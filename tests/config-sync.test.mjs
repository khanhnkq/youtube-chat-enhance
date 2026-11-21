import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const plain = value => JSON.parse(JSON.stringify(value));

function storageHarness(initial = {}) {
  const data = { ...initial };
  const listeners = [];
  const calls = [];
  const emit = (changes, area = 'local') => listeners.forEach(fn => fn(changes, area));
  const storage = {
    onChanged: { addListener: fn => listeners.push(fn) },
    local: {
      async get() { return { ...data }; },
      async set(partial) {
        calls.push(plain(partial));
        const changes = {};
        for (const [key, newValue] of Object.entries(partial)) {
          changes[key] = { oldValue: data[key], newValue };
          data[key] = newValue;
        }
        emit(changes);
      },
      async remove(keys) {
        const changes = {};
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          if (!Object.hasOwn(data, key)) continue;
          changes[key] = { oldValue: data[key] };
          delete data[key];
        }
        emit(changes);
      }
    }
  };
  function context(extra = {}) {
    const ctx = vm.createContext({ chrome: { storage }, ...extra });
    vm.runInContext(source('content/config.js'), ctx);
    return ctx;
  }
  return { data, storage, calls, emit, context };
}

test('a new profile shares Floating on / Danmaku off across popup, page and iframe', async () => {
  const harness = storageHarness();
  const contexts = [harness.context(), harness.context(), harness.context()];
  for (const ctx of contexts) {
    const config = await ctx.YTChatConfig.load();
    assert.equal(config.enableFloatingChat, true);
    assert.equal(config.enableDanmaku, false);
    assert.equal(config.danmakuTextShadow, true);
  }
  await harness.storage.local.set({ lang: 'vi' });
  assert.equal((await harness.context().YTChatConfig.load()).enableDanmaku, false);
  assert.equal(harness.data.ytChatDefaultsVersion, 2);
});

test('legacy profiles retain unsaved old defaults, explicit choices and placement', async () => {
  for (const initial of [
    { lang: 'vi' },
    { chatBoxPos: { left: '20px', top: '30px' } },
    { enableDanmaku: true, enableFloatingChat: false, danmakuOpacity: 35 },
    { enableDanmaku: false, danmakuTextShadow: false }
  ]) {
    const harness = storageHarness(initial);
    const first = await harness.context().YTChatConfig.load();
    const reopened = await harness.context().YTChatConfig.load();
    assert.equal(reopened.enableDanmaku, initial.enableDanmaku ?? true);
    assert.deepEqual(plain(first), plain(reopened));
    for (const [key, value] of Object.entries(initial)) assert.deepEqual(harness.data[key], value);
    assert.equal(harness.data.ytChatDefaultsVersion, 1);
  }
});

test('one config update per context; unrelated keys, no-op values and other storage areas do nothing', async () => {
  const harness = storageHarness();
  const ctx = harness.context();
  await ctx.YTChatConfig.load();
  const received = [];
  ctx.YTChatConfig.subscribe(update => received.push(plain(update)));
  await harness.storage.local.set({ danmakuOpacity: 45 });
  await harness.storage.local.set({ danmakuOpacity: 45, chatBoxPos: { left: '9px' } });
  harness.emit({ danmakuOpacity: { newValue: 10 } }, 'sync');
  assert.deepEqual(received, [{ danmakuOpacity: 45 }]);
  assert.equal((await ctx.YTChatConfig.load()).danmakuOpacity, 45);
});

test('startup keeps concurrent edits and deleted settings restore the profile default', async () => {
  const harness = storageHarness({ lang: 'vi' });
  const get = harness.storage.local.get;
  harness.storage.local.get = async () => {
    const snapshot = await get();
    await harness.storage.local.set({ enableDanmaku: false, chatFontSize: 19 });
    return snapshot;
  };
  const ctx = harness.context();
  const config = await ctx.YTChatConfig.load();
  assert.equal(config.enableDanmaku, false);
  assert.equal(config.chatFontSize, 19);
  await harness.storage.local.remove('enableDanmaku');
  assert.equal((await ctx.YTChatConfig.load()).enableDanmaku, true);
});

