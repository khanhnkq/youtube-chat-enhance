import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function storageHarness(initial = {}) {
  const data = { ...initial };
  const listeners = [];
  const storage = {
    onChanged: { addListener: fn => listeners.push(fn) },
    local: {
      async get() { return { ...data }; },
      async set(partial) {
        const changes = {};
        for (const [key, newValue] of Object.entries(partial)) {
          changes[key] = { oldValue: data[key], newValue };
          data[key] = newValue;
        }
        listeners.forEach(fn => fn(changes, 'local'));
      },
      async remove() {}
    }
  };
  return { storage, state: data };
}

test('switching videos replaces the overlay iframe instead of navigating it', () => {
  const created = [];
  const container = {
    children: [],
    querySelector(selector) { return selector === 'iframe' ? this.children[0] || null : null; },
    appendChild(child) { this.children.push(child); }
  };
  const createIframe = () => {
    const iframe = {
      srcWrites: 0,
      get src() { return this._src; },
      set src(value) { this.srcWrites++; this._src = value; },
      replaceWith(next) { container.children[container.children.indexOf(this)] = next; }
    };
    created.push(iframe);
    return iframe;
  };
  let videoId = 'first';
  const ctx = vm.createContext({
    window: { location: { hostname: 'www.youtube.com', search: '', pathname: '/watch' } },
    document: { createElement: createIframe },
    URLSearchParams
  });
  vm.runInContext(source('content/draggable-box.js'), ctx);
  const box = ctx.window.ytDraggableChatBox;
  Object.assign(box, { iframeContainer: container, config: {}, playerEl: { getVideoData: () => ({ video_id: videoId }) } });

  box.updateChatIframe();
  videoId = 'second';
  box.updateChatIframe();
  box.updateChatIframe();

  assert.equal(created.length, 2);
  assert.equal(created[0].srcWrites, 1, 'the old frame must not be navigated');
  assert.deepEqual(container.children, [created[1]]);
  assert.match(container.children[0].src, /live_chat\?v=second&/);
});

function nativeChatHarness({ collapsed }) {
  const video = { id: 'live1' };
  const { storage } = storageHarness({ enableFloatingChat: true, enableDanmaku: true });
  const clickListeners = [];
  const chatFrame = {
    collapsed, clicks: 0,
    hasAttribute(name) { return name === 'collapsed' && this.collapsed; },
    querySelector: () => ({ click() { chatFrame.clicks++; chatFrame.collapsed = !chatFrame.collapsed; } })
  };
  const ctx = vm.createContext({
    chrome: { storage },
    window: {
      addEventListener() {},
      ytDraggableChatBox: { getVideoId: () => video.id, updateConfig() {}, onFullscreenChange() {} }
    },
    document: {
      readyState: 'loading',
      addEventListener(type, listener) { if (type === 'click') clickListeners.push(listener); },
      body: { classList: { add() {}, remove() {} } },
      querySelector: selector => (selector === 'ytd-live-chat-frame' ? chatFrame : null)
    },
    setTimeout, clearTimeout, Date
  });
  vm.runInContext(source('content/config.js'), ctx);
  const viewerToggle = () => {
    chatFrame.collapsed = !chatFrame.collapsed;
    for (const listener of clickListeners) {
      listener({ isTrusted: true, target: { closest: selector => (selector.includes('#show-hide-button') ? {} : null) } });
    }
  };
  return { ctx, storage, chatFrame, video, viewerToggle };
}

for (const [label, startsCollapsed, endsCollapsed, nextVideo, viewerReopensAndHides] of [
  ['re-expands the native chat it collapsed so Danmaku keeps a message source', false, false],
  ['re-expands it after YouTube carried the collapsed chat to the next video', false, false, 'live2'],
  ['leaves a native chat the viewer had already collapsed alone', true, true],
  ['leaves the native chat closed when the viewer reopened and hid it again', false, true, null, true]
]) {
  test(`turning the floating chat off ${label}`, async () => {
    const { ctx, storage, chatFrame, video, viewerToggle } = nativeChatHarness({ collapsed: startsCollapsed });
    await ctx.YTChatConfig.load();
    vm.runInContext(source('content/chat-injector.js'), ctx);
    await storage.local.set({ enableFloatingChat: false });
    await settle();

    await storage.local.set({ enableFloatingChat: true });
    await settle();
    assert.equal(chatFrame.collapsed, true);
    if (nextVideo) video.id = nextVideo;
    if (viewerReopensAndHides) {
      viewerToggle();
      viewerToggle();
    }

    await storage.local.set({ enableFloatingChat: false });
    await settle();
    assert.equal(chatFrame.collapsed, endsCollapsed);
    assert.equal(chatFrame.clicks, startsCollapsed ? 0 : (viewerReopensAndHides ? 1 : 2));
  });
}

function placementHarness({ saved, player }) {
  const { storage, state } = storageHarness({ chatBoxPos: saved });
  const overlay = {
    style: { left: '', top: '', width: '', height: '' },
    classList: {
      names: new Set(),
      add(n) { this.names.add(n); },
      remove(n) { this.names.delete(n); },
      contains(n) { return this.names.has(n); }
    },
    querySelector: () => null,
    getBoundingClientRect() { return { left: parseFloat(this.style.left) || 0, top: parseFloat(this.style.top) || 0 }; },
    // Rendered size stays at the CSS default, as while the size transition is still running.
    offsetWidth: 320,
    offsetHeight: 420
  };
  const document = { body: { style: {} }, addEventListener() {}, removeEventListener() {} };
  const ctx = vm.createContext({ chrome: { runtime: { id: 'test' }, storage }, window: {}, document, URLSearchParams, requestAnimationFrame: fn => fn() });
  vm.runInContext(source('content/draggable-box.js'), ctx);
  const box = ctx.window.ytDraggableChatBox;
  Object.assign(box, {
    overlay, config: {},
    playerEl: { getBoundingClientRect: () => ({ left: 0, top: 0, width: player.width, height: player.height }) }
  });
  return { box, overlay, player, state };
}

