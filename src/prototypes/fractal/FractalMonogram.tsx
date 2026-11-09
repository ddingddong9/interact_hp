import { useMemo, useRef, useState } from 'react';
import { cssVar, reducedMotion, useCanvas } from './useCanvas';

// 2) KJW의 획을 더 작은 KJW로 채운 자기유사 모노그램. 클릭하면 한 칸 안으로 확대되어 처음 화면으로 이어집니다.
const COLS = 40;
const ROWS = 30; // 상자(4:3)와 같은 비율이라 한 칸이 전체와 정확히 닮은꼴입니다.
const ZOOM_MS = 3200;

function buildMask() {
  const c = document.createElement('canvas');
  c.width = COLS; c.height = ROWS;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 100px Arial, sans-serif`;
  const size = Math.min(100 * (COLS * 0.84) / g.measureText('KJW').width, ROWS * 0.78);
  g.font = `900 ${size}px Arial, sans-serif`;
  g.fillText('KJW', COLS / 2, ROWS / 2 + size * 0.04);
  const data = g.getImageData(0, 0, COLS, ROWS).data;
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (data[(y * COLS + x) * 4 + 3] > 110) cells.push([x, y]);
  return { canvas: c, cells };
}

export default function FractalMonogram() {
  const mask = useMemo(buildMask, []);
  const zoomStart = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  // 확대 목표: J 근처의 채워진 칸
  const target = useMemo(() => {
    const cx = COLS / 2, cy = ROWS / 2;
    return mask.cells.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cy) < Math.hypot(best[0] - cx, best[1] - cy) ? c : best));
  }, [mask]);

  const { canvasRef, kick } = useCanvas((ctx, w, h, time) => {
    const bg = cssVar('--site-surface');
    const fg = cssVar('--site-surface-text');
    let t = 0;
    if (zoomStart.current !== null) {
      t = Math.min(1, (time - zoomStart.current) / ZOOM_MS);
      if (t >= 1) { zoomStart.current = null; t = 0; setPlaying(false); }
    }
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const scale = COLS ** eased; // 1 → 64배: 목표 칸이 상자 전체가 됨
    const tx = ((target[0] + 0.5) / COLS) * w, ty = ((target[1] + 0.5) / ROWS) * h;
    ctx.clearRect(0, 0, w, h);
    // 화면 좌표로 잘라내면서, 칸이 충분히 크면 그 칸 안에 다시 KJW 패턴을 그립니다.
    const draw = (x: number, y: number, rw: number, rh: number) => {
      const sx = (x - tx) * scale + tx, sy = (y - ty) * scale + ty;
      if (sx > w || sy > h || sx + rw * scale < 0 || sy + rh * scale < 0) return;
      const cw = rw / COLS, ch = rh / ROWS;
      if (cw * scale < 1.5) {
        ctx.drawImage(mask.canvas, x, y, rw, rh);
        return;
      }
      for (const [cx, cy] of mask.cells) draw(x + cx * cw, y + cy * ch, cw, ch);
    };
    ctx.save();
    ctx.translate(tx, ty); ctx.scale(scale, scale); ctx.translate(-tx, -ty);
    draw(0, 0, w, h);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    return zoomStart.current !== null;
  });

  const play = () => {
    if (reducedMotion() || zoomStart.current !== null) return;
    zoomStart.current = performance.now();
    setPlaying(true);
    kick();
  };

  return (
    <button type="button" className="monogram interactive-monogram fractal-monogram" aria-label="KJW 안으로 확대하기" onClick={play}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <small className="interactive-monogram__hint" aria-hidden="true">{playing ? 'zoom' : '+ click'}</small>
    </button>
  );
}
