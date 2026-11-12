// 드롭 할당 장치: 창고 선반(Sku) → 드롭 트레이(DropItem) → 대기 받침(PAYMENT_WAIT) → 출고함(PAID)
// 트레이의 왼쪽 끝은 반납 게이트다. 상태 레버가 CLOSED이고 대기 받침이 비어 있을 때만 열린다.
import * as k from '../iso/iso-kit';
import type { Plan, Point3 } from '../iso/iso-kit';
import { partsFor } from './common';

export const WIDTH = 640;
export const HEIGHT = 420;

const PLATE: Plan = { x: -162, y: -72, w: 324, d: 156, r: 9 };
export const RACK = { x0: -152, x1: -94, y0: -30, y1: 28, top: 72 };
export const LEVELS = [4, 20, 36, 52];
export const BOX = { w: 40, d: 28, h: 12 };
export const REST_X = -123;

export const TRAY = { x0: -52, x1: 62, y0: -24, y1: 24, floor: 3, wall: 3, h: 10 };
export const TRAY_X = [-18, 32];
export const GATE_RISE = 16;

export const PAD = { x: 10, y: 50 };
export const PAD_Z = 4;
export const BIN = { x0: 96, x1: 146, y0: 20, y1: 66, floor: 3, wall: 3, h: 12 };
export const BIN_X = (BIN.x0 + BIN.x1) / 2;
export const BIN_Y = (BIN.y0 + BIN.y1) / 2;

export const LEVER = { y: 54, x0: -150, x1: -60, stops: [-128, -106, -84] };
export const LIFT = 22;

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -17, 0), [RACK.x0, RACK.y0, RACK.top + 2]],
  WIDTH, HEIGHT, { pad: 22, azimuth: 40, elevation: 32 },
);
const X = partsFor(P);
const { at, S, L, D, slab } = X;

