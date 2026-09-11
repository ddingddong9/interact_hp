import test from 'node:test';
import assert from 'node:assert/strict';
import { playPageMotion } from '../src/components/pageMotion.ts';

globalThis.window = { innerWidth: 1280, innerHeight: 800 };

function setup(direction) {
  const log = [];
  function element(name) {
    return {
      style: { opacity: '', visibility: '' }, animations: [],
      animate(frames, options) {
        log.push({ name, frames, options });
        const animation = { effect: { target: this }, cancelled: false, finished: Promise.resolve(), cancel() { this.cancelled = true; } };
        this.animations.push(animation);
        return animation;
      },
    };
  }
  const surface = element('surface'), frame = element('frame'), veil = element('veil'), layer = element('layer'), target = element('target');
  layer.querySelector = selector => selector.endsWith('__frame') ? frame : veil;
  let mounted = false;
  target.getBoundingClientRect = () => {
    assert.ok(mounted, 'home is restored before measuring the destination');
    assert.ok(surface.animations.every(animation => animation.cancelled), 'outgoing page transform cannot affect destination coordinates');
    return { left: 510, top: 200, width: 260, height: 390 };
  };
  const poster = { layer, direction, book: { left: 510, top: 200, width: 260, height: 390, layoutWidth: 260, layoutHeight: 390 }, findTarget: () => target };
  return { surface, frame, target, log, poster, commit: () => { mounted = true; log.push({ name: 'commit' }); } };
}

test('entry stages the poster before mounting and sliding the full-size project', async () => {
  const s = setup('enter');
  await playPageMotion(s.surface, s.commit, new AbortController().signal, s.poster);
  const commit = s.log.findIndex(item => item.name === 'commit');
  assert.ok(commit > 1);
  assert.equal(s.log[commit - 1].options.duration, 300);
  assert.ok(s.log.slice(commit + 1).some(item => item.name === 'surface' && item.frames[0].transform === 'translateX(100%)'));
  for (const item of s.log.filter(item => item.name === 'frame')) {
    assert.ok(item.frames.every(keyframe => !('width' in keyframe) && !('height' in keyframe)), 'poster text layout remains fixed');
  }
});

test('exit measures the settled home and restores the real poster after docking', async () => {
  const s = setup('exit');
  await playPageMotion(s.surface, s.commit, new AbortController().signal, s.poster);
  assert.equal(s.target.style.visibility, '');
  assert.equal(s.surface.style.opacity, '');
  assert.ok(s.log.some(item => item.name === 'frame' && item.frames.at(-1).transform === 'translate(510px, 200px) scale(1)'));
});

test('interrupted entry cleans animations without starting the slide', async () => {
  const s = setup('enter'), controller = new AbortController();
  await assert.rejects(playPageMotion(s.surface, () => controller.abort(), controller.signal, s.poster), { name: 'AbortError' });
  assert.ok(s.frame.animations.every(animation => animation.cancelled));
  assert.equal(s.surface.style.opacity, '');
});
