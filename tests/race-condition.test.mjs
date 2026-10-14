import test from 'node:test';
import assert from 'node:assert/strict';
import { raceFrames } from '../src/components/race/model.ts';
for (const first of ['A', 'B']) {
  test(`separate ${first}-first allows duplicate acquisition despite zero remaining`, () => {
    const frames = raceFrames('separate', first);
    assert.equal(frames[0].seats, 1);
    assert.equal(frames[0].requests.A.read, null);
    const end = frames.at(-1);
    assert.equal(end.seats, 0);
    assert.equal(end.requests.A.result, 'success');
    assert.equal(end.requests.B.result, 'success');
    assert.equal(end.requests.A.read, 1);
    assert.equal(end.requests.B.read, 1);
  });
  test(`atomic ${first}-first admits exactly one acquisition and second reads zero`, () => {
    const second = first === 'A' ? 'B' : 'A';
    const frames = raceFrames('atomic', first);
    const end = frames.at(-1);
    assert.equal(end.seats, 0);
    assert.equal(end.requests[first].result, 'success');
    assert.equal(end.requests[second].result, 'failed');
    assert.equal(end.requests[second].read, 0);
    for (const frame of frames.filter(f => f.lockedBy === first)) {
      assert.equal(frame.requests[second].read, null);
    }
    assert.equal(end.lockedBy, null);
    assert.equal(end.waiting, null);
  });
}
