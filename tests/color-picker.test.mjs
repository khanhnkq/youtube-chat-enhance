import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

class Element extends EventTarget {
  children = [];
  style = {};
  attributes = {};
  value = '';
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() { this.focused = true; }
}

function pickerHarness(color = '#123456') {
  const doc = { createElement: () => new Element() };
  const row = new Element();
  const info = new Element();
  row.querySelector = () => info;
  row.replaceWith = node => { row.replacement = node; };
  const input = new Element();
  input.type = 'color';
  input.value = color;
  input.ownerDocument = doc;
  input.closest = () => row;
  const ctx = vm.createContext({ Event, Date, setTimeout: () => 1, clearTimeout() {} });
  vm.runInContext(source('popup/color-picker.js'), ctx);
  ctx.setupColorPicker(input);
  const details = row.replacement;
  const [summary, editor] = details.children;
  const sliders = editor.children.slice(1, 4).map(label => label.children[0]);
  const outputs = editor.children.slice(1, 4).map(label => label.children[1]);
  const hex = editor.children[4].children[0];
  return { ctx, input, details, summary, sliders, outputs, hex };
}

test('saved color initializes inline RGB/HEX controls and hides the native OS picker', () => {
  const { input, summary, sliders, outputs, hex } = pickerHarness('#33ee99');
  assert.equal(input.hidden, true, 'native color input cannot receive pointer/focus');
  assert.deepEqual(sliders.map(slider => slider.value), ['51', '238', '153']);
  assert.deepEqual(outputs.map(output => output.textContent), ['51', '238', '153']);
  assert.equal(hex.value, '#33ee99');
  assert.equal(summary.children[1].style.backgroundColor, '#33ee99');
  assert.ok(sliders.every(slider => slider.type === 'range' && slider.max === '255'));
});

test('inline RGB dragging coalesces through the real writer and change commits the final color', async () => {
  const { ctx, input, sliders, hex } = pickerHarness('#33ee99');
  vm.runInContext(source('popup/config-writer.js'), ctx);
  const writes = [];
  const writer = ctx.createConfigWriter({ async set(batch) { writes.push({ ...batch }); } });
  let saved;
  input.addEventListener('input', () => writer.update({ authorTextColor: input.value }));
  input.addEventListener('change', () => { saved = writer.flush(); });
  for (let i = 0; i <= 240; i += 3) {
    sliders[0].value = String(i);
    sliders[0].dispatchEvent(new Event('input'));
  }
  assert.equal(input.value, '#f0ee99');
  assert.equal(hex.value, '#f0ee99');
  sliders[0].dispatchEvent(new Event('change'));
  await saved;
  assert.deepEqual(writes, [{ authorTextColor: '#f0ee99' }]);
});

test('HEX editing accepts complete colors, restores invalid text and does not affect another picker', () => {
  const { input, sliders, hex } = pickerHarness();
  const other = pickerHarness('#abcdef');
  const events = [];
  input.addEventListener('input', () => events.push(input.value));
  hex.value = '#FF8800';
  hex.dispatchEvent(new Event('input'));
  assert.equal(input.value, '#ff8800');
  assert.deepEqual(sliders.map(slider => slider.value), ['255', '136', '0']);
  for (const invalid of ['#12', 'red', '#zzzzzz']) {
    hex.value = invalid;
    hex.dispatchEvent(new Event('input'));
    assert.equal(input.value, '#ff8800');
    hex.dispatchEvent(new Event('change'));
    assert.equal(hex.value, '#ff8800');
  }
  assert.deepEqual(events, ['#ff8800']);
  assert.equal(other.input.value, '#abcdef');
});

test('Escape closes the inline editor, returns keyboard focus and commits on close', () => {
  const { input, details, summary } = pickerHarness();
  let commits = 0;
  input.addEventListener('change', () => commits++);
  details.open = true;
  details.dispatchEvent(new Event('toggle'));
  assert.equal(commits, 0);
  const escape = new Event('keydown', { cancelable: true });
  Object.defineProperty(escape, 'key', { value: 'Escape' });
  details.dispatchEvent(escape);
  assert.equal(details.open, false);
  assert.equal(summary.focused, true);
  assert.equal(escape.defaultPrevented, true);
  details.dispatchEvent(new Event('toggle'));
  assert.equal(commits, 1);
});
