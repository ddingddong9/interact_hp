import test from 'node:test';
import assert from 'node:assert/strict';
import { CollapseScene, isTap, INFALL_SECONDS, RESTORE_SECONDS } from '../src/components/nebula/collapse.ts';

test('a collapse ends at a stable point and a second activation unfolds at the original position', () => {
  const effect = new CollapseScene();
  assert.equal(effect.activate(.23, .78), true);
  effect.advance(INFALL_SECONDS, false, false);
  assert.equal(effect.phase, 'point');
  assert.equal(effect.progress, 1);
  effect.advance(500, false, false);
  assert.equal(effect.phase, 'point');
  effect.activate(.5, .5);
  assert.equal(effect.phase, 'restore');
  assert.equal(effect.x, .23);
  assert.equal(effect.y, .78);
  effect.advance(RESTORE_SECONDS, false, false);
  assert.equal(effect.phase, 'idle');
  assert.equal(effect.progress, 0);
});

test('repeated activation cannot restart an in-progress absorption or restore', () => {
  const effect = new CollapseScene();
  effect.activate(.1, .8);
  effect.advance(2, false, false);
  const progress = effect.progress;
  assert.equal(effect.activate(.7, .3), false);
  assert.equal(effect.progress, progress);
  assert.equal(effect.x, .1);
  effect.advance(INFALL_SECONDS, false, false);
  effect.activate(.1, .8);
  assert.equal(effect.activate(.9, .9), false);
});

test('pause freezes absorption; reduced-motion finishes with the short transition', () => {
  const effect = new CollapseScene();
  effect.activate(.5, .5);
  effect.advance(10, false, true);
  assert.equal(effect.progress, 0);
  effect.advance(.9, true, false);
  assert.equal(effect.phase, 'point');
  effect.activate(.5, .5);
  effect.advance(.9, true, false);
  assert.equal(effect.phase, 'idle');
});

test('cancel/reset recovers from every animation phase', () => {
  for (const elapsed of [0, 3, 6.6]) {
    const effect = new CollapseScene();
    effect.activate(.5, .5);
    effect.advance(elapsed, false, false);
    effect.reset();
    assert.equal(effect.phase, 'idle');
    assert.equal(effect.progress, 0);
    assert.equal(effect.animating, false);
  }
});

test('dragging, long presses, cancelled and multi-pointer gestures cannot become a click', () => {
  const gesture = { id: 3, x: 100, y: 100, start: 10, moved: false };
  assert.equal(isTap(gesture, 3, 101, 103, 100), true);
  assert.equal(isTap(gesture, 3, 130, 100, 100), false);
  assert.equal(isTap({ ...gesture, moved: true }, 3, 100, 100, 100), false);
  assert.equal(isTap(gesture, 3, 100, 100, 600), false);
  assert.equal(isTap(gesture, 4, 100, 100, 100), false);
  assert.equal(isTap(null, 3, 100, 100, 100), false);
});
