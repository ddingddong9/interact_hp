import { useEffect, useRef } from 'react';
import { drawOrbit, drawType, makeOrbit, makeType, movePoints, palettes, scatterPoints } from './mouseShapes';
import type { Point, Pointer, SceneMode } from './mouseShapes';

type Props = { mode: SceneMode; palette: number; onInteract: () => void };

function MouseCanvas({ mode, palette, onInteract }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const settings = useRef({ palette, onInteract });

  useEffect(() => {
    settings.current = { palette, onInteract };
    redrawRef.current?.();
  }, [palette, onInteract]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const pointer: Pointer = { x: -1000, y: -1000, active: false, down: false };
    const dark = document.documentElement.classList.contains('dark');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionPreference.matches;
    let points: Point[] = [];
    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    let previousTime = 0;
    let dirty = true;
    let pointerId: number | null = null;
    let pressX = 0;
    let pressY = 0;
    let cursorX = -1000;
    let cursorY = -1000;

    function reset() {
      points = mode === 'orbit' ? makeOrbit(width, height) : makeType(width, height);
      dirty = true;
    }

    function resize() {
      const bounds = canvas!.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      reset();
    }

    function draw() {
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.clearRect(0, 0, width, height);
      const ink = mode === 'orbit' ? palettes[settings.current.palette].ink : (dark ? '#cdd2cf' : '#434a4c');
      if (mode === 'orbit') drawOrbit(context!, points, ink, Math.min(width, height));
      else drawType(context!, points, dark, height);
      if (pointer.active) {
        context!.beginPath();
        context!.arc(cursorX, cursorY, pointer.down ? 24 : 11, 0, Math.PI * 2);
        context!.strokeStyle = ink;
        context!.lineWidth = 1;
        context!.globalAlpha = 0.65;
        context!.stroke();
        context!.globalAlpha = 1;
        context!.beginPath();
        context!.arc(pointer.x, pointer.y, 2, 0, Math.PI * 2);
        context!.fillStyle = ink;
        context!.fill();
      }
      dirty = false;
    }

    function tick(time: number) {
      frame = 0;
      const delta = Math.min((time - previousTime) / 16.667 || 1, 2);
      previousTime = time;
      if (!reduceMotion) {
        movePoints(points, pointer, mode, delta);
        cursorX += (pointer.x - cursorX) * 0.23;
        cursorY += (pointer.y - cursorY) * 0.23;
        dirty = true;
      } else {
        cursorX = pointer.x;
        cursorY = pointer.y;
        // 모션 감소 설정에서는 흔들림 없이 마우스 위치에만 작게 반응합니다.
        if (dirty) {
          for (const p of points) {
            const dx = p.homeX - pointer.x;
            const dy = p.homeY - pointer.y;
            const distance = Math.max(1, Math.hypot(dx, dy));
            const offset = pointer.active ? Math.max(0, 1 - distance / 125) * (pointer.down ? -12 : 12) : 0;
            p.x = p.homeX + dx / distance * offset;
            p.y = p.homeY + dy / distance * offset;
            p.vx = 0;
            p.vy = 0;
          }
        }
      }
      if (dirty) draw();
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    function move(event: PointerEvent) {
      const bounds = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      if (!pointer.active) { cursorX = pointer.x; cursorY = pointer.y; }
      pointer.active = true;
      dirty = true;
    }

    function press(event: PointerEvent) {
      if (event.button !== 0 || pointerId !== null) return;
      move(event);
      pointer.down = true;
      pressX = pointer.x;
      pressY = pointer.y;
      pointerId = event.pointerId;
      canvas!.setPointerCapture(event.pointerId);
      canvas!.focus({ preventScroll: true });
    }

    function release(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      move(event);
      const click = Math.hypot(pointer.x - pressX, pointer.y - pressY) < 8;
      pointer.down = false;
      pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
      pointerId = null;
      if (canvas!.hasPointerCapture(event.pointerId)) canvas!.releasePointerCapture(event.pointerId);
      if (click) {
        if (mode === 'type' && !reduceMotion) scatterPoints(points, pointer.x, pointer.y);
        settings.current.onInteract();
      }
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

    function leave() { if (!pointer.down) cancel(); }
    function lostCapture() { if (pointerId !== null) cancel(); }

    function keyboard(event: KeyboardEvent) {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      if (mode === 'type' && !reduceMotion) scatterPoints(points, width / 2, height * 0.5);
      settings.current.onInteract();
    }

    function visibility() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      cancel();
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    function updateMotionPreference() {
      reduceMotion = motionPreference.matches;
      reset();
    }

    redrawRef.current = () => { dirty = true; };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', press);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', lostCapture);
    canvas.addEventListener('keydown', keyboard);
    window.addEventListener('blur', cancel);
    motionPreference.addEventListener('change', updateMotionPreference);
    document.addEventListener('visibilitychange', visibility);
    if (!document.hidden) frame = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', press);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', lostCapture);
      canvas.removeEventListener('keydown', keyboard);
      window.removeEventListener('blur', cancel);
      motionPreference.removeEventListener('change', updateMotionPreference);
      document.removeEventListener('visibilitychange', visibility);
      cancel();
      redrawRef.current = null;
    };
  }, [mode]);

  return <canvas ref={canvasRef} className="mouse-canvas" tabIndex={0} role="button"
    aria-label={mode === 'orbit' ? '움직이면 휘어지는 궤도. 누른 채 끌어당기기. 클릭 또는 Enter로 색 바꾸기.' : '마우스로 흩뜨리는 KJW 입자. 누른 채 끌어당기기. 클릭 또는 Enter로 흩뜨리기.'} />;
}

export default MouseCanvas;