test('obsolete reset flags are removed without becoming configuration changes', async () => {
  const harness = storageHarness({ resetChatPosition: true });
  const ctx = harness.context();
  const updates = [];
  ctx.YTChatConfig.subscribe(change => updates.push(change));
  const config = await ctx.YTChatConfig.load();
  assert.equal('resetChatPosition' in config, false);
  assert.equal('resetChatPosition' in harness.data, false);
  await harness.storage.local.set({ chatFontSize: 16 });
  assert.deepEqual(updates.map(plain), [{ chatFontSize: 16 }]);
});

test('overlay iframe applies a text style once and ignores language and placement changes', async () => {
  const harness = storageHarness();
  let writes = 0;
  let css = '';
  const style = {
    set textContent(value) { writes++; css = value; },
    get textContent() { return css; }
  };
  const ctx = harness.context({
    window: { location: { hash: '#yt_custom_overlay=1' }, name: '', addEventListener() {} },
    document: {
      readyState: 'loading', createElement: () => style,
      head: { appendChild() {} }, addEventListener() {}
    }
  });
  vm.runInContext(source('content/chat-iframe.js'), ctx);
  await settle();
  const initialWrites = writes;
  await harness.storage.local.set({ lang: 'vi', chatBoxPos: { left: '30px' } });
  assert.equal(writes, initialWrites);
  await harness.storage.local.set({ chatTextColor: '#123456' });
  assert.equal(writes, initialWrites + 1);
  assert.match(css, /#123456/);
});

function writerHarness(setter) {
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  const writes = [];
  const data = {};
  const ctx = vm.createContext({
    Date: { now: () => now },
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(source('popup/config-writer.js'), ctx);
  const writer = ctx.createConfigWriter({ async set(batch) {
    writes.push({ at: now, batch: plain(batch) });
    if (setter) await setter(batch, writes.length);
    Object.assign(data, batch);
  } });
  async function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
      await settle();
    }
    now = end;
    await settle();
  }
  return { writer, writes, data, advance };
}

test('100 slider inputs are coalesced at 120ms and commit preserves the final value', async () => {
  const { writer, writes, data, advance } = writerHarness();
  for (let i = 0; i < 100; i++) {
    await writer.update({ bgOpacity: i });
    await advance(10);
  }
  await writer.flush();
  assert.equal(data.bgOpacity, 99);
  assert.ok(writes.length <= 10, `wrote ${writes.length} times`);
  for (let i = 1; i < writes.length - 1; i++) assert.ok(writes[i].at - writes[i - 1].at >= 120);
});

test('slow writes cannot overtake newer changes, including a final keyboard commit', async () => {
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const { writer, writes, data, advance } = writerHarness((batch, count) => count === 1 ? blocked : undefined);
  await writer.update({ bgOpacity: 10 });
  await advance(0);
  await writer.update({ bgOpacity: 30, chatFontSize: 17 });
  await writer.update({ bgOpacity: 80 });
  const committed = writer.flush();
  await settle();
  assert.equal(writes.length, 1);
  release();
  await committed;
  assert.deepEqual(data, { bgOpacity: 80, chatFontSize: 17 });
  assert.equal(writes.length, 2);
});

test('pending edits drain after slow storage even without a change event', async () => {
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const { writer, data, advance } = writerHarness((batch, count) => count === 1 ? blocked : undefined);
  await writer.update({ bgOpacity: 10 });
  await advance(0);
  await writer.update({ bgOpacity: 75 });
  release();
  await settle();
  await advance(120);
  assert.equal(data.bgOpacity, 75);
});

test('a rejected write is retryable and cannot restore stale values over newer edits', async () => {
  const { writer, data } = writerHarness((batch, count) => {
    if (count === 1) throw new Error('storage unavailable');
  });
  await assert.rejects(writer.update({ bgOpacity: 10, chatFontSize: 17 }, true), /storage unavailable/);
  await writer.update({ bgOpacity: 90 }, true);
  assert.deepEqual(data, { bgOpacity: 90, chatFontSize: 17 });
});

test('page applies only relevant settings once and resets on every command without replaying a flag', async () => {
  const harness = storageHarness({ resetChatPosition: true });
  const runtimeListeners = [];
  let resets = 0;
  const danmakuUpdates = [];
  const floatingUpdates = [];
  const ctx = harness.context({
    window: {
      addEventListener() {},
      ytDanmakuEngine: { updateConfig: value => danmakuUpdates.push(value) },
      ytDraggableChatBox: { updateConfig: value => floatingUpdates.push(value), resetPosition: () => resets++ }
    },
    document: { readyState: 'loading', addEventListener() {} }
  });
  ctx.chrome.runtime = { onMessage: { addListener: fn => runtimeListeners.push(fn) } };
  await ctx.YTChatConfig.load();
  vm.runInContext(source('content/chat-injector.js'), ctx);
  await harness.storage.local.set({ lang: 'vi', chatBoxPos: { left: '5px' } });
  assert.equal(danmakuUpdates.length, 0);
  assert.equal(floatingUpdates.length, 0);
  await harness.storage.local.set({ danmakuOpacity: 40 });
  assert.equal(danmakuUpdates.length, 1);
  await harness.storage.local.set({ bgOpacity: 40 });
  assert.equal(floatingUpdates.length, 1);
  for (let i = 0; i < 2; i++) runtimeListeners[0]({ action: 'RESET_CHAT_POSITION' }, {}, () => {});
  await harness.storage.local.set({ bgOpacity: 60 });
  assert.equal(resets, 2);
});

async function popupHarness(initial) {
  const harness = storageHarness(initial);
  const elements = new Map();
  const inputs = [];
  const commands = [];
  const html = source('popup/popup.html');
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const handlers = {};
    const element = {
      id: match[1], value: '', checked: false, textContent: '',
      classList: { add() {}, remove() {} },
      addEventListener(type, fn) { (handlers[type] ??= []).push(fn); },
      async dispatch(type) {
        for (const fn of handlers[type] ?? []) await fn({ target: element });
      }
    };
    elements.set(element.id, element);
    if (/type="(range|color)"/.test(match[0])) inputs.push(element);
  }
  let start;
  const ctx = harness.context({
    document: {
      documentElement: {},
      getElementById: id => elements.get(id),
      querySelectorAll: selector => selector.startsWith('input[type=') ? inputs : [],
      addEventListener(type, fn) { if (type === 'DOMContentLoaded') start = fn; }
    },
    setTimeout: () => 1, clearTimeout() {}, Date
  });
  ctx.chrome.tabs = {
    async query() { return [{ id: 1 }, { id: 2 }]; },
    async sendMessage(id, command, options) {
      commands.push({ id, command: plain(command), options: plain(options) });
      if (id === 2) throw new Error('No receiving end');
    }
  };
  vm.runInContext(source('popup/config-writer.js'), ctx);
  vm.runInContext(source('popup/popup.js'), ctx);
  await start();
  return { ...harness, elements, commands };
}

