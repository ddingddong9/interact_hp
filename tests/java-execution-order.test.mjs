import test from 'node:test';
import assert from 'node:assert/strict';
import { executionOrder } from '../src/components/java/executionOrder.ts';
import { lessons } from '../src/components/java/model.ts';
test('compilation never produces execution numbers or objects', () => {
  const frames = lessons['override-error'].frames;
  assert.equal(executionOrder(frames, frames.length - 1).size, 0);
  assert.equal(executionOrder(lessons['compile-time-binding'].frames, 2).size, 0);
});
test('revisited call lines retain distinct orders while consecutive explanation frames share one', () => {
  const frames = lessons['field-hiding'].frames;
  const line = frames[1].line;
  const visits = executionOrder(frames, frames.length - 1).get(line);
  assert.deepEqual(visits.map(v => v.step), [1, 5]);
  assert.deepEqual(visits.map(v => v.order), [1, 4]);
});
test('stepping backward removes future visits and keeps orders consecutive', () => {
  const frames = lessons['overload-recursion'].frames;
  const previous = executionOrder(frames, 8);
  assert.ok([...previous.values()].flat().every(visit => visit.step <= 8));
  const all = executionOrder(frames, frames.length - 1);
  const orders = [...all.values()].flat().map(visit => visit.order).sort((a, b) => a - b);
  assert.deepEqual(orders, orders.map((_, i) => i + 1));
  assert.ok(orders.length > [...previous.values()].flat().length);
});
