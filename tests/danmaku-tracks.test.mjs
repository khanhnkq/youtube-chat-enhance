import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = file => readFileSync(new URL(`../content/${file}`, import.meta.url), 'utf8');
const source = read('danmaku-engine.js');
const context = vm.createContext({ window: {} });
vm.runInContext(read('runtime.js'), context);
new vm.Script(`${source}\nglobalThis.DanmakuEngine = window.ytDanmakuEngine.constructor;`).runInContext(context);
const { DanmakuEngine } = context;

test('trackFreeAt returns negative infinity for an unused track', () => {
  assert.equal(DanmakuEngine.trackFreeAt(null, 0.1, 1000, 24), -Infinity);
});

test('trackFreeAt uses the right-edge clearance time for a slower item', () => {
  const last = { start: 100, v: 0.2, w: 100 };
  assert.equal(DanmakuEngine.trackFreeAt(last, 0.1, 1000, 24), 720);
});

test('trackFreeAt delays a faster item until the previous item exits', () => {
  const last = { start: 0, v: 0.1, w: 200, exit: 12000 };
  const t1 = last.start + (last.w + 24) / last.v;
  const t2 = last.exit - 1000 / 0.15;

  assert.equal(t1, 2240);
  assert.ok(Math.abs(t2 - 5333.33) < 0.01);
  assert.equal(DanmakuEngine.trackFreeAt(last, 0.15, 1000, 24), t2);
});

test('trackFreeAt uses the stored exit after the layer widens', () => {
  const last = { start: 0, v: 0.1, w: 200, exit: 12000 };
  const t1 = last.start + (last.w + 24) / last.v;
  const t2 = last.exit - 2000 / 0.11;

  assert.equal(t1, 2240);
  assert.ok(Math.abs(t2 + 6181.82) < 0.01);
  assert.equal(DanmakuEngine.trackFreeAt(last, 0.11, 2000, 24), t1);
});

test('random-width comments never overlap on a track', () => {
  const width = 1000;
  const gap = 24;
  const duration = 10_000;
  const tracks = Array(10).fill(null);
  const items = [];
  const pending = [];
  let seed = 42;
  let nextItem = 0;
  let nextDrainAt = null;

  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };

  const place = (item, now) => {
    const v = (width + item.w) / duration;
    const trackIndex = tracks.findIndex(last => DanmakuEngine.trackFreeAt(last, v, width, gap) <= now);
    if (trackIndex === -1) return false;
    const placed = {
      ...item,
      start: now,
      v,
      exit: now + (width + item.w) / v,
      trackIndex
    };
    tracks[trackIndex] = placed;
    items.push(placed);
    return true;
  };

  const sample = now => {
    for (let first = 0; first < items.length; first++) {
      const a = items[first];
      if (now < a.start || now >= a.start + (width + a.w) / a.v) continue;
      const aLeft = width - a.v * (now - a.start);
      const aRight = aLeft + a.w;
      for (let second = first + 1; second < items.length; second++) {
        const b = items[second];
        if (a.trackIndex !== b.trackIndex || now < b.start || now >= b.start + (width + b.w) / b.v) continue;
        const bLeft = width - b.v * (now - b.start);
        const bRight = bLeft + b.w;
        assert.ok(
          Math.min(aRight, bRight) <= Math.max(aLeft, bLeft),
          `items on track ${a.trackIndex} overlap at ${now}ms`
        );
      }
    }
  };

  for (let now = 0; nextItem < 200 || pending.length > 0; now += 50) {
    if (now === nextItem * 300 && nextItem < 200) {
      const item = { id: nextItem, w: 80 + Math.floor(random() * 520) };
      nextItem++;
      if (pending.length > 0 || !place(item, now)) pending.push(item);
      if (pending.length > 0 && nextDrainAt === null) nextDrainAt = now + 200;
    }

    if (nextDrainAt !== null && now >= nextDrainAt) {
      nextDrainAt = null;
      while (pending.length > 0 && place(pending[0], now)) pending.shift();
      if (pending.length > 0) nextDrainAt = now + 200;
    }

    sample(now);
    assert.ok(now < 120_000, 'simulation did not drain all comments');
  }

  assert.equal(items.length, 200);
});