test('popup reopens with saved stroke/shadow state and keyboard change commits the final slider value', async () => {
  const { elements, data, commands } = await popupHarness({
    danmakuTextStroke: true, danmakuTextShadow: false, bgOpacity: 35
  });
  assert.equal(elements.get('danmakuTextStroke').checked, true);
  assert.equal(elements.get('danmakuTextShadow').checked, false);
  const opacity = elements.get('bgOpacity');
  opacity.value = '80';
  await opacity.dispatch('input');
  assert.equal(elements.get('bgOpacityVal').textContent, '80%');
  await opacity.dispatch('change');
  assert.equal(data.bgOpacity, 80);
  assert.deepEqual(commands, [], 'ordinary settings must not broadcast a second update');
});

test('each reset click clears placement and sends a transient top-frame command, even with receiverless tabs', async () => {
  const { elements, data, storage, commands } = await popupHarness({ chatBoxPos: { left: '70px' } });
  await elements.get('resetPosBtn').dispatch('click');
  await storage.local.set({ chatBoxPos: { left: '90px' } });
  await elements.get('resetPosBtn').dispatch('click');
  assert.equal('chatBoxPos' in data, false);
  assert.equal('resetChatPosition' in data, false);
  assert.equal(commands.length, 4);
  assert.ok(commands.every(item => item.command.action === 'RESET_CHAT_POSITION' && item.options.frameId === 0));
});
