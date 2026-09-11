import { useEffect, useRef, useState } from 'react';
import { cameraLimits, clamp, wrapYaw, panoramaSample, VERTICAL_ARC, HORIZONTAL_ARC, PANORAMA_PERIOD, PANORAMA_OVERLAP } from './nebula/view';
import { createNebulaRenderer } from './nebula/renderer';
import { CollapseScene, isTap, type CollapsePhase, type TapGesture } from './nebula/collapse';

const IMAGE_ROOT = '/images/nebula/carina-nebula-';

export default function NebulaPanorama() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const fallbackEffectRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<CollapsePhase>('idle');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const fallback = fallbackRef.current!;
    const fallbackEffect = fallbackEffectRef.current!;
    const fallbackContext = fallbackEffect.getContext('2d');
    const fallbackSnapshot = document.createElement('canvas');
    const effect = new CollapseScene();
    let gesture: TapGesture | null = null;
    let fallbackVisible = false;
    let lastView = { yaw: -.12, pitch: .035, fov: .42 };
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let renderer = createNebulaRenderer(canvas);
    let reduced = media.matches;
    let paused = false;
    let disposed = false;
    let textured = false;
    let width = 1, height = 1;
    let yaw = -.12, pitch = .035, fov = .42;
    let targetYaw = yaw, targetPitch = pitch, targetFov = fov;
    let vx = 0, vy = 0, frame = 0, last = 0;
    let introActive = false, introStarted = false, introElapsed = 0, introYaw = yaw;
    let lastMove = 0;
    let pinchDistance = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    const images: HTMLImageElement[] = [];
    let currentImage: HTMLImageElement | null = null;

    function requestFrame() {
      if (!frame && !disposed && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    function stopIntro() {
      introStarted = true;
      if (!introActive) return;
      introActive = false;
      targetYaw = yaw;
    }
    function startIntro() {
      if (introStarted || !currentImage || canvas.closest('[data-transitioning]')) return;
      introStarted = true;
      if (reduced) return;
      introYaw = yaw;
      introElapsed = 0;
      introActive = true;
      requestFrame();
    }
    function constrain() {
      const limits = cameraLimits(width / height, targetFov);
      targetFov = limits.halfFov;
      // Rebase both angles together; interpolation never jumps at ±π.
      const wrappedYaw = wrapYaw(yaw);
      targetYaw -= yaw - wrappedYaw;
      yaw = wrappedYaw;
      const nextPitch = clamp(targetPitch, -limits.pitch, limits.pitch);
      if (nextPitch !== targetPitch) vy = 0;
      targetPitch = nextPitch;
    }
    function reset() {
      effect.reset();
      setPhase('idle');
      canvas.style.cursor = '';
      cancel();
      targetYaw = yaw + wrapYaw(-.12 - yaw);
      targetPitch = .035;
      targetFov = width < height ? .53 : .42;
      vx = vy = 0;
      constrain();
      requestFrame();
    }
    function resize() {
      const bounds = canvas.getBoundingClientRect();
      const initial = width === 1;
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(devicePixelRatio || 1, 1.75);
      renderer?.resize(Math.round(width * ratio), Math.round(height * ratio));
      fallbackEffect.width = Math.round(width * Math.min(ratio, 1.5));
      fallbackEffect.height = Math.round(height * Math.min(ratio, 1.5));
      if (initial) {
        targetFov = fov = width < height ? .53 : .42;
      }
      constrain();
      requestFrame();
    }
    function tick(now: number) {
      frame = 0;
      const dt = Math.min(.04, Math.max(0, (now - last) / 1000));
      last = now;
      const previousPhase = effect.phase;
      effect.advance(dt, reduced, paused);
      if (effect.phase !== previousPhase) {
        setPhase(effect.phase);
        canvas.style.cursor = effect.phase === 'point' ? 'default' : '';
      }
      if (introActive && effect.phase === 'idle') {
        introElapsed += dt;
        const amount = clamp((introElapsed - .18) / 2.2, 0, 1);
        const eased = amount * amount * (3 - 2 * amount);
        yaw = targetYaw = introYaw + eased * .82;
        if (amount === 1) introActive = false;
      }
      if (!introActive && !pointers.size && !reduced && !paused && effect.phase === 'idle') {
        // Integrate exponential drag exactly so release feels the same at 60/120 Hz.
        const damping = 2.8;
        const friction = Math.exp(-dt * damping);
        const travel = (1 - friction) / damping;
        targetYaw += vx * travel;
        targetPitch += vy * travel;
        vx *= friction;
        vy *= friction;
        if (Math.abs(vx) < .0003) vx = 0;
        if (Math.abs(vy) < .0003) vy = 0;
      }
      constrain();
      const ease = reduced ? 1 : 1 - Math.exp(-dt * (pointers.size ? 16 : 11));
      yaw += (targetYaw - yaw) * ease;
      pitch += (targetPitch - pitch) * ease;
      fov += (targetFov - fov) * ease;
      const limits = cameraLimits(width / height, fov);
      fov = limits.halfFov;
      const renderYaw = yaw;
      const renderPitch = clamp(pitch, -limits.pitch, limits.pitch);
      lastView = { yaw: renderYaw, pitch: renderPitch, fov };
      if (renderer && textured) renderer.draw(renderYaw, renderPitch, fov, effect, reduced);
      drawFallbackEffect();
      const unsettled = Math.abs(yaw - targetYaw) + Math.abs(pitch - targetPitch) + Math.abs(fov - targetFov) > .0001;
      if (!document.hidden && (introActive || (effect.animating && !paused) || unsettled || (!paused && Math.abs(vx) + Math.abs(vy) > .0001))) frame = requestAnimationFrame(tick);
    }
    function upload(image: HTMLImageElement) {
      if (disposed) return;
      currentImage = image;
      if (renderer) {
        try {
          renderer.upload(image);
          textured = true;
          renderer.draw(yaw, pitch, fov, effect, reduced);
          setReady(true);
        } catch {
          // Keep an already uploaded lower-resolution photograph usable.
          if (!textured) {
            renderer.dispose();
            renderer = null;
            setReady(false);
          }
        }
      }
      startIntro();
      requestFrame();
    }
    function load(size: number, after?: () => void) {
      const image = new Image();
      images.push(image);
      image.decoding = 'async';
      image.onload = () => {
        if (disposed) return;
        upload(image);
        after?.();
      };
      image.onerror = () => {
        if (disposed) return;
        after?.();
        requestFrame();
      };
      image.src = `${IMAGE_ROOT}${size}.jpg`;
    }
    function drawFallbackPanorama(ctx: CanvasRenderingContext2D, outputWidth: number, outputHeight: number) {
      const image = currentImage || fallback;
      if (!image.naturalWidth) return;
      const sourceHeight = Math.min(image.naturalHeight, image.naturalHeight * fov * 2 / VERTICAL_ARC);
      const sourceY = clamp(image.naturalHeight * (.5 - pitch / VERTICAL_ARC) - sourceHeight / 2, 0, image.naturalHeight - sourceHeight);
      const tangent = Math.tan(fov) * outputWidth / outputHeight;
      // A cylindrical strip projection keeps the non-WebGL path continuous too.
      const stripWidth = Math.max(2, outputWidth / 256);
      for (let x = 0; x < outputWidth; x += stripWidth) {
        const span = Math.min(stripWidth, outputWidth - x);
        const left = Math.atan((x / outputWidth * 2 - 1) * tangent) + yaw;
        const right = Math.atan(((x + span) / outputWidth * 2 - 1) * tangent) + yaw;
        const sample = panoramaSample((left + right) / 2);
        const sourceWidth = Math.max(.5, (right - left) / HORIZONTAL_ARC * PANORAMA_PERIOD * image.naturalWidth);
        const drawStrip = (u: number) => ctx.drawImage(image,
          clamp(u * image.naturalWidth - sourceWidth / 2, 0, image.naturalWidth - sourceWidth), sourceY,
          sourceWidth, sourceHeight, x, 0, span + .5, outputHeight);
        drawStrip(sample.u);
        if (sample.u < PANORAMA_OVERLAP) {
          ctx.globalAlpha = 1 - sample.blend;
          drawStrip(sample.u + PANORAMA_PERIOD);
          ctx.globalAlpha = 1;
        }
      }
    }
    function captureFallback() {
      const scale = Math.min(1, 2048 / Math.max(width, height));
      fallbackSnapshot.width = Math.round(width * scale);
      fallbackSnapshot.height = Math.round(height * scale);
      const ctx = fallbackSnapshot.getContext('2d');
      if (ctx) drawFallbackPanorama(ctx, fallbackSnapshot.width, fallbackSnapshot.height);
    }
    function drawFallbackEffect() {
      if (!fallbackContext) return;
      const ctx = fallbackContext;
      if (renderer) {
        if (fallbackVisible) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, fallbackEffect.width, fallbackEffect.height);
          fallbackVisible = false;
        }
        return;
      }
      fallbackVisible = true;
      ctx.setTransform(fallbackEffect.width / width, 0, 0, fallbackEffect.height / height, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (effect.phase === 'idle') {
        drawFallbackPanorama(ctx, width, height);
        return;
      }
      const p = effect.progress, x = effect.x * width, y = effect.y * height;
      ctx.fillStyle = '#000102';
      ctx.fillRect(0, 0, width, height);
      if (effect.phase === 'restore' && !reduced) {
        const t = 1 - p;
        const launch = clamp((t - .025) / .875, 0, 1);
        const extent = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
        const radius = Math.max(1, extent * 1.48 * Math.pow(launch * launch * (3 - 2 * launch), .65));
        ctx.globalAlpha = clamp((t - .028) / .112, 0, 1);
        ctx.drawImage(fallbackSnapshot, 0, 0, width, height);
        ctx.globalAlpha = 1;
        const mask = ctx.createRadialGradient(x, y, radius * .72, x, y, radius * 1.06);
        mask.addColorStop(0, '#00010200');
        mask.addColorStop(1, '#000102');
        ctx.fillStyle = mask;
        ctx.fillRect(0, 0, width, height);
        const charge = Math.sin(Math.PI * clamp(t / .22, 0, 1));
        if (charge > .001) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 8 + charge * 35);
          glow.addColorStop(0, `rgba(231,244,255,${charge * .85})`);
          glow.addColorStop(.18, `rgba(159,196,232,${charge * .35})`);
          glow.addColorStop(1, '#9fc4e800');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.globalAlpha = 1 - clamp((t - .035) / .065, 0, 1);
        ctx.beginPath();ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#e3efff';ctx.fill();ctx.globalAlpha = 1;
        return;
      }
      if (p < .99 && fallbackSnapshot.width > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.drawImage(fallbackSnapshot, 0, 0, width, height);
        ctx.restore();
      }
      if (!reduced && p > 0 && p < .98) {
        const r = Math.min(width, height) * .07 * Math.min(1, p * 10) * (1 - p);
        ctx.beginPath();ctx.arc(x, y, Math.max(.1, r), 0, Math.PI * 2);
        ctx.fillStyle = '#000';ctx.fill();
        ctx.strokeStyle = `rgba(213,230,241,${Math.min(1, p * 8) * (1 - p)})`;
        ctx.lineWidth = 1.2;ctx.stroke();
      }
      if (p > .95) {
        ctx.globalAlpha = (p - .95) / .05;
        ctx.beginPath();ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#e3efff';ctx.fill();ctx.globalAlpha = 1;
      }
    }
    function activate(x: number, y: number) {
      if (effect.animating) return;
      if (effect.phase === 'idle') {
        if (renderer && !textured) return;
        yaw = targetYaw = lastView.yaw;
        pitch = targetPitch = lastView.pitch;
        targetFov = fov;
        captureFallback();
      }
      if (!effect.activate(x, y)) return;
      paused = false;
      vx = vy = 0;
      gesture = null;
      setPhase(effect.phase);
      canvas.style.cursor = 'default';
      requestFrame();
    }
    function distance() {
      const [a, b] = [...pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    }
    function down(event: PointerEvent) {
      if (event.button !== 0 || pointers.size >= 2 || effect.animating) return;
      stopIntro();
      if (!pointers.size) gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, start: performance.now(), moved: false };
      else gesture = null;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      pinchDistance = distance();
      vx = vy = 0;
      lastMove = performance.now();
      if (effect.phase === 'idle') canvas.classList.add('is-dragging');
      requestFrame();
    }
    function move(event: PointerEvent) {
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        if (effect.phase === 'point') {
          const bounds = canvas.getBoundingClientRect();
          const near = Math.hypot(event.clientX - bounds.left - effect.x * width, event.clientY - bounds.top - effect.y * height) < 36;
          canvas.style.cursor = near ? 'pointer' : 'default';
        }
        return;
      }
      if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 8) gesture.moved = true;
      if (effect.phase !== 'idle') return;
      const now = performance.now();
      const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const nextDistance = distance();
        if (pinchDistance > 1 && nextDistance > 1) targetFov *= pinchDistance / nextDistance;
        pinchDistance = nextDistance;
        vx = vy = 0;
      } else {
        const sensitivity = fov * 2 / height;
        targetYaw -= dx * sensitivity;
        targetPitch += dy * sensitivity;
        const elapsed = Math.max(.001, (now - lastMove) / 1000);
        const blend = 1 - Math.exp(-elapsed * 24);
        // Average recent motion rather than inheriting a noisy final pointer event.
        vx += (clamp(-dx * sensitivity / elapsed, -1.2, 1.2) - vx) * blend;
        vy += (clamp(dy * sensitivity / elapsed, -.9, .9) - vy) * blend;
      }
      lastMove = now;
      constrain();
      requestFrame();
    }
    function up(event: PointerEvent) {
      if (!pointers.has(event.pointerId)) return;
      const tapped = pointers.size === 1 && isTap(gesture, event.pointerId, event.clientX, event.clientY, performance.now());
      gesture = null;
      pointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (!pointers.size) canvas.classList.remove('is-dragging');
      const releaseDelay = (performance.now() - lastMove) / 1000;
      const releaseWeight = reduced || releaseDelay > .18 ? 0 : Math.exp(-Math.max(0, releaseDelay - .025) * 18);
      vx *= releaseWeight;
      vy *= releaseWeight;
      lastMove = performance.now();
      pinchDistance = distance();
      if (tapped) {
        const bounds = canvas.getBoundingClientRect();
        const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
        if (effect.phase === 'idle' || Math.hypot(x - effect.x * width, y - effect.y * height) < 36) activate(x / width, y / height);
      }
      requestFrame();
    }
    function cancel() {
      gesture = null;
      const captured = [...pointers.keys()];
      pointers.clear();
      captured.forEach(id => { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); });
      pinchDistance = vx = vy = 0;
      canvas.classList.remove('is-dragging');
    }
    function lostCapture(event: PointerEvent) {
      if (pointers.has(event.pointerId)) cancel();
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (effect.phase !== 'idle') return;
      stopIntro();
      gesture = null;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
      targetFov *= Math.exp(clamp(event.deltaY * unit, -150, 150) * .0014);
      constrain();
      requestFrame();
    }
    function key(event: KeyboardEvent) {
      stopIntro();
      if ((event.key === ' ' || event.key === 'Enter') && event.repeat) { event.preventDefault(); return; }
      if (event.key === 'Enter') {
        event.preventDefault();
        activate(.5, .5);
        return;
      }
      if (effect.phase !== 'idle' && !['r', 'R', ' ', 'Escape'].includes(event.key)) return;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => { targetYaw -= .065; },
        ArrowRight: () => { targetYaw += .065; },
        ArrowUp: () => { targetPitch += .045; },
        ArrowDown: () => { targetPitch -= .045; },
        '+': () => { targetFov *= .88; },
        '=': () => { targetFov *= .88; },
        '-': () => { targetFov *= 1.12; },
        r: reset, R: reset,
        ' ': () => { paused = !paused; },
        Escape: cancel,
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
      vx = vy = 0;
      constrain();
      requestFrame();
    }
    function visibility() {
      if (document.hidden) {
        cancel();
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestFrame();
    }
    function motionChange() {
      reduced = media.matches;
      if (reduced) stopIntro();
      vx = vy = 0;
      requestFrame();
    }
    function contextLost(event: Event) {
      event.preventDefault();
      renderer?.dispose();
      renderer = null;
      textured = false;
      setReady(false);
      requestFrame();
    }
    function contextRestored() {
      renderer = createNebulaRenderer(canvas);
      resize();
      if (currentImage) upload(currentImage);
      requestFrame();
    }
    resize();
    const maxTexture = renderer?.maximumTextureSize ?? 4096;
    load(2048, () => {
      if (maxTexture >= 4096) load(width > 1000 && maxTexture >= 8192 ? 8192 : 4096);
    });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', lostCapture);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('keydown', key);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('project-ready', startIntro);
    media.addEventListener('change', motionChange);
    return () => {
      disposed = true;
      cancel();
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer?.dispose();
      images.forEach(image => { image.onload = null; image.onerror = null; });
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', lostCapture);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('project-ready', startIntro);
      media.removeEventListener('change', motionChange);
    };
  }, []);

  return <>
    <img ref={fallbackRef} className="nebula-photograph" src={`${IMAGE_ROOT}2048.jpg`} alt="" fetchPriority="high" draggable={false} />
    <canvas ref={fallbackEffectRef} className="nebula-collapse-fallback" aria-hidden="true" />
    <canvas ref={canvasRef} className={`nebula-canvas${ready ? ' is-ready' : ''}`} tabIndex={0} role="application" data-phase={phase}
      aria-label={phase === 'point' ? 'One point remains. Click the point or press Enter to ignite a new universe.' : phase === 'idle' ? 'Nebula Drift. Click to create a black hole. Drag to look around 360 degrees. Scroll or pinch to zoom. Enter creates a black hole, Space pauses motion, and R resets.' : 'The universe is transforming. Space pauses motion. R resets.'} />
  </>;
}
