import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\0')
      .filter(Boolean);
  } catch {
    return null;
  }
}

test('release packages are not tracked in the repository', (t) => {
  const files = trackedFiles();
  if (!files) return t.skip('not a git checkout');
  const packages = files.filter(file => /\.(zip|xpi|crx)$/i.test(file) || file.startsWith('dist/'));
  assert.deepEqual(packages, [], 'build packages with `npm run build` and attach them to a release instead of committing them');
});