test('a placement saved in fullscreen is pulled back inside a smaller player on restore', async () => {
  const { box, overlay } = placementHarness({
    saved: { left: '960px', top: '540px', width: '320px', height: '420px' },
    player: { width: 877, height: 440 }
  });
  await box.restorePositionAndSize();
  assert.equal(overlay.style.left, '557px');
  assert.equal(overlay.style.top, '20px');
  assert.equal(overlay.style.width, '320px');
});

test('a placement that fits the player is restored unchanged', async () => {
  const { box, overlay } = placementHarness({
    saved: { left: '100px', top: '50px', width: '320px', height: '420px' },
    player: { width: 1257, height: 668 }
  });
  await box.restorePositionAndSize();
  assert.equal(overlay.style.left, '100px');
  assert.equal(overlay.style.top, '50px');
});

test('leaving fullscreen pulls the chat back inside the smaller player', () => {
  const { box, overlay, player } = placementHarness({ saved: null, player: { width: 1280, height: 960 } });
  Object.assign(overlay.style, { left: '960px', top: '540px', width: '320px', height: '420px' });
  Object.assign(player, { width: 877, height: 440 });
  box.onFullscreenChange(false, {});
  assert.equal(overlay.style.left, '557px');
  assert.equal(overlay.style.top, '20px');
});

test('a larger saved size is clamped by its target size, not the size mid-transition', async () => {
  const { box, overlay } = placementHarness({
    saved: { left: '960px', top: '540px', width: '500px', height: '300px' },
    player: { width: 877, height: 440 }
  });
  await box.restorePositionAndSize();
  assert.equal(overlay.style.left, '377px');
  assert.equal(overlay.style.top, '140px');
});

test('returning to fullscreen brings back the placement the viewer chose', async () => {
  const { box, overlay, player } = placementHarness({
    saved: { left: '960px', top: '540px', width: '320px', height: '420px' },
    player: { width: 877, height: 440 }
  });
  await box.restorePositionAndSize();
  assert.equal(overlay.style.left, '557px');
  Object.assign(player, { width: 1280, height: 960 });
  box.onFullscreenChange(true, {});
  assert.equal(overlay.style.left, '960px');
  assert.equal(overlay.style.top, '540px');
});

test('resizing a clamped chat keeps the saved placement; dragging replaces it', async () => {
  const { box, overlay, state } = placementHarness({
    saved: { left: '960px', top: '540px', width: '320px', height: '420px' },
    player: { width: 877, height: 440 }
  });
  await box.restorePositionAndSize();
  overlay.style.width = '200px';
  await box.savePositionAndSize();
  assert.equal(state.chatBoxPos.left, '960px');
  assert.equal(state.chatBoxPos.top, '540px');
  assert.equal(state.chatBoxPos.width, '200px');

  box.preferredPos = null;
  await box.savePositionAndSize();
  assert.equal(state.chatBoxPos.left, '557px');
});

test('reopening a minimized chat after the player resized keeps it inside the player', async () => {
  const { box, overlay, player } = placementHarness({
    saved: { left: '960px', top: '540px', width: '320px', height: '420px' },
    player: { width: 877, height: 440 }
  });
  await box.restorePositionAndSize();
  box.toggleMinimize();
  Object.assign(player, { width: 1000, height: 600 });
  box.onFullscreenChange(false, {});
  assert.equal(overlay.style.left, '920px');
  box.toggleMinimize();
  assert.equal(overlay.style.left, '680px');
  assert.equal(overlay.style.top, '180px');
});

test('clicking the minimized chat open keeps the chosen placement; a real drag replaces it', async () => {
  const { box, overlay, player, state } = placementHarness({
    saved: { left: '750px', top: '10px', width: '320px', height: '420px' },
    player: { width: 1280, height: 960 }
  });
  const press = { target: { closest: () => null }, clientX: 760, clientY: 15, preventDefault() {} };
  await box.restorePositionAndSize();
  box.toggleMinimize();
  Object.assign(player, { width: 877, height: 440 });
  box.onFullscreenChange(false, {});
  assert.equal(overlay.style.left, '750px');

  box.onDragStart(press);
  box.onStopDrag();
  box.toggleMinimize();
  assert.equal(overlay.style.left, '557px');

  Object.assign(player, { width: 1280, height: 960 });
  box.onFullscreenChange(true, {});
  assert.equal(overlay.style.left, '750px');
  await box.savePositionAndSize();
  assert.equal(state.chatBoxPos.left, '750px');

  box.onDragStart(press);
  box.onDrag({ clientX: 310, clientY: 15 });
  box.onStopDrag();
  await box.savePositionAndSize();
  assert.equal(state.chatBoxPos.left, '300px');
});

test('a drag pushed against the player edge saves the displayed placement', async () => {
  const { box, overlay, state } = placementHarness({
    saved: { left: '960px', top: '540px', width: '320px', height: '420px' },
    player: { width: 877, height: 440 }
  });
  await box.restorePositionAndSize();
  assert.equal(overlay.style.left, '557px');
  box.onDragStart({ target: { closest: () => null }, clientX: 600, clientY: 30, preventDefault() {} });
  box.onDrag({ clientX: 700, clientY: 200 });
  box.onStopDrag();
  assert.equal(overlay.style.left, '557px');
  assert.equal(overlay.style.top, '20px');
  assert.equal(state.chatBoxPos.left, '557px');
  assert.equal(state.chatBoxPos.top, '20px');
});
