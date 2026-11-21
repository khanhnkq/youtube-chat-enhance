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
  return { storage };
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
      readyState: 'loading', addEventListener() {},
      body: { classList: { add() {}, remove() {} } },
      querySelector: selector => (selector === 'ytd-live-chat-frame' ? chatFrame : null)
    },
    setTimeout, clearTimeout, Date
  });
  vm.runInContext(source('content/config.js'), ctx);
  return { ctx, storage, chatFrame, video };
}

for (const [label, startsCollapsed, endsCollapsed, nextVideo] of [
  ['re-expands the native chat it collapsed so Danmaku keeps a message source', false, false],
  ['re-expands it after YouTube carried the collapsed chat to the next video', false, false, 'live2'],
  ['leaves a native chat the viewer had already collapsed alone', true, true]
]) {
  test(`turning the floating chat off ${label}`, async () => {
    const { ctx, storage, chatFrame, video } = nativeChatHarness({ collapsed: startsCollapsed });
    await ctx.YTChatConfig.load();
    vm.runInContext(source('content/chat-injector.js'), ctx);
    await storage.local.set({ enableFloatingChat: false });
    await settle();

    await storage.local.set({ enableFloatingChat: true });
    await settle();
    assert.equal(chatFrame.collapsed, true);
    if (nextVideo) video.id = nextVideo;

    await storage.local.set({ enableFloatingChat: false });
    await settle();
    assert.equal(chatFrame.collapsed, endsCollapsed);
    assert.equal(chatFrame.clicks, startsCollapsed ? 0 : 2);
  });
}
