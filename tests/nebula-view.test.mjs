import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraLimits, HORIZONTAL_ARC, VERTICAL_ARC, wrapYaw, panoramaSample, PANORAMA_PERIOD } from '../src/components/nebula/view.ts';

test('horizontal rotation completes any number of turns without a camera limit', () => {
  for (const angle of [-3.13, -1, 0, 1, 3.13]) {
    for (const turns of [-1000, -5, -1, 0, 1, 5, 1000]) {
      const sample = panoramaSample(angle + turns * HORIZONTAL_ARC);
      const base = panoramaSample(angle);
      assert.ok(Math.abs(sample.u - base.u) < 1e-10);
      assert.ok(Math.abs(sample.blend - base.blend) < 1e-10);
    }
  }
});

test('the rear overlap has a continuous color and slope across a full turn', () => {
  // An intentionally mismatched photograph: its ends have very different colors.
  const photo = u => .2 + .7 * u * u;
  const color = angle => {
    const { u, blend } = panoramaSample(angle);
    return photo(u + PANORAMA_PERIOD) * (1 - blend) + photo(u) * blend;
  };
  const epsilon = 1e-5;
  const seam = color(-Math.PI);
  const before = color(Math.PI - epsilon), after = color(-Math.PI + epsilon);
  assert.ok(Math.abs(before - after) < 1e-5);
  assert.ok(Math.abs((seam - before) / epsilon - (after - seam) / epsilon) < .001);
});

test('rebasing camera and target together preserves the direction and distance of inertia', () => {
  for (const camera of [Math.PI - .001, Math.PI + .1, -Math.PI - .1, 800 * Math.PI]) {
    for (const velocity of [-.3, .3]) {
      const target = camera + velocity;
      const wrapped = wrapYaw(camera);
      const rebasedTarget = target - (camera - wrapped);
      assert.ok(Math.abs(rebasedTarget - wrapped - velocity) < 1e-10);
    }
  }
});

test('vertical projection avoids the poles at all zoom and screen aspect limits', () => {
  for (const aspect of [.3, .46, .75, 1, 1.78, 2.4, 3.56, 5]) {
    for (const request of [.01, .2, .3, .42, .53, .7, 4]) {
      const limits = cameraLimits(aspect, request);
      assert.equal('yaw' in limits, false);
      for (const pitch of [-limits.pitch, 0, limits.pitch]) {
        for (let iy = 0; iy <= 12; iy++) {
          for (let ix = 0; ix <= 12; ix++) {
            const x = (ix / 6 - 1) * aspect * Math.tan(limits.halfFov);
            const y = (iy / 6 - 1) * Math.tan(limits.halfFov);
            const ry = (Math.cos(pitch) * y + Math.sin(pitch)) / Math.hypot(x, y, 1);
            const v = .5 + Math.asin(ry) / VERTICAL_ARC;
            assert.ok(v > 0 && v < 1);
          }
        }
      }
    }
  }
  assert.equal(cameraLimits(16 / 9, .001).halfFov, .2);
  assert.ok(cameraLimits(16 / 9, 10).halfFov <= .59);
});
