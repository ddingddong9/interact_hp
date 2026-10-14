import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAdmission, admitTick, enqueueVisitor, finishVisitor } from '../src/components/admission/model.ts';
test('rate and capacity bound FIFO admission across ticks', () => {
  const initial = initialAdmission();
  const first = admitTick(initial, 2, 3).state;
  const second = admitTick(first, 2, 3).state;
  assert.deepEqual(first.active.map(u => u.id), ['A', 'B']);
  assert.deepEqual(second.active.map(u => u.id), ['A', 'B', 'C']);
  assert.deepEqual(second.waiting.map(u => u.id), ['D', 'E']);
  assert.deepEqual(admitTick(second, 2, 3).state.active, second.active);
  assert.equal(initial.active.length, 0);
});
test('completion frees a slot for the earliest remaining visitor', () => {
  let state = admitTick(initialAdmission(), 5, 3).state;
  state = finishVisitor(state, 'B').state;
  state = admitTick(state, 2, 3).state;
  assert.deepEqual(state.active.map(u => u.id), ['A', 'C', 'D']);
  assert.deepEqual(state.finished.map(u => u.id), ['B']);
  assert.deepEqual(state.waiting.map(u => u.id), ['E']);
});
test('enqueue preserves monotonic order and rejects duplicate identities', () => {
  const initial = initialAdmission();
  const next = enqueueVisitor(initial, 'F').state;
  assert.equal(next.waiting.at(-1).order, 6);
  assert.equal(next.nextOrder, 7);
  assert.throws(() => enqueueVisitor(next, 'A'));
  const active = admitTick(next, 1, 3).state;
  assert.throws(() => enqueueVisitor(active, 'A'));
  assert.throws(() => enqueueVisitor(finishVisitor(active, 'A').state, 'A'));
});
test('empty queue and capacity reductions do not admit or evict users', () => {
  const active = admitTick(initialAdmission(), 5, 5).state;
  const next = admitTick(active, 2, 2).state;
  assert.equal(next.active.length, 5);
  assert.equal(next.waiting.length, 0);
  assert.throws(() => admitTick(initialAdmission(), 0, 3));
  assert.throws(() => finishVisitor(initialAdmission(), 'A'));
});