function tray() {
  const { x0, x1, y0, y1, floor, wall, h } = TRAY;
  const out = [X.halo({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 2 }, 0, 5)];
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 1.5 }, 0, floor, 3, 0.5), { tone: 'lo' }));
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: wall, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  out.push(S(slab({ x: x1 - wall, y: y0, w: wall, d: y1 - y0, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  for (const x of TRAY_X) out.push(L(k.planOutline({ x: x - BOX.w / 2 - 1.5, y: -BOX.d / 2 - 1.5, w: BOX.w + 3, d: BOX.d + 3, r: 1 }, floor, P, 2), { tone: 'faint' }));
  // 게이트 가이드 기둥 두 개(먼 쪽, 가까운 쪽)
  for (const y of [y0 + 1.5, y1 - 1.5]) {
    out.push(S(k.cylinder(x0 + 1.5, y, 1.8, floor, h + GATE_RISE + 4, P, 14), { tone: 'mid', crease: 'none' }));
    out.push(S(k.cylinder(x0 + 1.5, y, 2.4, floor + h + GATE_RISE + 4, 1.4, P, 14), { tone: 'mid' }));
  }
  return out.join('');
}

export function gateArt() {
  const { x0, y0, y1, floor, h } = TRAY;
  const plan: Plan = { x: x0 + 0.2, y: y0 + 3.6, w: 2.6, d: y1 - y0 - 7.2, r: 0.4 };
  const out = [S(slab(plan, floor, h, 2, 0.3), { tone: 'hi', lit: true })];
  out.push(D([at([x0 + 1.5, y0 + 7, floor + h]), at([x0 + 1.5, y1 - 7, floor + h])], 0.45, 'hi'));
  return out.join('');
}

function trayLip() {
  const { x0, x1, y1, floor, wall } = TRAY;
  return S(slab({ x: x0 + 3, y: y1 - wall, w: x1 - x0 - 6, d: wall, r: 0.6 }, floor, 4, 2, 0.3), { tone: 'mid' });
}

function pad() {
  const plan: Plan = { x: PAD.x - 26, y: PAD.y - 19, w: 52, d: 38, r: 3 };
  const out = [X.halo(k.insetPlan(plan, 3), 0, 4)];
  out.push(S(slab(plan, 0, PAD_Z, 5, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3.5), PAD_Z, P, 4), { tone: 'faint' }));
  out.push(D(k.corners(plan, 3).map(([x, y]) => at([x, y, PAD_Z])), 0.45));
  // 대기 표시등 받침
  const base: Plan = { x: PAD.x + 30, y: PAD.y - 6, w: 12, d: 12, r: 2 };
  out.push(S(slab(base, 0, 6, 4, 0.4), { tone: 'mid' }));
  out.push(X.lamp(PAD.x + 36, PAD.y, 6, 'pending'));
  return out.join('');
}

function binBack() {
  const { x0, x1, y0, y1, floor, wall, h } = BIN;
  const out = [X.halo({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 2 }, 0, 5)];
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 1.5 }, 0, floor, 3, 0.5), { tone: 'lo' }));
  out.push(S(slab({ x: x0, y: y0, w: wall, d: y1 - y0, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: wall, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  return out.join('');
}
function binFront() {
  const { x0, x1, y0, y1, floor, wall, h } = BIN;
  const out = [S(slab({ x: x1 - wall, y: y0, w: wall, d: y1 - y0, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' })];
  out.push(S(slab({ x: x0, y: y1 - wall, w: x1 - x0, d: wall, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  out.push(D([at([x0 + 4, y1 - 1.5, floor + h]), at([x1 - 4, y1 - 1.5, floor + h])], 0.45));
  return out.join('');
}

function leverRail() {
  const { y, x0, x1, stops } = LEVER;
  const plan: Plan = { x: x0, y: y - 9, w: x1 - x0, d: 18, r: 2.5 };
  const out = [X.halo(k.insetPlan(plan, 2), 0, 4)];
  out.push(S(slab(plan, 0, 4, 4, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline({ x: x0 + 8, y: y - 2, w: x1 - x0 - 16, d: 4, r: 1.8 }, 4, P, 3), { tone: 'lo' }));
  for (const x of stops) out.push(L(k.lineOnTop([x, y - 7], [x, y - 3.6], 4, P), { tone: 'mid' }));
  out.push(D([at([x0 + 3, y - 6, 4]), at([x1 - 3, y - 6, 4]), at([x0 + 3, y + 6, 4]), at([x1 - 3, y + 6, 4])], 0.45));
  return out.join('');
}
export function leverArt() {
  const { y, stops } = LEVER;
  const x = stops[0];
  const out = [S(slab({ x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, 4, 5, 4, 0.5), { tone: 'mid' })];
  out.push(S(k.cylinder(x, y, 2, 9, 9, P, 14), { tone: 'mid', crease: 'none' }));
  out.push(S(k.cylinder(x, y, 4.2, 18, 5, P, 24, 0.5), { tone: 'hi', lit: true }));
  out.push(L(k.knurl(x, y, 4.2, 18, 23, 20, P), { tone: 'lo' }));
  return out.join('');
}

export const translate = (by: Point3) => k.translateAlong(P, by);

export function figure() {
  const boxes = LEVELS.map((z, i) => `<g data-box="${i}" transform="${translate([0, 0, z])}">${X.boxArt(REST_X, 0, BOX)}</g>`);
  return k.figureSvg({
    width: WIDTH, height: HEIGHT,
    label: '드롭 할당 장치. 왼쪽 창고 선반이 Sku 재고, 가운데 트레이가 드롭 전용 재고(DropItem)다. 앞쪽 받침은 결제를 기다리는 주문, 오른쪽 출고함은 결제 완료다. 트레이 왼쪽 끝의 게이트는 앞쪽 상태 레버가 CLOSED이고 대기 받침이 비었을 때만 열려 남은 상자를 선반으로 돌려보낸다.',
    body: [
      X.plate(PLATE, { x: 100, y: -66, w: 46, d: 14, r: 1.5 }, { x: -150, w: 300 }),
      tray(),
      `<g data-part="gate">${gateArt()}</g>`,
      pad(),
      binBack(),
      X.rack(RACK, LEVELS, boxes),
      X.rackPost(RACK, LEVELS),
      trayLip(),
      binFront(),
      leverRail(),
      `<g data-part="lever">${leverArt()}</g>`,
    ],
  });
}
