import { useEffect, useRef } from 'react';
import { cssVar, reducedMotion, useCanvas } from './useCanvas';

// 1) 소개 영역 뒤에서 자라는 재귀 트리. 가지는 같은 규칙(둘로 나뉘고 짧아짐)을 반복합니다.
const DEPTH = 11;
const GROW_MS = 2600;
const seeded = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export default function FractalTree() {
  const start = useRef(0);
  const wind = useRef({ x: 0, target: 0 });
  const { canvasRef, kick } = useCanvas((ctx, w, h, time) => {
    if (!start.current) start.current = time;
    const reduce = reducedMotion();
    const progress = reduce ? DEPTH : Math.min(DEPTH, ((time - start.current) / GROW_MS) * DEPTH);
    wind.current.x += (wind.current.target - wind.current.x) * 0.06;
    ctx.clearRect(0, 0, w, h);
    const ink = cssVar('--site-faint');
    const tip = cssVar('--site-muted');

    const branch = (x: number, y: number, len: number, angle: number, depth: number, id: number) => {
      const grown = Math.min(1, Math.max(0, progress - depth));
      if (grown <= 0) return;
      const sway = wind.current.x * 0.05 * (depth + 1) / DEPTH;
      const a = angle + sway;
      const x2 = x + Math.cos(a) * len * grown;
      const y2 = y + Math.sin(a) * len * grown;
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.25 + 0.55 * (1 - depth / DEPTH);
      ctx.lineWidth = Math.max(0.5, (DEPTH - depth) * 0.32);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      if (depth === DEPTH - 1 && grown === 1) {
        ctx.globalAlpha = 0.7; ctx.fillStyle = tip;
        ctx.beginPath(); ctx.arc(x2, y2, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      if (grown < 1 || depth >= DEPTH - 1) return;
      const spread = 0.34 + seeded(id) * 0.22;
      const shrink = 0.72 + seeded(id + 9) * 0.08;
      branch(x2, y2, len * shrink, a - spread, depth + 1, id * 2);
      branch(x2, y2, len * shrink, a + spread, depth + 1, id * 2 + 1);
    };

    const trunk = Math.min(h * 0.2, 150);
    branch(w * 0.12, h, trunk, -Math.PI / 2 - 0.28, 0, 1);
    branch(w * 0.88, h, trunk, -Math.PI / 2 + 0.28, 0, 3);
    ctx.globalAlpha = 1;
    const settling = Math.abs(wind.current.target - wind.current.x) > 0.001;
    return progress < DEPTH || settling;
  });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (reducedMotion()) return;
      wind.current.target = (event.clientX / window.innerWidth - 0.5) * 2;
      kick();
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [kick]);

  return <canvas ref={canvasRef} className="fractal-tree" aria-hidden="true" />;
}
