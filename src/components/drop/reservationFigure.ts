// 재고 선점 장치: 선반(재고) → 보류 받침(결제 대기) → 출고함(결제 완료)
// 상태 토큰 하나를 결제 팔과 만료 팔이 서로 가져가려 한다. 먼저 집은 쪽만 상태를 바꾼다(조건부 UPDATE).
import * as k from '../iso/iso-kit';
import type { Plan, Point3 } from '../iso/iso-kit';

export const WIDTH = 640;
export const HEIGHT = 400;

const PLATE: Plan = { x: -156, y: -70, w: 312, d: 150, r: 9 };
const PLATE_H = 12;
const FOOT_H = 5;

// 선반(재고 3켤레)
const RACK = { x0: -146, x1: -88, y0: -30, y1: 28, top: 60 };
export const SHELF_Z = [4, 22, 40];
const SHELF_T = 2;
export const BOX = { w: 42, d: 30, h: 13 };
export const REST_X = -115; // 선반 안 상자 중심
const boxPlan = (cx: number): Plan => ({ x: cx - BOX.w / 2, y: -BOX.d / 2, w: BOX.w, d: BOX.d, r: 1.2 });

// 보류 받침(결제 대기)
export const HOLD_X = -26;
const HOLD: Plan = { x: HOLD_X - 28, y: -21, w: 56, d: 42, r: 3 };
export const HOLD_Z = 4;

// 결제 대기 타이머
export const DIAL = { x: -26, y: -48, r: 14, z: 22, h: 6 };
export const DIAL_TOP = DIAL.z + DIAL.h;

// 출고함(결제 완료)
const BIN = { x0: 90, x1: 142, y0: -27, y1: 27, wall: 3, h: 13 };
export const BIN_X = (BIN.x0 + BIN.x1) / 2;
export const BIN_FLOOR = 3;

// 앞쪽 레일: 결제 팔(왼쪽), 상태 토큰 받침(가운데), 만료 팔(오른쪽)
export const STRIP_Y = 46;
export const CUP = { x: 30, r: 9, h: 14 };
export const TOKEN = { r: 6.6, h: 4 };
const CAR = { w: 26, d: 22, h: 12 };
export const PAY_HOME = -30;
export const PAY_REACH = -2;
export const SCHED_HOME = 90;
export const SCHED_REACH = 62;
const FORK_LEN = 22;

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [RACK.x0, RACK.y0, RACK.top + 2], [DIAL.x, DIAL.y, DIAL_TOP + 2]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 40, elevation: 32 },
);

const at = (point: Point3) => k.iso(point, P);
const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const D = (points: Array<[number, number]>, size = 0.5, tone: k.Tone = 'mid') => k.dotsSvg(points, { size, tone });
const byDepth = (points: Array<[number, number]>) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const slab = (plan: Plan, z: number, h: number, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);

function plate() {
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
  // 앞 가장자리 눈금자: 상자가 지나가는 길
  const strip: Plan = { x: -150, y: PLATE.y + PLATE.d - 13, w: 300, d: 6, r: 1 };
  out.push(S(slab(strip, 0, 0.6, 3), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], 0.45));
  // 이름판
  const label: Plan = { x: 96, y: -64, w: 46, d: 14, r: 1.5 };
  out.push(S(slab(label, 0, 0.8, 4), { tone: 'lo', crease: 'none' }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P), { tone: 'faint' }));
  for (const [i, len] of [32, 24, 28].entries()) {
    out.push(L(k.lineOnTop([label.x + 6, label.y + 4 + i * 3], [label.x + 6 + len, label.y + 4 + i * 3], 0.8, P), { tone: 'lo', free: true }));
  }
  out.push(D([at([label.x + 3, label.y + 7, 0.8]), at([label.x + label.w - 3, label.y + 7, 0.8])], 0.4));
  return out.join('');
}

