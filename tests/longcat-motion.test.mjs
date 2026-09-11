import test from 'node:test';
import assert from 'node:assert/strict';
import { ElasticBody } from '../src/components/longcat/motion.ts';

test('long pulls resist and release settles without inverting the body', () => {
  const body = new ElasticBody();
  body.pull(100000, -100000, 300);
  assert.ok(body.target <= 660 && body.targetLift >= -150);
  for (let i = 0; i < 120; i++) body.step(1 / 60, false);
  assert.ok(body.stretch > 600);
  body.release();
  let overshot = false;
  for (let i = 0; i < 420; i++) {
    body.step(1 / 60, false);
    assert.ok(Number.isFinite(body.stretch) && body.stretch >= -48);
    if (body.stretch < 0) overshot = true;
  }
  assert.ok(overshot);
  assert.equal(body.stretch, 0);
  assert.equal(body.lift, 0);
});

test('reduced motion follows direct dragging and returns without spring oscillation', () => {
  const body = new ElasticBody();
  body.pull(200, -50, 200); body.step(1 / 60, true);
  assert.equal(body.stretch, body.target);
  body.release(); body.step(1 / 60, true);
  assert.equal(body.stretch, 0);
  assert.equal(body.velocity, 0);
});

test('regrabbing a moving body remains bounded across different frame rates', () => {
  for (const fps of [30, 60, 120]) {
    const body = new ElasticBody();
    body.pull(150, -40, 250);
    for (let i = 0; i < fps; i++) body.step(1 / fps, false);
    body.release(); body.step(1 / fps, false);
    body.pull(-900, 900, 250);
    for (let i = 0; i < fps * 2; i++) body.step(1 / fps, false);
    assert.ok(Math.abs(body.stretch + 30) < 1);
    assert.ok(Math.abs(body.lift - 50) < 1);
  }
});
