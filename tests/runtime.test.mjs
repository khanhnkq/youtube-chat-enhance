import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function fakeClock() {
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  return {
    now: () => now,
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    pending: () => timers.size,
    advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
      }
      now = end;
    }
  };
}

function runtimeHarness() {
  const clock = fakeClock();
  const warnings = [];
  const ctx = vm.createContext({
    console: { warn: (...args) => warnings.push(args) },
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout
  });
  vm.runInContext(source('content/runtime.js'), ctx);
  return { ctx, runtime: ctx.YTChatRuntime, clock, warnings };
}

test('every content script that uses the shared runtime is loaded after it', () => {
  const manifest = JSON.parse(source('manifest.json'));
  for (const { js } of manifest.content_scripts) {
    const runtimeAt = js.indexOf('content/runtime.js');
    assert.notEqual(runtimeAt, -1, `${js.join(', ')} must include content/runtime.js`);
    for (const file of js) {
      if (source(file).includes('YTChatRuntime') && file !== 'content/runtime.js') {
        assert.ok(js.indexOf(file) > runtimeAt, `${file} must load after content/runtime.js`);
      }
    }
  }
});

test('the message selector covers exactly the three kinds of chat message', () => {
  const { runtime } = runtimeHarness();
  assert.deepEqual(runtime.selectors.chatMessage.split(', ').sort(), plain(Object.values(runtime.messageTags)).sort());
  assert.equal(Object.values(runtime.messageTags).length, 3);
});

test('a message with a YouTube id is accepted once, however late the copy arrives', () => {
  const cache = runtimeHarness().runtime.createDedupeCache();
  const message = { id: 'ChwKGkNQYWJj', author: 'Lan', text: 'xin chào' };
  assert.equal(cache.accept(message, 0), true);
  assert.equal(cache.accept({ ...message }, 10), false);
  assert.equal(cache.accept({ ...message }, 600_000), false);
  assert.equal(cache.accept({ ...message, id: 'ChwKGkNQeHl6' }, 20), true, 'same words under another id are a new message');
});

test('a message without an id is matched by author and text for 1.5 seconds', () => {
  const cache = runtimeHarness().runtime.createDedupeCache();
  const message = { id: '', author: 'Lan', text: 'gg' };
  assert.equal(cache.accept(message, 1_400), true);
  // 1400 and 1600 fall in different 1500 ms buckets; the copy must still be caught.
  assert.equal(cache.accept({ ...message }, 1_600), false);
  assert.equal(cache.accept({ ...message, author: 'Minh' }, 1_600), true);
  assert.equal(cache.accept({ ...message }, 2_899), false);
  assert.equal(cache.accept({ ...message }, 2_900), true, 'the same viewer may repeat a message later');
  assert.equal(cache.accept({ ...message }, 3_000), false);
});

test('the dedupe cache forgets the oldest message beyond its limit and everything on clear', () => {
  const cache = runtimeHarness().runtime.createDedupeCache({ limit: 300 });
  for (let i = 0; i <= 300; i++) assert.equal(cache.accept({ id: `message-${i}`, text: 'x' }, i), true);
  assert.equal(cache.size, 300);
  assert.equal(cache.accept({ id: 'message-1', text: 'x' }, 400), false);
  assert.equal(cache.accept({ id: 'message-0', text: 'x' }, 400), true, 'the oldest entry was evicted');
  cache.clear();
  assert.equal(cache.size, 0);
  assert.equal(cache.accept({ id: 'message-1', text: 'x' }, 500), true);
});

function queueHarness({ limit = 3 } = {}) {
  const harness = runtimeHarness();
  const state = { paused: false, room: 0, placed: [], errors: [] };
  const queue = harness.runtime.createPendingQueue({
    limit,
    retryDelay: 200,
    isPaused: () => state.paused,
    onError: error => state.errors.push(error.message),
    place(item) {
      if (item === 'broken') throw new Error('cannot place');
      if (state.room === 0) return false;
      state.room--;
      state.placed.push(item);
      return true;
    }
  });
  return { queue, state, clock: harness.clock };
}

test('an item is placed straight away when there is room and nothing is waiting', () => {
  const { queue, state, clock } = queueHarness();
  state.room = 1;
  queue.add('a');
  assert.deepEqual(state.placed, ['a']);
  assert.equal(queue.size, 0);
  assert.equal(clock.pending(), 0);
});

test('items wait in arrival order and are retried until there is room', () => {
  const { queue, state, clock } = queueHarness();
  queue.add('a');
  queue.add('b');
  assert.equal(clock.pending(), 1, 'one retry timer, however many items wait');
  state.room = 1;
  queue.add('c');
  assert.deepEqual(state.placed, [], 'a newer item must not overtake the ones waiting');
  clock.advance(200);
  assert.deepEqual(state.placed, ['a']);
  state.room = 5;
  clock.advance(200);
  assert.deepEqual(state.placed, ['a', 'b', 'c']);
  assert.equal(queue.size, 0);
  assert.equal(clock.pending(), 0);
});

