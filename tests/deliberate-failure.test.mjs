import assert from 'node:assert/strict';
import test from 'node:test';

test('deliberate failure to prove the pull request checks go red', () => {
  assert.equal(1, 2);
});
