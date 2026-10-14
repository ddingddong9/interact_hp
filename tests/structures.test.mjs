import test from 'node:test';
import assert from 'node:assert/strict';
import { initialItems, makeFrames, spanBetween, ordered } from '../src/components/structures/model.ts';
const result = frames => frames.at(-1).items;
test('linked insertion supports head, middle, tail and immutable replay', () => {
  const source = initialItems('linked-list');
  for (const position of [0, 2, 5]) {
    const frames = makeFrames('linked-list', source, { action: 'insert', value: 99, position });
    assert.equal(result(frames)[position].value, 99);
    assert.equal(frames[0].items.length, 5);
    assert.equal(source.length, 5);
  }
  assert.throws(() => makeFrames('linked-list', source, { action: 'insert', value: 1, position: -1 }));
});
test('linked deletion removes first duplicate and handles empty list', () => {
  const source = [{ id: 'x', value: 1, height: 1 }, { id: 'y', value: 1, height: 1 }];
  assert.deepEqual(result(makeFrames('linked-list', source, { action: 'delete', value: 1 })).map(n => n.id), ['y']);
  assert.match(makeFrames('linked-list', [], { action: 'search', value: 2 }).at(-1).message, /NULL/);
});
test('skip search descends and finds existing values, duplicate insert preserves count', () => {
  const source = initialItems('skip-list');
  const frames = makeFrames('skip-list', source, { action: 'search', value: 40 });
  assert.match(frames.at(-1).message, /찾았습니다/);
  assert.ok(frames.some(frame => frame.level === 3));
  assert.ok(frames.some(frame => frame.level === 1));
  assert.equal(result(makeFrames('skip-list', source, { action: 'insert', value: 20 })).length, 5);
  assert.match(makeFrames('skip-list', source, { action: 'search', value: 35 }).at(-1).message, /없습니다/);
});
test('sorted member update, NX and ties are consistent', () => {
  const source = initialItems('sorted-set');
  const changed = result(makeFrames('sorted-set', source, { action: 'insert', member: 'E', value: 5 }));
  assert.equal(changed.length, 5);
  assert.equal(changed[0].id, 'E');
  assert.deepEqual(result(makeFrames('sorted-set', source, { action: 'insert', member: 'E', value: 5, nx: true })), source);
  const tie = result(makeFrames('sorted-set', source, { action: 'insert', member: 'AA', value: 10, height: 2 }));
  assert.deepEqual(tie.slice(0, 2).map(item => item.id), ['A', 'AA']);
});
test('Span accumulation gives every member the correct zero-based rank after edits', () => {
  let source = initialItems('sorted-set');
  source = result(makeFrames('sorted-set', source, { action: 'insert', member: 'F', value: 25, height: 3 }));
  source = result(makeFrames('sorted-set', source, { action: 'delete', member: 'A', value: 0 }));
  ordered(source).forEach((item, index) => {
    const frame = makeFrames('sorted-set', source, { action: 'rank', member: item.id, value: 0 }).at(-1);
    assert.equal(frame.rank - 1, index);
  });
  assert.equal(spanBetween(source, -1, 2), 3);
});
test('sorted missing member does not traverse or alter data', () => {
  const source = initialItems('sorted-set');
  const frames = makeFrames('sorted-set', source, { action: 'delete', member: 'missing', value: 0 });
  assert.ok(frames.every(frame => frame.view === 'index'));
  assert.deepEqual(result(frames), source);
});
