import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyTable, operationFrames } from '../src/components/hash/model.ts';
const finish = frames => frames.at(-1).table;
test('collisions preserve both keys and compare along the same chain', () => {
  const initial = emptyTable();
  const first = finish(operationFrames(initial, 'insert', 10, 'A'));
  const second = finish(operationFrames(first, 'insert', 17, 'B'));
  assert.deepEqual(initial[3], []);
  assert.deepEqual(second[3], [{ key: 10, value: 'A' }, { key: 17, value: 'B' }]);
  const search = operationFrames(second, 'search', 17);
  assert.deepEqual(search.filter(f => f.phase === 'compare').map(f => f.index), [0, 1]);
  assert.equal(search.at(-1).result, 'found');
});
test('repeated keys update values rather than create duplicate entries', () => {
  const first = finish(operationFrames(emptyTable(), 'insert', 10, 'A'));
  const frames = operationFrames(first, 'insert', 10, 'new');
  assert.deepEqual(finish(frames)[3], [{ key: 10, value: 'new' }]);
  assert.equal(first[3][0].value, 'A');
  assert.equal(frames.at(-1).result, 'updated');
});
test('deleting the head preserves access to later colliding entries', () => {
  const first = finish(operationFrames(emptyTable(), 'insert', 10, 'A'));
  const second = finish(operationFrames(first, 'insert', 17, 'B'));
  const removed = finish(operationFrames(second, 'delete', 10));
  assert.equal(operationFrames(removed, 'search', 17).at(-1).result, 'found');
  assert.equal(operationFrames(removed, 'search', 10).at(-1).result, 'missing');
});
test('missing lookup and deletion leave data unchanged', () => {
  const table = finish(operationFrames(emptyTable(), 'insert', 10, 'A'));
  const frames = operationFrames(table, 'delete', 24);
  assert.equal(frames.at(-1).result, 'missing');
  assert.deepEqual(finish(frames), table);
  assert.equal(operationFrames(table, 'search', 2).at(-1).result, 'missing');
});
