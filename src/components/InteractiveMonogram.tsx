import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import '../styles/interactive-monogram.css';
import { cssVar, reducedMotion, useCanvas } from './fractalCanvas';

// KJW의 획을 더 작은 KJW로 채운 자기유사 모노그램. 누르고 있는 동안 칸 안으로 계속 확대되고, 떼면 다음 단계 경계에서 멈춥니다.
// 가로·세로를 같은 칸 수로 나누므로 각 칸이 상자(4:3)와 정확히 닮은꼴입니다.
const COLS = 36;
const ROWS = 36;
const BOX_ASPECT = 4 / 3;
// 확대 속도 단위: 초당 단계 수(1단계 = 한 칸이 상자 전체가 될 때까지)
const MAX_SPEED = 0.6;
const ACCEL = 0.9;
const RELEASE_SPEED = 0.33; // 짧게 눌렀다 떼도 한 단계는 부드럽게 들어갑니다.
const MIN_SPEED = 0.05;

function buildMask() {
  const c = document.createElement('canvas');
  c.width = COLS; c.height = ROWS;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // 마스크 한 칸은 화면에서 4:3으로 늘어나므로 글자를 가로로 미리 눌러 그립니다.
  g.scale(1 / BOX_ASPECT, 1);
  g.font = `900 100px Arial, sans-serif`;
  const size = Math.min(100 * (COLS * BOX_ASPECT * 0.84) / g.measureText('KJW').width, ROWS * 0.55);
  g.font = `900 ${size}px Arial, sans-serif`;
  g.fillText('KJW', (COLS * BOX_ASPECT) / 2, ROWS / 2 + size * 0.04);
  const data = g.getImageData(0, 0, COLS, ROWS).data;
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (data[(y * COLS + x) * 4 + 3] > 110) cells.push([x, y]);
  return { canvas: c, cells };
}

export default function InteractiveMonogram() {
  const mask = useMemo(buildMask, []);
  // phase: 현재 단계 안에서의 진행(0~1, 로그 배율). 1에 닿으면 0으로 돌아가도 장면이 같습니다.
  const motion = useRef({ phase: 0, speed: 0, holding: false, last: 0 });
  const [playing, setPlaying] = useState(false);
  // 확대 목표: J 근처의 채워진 칸
  const target = useMemo(() => {
    const cx = COLS / 2, cy = ROWS / 2;
    return mask.cells.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cy) < Math.hypot(best[0] - cx, best[1] - cy) ? c : best));
  }, [mask]);

  const { canvasRef, kick } = useCanvas((ctx, w, h, time) => {
    const bg = cssVar('--site-surface');
    const fg = cssVar('--site-surface-text');
    const m = motion.current;
    const dt = m.last ? Math.min(0.05, (time - m.last) / 1000) : 0;
    m.last = time;
    if (m.holding) {
      m.speed = Math.min(MAX_SPEED, m.speed + ACCEL * dt);
    } else if (m.speed > 0) {
      // 남은 거리에 비례해 감속하면서 다음 단계 경계에 정확히 멈춥니다.
      m.speed = Math.max(MIN_SPEED, Math.min(m.speed, (1 - m.phase) * 2.4));
    }
    m.phase += m.speed * dt;
    let moving = m.holding || m.speed > 0;
    if (m.phase >= 1) {
      m.phase -= 1;
      if (!m.holding) { m.phase = 0; m.speed = 0; moving = false; }
    }
    if (!moving) setPlaying(false);
    const eased = m.phase;
    const scale = COLS ** eased; // 1 → 36배: 목표 칸이 상자 전체가 됨
    // "상자 → 목표 칸" 축소 변환의 고정점. 이 점을 중심으로 확대해야 마지막 장면이 첫 장면과 정확히 겹칩니다.
    const tx = (target[0] * w) / (COLS - 1), ty = (target[1] * h) / (ROWS - 1);
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
    if (!moving) m.last = 0;
    return moving;
  });

  const press = () => {
    if (reducedMotion()) return;
    const m = motion.current;
    m.holding = true;
    setPlaying(true);
    kick();
  };
  const release = () => {
    const m = motion.current;
    if (!m.holding) return;
    m.holding = false;
    m.speed = Math.max(m.speed, RELEASE_SPEED);
    kick();
  };
  const pointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press();
  };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat) press();
  };
  const keyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release(); }
  };

  return (
    <button type="button" className="monogram interactive-monogram" aria-label="KJW 안으로 확대하기. 누르고 있는 동안 계속 확대됩니다."
      onPointerDown={pointerDown} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
      onKeyDown={keyDown} onKeyUp={keyUp} onBlur={release} onContextMenu={event => event.preventDefault()}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <small className="interactive-monogram__hint" aria-hidden="true">{playing ? 'zoom' : '+ hold'}</small>
    </button>
  );
}
