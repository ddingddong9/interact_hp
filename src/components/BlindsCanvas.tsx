import { useEffect, useRef, useState } from 'react';

const ART = '/images/blinds/girl-with-a-pearl-earring.png';
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
type Opening = { x: number; row: number; amount: number; target: number; velocity: number };

export default function BlindsCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) { setFallback(true); return; }
    const surface = canvas;
    const context = ctx;
    const photo = document.createElement('canvas');
    const matte = document.createElement('canvas');
    const photoCtx = photo.getContext('2d')!;
    const matteCtx = matte.getContext('2d')!;
    const image = new Image();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches;
    let width = 1, height = 1, pitch = 3.4, dpr = 1;
    let loaded = false, disposed = false, frame = 0, last = 0;
    let openings: Opening[] = [];
    const hover = { x: .5, y: .45, strength: 0, target: 0 };
    const ripple = { x: .5, y: .45, energy: 0, phase: 0, sampledAt: 0 };
    let press: { x: number; y: number; id: number; opening: Opening } | null = null;
    let keyOpening: Opening | null = null;
    let keyboard = false;

    function requestFrame() {
      if (frame || disposed || !loaded || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function resize() {
      const bounds = surface.getBoundingClientRect();
      const oldPitch = pitch, oldHeight = height;
      if (press) release();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      pitch = height / Math.round(height / (width < 600 ? 3.1 : 3.4));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const opening of openings) opening.row = clamp(Math.round(opening.row * oldPitch / oldHeight * height / pitch), 1, Math.ceil(height / pitch) - 2);
      if (!loaded) return;
      photo.width = matte.width = Math.ceil(width * dpr);
      photo.height = matte.height = Math.ceil(height * dpr);
      photoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      photoCtx.fillStyle = '#080a0a'; photoCtx.fillRect(0, 0, width, height);
      // One fixed photographic plane: parting the lines never moves the artwork.
      const artHeight = width < 600
        ? Math.min(height * 1.16, width * 1.9)
        : Math.max(height * 1.28, Math.min(width * 1.42, height * 1.65));
      const artWidth = artHeight * image.naturalWidth / image.naturalHeight;
      const artTop = width < 600 ? (height - artHeight) / 2 : -artHeight * .065;
      photoCtx.drawImage(image, (width - artWidth) / 2, artTop, artWidth, artHeight);
      matteCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      matteCtx.fillStyle = '#080a0a'; matteCtx.fillRect(0, 0, width, height);
      matteCtx.filter = `blur(${Math.max(10, height * .021)}px) saturate(.84)`;
      matteCtx.drawImage(photo, 0, 0, width, height);
      matteCtx.filter = 'none';
      matteCtx.fillStyle = 'rgba(160,164,155,.035)'; matteCtx.fillRect(0, 0, width, height);
      requestFrame();
    }

    function displacement(y: number, x: number) {
      let shift = 0;
      // Speed controls the reach and amplitude of a continuous wave, without opening a slit.
      if (!reduced && !press && !keyboard && ripple.energy > .01) {
        const dx = (x - ripple.x * width) / Math.min(140 + ripple.energy * 3.5, width * .38);
        const dy = (y - ripple.y * height) / (75 + ripple.energy * 3);
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          const wave = Math.cos(Math.hypot(dx, dy) * 2.4 - ripple.phase);
          shift += ripple.energy * wave * (1 - dx * dx) ** 3 * (1 - dy * dy) ** 3;
        }
      }
      for (const opening of openings) {
        const radius = Math.min(width * .55, height * .44) + opening.amount * .25;
        const distance = (x - opening.x * width) / radius;
        if (Math.abs(distance) >= 1) continue;
        const envelope = (1 - distance * distance) ** 3;
        const delta = y - opening.row * pitch;
        const reach = delta >= 0 ? Math.max(110, opening.amount * 2.6) : 85;
        const t = Math.min(1, Math.abs(delta) / reach);
        const falloff = 1 - t * t * (3 - 2 * t);
        shift += opening.amount * envelope * falloff * (delta >= 0 ? 1 : -.12);
      }
      return shift;
    }

    function draw() {
      context.drawImage(photo, 0, 0, width, height);
      const rows = Math.ceil(height / pitch);
      const segments = Math.ceil(width / 18);
      const step = width / segments;
      for (let row = rows - 1; row >= 0; row--) {
        const sy = row * pitch;
        const sh = Math.min(pitch, height - sy);
        const samples = Array.from({ length: segments + 1 }, (_, j) => {
          const x = j * step;
          return { x, top: sy + displacement(sy, x), bottom: sy + sh + displacement(sy + sh - .001, x) };
        });
        const flat = samples.every(p => Math.abs(p.top - sy) < .025 && Math.abs(p.bottom - sy - sh) < .025);
        if (flat) {
          context.drawImage(matte, 0, sy * dpr, matte.width, sh * dpr, 0, sy, width, sh);
          context.fillStyle = 'rgba(0,0,0,.68)'; context.fillRect(0, sy + sh - .8, width, .8);
          continue;
        }
        // Colour follows each hairline; there are no solid slats, bevels or cords.
        for (let j = 0; j < segments; j++) {
          const a = samples[j], b = samples[j + 1];
          const lineHeight = Math.max(.25, (a.bottom - a.top + b.bottom - b.top) / 2);
          context.save();
          context.transform(1, (b.top - a.top) / step, 0, lineHeight / sh, a.x, a.top);
          context.drawImage(matte, a.x * dpr, sy * dpr, Math.min(step * dpr, matte.width - a.x * dpr), sh * dpr,
            0, 0, step + .5, sh);
          context.restore();
        }
        context.beginPath();
        samples.forEach((p, i) => i ? context.lineTo(p.x, p.bottom - .4) : context.moveTo(p.x, p.bottom - .4));
        context.strokeStyle = 'rgba(0,0,0,.68)'; context.lineWidth = .8; context.stroke();
      }
      // A small cursor ring expresses where to pull, without explanatory text.
      if (hover.strength > .01 && !keyboard) {
        context.globalAlpha = hover.strength * .65;
        context.beginPath(); context.arc(hover.x * width, hover.y * height, press ? 5 : 8, 0, Math.PI * 2);
        context.strokeStyle = '#f0e6cf'; context.lineWidth = .8; context.stroke(); context.globalAlpha = 1;
      }
      if (keyboard) {
        context.beginPath(); context.arc(hover.x * width, hover.y * height, 7, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(255,246,220,.9)'; context.lineWidth = 1; context.stroke();
      }
    }

    function tick(now: number) {
      frame = 0;
      const dt = Math.min(.032, Math.max(.001, (now - last) / 1000)); last = now;
      let moving = false;
      for (const opening of openings) {
        if (reduced) { opening.amount = opening.target; opening.velocity = 0; }
        else {
          // Near-critical damping: weighted bending, with no rubbery bounce.
          opening.velocity += ((opening.target - opening.amount) * (press?.opening === opening ? 210 : 35) - opening.velocity * (press?.opening === opening ? 29 : 12)) * dt;
          opening.amount += opening.velocity * dt;
        }
        if (Math.abs(opening.amount - opening.target) > .0005 || Math.abs(opening.velocity) > .001) moving = true;
        else { opening.amount = opening.target; opening.velocity = 0; }
      }
      openings = openings.filter(o => o === press?.opening || o === keyOpening || o.target || o.amount > .0001);
      hover.strength += (hover.target - hover.strength) * (1 - Math.exp(-dt * 12));
      if (Math.abs(hover.target - hover.strength) > .001) moving = true;
      ripple.x += (hover.x - ripple.x) * (1 - Math.exp(-dt * 18));
      ripple.y += (hover.y - ripple.y) * (1 - Math.exp(-dt * 18));
      ripple.phase = (ripple.phase + dt * 7.5) % (Math.PI * 2);
      ripple.energy = reduced || press || keyboard ? 0 : ripple.energy * Math.exp(-dt * 2.6);
      if (ripple.energy > .01) moving = true;
      else ripple.energy = 0;
      draw();
      if (moving && !document.hidden) frame = requestAnimationFrame(tick);
    }

    function begin(x: number, y: number) {
      for (const opening of openings) opening.target = 0;
      const opening = { x, row: clamp(Math.floor(y * height / pitch), 1, Math.ceil(height / pitch) - 2), target: 0, amount: 0, velocity: 0 };
      openings.push(opening);
      openings = openings.slice(-3);
      return opening;
    }
    function release() {
      if (press) {
        press.opening.target = 0;
        if (surface.hasPointerCapture(press.id)) surface.releasePointerCapture(press.id);
      }
      press = null;
      surface.classList.remove('is-pulling');
      requestFrame();
    }
    function location(e: PointerEvent) {
      const b = surface.getBoundingClientRect();
      return { x: clamp((e.clientX - b.left) / b.width, 0, 1), y: clamp((e.clientY - b.top) / b.height, 0, 1) };
    }
    function move(e: PointerEvent) {
      if (press && press.id !== e.pointerId) return;
      const p = location(e);
      if (!hover.target) { ripple.x = p.x; ripple.y = p.y; }
      else if (!press && !reduced && e.pointerType !== 'touch') {
        const distance = Math.hypot((p.x - hover.x) * width, (p.y - hover.y) * height);
        const elapsed = e.timeStamp - ripple.sampledAt;
        if (elapsed > 0 && elapsed < 120) {
          // Pixels per second makes fast sweeps stronger regardless of mouse event rate.
          const seconds = Math.max(.004, elapsed / 1000);
          const speed = distance / seconds;
          const amplitude = 18 * Math.pow(Math.min(1, speed / 1800), .72);
          if (ripple.energy < .05) ripple.phase = 0;
          ripple.energy += Math.max(0, amplitude - ripple.energy) * (1 - Math.exp(-seconds * 28));
        }
      }
      ripple.sampledAt = e.timeStamp;
      hover.x = p.x; hover.y = p.y;
      hover.target = e.pointerType === 'touch' ? 0 : 1; keyboard = false;
      if (press) {
        const travel = (p.y - press.y) * height;
        press.opening.target = clamp(travel - 3, 0, Math.min(height * .3, (1 - press.y) * height * .8));
      }
      requestFrame();
    }
    function down(e: PointerEvent) {
      if (e.button !== 0 || press || !loaded) return;
      const p = location(e);
      keyOpening = null;
      press = { ...p, id: e.pointerId, opening: begin(p.x, p.y) };
      surface.dataset.pointerFocus = 'true';
      surface.focus({ preventScroll: true }); surface.setPointerCapture(e.pointerId);
      surface.classList.add('is-pulling'); move(e);
    }
    function up(e: PointerEvent) {
      if (!press || press.id !== e.pointerId) return;
      release();
      if (e.pointerType === 'touch') leave();
    }
    function cancel() { release(); leave(); }
    function leave() { hover.target = 0; requestFrame(); }
    function key(e: KeyboardEvent) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape'].includes(e.key)) return;
      e.preventDefault(); delete surface.dataset.pointerFocus; keyboard = true; hover.target = 1;
      if (e.key === 'Enter' || e.key === ' ') {
        if (!e.repeat) {
          if (keyOpening) { keyOpening.target = 0; keyOpening = null; }
          else keyOpening = begin(hover.x, hover.y);
        }
      } else if (e.key === 'Escape') {
        openings.forEach(o => { o.target = 0; }); keyOpening = null;
      } else if (keyOpening && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        keyOpening.target = clamp(keyOpening.target + (e.key === 'ArrowDown' ? 16 : -16), 0, Math.min(height * .3, height - keyOpening.row * pitch - 12));
      } else if (!keyOpening) {
        if (e.key === 'ArrowLeft') hover.x = clamp(hover.x - .04, .04, .96);
        if (e.key === 'ArrowRight') hover.x = clamp(hover.x + .04, .04, .96);
        if (e.key === 'ArrowUp') hover.y = clamp(hover.y - .025, .04, .96);
        if (e.key === 'ArrowDown') hover.y = clamp(hover.y + .025, .04, .96);
      }
      requestFrame();
    }
    function blur() {
      keyboard = false; delete surface.dataset.pointerFocus; release();
      openings.forEach(o => { o.target = 0; }); keyOpening = null; leave();
    }
    function visibility() {
      if (document.hidden) { blur(); cancelAnimationFrame(frame); frame = 0; }
      else requestFrame();
    }
    function motion() { reduced = media.matches; requestFrame(); }
    const observer = new ResizeObserver(resize); observer.observe(surface);
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerdown', down);
    surface.addEventListener('pointerup', up);
    surface.addEventListener('pointercancel', cancel);
    surface.addEventListener('lostpointercapture', cancel);
    surface.addEventListener('pointerleave', leave);
    surface.addEventListener('keydown', key);
    surface.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', motion);
    image.onload = () => { if (!disposed) { loaded = true; resize(); setReady(true); } };
    image.onerror = () => { if (!disposed) setFallback(true); };
    image.src = ART;
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      image.onload = null; image.onerror = null;
      surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerdown', down);
      surface.removeEventListener('pointerup', up); surface.removeEventListener('pointercancel', cancel);
      surface.removeEventListener('lostpointercapture', cancel);
      surface.removeEventListener('pointerleave', leave); surface.removeEventListener('keydown', key);
      surface.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', motion);
    };
  }, []);

  if (fallback) return <img className="blinds-fallback" src={ART} alt="Girl with a Pearl Earring by Johannes Vermeer" />;
  return <canvas ref={ref} className={`blinds-canvas${ready ? ' is-ready' : ''}`} tabIndex={0} role="application"
    aria-label="Blinds. Press and pull downward to part the fine lines and reveal the painting. Release to close. Arrow keys choose a position, Enter or Space grabs the lines, Down and Up adjust the opening, Enter releases, Escape closes." />;
}
