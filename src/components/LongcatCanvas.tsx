import { useEffect, useRef, useState } from 'react';
import { ElasticBody, Pursuit, clamp, smooth } from './longcat/motion';

type Cat = {
  x: number; y: number; width: number; height: number; direction: number;
  lane: number; size: number; speed: number; gait: number; resting: number;
  offended: number; nap: boolean; body: ElasticBody;
  pursuit?: Pursuit; attention?: number; settled?: number; crouch?: number; look?: number;
};

export default function LongcatCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches, width = 1, height = 1, frame = 0, last = 0, time = 0;
    let loaded = false, disposed = false, paused = false;
    let drag: { id: number; cat: Cat; x: number; y: number } | null = null;
    let press: { id: number; x: number; y: number; at: number; moved: boolean } | null = null;
    const pointer = { x: 0, y: 0, inside: false, speed: 0, at: 0 };
    let lure: { x: number; y: number; age: number } | null = null;
    const image = new Image();
    // Source bounds are measured once from the supplied transparent artwork.
    let source = { x: 0, y: 0, width: 1, height: 1 };
    const cats: Cat[] = [
      { x: 0, y: 0, width: 0, height: 0, direction: 1, lane: .65, size: 1, speed: 19, gait: 0, resting: 2.2, offended: 0, nap: false, body: new ElasticBody() },
      { x: 0, y: 0, width: 0, height: 0, direction: -1, lane: .37, size: .58, speed: 13, gait: 2, resting: 4, offended: 0, nap: true, body: new ElasticBody() },
      { x: 0, y: 0, width: 0, height: 0, direction: 1, lane: .84, size: .68, speed: 24, gait: 4, resting: .4, offended: 0, nap: false, body: new ElasticBody() },
    ];

    function requestFrame() {
      if (frame || disposed || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function resize() {
      const oldWidth = width;
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cats.forEach((cat, i) => {
        cat.width = Math.min(360, width * .52, height * .63) * cat.size;
        cat.height = cat.width * source.height / source.width;
        cat.y = height * cat.lane;
        cat.x = oldWidth === 1 ? width * [.65, .33, .63][i] : cat.x / oldWidth * width;
        keepInside(cat);
      });
      requestFrame();
    }
    function keepInside(cat: Cat) {
      const padding = Math.min(34, width * .05);
      const low = cat.direction === 1 ? padding + cat.width : padding;
      const high = cat.direction === 1 ? width - padding : width - padding - cat.width;
      cat.x = clamp(cat.x, low, Math.max(low, high));
    }
    function tick(now: number) {
      frame = 0;
      const dt = Math.min(.04, Math.max(0, (now - last) / 1000));
      last = now;
      const active = !paused && !canvas.closest('[data-transitioning]');
      if (active) {
        time += dt;
        pointer.speed *= Math.exp(-dt * 4);
        if (lure) { lure.age += dt; if (lure.age > 6) lure = null; }
      }
      ctx!.clearRect(0, 0, width, height);
      if (loaded) cats.forEach((cat, i) => {
        if (active) {
          cat.resting = Math.max(0, cat.resting - dt);
          cat.offended = Math.max(0, cat.offended - dt);
          behave(cat, i, dt);
          cat.body.step(dt, reduced);
        }
        draw(cat);
      });
      if (lure) {
        const bounce = reduced ? 0 : Math.abs(Math.sin(lure.age * 7)) * 24 * Math.exp(-lure.age * 1.5);
        ctx!.globalAlpha = 1 - smooth((lure.age - 4.8) / 1.2);
        ctx!.fillStyle = '#fff3d8';
        ctx!.beginPath(); ctx!.arc(lure.x, lure.y - bounce, 4.5, 0, Math.PI * 2); ctx!.fill();
        ctx!.globalAlpha = 1;
      }
      if (!document.hidden && !paused && (!reduced || !!lure || cats.some(cat => cat.body.held))) frame = requestAnimationFrame(tick);
    }
    function behave(cat: Cat, index: number, dt: number) {
      const brain = cat.pursuit ??= new Pursuit();
      cat.crouch = Math.max(0, (cat.crouch ?? 0) - dt);
      const target = lure ?? (pointer.inside ? pointer : null);
      const distance = target ? Math.hypot(target.x - cat.x, target.y - (cat.y - cat.height * .5)) : Infinity;
      const notice = [Math.max(260, width * .48), 170, Math.max(420, width * .7)][index];
      const noticed = !!target && (!!lure || distance < notice);
      const attentionBefore = cat.attention ?? 0;
      cat.attention = noticed ? 1 : Math.max(0, attentionBefore - dt * .35);
      cat.look = (cat.look ?? 0) + ((target && cat.attention ? clamp((target.y - cat.y + cat.height * .5) / 100, -1, 1) : 0) - (cat.look ?? 0)) * (1 - Math.exp(-dt * 7));
      if (cat.body.held || cat.offended || reduced) { brain.stop(); return; }
      if (noticed && attentionBefore < .2) {
        cat.nap = false; cat.settled = 0;
        cat.crouch = pointer.speed > 600 ? [.28, .5, .14][index] : [0, .3, 0][index];
      }
      if (target && cat.attention > 0 && !cat.crouch) {
        let targetX = target.x + [-12, -38, 30][index];
        let targetY = target.y + cat.height * .52 + [0, -28, 36][index];
        // Soft spacing prevents all three faces occupying the same point.
        for (const other of cats) {
          if (other === cat) continue;
          const dx = cat.x - other.x, dy = cat.y - other.y;
          const gap = Math.hypot(dx, dy), spacing = Math.min(cat.height, other.height) * .72;
          if (gap < spacing) {
            const push = (spacing - gap) * 1.7;
            targetX += dx / Math.max(1, gap) * push;
            targetY += (gap < 1 ? index - 1 : dy / gap) * push;
          }
        }
        const pad = Math.min(34, width * .05);
        // Turn around the body centre only when the target is behind the rump.
        if ((targetX - cat.x) * cat.direction < -cat.width * .72 && cat.resting === 0) {
          cat.x -= cat.direction * cat.width;
          cat.direction *= -1;
          brain.stop(); cat.resting = .35;
        }
        targetX = clamp(targetX, cat.direction === 1 ? pad + cat.width : pad, cat.direction === 1 ? width - pad : width - pad - cat.width);
        targetY = clamp(targetY, cat.height + 40, height - 65);
        const speed = [115, 72, 190][index] * (lure ? 1.45 : 1 + Math.min(.45, pointer.speed / 2000));
        const gap = brain.step(targetX - cat.x, targetY - cat.y, cat.nap ? 0 : speed, dt);
        cat.x += brain.vx * dt; cat.y += brain.vy * dt;
        cat.body.follow(Math.hypot(brain.vx, brain.vy), cat.width);
        cat.gait += Math.hypot(brain.vx, brain.vy) * dt / Math.max(12, cat.width * .07);
        cat.settled = gap < 35 ? (cat.settled ?? 0) + dt : 0;
        if (gap > 65) cat.nap = false;
        if ((cat.settled ?? 0) > [3.5, 1.8, 5][index]) cat.nap = true;
      } else {
        brain.step(0, 0, 0, dt);
        cat.x += brain.vx * dt; cat.y += brain.vy * dt;
        cat.body.follow(0, cat.width);
        cat.settled = (cat.settled ?? 0) + dt;
        if ((cat.settled ?? 0) > 5) cat.nap = true;
      }
      keepInside(cat);
    }
    function draw(cat: Cat) {
      const body = cat.body;
      const walking = !reduced && !paused && !cat.nap && !body.held && Math.hypot(cat.pursuit?.vx ?? 0, cat.pursuit?.vy ?? 0) > 4;
      const breath = reduced ? 0 : Math.sin(time * (cat.nap ? 1.6 : 2.2) + cat.gait) * (cat.nap ? 2 : .7);
      const bounce = walking ? Math.sin(cat.gait * 2) * 1.6 : breath;
      const squash = cat.nap ? .86 : cat.crouch ? .90 : 1;
      ctx!.save();
      ctx!.translate(cat.x, cat.y);
      ctx!.scale(cat.direction, 1);
      // Draw the original artwork in narrow strips. The face and paws stay
      // compact; only the clear middle of the torso extends like an elastic line.
      const columns = 64;
      for (let i = 0; i < columns; i++) {
        const u0 = i / columns, u1 = (i + 1) / columns;
        const point = (u: number) => {
          const torso = smooth((u - .25) / .43);
          const x = (u - 1) * cat.width - body.stretch * (1 - torso);
          const arch = Math.sin(Math.PI * torso);
          const y = body.lift * arch + bounce * (1 - smooth((u - .75) / .15));
          const attitude = Math.sin(Math.PI * clamp(cat.offended / 1.6, 0, 1)) * -3 * smooth((u - .7) / .25);
          const gaze = (cat.look ?? 0) * cat.height * .055 * smooth((u - .72) / .24);
          return { x, y: y + attitude + gaze };
        };
        const a = point(u0), b = point(u1), dx = Math.max(.2, b.x - a.x);
        ctx!.save();
        ctx!.transform(1, (b.y - a.y) / dx, 0, 1, a.x, a.y);
        const cut = .81;
        const h = cat.height * squash;
        ctx!.drawImage(image, source.x + source.width * u0, source.y, source.width / columns, source.height * cut,
          0, -h, dx + .55, h * cut + .2);
        // Legs swing about their attachment point; head and torso remain steady.
        const legPhase = u0 < .5 ? 0 : Math.PI;
        const swing = walking ? Math.sin(cat.gait + legPhase) * cat.width * .013 : 0;
        ctx!.transform(1, 0, swing / (h * (1 - cut)), 1, swing, 0);
        ctx!.drawImage(image, source.x + source.width * u0, source.y + source.height * cut, source.width / columns, source.height * (1 - cut),
          0, -h * (1 - cut), dx + .55, h * (1 - cut));
        ctx!.restore();
      }
      ctx!.restore();
    }
    function location(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }
    function hit(x: number, y: number) {
      return [...cats].reverse().find(cat => {
        const local = (x - cat.x) * cat.direction;
        return local >= -cat.width - cat.body.stretch - 12 && local <= 12
          && y > cat.y - cat.height + Math.min(0, cat.body.lift) - 12 && y < cat.y + 12;
      });
    }
    function down(event: PointerEvent) {
      if (event.button !== 0 || press || !loaded) return;
      const p = location(event), cat = hit(p.x, p.y);
      pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
      press = { id: event.pointerId, x: p.x, y: p.y, at: performance.now(), moved: false };
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      if (!cat) { requestFrame(); return; }
      cat.pursuit?.stop();
      cat.nap = false; cat.resting = 0; cat.offended = 0;
      cat.body.pull(cat.body.stretch, cat.body.lift, cat.width);
      drag = { id: event.pointerId, cat, x: p.x + cat.body.stretch * cat.direction, y: p.y };
      canvas.style.cursor = 'grabbing';
      requestFrame();
    }
    function move(event: PointerEvent) {
      const p = location(event);
      if (press && press.id !== event.pointerId) return;
      const now = performance.now();
      const elapsed = Math.max(.008, (now - pointer.at) / 1000);
      pointer.speed = pointer.inside ? pointer.speed * .55 + Math.min(2400, Math.hypot(p.x - pointer.x, p.y - pointer.y) / elapsed) * .45 : 0;
      pointer.x = p.x; pointer.y = p.y; pointer.inside = true; pointer.at = now;
      if (press && Math.hypot(p.x - press.x, p.y - press.y) > 8) press.moved = true;
      if (drag?.id === event.pointerId) {
        drag.cat.body.pull((drag.x - p.x) * drag.cat.direction, p.y - drag.y, drag.cat.width);
        requestFrame();
      } else canvas.style.cursor = hit(p.x, p.y) ? 'grab' : 'default';
      requestFrame();
    }
    function release() {
      if (!drag) return;
      const previous = drag;
      drag = null;
      previous.cat.body.release(); previous.cat.offended = 1.6; previous.cat.resting = 2.2;
      if (canvas.hasPointerCapture(previous.id)) canvas.releasePointerCapture(previous.id);
      canvas.style.cursor = 'grab';
      requestFrame();
    }
    function up(event: PointerEvent) {
      if (press?.id !== event.pointerId) return;
      const tapped = !press.moved && performance.now() - press.at < 400;
      const p = location(event);
      press = null;
      release();
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (tapped) dropLure(p.x, p.y);
      if (event.pointerType === 'touch') pointer.inside = false;
      requestFrame();
    }
    function dropLure(x: number, y: number) {
      lure = { x: clamp(x, 12, width - 12), y: clamp(y, 20, height - 65), age: 0 };
      cats.forEach(cat => { cat.nap = false; cat.settled = 0; cat.attention = 0; cat.offended = 0; });
      requestFrame();
    }
    function cancelPress() {
      const id = press?.id;
      press = null; release();
      if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      pointer.inside = false;
    }
    function leave() { if (!press) pointer.inside = false; }
    function key(event: KeyboardEvent) {
      if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      const cat = cats[0];
      if (event.key === 'Enter') {
        cat.nap = false;
        if (cat.body.held) { cat.body.release(); cat.offended = 1.6; cat.resting = 2.2; }
        else cat.body.pull(cat.width * 1.1, -cat.width * .1, cat.width);
      } else if (event.key === ' ') { cat.nap = !cat.nap; cat.body.release(); }
      else if (event.key === 'Escape') { release(); cats.forEach(c => c.body.release()); }
      else {
        const origin = lure ?? { x: width * .5, y: height * .55 };
        dropLure(origin.x + (event.key === 'ArrowLeft' ? -50 : event.key === 'ArrowRight' ? 50 : 0), origin.y + (event.key === 'ArrowUp' ? -40 : event.key === 'ArrowDown' ? 40 : 0));
      }
      requestFrame();
    }
    function visibility() {
      cancelPress();
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else requestFrame();
    }
    function motionChange() { reduced = media.matches; requestFrame(); }
    function blur() { cancelPress(); paused = true; }
    function focus() { paused = false; requestFrame(); }
    image.onload = () => {
      if (disposed) return;
      // Read alpha bounds without modifying the generated asset.
      const probe = document.createElement('canvas');
      probe.width = image.naturalWidth; probe.height = image.naturalHeight;
      const context = probe.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
      let left = probe.width, right = 0, top = probe.height, bottom = 0;
      for (let y = 0; y < probe.height; y++) for (let x = 0; x < probe.width; x++) {
        if (pixels[(y * probe.width + x) * 4 + 3] > 30) {
          left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      source = { x: left, y: top, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1) };
      loaded = true; setReady(true); resize();
    };
    image.src = '/images/longcat/longcat.png';
    resize();
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancelPress);
    canvas.addEventListener('lostpointercapture', cancelPress); canvas.addEventListener('keydown', key);
    canvas.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility); media.addEventListener('change', motionChange);
    window.addEventListener('blur', blur); window.addEventListener('focus', focus);
    return () => {
      disposed = true; cancelPress(); cancelAnimationFrame(frame); observer.disconnect(); image.onload = null;
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancelPress);
      canvas.removeEventListener('lostpointercapture', cancelPress); canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', motionChange);
      window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
    };
  }, []);
  return <canvas ref={ref} className={`longcat-canvas${ready ? ' is-ready' : ''}`} tabIndex={0} role="application"
    aria-label="Longcat. Move your pointer to attract the cats. Tap to drop a point for them to chase. Drag a cat to stretch it. Arrow keys move the lure. Enter stretches or releases the main cat. Space toggles its nap." />;
}