test('the queue keeps only the newest items up to its limit', () => {
  const { queue, state, clock } = queueHarness({ limit: 3 });
  for (const item of ['a', 'b', 'c', 'd', 'e']) queue.add(item);
  assert.equal(queue.size, 3);
  state.room = 10;
  clock.advance(200);
  assert.deepEqual(state.placed, ['c', 'd', 'e']);
});

test('nothing is placed or retried while paused; draining after resume places the backlog', () => {
  const { queue, state, clock } = queueHarness();
  state.paused = true;
  state.room = 10;
  queue.add('a');
  queue.add('b');
  clock.advance(10_000);
  assert.deepEqual(state.placed, []);
  assert.equal(clock.pending(), 0, 'a paused queue must not keep a timer alive');
  queue.drain();
  assert.deepEqual(state.placed, []);
  state.paused = false;
  queue.drain();
  assert.deepEqual(state.placed, ['a', 'b']);
});

test('clearing the queue drops the backlog and its retry timer', () => {
  const { queue, state, clock } = queueHarness();
  queue.add('a');
  queue.clear();
  assert.equal(queue.size, 0);
  assert.equal(clock.pending(), 0);
  state.room = 10;
  clock.advance(1_000);
  assert.deepEqual(state.placed, []);
});

test('an item whose placement throws is dropped and reported without blocking the rest', () => {
  const { queue, state, clock } = queueHarness();
  queue.add('broken');
  assert.equal(queue.size, 0);
  queue.add('a');
  queue.add('broken');
  queue.add('b');
  state.room = 10;
  clock.advance(200);
  assert.deepEqual(state.placed, ['a', 'b']);
  assert.deepEqual(state.errors, ['cannot place', 'cannot place']);
  assert.equal(clock.pending(), 0);
});

test('a box is kept inside its bounds', () => {
  const { clampPosition } = runtimeHarness().runtime;
  const player = { width: 1280, height: 720 };
  const box = { width: 320, height: 420 };
  assert.deepEqual(plain(clampPosition({ ...box, left: 100, top: 50 }, player)), { left: 100, top: 50 });
  assert.deepEqual(plain(clampPosition({ ...box, left: 5_000, top: 5_000 }, player)), { left: 960, top: 300 });
  assert.deepEqual(plain(clampPosition({ ...box, left: -40, top: -1 }, player)), { left: 0, top: 0 });
  assert.deepEqual(
    plain(clampPosition({ ...box, left: 200, top: 200 }, { width: 300, height: 200 })),
    { left: 0, top: 0 },
    'a box larger than the player stays at the top-left corner so its header is reachable'
  );
});

test('an unexpected error is logged three times per source and only counted after that', () => {
  const { runtime, warnings } = runtimeHarness();
  for (let i = 0; i < 500; i++) runtime.diagnostics.report('chat message parse', new Error(`failure ${i}`));
  runtime.diagnostics.report('floating chat iframe', new Error('other'));
  assert.equal(warnings.length, 4);
  assert.match(warnings[0][0], /^\[YT Chat Extension\] chat message parse:$/);
  assert.match(warnings[2][0], /further errors from this source are only counted/);
  assert.match(warnings[3][0], /floating chat iframe/);
  assert.deepEqual(plain(runtime.diagnostics.counts()), { 'chat message parse': 500, 'floating chat iframe': 1 });
});

test('the error Chrome raises after the extension is reloaded is expected and not reported', () => {
  const { runtime, warnings } = runtimeHarness();
  runtime.diagnostics.report('floating chat position save', new Error('Extension context invalidated.'));
  assert.equal(warnings.length, 0);
  assert.deepEqual(plain(runtime.diagnostics.counts()), {});
});

