import { useEffect, useRef } from 'react';

type TrailPoint = { x: number; y: number };
type MemoryPoint = {
  id: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  phase: number;
  accent: boolean;
  trail: TrailPoint[];
};
type Ripple = { x: number; y: number; radius: number; alpha: number };

const MAX_POINTS = 40;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function PointCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const stage = canvas?.closest<HTMLElement>('.point-playground');
    if (!canvas || !context || !stage) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = {
      x: -1000,
      y: -1000,
      vx: 0,
      vy: 0,
      active: false,
      down: false,
      pressedAt: 0,
      pressX: 0,
      pressY: 0,
      movedAt: 0,
    };
    let points: MemoryPoint[] = [];
    let ripples: Ripple[] = [];
    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    let previousTime = 0;
    let pointId = 0;
    let pointerId: number | null = null;
    let reduceMotion = motionQuery.matches;
    let dirty = true;
    let ink = '#474f4d';
    let accent = '#e36e61';

    function updateColors() {
      const styles = getComputedStyle(stage!);
      ink = styles.getPropertyValue('--point-ink').trim() || ink;
      accent = styles.getPropertyValue('--point-accent').trim() || accent;
    }

    function makePoint(x: number, y: number, mass: number, isAccent = false): MemoryPoint {
      const radius = 3.6 + mass * 2.9;
      return {
        id: pointId++,
        x,
        y,
        homeX: x,
        homeY: y,
        vx: 0,
        vy: 0,
        radius,
        mass,
        phase: pointId * 1.731,
        accent: isAccent,
        trail: [{ x, y }],
      };
    }

    function syncCount() {
      canvas!.dataset.pointCount = String(points.length);
    }

    function reset() {
      pointId = 0;
      points = [makePoint(width / 2, height / 2, 1.45, true)];
      ripples = [];
      syncCount();
      dirty = true;
    }

    function resize() {
      const bounds = canvas!.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      updateColors();
      reset();
    }

    function createPoint(x: number, y: number, heldFor = 0) {
      const mass = clamp(.78 + heldFor / 430, .78, 2.8);
      const next = makePoint(
        clamp(x, 24, width - 24),
        clamp(y, 24, height - 24),
        mass,
        pointId % 7 === 0,
      );
      next.vx = pointer.vx * .16;
      next.vy = pointer.vy * .16;
      points.push(next);
      if (points.length > MAX_POINTS) points.splice(1, 1);
      ripples.push({ x: next.x, y: next.y, radius: next.radius, alpha: .48 });
      syncCount();
      dirty = true;
    }

    function update(delta: number, time: number) {
      pointer.vx *= Math.pow(.82, delta);
      pointer.vy *= Math.pow(.82, delta);
      const pointerSpeed = Math.min(28, Math.hypot(pointer.vx, pointer.vy));

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        let ax = (point.homeX - point.x) * .006;
        let ay = (point.homeY - point.y) * .006;

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const reach = pointer.down ? 330 : 225;
          if (distance < reach) {
            const influence = (1 - distance / reach) ** 2;
            const pull = influence * (pointer.down ? .46 : .14) / point.mass;
            ax += dx / distance * pull;
            ay += dy / distance * pull;
            ax += pointer.vx * influence * .025;
            ay += pointer.vy * influence * .025;
            ax += -dy / distance * influence * pointerSpeed * .013;
            ay += dx / distance * influence * pointerSpeed * .013;
          }
        }

        ax += Math.cos(time * .00042 + point.phase) * .002;
        ay += Math.sin(time * .00036 + point.phase) * .002;
        point.vx = (point.vx + ax * delta) * Math.pow(.935, delta);
        point.vy = (point.vy + ay * delta) * Math.pow(.935, delta);
        point.x += point.vx * delta;
        point.y += point.vy * delta;

        const edge = point.radius + 8;
        if (point.x < edge || point.x > width - edge) point.vx *= -.55;
        if (point.y < edge || point.y > height - edge) point.vy *= -.55;
        point.x = clamp(point.x, edge, width - edge);
        point.y = clamp(point.y, edge, height - edge);

        const last = point.trail.at(-1)!;
        if (Math.hypot(point.x - last.x, point.y - last.y) > 1.4) {
          point.trail.push({ x: point.x, y: point.y });
          if (point.trail.length > 28) point.trail.shift();
        }
      }

      for (let first = 0; first < points.length; first += 1) {
        for (let second = first + 1; second < points.length; second += 1) {
          const a = points[first];
          const b = points[second];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const spacing = a.radius + b.radius + 13;
          if (distance >= spacing) continue;
          const force = (spacing - distance) * .018;
          a.vx -= dx / distance * force / a.mass;
          a.vy -= dy / distance * force / a.mass;
          b.vx += dx / distance * force / b.mass;
          b.vy += dy / distance * force / b.mass;
        }
      }

      ripples = ripples.filter((ripple) => {
        ripple.radius += 2.2 * delta;
        ripple.alpha *= Math.pow(.92, delta);
        return ripple.alpha > .012;
      });
    }

    function draw(time: number) {
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.clearRect(0, 0, width, height);

      for (const point of points) {
        for (let index = 0; index < point.trail.length; index += 2) {
          const memory = point.trail[index];
          const progress = (index + 1) / point.trail.length;
          context!.beginPath();
          context!.arc(memory.x, memory.y, Math.max(.55, point.radius * progress * .24), 0, Math.PI * 2);
          context!.fillStyle = point.accent ? accent : ink;
          context!.globalAlpha = progress * .16;
          context!.fill();
        }
      }

      for (const ripple of ripples) {
        context!.beginPath();
        context!.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        context!.strokeStyle = accent;
        context!.lineWidth = 1;
        context!.globalAlpha = ripple.alpha;
        context!.stroke();
      }

      for (const point of points) {
        const breath = reduceMotion ? 1 : 1 + Math.sin(time * .0015 + point.phase) * .055;
        context!.beginPath();
        context!.arc(point.x, point.y, point.radius * 3.2 * breath, 0, Math.PI * 2);
        context!.fillStyle = point.accent ? accent : ink;
        context!.globalAlpha = .045;
        context!.fill();
        context!.beginPath();
        context!.arc(point.x, point.y, point.radius * breath, 0, Math.PI * 2);
        context!.globalAlpha = .92;
        context!.fill();
      }

      if (pointer.active) {
        const held = pointer.down ? Math.min(1, (performance.now() - pointer.pressedAt) / 900) : 0;
        context!.beginPath();
        context!.arc(pointer.x, pointer.y, 12 + held * 22, 0, Math.PI * 2);
        context!.strokeStyle = accent;
        context!.lineWidth = 1;
        context!.globalAlpha = .7;
        context!.stroke();
        context!.beginPath();
        context!.arc(pointer.x, pointer.y, pointer.down ? 2.8 : 1.8, 0, Math.PI * 2);
        context!.fillStyle = accent;
        context!.globalAlpha = 1;
        context!.fill();
      }

      context!.globalAlpha = 1;
      dirty = false;
    }

    function tick(time: number) {
      frame = 0;
      const delta = Math.min((time - previousTime) / 16.667 || 1, 2);
      previousTime = time;
      if (!reduceMotion) {
        update(delta, time);
        dirty = true;
      }
      if (dirty) draw(time);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    function move(event: PointerEvent) {
      const bounds = canvas!.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const now = performance.now();
      if (pointer.active) {
        const elapsed = Math.max(8, now - pointer.movedAt);
        const scale = 16 / elapsed;
        pointer.vx += ((x - pointer.x) * scale - pointer.vx) * .5;
        pointer.vy += ((y - pointer.y) * scale - pointer.vy) * .5;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.movedAt = now;
      pointer.active = true;
      dirty = true;
      if (reduceMotion) draw(now);
    }

    function press(event: PointerEvent) {
      if (event.button !== 0 || pointerId !== null) return;
      move(event);
      pointer.down = true;
      pointer.pressedAt = performance.now();
      pointer.pressX = pointer.x;
      pointer.pressY = pointer.y;
      pointerId = event.pointerId;
      canvas!.setPointerCapture(event.pointerId);
      canvas!.focus({ preventScroll: true });
    }

    function release(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      move(event);
      const wasClick = Math.hypot(pointer.x - pointer.pressX, pointer.y - pointer.pressY) < 9;
      const heldFor = performance.now() - pointer.pressedAt;
      pointer.down = false;
      pointerId = null;
      if (canvas!.hasPointerCapture(event.pointerId)) canvas!.releasePointerCapture(event.pointerId);
      if (wasClick) createPoint(pointer.x, pointer.y, heldFor);
      if (reduceMotion) draw(performance.now());
    }

    function leave() {
      if (pointer.down) return;
      pointer.active = false;
      dirty = true;
    }

    function cancel() {
      const captured = pointerId;
      pointerId = null;
      pointer.down = false;
      pointer.active = false;
      if (captured !== null && canvas!.hasPointerCapture(captured)) canvas!.releasePointerCapture(captured);
      dirty = true;
    }

    function keyboard(event: KeyboardEvent) {
      if (event.repeat) return;
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        reset();
        if (reduceMotion) draw(performance.now());
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      createPoint(width / 2 + (pointId % 5 - 2) * 24, height / 2, 120 + pointId * 37 % 500);
      if (reduceMotion) draw(performance.now());
    }

    function visibility() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    function updateMotionPreference() {
      reduceMotion = motionQuery.matches;
      dirty = true;
      if (reduceMotion) draw(performance.now());
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', press);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', cancel);
    canvas.addEventListener('keydown', keyboard);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    motionQuery.addEventListener('change', updateMotionPreference);
    if (!document.hidden) frame = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', press);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel);
      canvas.removeEventListener('keydown', keyboard);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
      motionQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mouse-canvas point-canvas"
      tabIndex={0}
      role="button"
      aria-label="남겨진 점. 포인터를 움직여 점을 끌어당기고, 클릭하거나 오래 눌러 새로운 점을 남깁니다. R 키로 초기화합니다."
    />
  );
}

export default PointCanvas;
