// Drop Commerce 챕터들이 함께 쓰는 부품, 움직임, 테마 도구
import { useEffect, useState } from 'react';
import * as k from '../iso/iso-kit';
import type { Plan, Point3, Projection } from '../iso/iso-kit';

export type Box = { w: number; d: number; h: number };

export function partsFor(P: Projection) {
  const at = (point: Point3) => k.iso(point, P);
  const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
  const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
  const D = (points: Array<[number, number]>, size = 0.5, tone: k.Tone = 'mid') => k.dotsSvg(points, { size, tone });
  const slab = (plan: Plan, z: number, h: number, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
  const byDepth = (points: Array<[number, number]>) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const halo = (plan: Plan, z = 0, blur = 4) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}" style="filter:blur(${blur}px)"/>`;

  function plate(PLATE: Plan, label: Plan, ruler: { x: number; w: number }) {
    const PLATE_H = 12, FOOT_H = 5;
    const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
      out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: 'lo' }));
      out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: 'mid' }));
    }
    out.push(S(slab(PLATE, -PLATE_H, PLATE_H, 8, 1.6), { tone: 'mid' }));
    out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
    const screws = k.corners(PLATE, 10);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0]))));
    const strip: Plan = { x: ruler.x, y: PLATE.y + PLATE.d - 13, w: ruler.w, d: 6, r: 1 };
    out.push(S(slab(strip, 0, 0.6, 3), { tone: 'lo', crease: 'none' }));
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
    out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], 0.45));
    out.push(S(slab(label, 0, 0.8, 4), { tone: 'lo', crease: 'none' }));
    out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P), { tone: 'faint' }));
    for (const [i, len] of [label.w * 0.66, label.w * 0.5, label.w * 0.58].entries()) {
      out.push(L(k.lineOnTop([label.x + 6, label.y + 4 + i * 3], [label.x + 6 + len, label.y + 4 + i * 3], 0.8, P), { tone: 'lo', free: true }));
    }
    out.push(D([at([label.x + 3, label.y + 7, 0.8]), at([label.x + label.w - 3, label.y + 7, 0.8])], 0.4));
    return out.join('');
  }

  // 두 줄 레일과 양 끝 멈춤쇠. 가운데 [gapFrom, gapTo]는 비워 둔다(받침대 옆면에 닿음).
  function rails(x0: number, x1: number, y: number, gap?: [number, number]) {
    const out: string[] = [];
    const runs: Array<[number, number]> = gap ? [[x0 + 6, gap[0]], [gap[1], x1]] : [[x0 + 6, x1]];
    for (const ry of [y - 9, y + 6]) for (const [a, b] of runs) out.push(S(slab({ x: a, y: ry, w: b - a, d: 3, r: 0.8 }, 0, 2.6, 2, 0.3), { tone: 'mid' }));
    for (const x of [x0, x1]) {
      out.push(S(slab({ x, y: y - 12, w: 6, d: 22, r: 1.2 }, 0, 8, 3, 0.5), { tone: 'mid' }));
      out.push(D([at([x + 3, y - 8, 8]), at([x + 3, y + 6, 8])], 0.45));
    }
    return out.join('');
  }

  // 레일 위 캐리지(손잡이 포함). z0는 레일 윗면.
  function carriage(cx: number, cy: number, { w = 26, d = 22, h = 12 } = {}) {
    const plan: Plan = { x: cx - w / 2, y: cy - d / 2, w, d, r: 2 };
    const z0 = 2.6;
    const out = [halo(k.insetPlan(plan, 2), z0, 3)];
    out.push(S(slab(plan, z0, h, 4, 0.6), { tone: 'mid' }));
    out.push(D([at([plan.x + 3, plan.y + 3, z0 + h]), at([plan.x + w - 3, plan.y + 3, z0 + h])], 0.4));
    out.push(S(slab({ x: cx - 1.6, y: cy + d / 2 - 0.5, w: 3.2, d: 2.6, r: 0.8 }, z0 + 1.8, 3, 2), { tone: 'mid', crease: 'none' }));
    out.push(S(k.cylinder(cx, cy + d / 2 + 3.8, 2.6, z0 + 0.6, 5.4, P, 18), { tone: 'mid' }));
    out.push(L(k.knurl(cx, cy + d / 2 + 3.8, 2.6, z0 + 0.6, z0 + 6, 16, P), { tone: 'lo' }));
    return out.join('');
  }

  // 신발 상자 하나(중심 cx, cy, 바닥 z = 0). 움직일 때는 그룹째 옮긴다.
  function boxArt(cx: number, cy: number, box: Box) {
    const plan: Plan = { x: cx - box.w / 2, y: cy - box.d / 2, w: box.w, d: box.d, r: 1.2 };
    const out = [halo(k.insetPlan(plan, 2), 0, 3)];
    const lidZ = box.h - 3;
    out.push(S(slab(plan, 0, lidZ, 2, 0.4), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(plan, 3, P, 2), { tone: 'faint' }) }));
    out.push(S(slab(k.insetPlan(plan, -0.6), lidZ, 3, 2, 0.4), { tone: 'hi', crease: 'lo' }));
    const card: Plan = { x: plan.x + 5, y: plan.y + box.d / 2 - 5, w: 15, d: 10, r: 0.6 };
    out.push(L(k.planOutline(card, box.h, P, 2), { tone: 'lo' }));
    out.push(L(k.lineOnTop([card.x + 3, card.y + 4], [card.x + 11, card.y + 4], box.h, P), { tone: 'lo', free: true }));
    out.push(L(k.lineOnTop([card.x + 3, card.y + 6.5], [card.x + 8, card.y + 6.5], box.h, P), { tone: 'lo', free: true }));
    return out.join('');
  }

  // 선반: 뒤판, 먼 옆판, 칸마다 선반. 상자는 칸 사이에 끼워 그린다.
  function rack(r: { x0: number; x1: number; y0: number; y1: number; top: number }, levels: number[], between: string[]) {
    const out: string[] = [halo({ x: r.x0, y: r.y0, w: r.x1 - r.x0, d: r.y1 - r.y0, r: 2 }, 0, 5)];
    out.push(S(slab({ x: r.x0, y: r.y0, w: 4, d: r.y1 - r.y0, r: 0.8 }, 0, r.top, 2, 0.5), { tone: 'mid' }));
    out.push(S(slab({ x: r.x0, y: r.y0, w: r.x1 - r.x0, d: 4, r: 0.8 }, 0, r.top, 2, 0.5), { tone: 'mid' }));
    out.push(D([at([r.x0 + 2, r.y0 + 8, r.top]), at([r.x0 + 2, r.y1 - 6, r.top]), at([r.x1 - 6, r.y0 + 2, r.top])], 0.45));
    levels.forEach((z, i) => {
      const plan: Plan = { x: r.x0 + 4, y: r.y0 + 4, w: r.x1 - r.x0 - 4, d: r.y1 - r.y0 - 4, r: 0.8 };
      out.push(S(slab(plan, i === 0 ? 0 : z - 2, i === 0 ? z : 2, 2, 0.4), { tone: i === 0 ? 'lo' : 'mid' }));
      out.push(D([at([r.x1 - 3, r.y1 - 3, z]), at([r.x1 - 3, r.y0 + 7, z])], 0.4));
      out.push(between[i] ?? '');
    });
    return out.join('');
  }
  function rackPost(r: { x1: number; y1: number; top: number }, levels: number[]) {
    const out = [S(k.cylinder(r.x1 - 2.4, r.y1 - 2.4, 2.4, 0, r.top, P, 16), { tone: 'mid', crease: 'none' })];
    out.push(L(levels.slice(1).map(z => k.sideArc(r.x1 - 2.4, r.y1 - 2.4, 2.4, z, P, 10)).join(''), { tone: 'faint' }));
    out.push(S(k.cylinder(r.x1 - 2.4, r.y1 - 2.4, 3.2, r.top, 1.6, P, 16), { tone: 'mid' }));
    return out.join('');
  }

  // 작은 표시등: 갓 + 렌즈. 켜짐은 렌즈 그룹의 data-on으로 바꾼다.
  function lamp(x: number, y: number, z: number, part: string) {
    const out = [S(k.cylinder(x, y, 3.6, z, 2, P, 20), { tone: 'mid' })];
    out.push(`<g data-part="${part}" data-on="false">${S(k.cylinder(x, y, 2.4, z + 2, 1.4, P, 18), { tone: 'hi', lit: true })}</g>`);
    return out.join('');
  }

  return { at, S, L, D, slab, byDepth, halo, plate, rails, carriage, boxArt, rack, rackPost, lamp };
}

export const ease = (t: number) => t * t * (3 - 2 * t);

export function along(path: Point3[], t: number): Point3 {
  const lengths = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1], p[2] - path[i][2]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let left = ease(Math.min(1, Math.max(0, t))) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? Math.min(1, left / lengths[i]) : 1;
      const [a, b] = [path[i], path[i + 1]];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
    left -= lengths[i];
  }
  return path[path.length - 1];
}

// 시간 기반 트윈: 여러 개를 동시에 굴리고, 끝나면 done을 부른다.
export type Tween = { path: Point3[]; t: number; dur: number; done?: () => void };
export function stepTween(tw: Tween | null, dt: number): [Point3 | null, Tween | null] {
  if (!tw) return [null, null];
  tw.t += dt / tw.dur;
  const at = along(tw.path, tw.t);
  if (tw.t >= 1) { tw.done?.(); return [at, null]; }
  return [at, tw];
}

export function useSiteTheme() {
  const read = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const [theme, setTheme] = useState<'dark' | 'light'>(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setTheme(read());
    return () => observer.disconnect();
  }, []);
  return theme;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
