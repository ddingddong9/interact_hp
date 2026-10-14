import test from 'node:test';
import assert from 'node:assert/strict';
import { initialLuaState, luaFrames } from '../src/components/lua/model.ts';
test('successful acquisition changes stock and records exactly one member', () => {
  const source = initialLuaState();
  const frames = luaFrames(source, 'A', true);
  assert.deepEqual(frames.at(-1).state, { seats: 0, reserved: ['A'] });
  assert.equal(frames.at(-1).result, 'RESERVED');
  assert.deepEqual(source, initialLuaState());
  assert.deepEqual(frames[0].state, initialLuaState());
});
test('retry after last-seat success returns duplicate without further deduction', () => {
  const source = luaFrames(initialLuaState(), 'A', true).at(-1).state;
  const end = luaFrames(source, 'A', true).at(-1);
  assert.equal(end.result, 'DUPLICATE');
  assert.deepEqual(end.state, source);
});
test('another user receives sold out without modifying records', () => {
  const source = { seats: 0, reserved: ['A'] };
  const end = luaFrames(source, 'B', true).at(-1);
  assert.equal(end.result, 'SOLD_OUT');
  assert.deepEqual(end.state, source);
});
test('permission rejection precedes all writes and duplicate checks', () => {
  const source = { seats: 2, reserved: ['A'] };
  const frames = luaFrames(source, 'A', false);
  assert.equal(frames.at(-1).result, 'NO_ENTRY');
  assert.ok(frames.every(frame => frame.phase <= 1));
  assert.deepEqual(frames.at(-1).state, source);
});