async function pageHarness() {
  const listeners = {};
  const storageListeners = [];
  const shown = [];
  const overlayFrame = { contentWindow: {} };
  const nativeFrame = { contentWindow: {} };
  const ctx = vm.createContext({
    chrome: { storage: {
      onChanged: { addListener: listener => storageListeners.push(listener) },
      local: { async get() { return {}; }, async set() {}, async remove() {} }
    } },
    window: {
      addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
      ytDanmakuEngine: {
        addCommentBatch: batch => shown.push(...batch.map(message => message.text)),
        updateConfig() {},
        clear() {}
      }
    },
    document: {
      readyState: 'loading',
      addEventListener() {},
      querySelector: selector => (selector === '.yt-custom-chat-overlay iframe' ? overlayFrame
        : selector === 'ytd-live-chat-frame iframe' ? nativeFrame : null)
    },
    setTimeout() {}, clearTimeout() {}, Date
  });
  for (const file of ['content/config.js', 'content/runtime.js', 'content/chat-injector.js']) {
    vm.runInContext(source(file), ctx);
  }
  await ctx.YTChatConfig.load();
  storageListeners.forEach(listener => listener({ enableDanmaku: { oldValue: false, newValue: true } }, 'local'));
  const post = (frame, batch, origin = 'https://www.youtube.com') => {
    for (const listener of listeners.message) {
      listener({ origin, source: frame.contentWindow, data: { type: 'YT_DANMAKU_BATCH', batch } });
    }
  };
  const navigate = () => listeners['yt-navigate-finish'].forEach(listener => listener());
  return { shown, overlayFrame, nativeFrame, post, navigate };
}

test('a message read by both the floating and the native chat is shown once', async () => {
  const page = await pageHarness();
  const message = { id: 'ChwKGkNQYWJj', author: 'Lan', text: 'xin chào' };
  page.post(page.overlayFrame, [message, { id: '', author: 'Minh', text: 'gg' }]);
  page.post(page.nativeFrame, [{ ...message }, { id: '', author: 'Minh', text: 'gg' }, { id: 'ChwKGkNQeHl6', text: 'mới' }]);
  assert.deepEqual(page.shown, ['xin chào', 'gg', 'mới']);
});

test('messages from another window or origin, and empty ones, are never shown', async () => {
  const page = await pageHarness();
  page.post({ contentWindow: {} }, [{ id: 'ChwKGkNQYWJj', text: 'lạ' }]);
  page.post(page.overlayFrame, [{ id: 'ChwKGkNQYWJj', text: 'lạ' }], 'https://example.com');
  page.post(page.overlayFrame, [null, { id: 'ChwKGkNQZW1wdHk', text: '' }]);
  assert.deepEqual(page.shown, []);
});

test('navigating to another video forgets the messages already shown', async () => {
  const page = await pageHarness();
  const message = { id: 'ChwKGkNQYWJj', text: 'xin chào' };
  page.post(page.overlayFrame, [message]);
  page.navigate();
  page.post(page.overlayFrame, [{ ...message }]);
  assert.deepEqual(page.shown, ['xin chào', 'xin chào']);
});

function engineHarness() {
  const clock = fakeClock();
  const ctx = vm.createContext({ window: {}, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  vm.runInContext(source('content/runtime.js'), ctx);
  vm.runInContext(source('content/danmaku-engine.js'), ctx);
  const engine = ctx.window.ytDanmakuEngine;
  const placed = [];
  let room = Infinity;
  Object.assign(engine, { layer: {}, measureContext: {}, videoEl: { paused: false } });
  engine.placeComment = message => {
    if (room === 0) return false;
    room--;
    placed.push(message.text);
    return true;
  };
  return { engine, placed, clock, setRoom: value => { room = value; } };
}

const comments = count => Array.from({ length: count }, (_, index) => ({ text: `tin ${index + 1}` }));

test('Danmaku holds comments while the video is paused and shows the newest 30 in order on play', () => {
  const { engine, placed, clock } = engineHarness();
  engine.videoEl.paused = true;
  engine.addCommentBatch(comments(35));
  clock.advance(10_000);
  assert.deepEqual(placed, []);
  assert.equal(engine.pending.size, 30);
  assert.equal(clock.pending(), 0);
  engine.videoEl.paused = false;
  engine.onVideoPlay();
  assert.deepEqual(placed, comments(35).slice(5).map(comment => comment.text));
  assert.equal(engine.pending.size, 0);
});

test('Danmaku retries queued comments while tracks are busy and stops when the engine is cleared', () => {
  const { engine, placed, clock, setRoom } = engineHarness();
  setRoom(1);
  engine.addCommentBatch(comments(3));
  assert.deepEqual(placed, ['tin 1']);
  setRoom(1);
  clock.advance(200);
  assert.deepEqual(placed, ['tin 1', 'tin 2']);
  engine.clear();
  setRoom(10);
  clock.advance(5_000);
  assert.deepEqual(placed, ['tin 1', 'tin 2']);
  assert.equal(clock.pending(), 0);
});

test('Danmaku ignores comments while it is turned off or has no layer', () => {
  const { engine, placed } = engineHarness();
  engine.isEnabled = false;
  engine.addComment({ text: 'tắt' });
  engine.isEnabled = true;
  engine.layer = null;
  engine.addComment({ text: 'chưa có lớp' });
  engine.layer = {};
  engine.addComment({ text: '' });
  assert.deepEqual(placed, []);
  assert.equal(engine.pending.size, 0);
});