function hold() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(HOLD, 3), 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(slab(HOLD, 0, HOLD_Z, 5, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(HOLD, 3.5), HOLD_Z, P, 4), { tone: 'faint' }));
  out.push(D(k.corners(HOLD, 3).map(([x, y]) => at([x, y, HOLD_Z])), 0.45));
  // 상자 자리 표시(얕은 홈)
  out.push(L(k.planOutline(k.insetPlan(boxPlan(HOLD_X), -1.5), HOLD_Z, P, 3), { tone: 'lo' }));
  // 타이머 기둥과 다이얼
  out.push(S(slab({ x: DIAL.x - 8, y: DIAL.y - 6, w: 16, d: 12, r: 2 }, 0, 4, 4, 0.5), { tone: 'mid' }));
  out.push(S(k.cylinder(DIAL.x, DIAL.y, 2.8, 4, DIAL.z - 4, P, 20), { tone: 'mid', crease: 'none' }));
  out.push(L(k.sideArc(DIAL.x, DIAL.y, 2.8, 12, P, 12), { tone: 'faint' }));
  out.push(S(k.cylinder(DIAL.x, DIAL.y, DIAL.r, DIAL.z, DIAL.h, P, 56, 0.7), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.knurl(DIAL.x, DIAL.y, DIAL.r, DIAL_TOP - 2.6, DIAL_TOP, 64, P, 0.3), { tone: 'lo' }));
  out.push(L(k.sideArc(DIAL.x, DIAL.y, DIAL.r, DIAL_TOP - 2.6, P, 36), { tone: 'faint' }));
  out.push(L(k.ring(DIAL.x, DIAL.y, DIAL.r - 2, DIAL_TOP, P, 48), { tone: 'lo' }));
  const ticks = k.radialTicks(DIAL.x, DIAL.y, DIAL.r - 2.4, 40, 5, DIAL_TOP, [1, 2.2], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(L(k.ring(DIAL.x, DIAL.y, 1.3, DIAL_TOP, P, 14), { tone: 'mid' }));
  // 크라운
  out.push(S(slab({ x: DIAL.x + DIAL.r - 1, y: DIAL.y - 2, w: 4, d: 4, r: 1 }, DIAL.z + 1.5, 3, 3), { tone: 'mid' }));
  return out.join('');
}

function rackBack() {
  const out: string[] = [];
  const { x0, x1, y0, y1, top } = RACK;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 2 }, 0, 0.1, P)}" style="filter:blur(5px)"/>`);
  out.push(S(slab({ x: x0, y: y0, w: 4, d: y1 - y0, r: 0.8 }, 0, top, 2, 0.5), { tone: 'mid' }));
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: 4, r: 0.8 }, 0, top, 2, 0.5), { tone: 'mid' }));
  out.push(D([at([x0 + 2, y0 + 8, top]), at([x0 + 2, y1 - 6, top]), at([x1 - 6, y0 + 2, top])], 0.45));
  return out.join('');
}

function shelf(i: number) {
  const { x0, x1, y0, y1 } = RACK;
  const z = SHELF_Z[i] - SHELF_T;
  const plan: Plan = { x: x0 + 4, y: y0 + 4, w: x1 - x0 - 4, d: y1 - y0 - 4, r: 0.8 };
  const out = [S(slab(plan, i === 0 ? 0 : z, i === 0 ? SHELF_Z[0] : SHELF_T, 2, 0.4), { tone: i === 0 ? 'lo' : 'mid' })];
  out.push(D([at([x1 - 3, y1 - 3, SHELF_Z[i]]), at([x1 - 3, y0 + 7, SHELF_Z[i]])], 0.4));
  return out.join('');
}

export function boxArt() {
  const plan = boxPlan(REST_X);
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  const lidZ = BOX.h - 3;
  out.push(S(slab(plan, 0, lidZ, 2, 0.4), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(plan, 3, P, 2), { tone: 'faint' }) }));
  out.push(S(slab(k.insetPlan(plan, -0.6), lidZ, 3, 2, 0.4), { tone: 'hi', crease: 'lo' }));
  // 라벨 카드
  const card: Plan = { x: plan.x + 6, y: plan.y + 8, w: 16, d: 10, r: 0.6 };
  out.push(L(k.planOutline(card, BOX.h, P, 2), { tone: 'lo' }));
  out.push(L(k.lineOnTop([card.x + 3, card.y + 4], [card.x + 12, card.y + 4], BOX.h, P), { tone: 'lo', free: true }));
  out.push(L(k.lineOnTop([card.x + 3, card.y + 6.5], [card.x + 9, card.y + 6.5], BOX.h, P), { tone: 'lo', free: true }));
  return out.join('');
}

