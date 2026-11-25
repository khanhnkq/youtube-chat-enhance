import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = path.join(root, '_locales');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const locales = fs.readdirSync(localesDir).filter(name => !name.startsWith('.'));

function messages(locale) {
  return JSON.parse(fs.readFileSync(path.join(localesDir, locale, 'messages.json'), 'utf8'));
}

// Store limits: Chrome Web Store name 75, summary 132, short_name 12; addons.mozilla.org name 50.
const LIMITS = { appName: 75, appNameFirefox: 50, appShortName: 12, appDesc: 132 };

test('the default locale exists', () => {
  assert.ok(locales.includes(manifest.default_locale), `_locales/${manifest.default_locale} is missing`);
});

test('every locale defines the same keys as the default locale', () => {
  const expected = Object.keys(messages(manifest.default_locale)).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(messages(locale)).sort(), expected, `keys differ in _locales/${locale}`);
  }
});

test('every __MSG_*__ key used by the manifest is defined', () => {
  const used = [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map(match => match[1]);
  used.push('appNameFirefox'); // set on the Firefox manifest by scripts/build.js
  for (const locale of locales) {
    const defined = messages(locale);
    for (const key of used) {
      assert.ok(defined[key]?.message, `_locales/${locale} is missing ${key}`);
    }
  }
});

test('localized names and summaries fit the store limits', () => {
  for (const locale of locales) {
    const defined = messages(locale);
    for (const [key, limit] of Object.entries(LIMITS)) {
      const length = [...defined[key].message].length;
      assert.ok(length <= limit, `_locales/${locale} ${key} is ${length} characters (limit ${limit})`);
    }
  }
});

test('localized names keep the DanmaChat brand and the YouTube compatibility wording', () => {
  for (const locale of locales) {
    const { appName, appShortName } = messages(locale);
    assert.ok(appName.message.startsWith('DanmaChat'), `_locales/${locale} appName must start with DanmaChat`);
    assert.ok(!appName.message.startsWith('YouTube'), `_locales/${locale} appName must not start with YouTube`);
    assert.equal(appShortName.message, 'DanmaChat');
  }
});
