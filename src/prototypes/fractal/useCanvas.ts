import { useEffect, useRef } from 'react';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** 캔버스 크기를 부모에 맞추고 매 프레임 draw를 호출합니다. draw가 false를 반환하면 다음 프레임을 요청하지 않습니다. */
export function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => boolean | void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let running = false;
    let w = 0, h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      kick();
    };
    const tick = (time: number) => {
      running = false;
      if (drawRef.current(ctx, w, h, time) !== false) { running = true; frame = requestAnimationFrame(tick); }
    };
    const kick = () => { if (!running) { running = true; frame = requestAnimationFrame(tick); } };
    kickRef.current = kick;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const themeObserver = new MutationObserver(kick);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    resize();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); themeObserver.disconnect(); };
  }, []);

  return { canvasRef, kick: () => kickRef.current() };
}