function rackFront() {
  const { x1, y1, top } = RACK;
  const out = [S(k.cylinder(x1 - 2.4, y1 - 2.4, 2.4, 0, top, P, 16), { tone: 'mid', crease: 'none' })];
  out.push(L(SHELF_Z.slice(1).map(z => k.sideArc(x1 - 2.4, y1 - 2.4, 2.4, z, P, 10)).join(''), { tone: 'faint' }));
  out.push(S(k.cylinder(x1 - 2.4, y1 - 2.4, 3.2, top, 1.6, P, 16), { tone: 'mid' }));
  return out.join('');
}

function binBack() {
  const { x0, x1, y0, y1, wall, h } = BIN;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 2 }, 0, 0.1, P)}" style="filter:blur(5px)"/>`];
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 1.5 }, 0, BIN_FLOOR, 3, 0.5), { tone: 'lo' }));
  out.push(S(slab({ x: x0, y: y0, w: wall, d: y1 - y0, r: 0.6 }, BIN_FLOOR, h, 2, 0.4), { tone: 'mid' }));
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: wall, r: 0.6 }, BIN_FLOOR, h, 2, 0.4), { tone: 'mid' }));
  return out.join('');
}

function binFront() {
  const { x0, x1, y0, y1, wall, h } = BIN;
  const out = [S(slab({ x: x1 - wall, y: y0, w: wall, d: y1 - y0, r: 0.6 }, BIN_FLOOR, h, 2, 0.4), { tone: 'mid' })];
  out.push(S(slab({ x: x0, y: y1 - wall, w: x1 - x0, d: wall, r: 0.6 }, BIN_FLOOR, h, 2, 0.4), { tone: 'mid' }));
  out.push(D([at([x0 + 4, y1 - 1.5, BIN_FLOOR + h]), at([x1 - 4, y1 - 1.5, BIN_FLOOR + h]), at([x1 - 1.5, y0 + 4, BIN_FLOOR + h])], 0.45));
  return out.join('');
}

function railStrip() {
  const out: string[] = [];
  const y = STRIP_Y;
  // 레일 두 줄과 끝 멈춤쇠
  // 레일은 토큰 받침대 앞뒤에서 끊어 받침대 옆면에 닿게 한다
  for (const ry of [y - 9, y + 6]) {
    out.push(S(slab({ x: -46, y: ry, w: CUP.x - 12 + 46, d: 3, r: 0.8 }, 0, 2.6, 2, 0.3), { tone: 'mid' }));
    out.push(S(slab({ x: CUP.x + 12, y: ry, w: 106 - CUP.x - 12, d: 3, r: 0.8 }, 0, 2.6, 2, 0.3), { tone: 'mid' }));
  }
  for (const x of [-52, 106]) {
    out.push(S(slab({ x, y: y - 12, w: 6, d: 22, r: 1.2 }, 0, 8, 3, 0.5), { tone: 'mid' }));
    out.push(D([at([x + 3, y - 8, 8]), at([x + 3, y + 6, 8])], 0.45));
  }
  return out.join('');
}

function cup() {
  const out: string[] = [];
  const y = STRIP_Y;
  const base: Plan = { x: CUP.x - 12, y: y - 12, w: 24, d: 24, r: 2.5 };
  out.push(S(slab(base, 0, 3, 4, 0.5), { tone: 'mid' }));
  out.push(D(k.corners(base, 3).map(([x, yy]) => at([x, yy, 3])), 0.45));
  out.push(S(k.cylinder(CUP.x, y, 4, 3, CUP.h - 5, P, 24), { tone: 'mid', crease: 'none' }));
  out.push(L(k.sideArc(CUP.x, y, 4, 7, P, 12), { tone: 'faint' }));
  out.push(S(k.cylinder(CUP.x, y, CUP.r, CUP.h - 2, 2, P, 40, 0.5), { tone: 'mid' }));
  out.push(L(k.ring(CUP.x, y, CUP.r - 2, CUP.h, P, 32), { tone: 'lo' }));
  return out.join('');
}

