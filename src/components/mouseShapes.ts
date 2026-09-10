export type SceneMode = 'orbit' | 'type';
export type Point = { x: number; y: number; homeX: number; homeY: number; vx: number; vy: number; color: number };
export type Pointer = { x: number; y: number; active: boolean; down: boolean };
export type Palette = { background: string; ink: string };

export const palettes: Palette[] = [
  { background: '#252a2d', ink: '#bfc7c5' },
  { background: '#e7e5df', ink: '#475b63' },
  { background: '#3c5058', ink: '#d2d5cf' },
];
export const RING_POINTS = 72;
const RING_COUNT = 32;

function point(x: number, y: number, color = 0): Point {
  return { x, y, homeX: x, homeY: y, vx: 0, vy: 0, color };
}

export function makeOrbit(width: number, height: number): Point[] {
  const points: Point[] = [];
  const radius = Math.min(width * 0.32, height * 0.37, 390);
  for (let ring = 0; ring < RING_COUNT; ring++) {
    const layer = ring / (RING_COUNT - 1);
    const size = radius * (0.15 + layer * 0.85);
    for (let i = 0; i < RING_POINTS; i++) {
      const angle = i / RING_POINTS * Math.PI * 2;
      const ripple = 1 + Math.sin(angle * 3 + layer * 3.8) * 0.07;
      const x = Math.cos(angle) * size * ripple;
      const y = Math.sin(angle) * size * 0.94 + Math.sin(angle * 2 + layer * 3) * size * 0.09;
      points.push(point(width / 2 + x, height * 0.5 + y, ring));
    }
  }
  return points;
}

export function makeType(width: number, height: number): Point[] {
  // 글자의 모양을 작은 점들로 바꿉니다.
  const stamp = document.createElement('canvas');
  stamp.width = Math.round(width);
  stamp.height = Math.round(height);
  const context = stamp.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  const size = Math.min(width * 0.39, height * 0.54, 520);
  context.font = `900 ${size}px Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('KJW', width / 2, height * 0.5);
  const data = context.getImageData(0, 0, stamp.width, stamp.height).data;
  const spacing = Math.max(5, Math.round(size / 48));
  const points: Point[] = [];
  for (let y = 0; y < stamp.height; y += spacing) {
    for (let x = 0; x < stamp.width; x += spacing) {
      if (data[(y * stamp.width + x) * 4 + 3] > 140) {
        points.push(point(x, y, Math.floor(x / width * 6) % 3));
      }
    }
  }
  return points;
}

export function movePoints(points: Point[], pointer: Pointer, mode: SceneMode, delta: number) {
  const radius = mode === 'orbit' ? 155 : 125;
  const spring = mode === 'orbit' ? 0.026 : 0.018;
  const damping = Math.pow(mode === 'orbit' ? 0.86 : 0.89, delta);
  for (const p of points) {
    let ax = (p.homeX - p.x) * spring;
    let ay = (p.homeY - p.y) * spring;
    if (pointer.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const reach = pointer.down ? radius * 2 : radius;
      if (distance < reach) {
        const strength = (1 - distance / reach) ** 2;
        const force = strength * (pointer.down ? -3.5 : 5.5);
        ax += dx / distance * force;
        ay += dy / distance * force;
        if (pointer.down) {
          ax += -dy / distance * strength * 1.8;
          ay += dx / distance * strength * 1.8;
        }
      }
    }
    p.vx = (p.vx + ax * delta) * damping;
    p.vy = (p.vy + ay * delta) * damping;
    p.x += p.vx * delta;
    p.y += p.vy * delta;
  }
}

export function scatterPoints(points: Point[], x: number, y: number) {
  for (const p of points) {
    const dx = p.x - x;
    const dy = p.y - y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const force = Math.max(0, 1 - distance / 650) * 32;
    p.vx += dx / distance * force;
    p.vy += dy / distance * force;
  }
}

export function drawOrbit(context: CanvasRenderingContext2D, points: Point[], ink: string, scale: number) {
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.4, Math.min(3, scale / 270));
  context.lineJoin = 'round';
  for (let start = 0; start < points.length; start += RING_POINTS) {
    const first = points[start];
    const last = points[start + RING_POINTS - 1];
    context.beginPath();
    context.moveTo((first.x + last.x) / 2, (first.y + last.y) / 2);
    for (let i = 0; i < RING_POINTS; i++) {
      const p = points[start + i];
      const next = points[start + (i + 1) % RING_POINTS];
      context.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
    }
    context.closePath();
    context.stroke();
  }
}

export function drawType(context: CanvasRenderingContext2D, points: Point[], dark: boolean, height: number) {
  const colors = dark ? ['#cdd2cf', '#9aaeb8', '#b8afa1'] : ['#434a4c', '#657d89', '#827b70'];
  const radius = Math.max(1.6, Math.min(3.2, height / 220));
  for (let color = 0; color < colors.length; color++) {
    context.fillStyle = colors[color];
    context.beginPath();
    for (const p of points) {
      if (p.color !== color) continue;
      context.moveTo(p.x + radius, p.y);
      context.arc(p.x, p.y, radius, 0, Math.PI * 2);
    }
    context.fill();
  }
}
