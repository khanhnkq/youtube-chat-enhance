import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

const textNode = value => ({ nodeType: 3, textContent: value });
// Attribute shapes copied from live YouTube chat: Unicode emoji have only alt,
// channel emoji have a bare name in alt plus data-emoji-id.
const emojiImg = (alt, emojiId = null) => ({
  nodeType: 1,
  tagName: 'IMG',
  childNodes: [],
  textContent: '',
  getAttribute: name => (name === 'alt' ? alt : name === 'data-emoji-id' ? emojiId : null)
});
const channelEmoji = name => emojiImg(name, `UCkszU2WH9gy1mb0dV-11UJg/${name}`);
function span(children) {
  return {
    nodeType: 1,
    tagName: 'SPAN',
    childNodes: children,
    get textContent() { return children.map(child => child.textContent).join(''); },
    getAttribute: () => null
  };
}

function chatMessage({ id = 'ChwKGkNQYWJjZGVmZ2hpams', author = 'Viewer', parts = [], tag = 'yt-live-chat-text-message-renderer' } = {}) {
  const message = span(parts);
  const element = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    dataset: {},
    isConnected: true,
    reads: 0,
    message,
    getAttribute: name => (name === 'id' ? id : null),
    querySelector(selector) {
      if (selector === '#message') { element.reads++; return message; }
      if (selector === '#author-name') return { textContent: author };
      return null;
    },
    querySelectorAll: () => []
  };
  return element;
}

async function readerHarness() {
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  const posted = [];
  let onMutations = null;
  const chatList = { isConnected: true, querySelectorAll: () => [] };
  const ctx = vm.createContext({
    Date: { now: () => now },
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    chrome: { storage: {
      onChanged: { addListener() {} },
      local: { async get() { return { enableDanmaku: true }; }, async set() {}, async remove() {} }
    } },
    MutationObserver: class {
      constructor(callback) { onMutations = callback; }
      observe() {}
      disconnect() {}
    },
    document: {
      readyState: 'complete',
      head: { appendChild() {} },
      createElement: () => ({}),
      addEventListener() {},
      querySelector: () => chatList
    }
  });
  ctx.window = {
    location: { hash: '' },
    name: '',
    parent: { postMessage: data => posted.push(...data.batch) }
  };
  vm.runInContext(source('content/config.js'), ctx);
  vm.runInContext(source('content/chat-iframe.js'), ctx);
  await settle();

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
  }
  return {
    posted,
    advance,
    add: (...nodes) => onMutations([{ addedNodes: nodes }]),
    pendingTimers: () => timers.size
  };
}

test('a normal message is sent exactly once, even when YouTube reports the node again', async () => {
  const reader = await readerHarness();
  const element = chatMessage({ id: 'ChwKGkNQbm9ybWFsMDAwMQ', author: 'Lan', parts: [textNode('xin chào')] });
  reader.add(element);
  reader.add(element);
  await reader.advance(5_000);
  assert.equal(reader.posted.length, 1);
  assert.equal(reader.posted[0].id, 'ChwKGkNQbm9ybWFsMDAwMQ');
  assert.equal(reader.posted[0].author, 'Lan');
  assert.equal(reader.posted[0].text, 'xin chào');
  assert.equal(reader.pendingTimers(), 0);
});

test('text that YouTube fills in late is sent once and leaves no timer behind', async () => {
  const reader = await readerHarness();
  const element = chatMessage();
  reader.add(element);
  await reader.advance(200);
  assert.equal(reader.posted.length, 0);
  element.message.childNodes.push(textNode('đến muộn'));
  await reader.advance(5_000);
  assert.deepEqual(reader.posted.map(message => message.text), ['đến muộn']);
  assert.equal(reader.pendingTimers(), 0);
});

test('an image-only emoji message is sent from the image alt text on the first read', async () => {
  const reader = await readerHarness();
  const element = chatMessage({ parts: [emojiImg('😀'), emojiImg('👍')] });
  reader.add(element);
  await reader.advance(5_000);
  assert.deepEqual(reader.posted.map(message => message.text), ['😀👍']);
  assert.equal(element.reads, 1);
  assert.equal(reader.pendingTimers(), 0);
});

test('emoji keep their position between words, including inside nested nodes', async () => {
  const reader = await readerHarness();
  const element = chatMessage({
    parts: [textNode('hay quá '), emojiImg('🔥'), span([textNode(' lắm '), emojiImg('👍')])]
  });
  reader.add(element);
  await reader.advance(5_000);
  assert.deepEqual(reader.posted.map(message => message.text), ['hay quá 🔥 lắm 👍']);
});

test('channel emoji are sent as :name: so adjacent ones stay readable', async () => {
  const reader = await readerHarness();
  const element = chatMessage({
    parts: [channelEmoji('face-blue-smiling'), channelEmoji('face-red-heart-shape'), textNode(' gg')]
  });
  reader.add(element);
  await reader.advance(5_000);
  assert.deepEqual(reader.posted.map(message => message.text), [':face-blue-smiling::face-red-heart-shape: gg']);
  assert.equal(reader.pendingTimers(), 0);
});

test('an empty element that left the page is never read again', async () => {
  const reader = await readerHarness();
  const element = chatMessage();
  reader.add(element);
  await reader.advance(100);
  element.isConnected = false;
  const readsAtRemoval = element.reads;
  await reader.advance(60_000);
  assert.equal(element.reads, readsAtRemoval);
  assert.equal(reader.posted.length, 0);
  assert.equal(reader.pendingTimers(), 0);
});

test('an element that stays empty stops being re-read after a bounded number of tries', async () => {
  const reader = await readerHarness();
  const element = chatMessage();
  reader.add(element);
  await reader.advance(60_000);
  const reads = element.reads;
  assert.ok(reads > 1 && reads <= 12, `expected a small bounded number of reads, got ${reads}`);
  assert.equal(reader.pendingTimers(), 0);
  await reader.advance(60_000);
  assert.equal(element.reads, reads);
  assert.equal(reader.posted.length, 0);
});