function carriage(home: number, dir: 1 | -1) {
  const y = STRIP_Y;
  const plan: Plan = { x: home - CAR.w / 2, y: y - CAR.d / 2, w: CAR.w, d: CAR.d, r: 2 };
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), 2.6, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(slab(plan, 2.6, CAR.h, 4, 0.6), { tone: 'mid' }));
  out.push(D([at([plan.x + 3, plan.y + 3, 2.6 + CAR.h]), at([plan.x + plan.w - 3, plan.y + 3, 2.6 + CAR.h])], 0.4));
  // 포크: 토큰 밑으로 들어가는 얇은 판
  const forkX = dir === 1 ? home + CAR.w / 2 : home - CAR.w / 2 - FORK_LEN;
  out.push(S(slab({ x: forkX, y: y - 3.5, w: FORK_LEN, d: 7, r: 1 }, CUP.h, 1.5, 2, 0.3), { tone: 'mid' }));
  // 손잡이
  const knob: [number, number] = [home, y + CAR.d / 2 + 3];
  out.push(S(slab({ x: knob[0] - 1.6, y: y + CAR.d / 2 - 0.5, w: 3.2, d: 2.6, r: 0.8 }, 4.4, 3, 2), { tone: 'mid', crease: 'none' }));
  out.push(S(k.cylinder(knob[0], knob[1] + 0.8, 2.6, 3.2, 5.4, P, 18), { tone: 'mid' }));
  out.push(L(k.knurl(knob[0], knob[1] + 0.8, 2.6, 3.2, 8.6, 16, P), { tone: 'lo' }));
  return out.join('');
}

function token() {
  const out = [S(k.cylinder(CUP.x, STRIP_Y, TOKEN.r, CUP.h, TOKEN.h, P, 28, 0.4), { tone: 'hi', lit: true })];
  out.push(L(k.ring(CUP.x, STRIP_Y, TOKEN.r - 1.6, CUP.h + TOKEN.h, P, 20), { tone: 'lit' }));
  return out.join('');
}

export const needleAt = (share: number) => {
  const a = share * Math.PI * 2;
  const { x, y, r } = DIAL;
  return k.lineOnTop([x - Math.sin(a) * 2.6, y + Math.cos(a) * 2.6], [x + Math.sin(a) * (r - 3.6), y - Math.cos(a) * (r - 3.6)], DIAL_TOP + 0.2, P);
};

export const translate = (by: Point3) => k.translateAlong(P, by);

export function figure() {
  const boxes = SHELF_Z.map((z, i) => `<g data-box="${i}" transform="${translate([0, 0, z])}">${boxArt()}</g>`);
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: '재고 선점 장치. 왼쪽 선반에 상자 세 개가 있다. 주문하면 상자 하나가 가운데 보류 받침으로 나와 결제를 기다린다. 앞쪽 받침 위의 상태 토큰을 왼쪽 결제 팔과 오른쪽 만료 팔이 가져가려 하고, 먼저 집은 쪽만 상태를 바꾼다. 결제 팔이 이기면 상자는 오른쪽 출고함으로, 만료 팔이 이기면 다시 선반으로 돌아간다.',
    body: [
      plate(),
      hold(),
      `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(0)}" style="stroke-width:1.1"/>`,
      binBack(),
      rackBack(),
      shelf(0), boxes[0],
      shelf(1), boxes[1],
      shelf(2), boxes[2],
      rackFront(),
      binFront(),
      railStrip(),
      `<g data-part="pay">${carriage(PAY_HOME, 1)}</g>`,
      cup(),
      `<g data-part="sched">${carriage(SCHED_HOME, -1)}</g>`,
      `<g data-part="token">${token()}</g>`,
    ],
  });
}
