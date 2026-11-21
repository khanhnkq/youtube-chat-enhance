#!/usr/bin/env node

/**
 * Runs `web-ext lint` on the built Firefox package (dist/firefox).
 * Fails on any error and on any warning that is not listed in
 * firefox-lint-known-warnings.json; the listed warnings are reported separately.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'dist', 'firefox');
const WEB_EXT = path.join(ROOT_DIR, 'node_modules', 'web-ext', 'bin', 'web-ext.js');
const KNOWN = JSON.parse(fs.readFileSync(path.join(__dirname, 'firefox-lint-known-warnings.json'), 'utf8'));

if (!fs.existsSync(path.join(SOURCE_DIR, 'manifest.json'))) {
  console.error('dist/firefox is missing. Run `npm run build` first.');
  process.exit(1);
}
if (!fs.existsSync(WEB_EXT)) {
  console.error('web-ext is not installed. Run `npm ci` first.');
  process.exit(1);
}

const run = spawnSync(
  process.execPath,
  [WEB_EXT, 'lint', '--source-dir', SOURCE_DIR, '--output', 'json', '--no-config-discovery'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);

let report;
try {
  report = JSON.parse(run.stdout);
} catch (error) {
  console.error('Could not read the web-ext lint report.');
  console.error(run.stderr || run.stdout || (run.error && run.error.message) || error.message);
  process.exit(1);
}

const isKnown = (warning, known) =>
  warning.code === known.code &&
  (!known.file || warning.file === known.file) &&
  (!known.contains || `${warning.description}`.includes(known.contains));

const errors = report.errors || [];
const warnings = report.warnings || [];
const knownWarnings = warnings.filter(w => KNOWN.some(k => isKnown(w, k)));
const newWarnings = warnings.filter(w => !KNOWN.some(k => isKnown(w, k)));
const staleEntries = KNOWN.filter(k => !warnings.some(w => isKnown(w, k)));

const describe = item =>
  `${item.code}${item.file ? ` (${item.file}${item.line ? `:${item.line}` : ''})` : ''}: ${item.description || item.message}`;

const sections = [
  ['Errors', errors.map(describe)],
  ['New warnings', newWarnings.map(describe)],
  ['Known warnings (accepted in scripts/firefox-lint-known-warnings.json)', knownWarnings.map(describe)],
  ['Known warnings no longer reported (remove them from the list)', staleEntries.map(k => k.code)]
];

const failed = errors.length > 0 || newWarnings.length > 0;
const headline = `web-ext lint on dist/firefox: ${errors.length} errors, ${newWarnings.length} new warnings, ${knownWarnings.length} known warnings`;

console.log(headline);
for (const [title, lines] of sections) {
  if (lines.length === 0) continue;
  console.log(`\n${title}:`);
  for (const line of lines) console.log(`  - ${line}`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [`### ${headline}`, ''];
  for (const [title, lines] of sections) {
    if (lines.length === 0) continue;
    summary.push(`**${title}**`, '', ...lines.map(line => `- ${line}`), '');
  }
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
}

process.exit(failed ? 1 : 0);
