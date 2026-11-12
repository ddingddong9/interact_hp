// 멱등성 장치: 왼쪽 상태 레버(주문 상태), 가운데 두 레인의 셔틀(결제 요청), 오른쪽 PG 프레스.
// 프레스가 한 번 내려올 때마다 동전 하나(카드 결제 한 번)가 떨어진다. 키 보관함에 있는 키는 다시 찍지 않는다.
import * as k from '../iso/iso-kit';
import type { Plan, Point3 } from '../iso/iso-kit';
import { partsFor } from './common';

export const WIDTH = 640;
export const HEIGHT = 420;

const PLATE: Plan = { x: -156, y: -72, w: 312, d: 154, r: 9 };
export const LANES = [18, 48];
export const SHUTTLE = { home: -58, pg: 52, w: 24, d: 16, h: 8 };
const SH_TOP = 2.6 + SHUTTLE.h;

export const STATUS = { y: -40, x0: -152, x1: -78, stops: [-140, -124, -108, -92] };
export const PRESS = { x: 102, y: 33, beam: 54, stroke: 24 };
export const COIN = { x: 124, y: -42, r: 6, h: 2.4, max: 4 };
export const INDEX = { x: 72, y: -46, max: 3 };

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -17, 0), [PRESS.x, PRESS.y, PRESS.beam + 8]],
  WIDTH, HEIGHT, { pad: 22, azimuth: 40, elevation: 32 },
);
const X = partsFor(P);
const { at, S, L, D, slab } = X;

function statusRail() {
  const { y, x0, x1, stops } = STATUS;
  const plan: Plan = { x: x0, y: y - 9, w: x1 - x0, d: 18, r: 2.5 };
  const out = [X.halo(k.insetPlan(plan, 2), 0, 4)];
  out.push(S(slab(plan, 0, 4, 4, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline({ x: x0 + 7, y: y - 2, w: x1 - x0 - 14, d: 4, r: 1.8 }, 4, P, 3), { tone: 'lo' }));
  for (const x of stops) out.push(L(k.lineOnTop([x, y + 3.6], [x, y + 7], 4, P), { tone: 'mid' }));
  out.push(D([at([x0 + 3, y - 6, 4]), at([x1 - 3, y - 6, 4]), at([x0 + 3, y + 6, 4]), at([x1 - 3, y + 6, 4])], 0.45));
  return out.join('');
}
export function knobArt() {
  const { y, stops } = STATUS;
  const x = stops[0];
  const out = [S(slab({ x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, 4, 5, 4, 0.5), { tone: 'mid' })];
  out.push(S(k.cylinder(x, y, 2, 9, 8, P, 14), { tone: 'mid', crease: 'none' }));
  out.push(S(k.cylinder(x, y, 4.2, 17, 5, P, 24, 0.5), { tone: 'hi', lit: true }));
  out.push(L(k.knurl(x, y, 4.2, 17, 22, 20, P), { tone: 'lo' }));
  return out.join('');
}

function indexTray() {
  const plan: Plan = { x: INDEX.x - 16, y: INDEX.y - 14, w: 32, d: 28, r: 2 };
  const out = [X.halo(plan, 0, 4), S(slab(plan, 0, 3, 3, 0.5), { tone: 'lo' })];
  out.push(S(slab({ x: plan.x, y: plan.y, w: plan.w, d: 3, r: 0.6 }, 3, 10, 2, 0.4), { tone: 'mid' }));
  out.push(S(slab({ x: plan.x, y: plan.y, w: 3, d: plan.d, r: 0.6 }, 3, 10, 2, 0.4), { tone: 'mid' }));
  return out.join('');
}
export function keyCardArt(i: number, label: string) {
  const plan: Plan = { x: INDEX.x - 11 + i * 1.5, y: INDEX.y - 9 + i * 6, w: 22, d: 4, r: 0.6 };
  const out = [S(slab(plan, 3, 12, 2, 0.3), { tone: 'hi', crease: 'lo' })];
  out.push(k.faceTextSvg(k.topMatrix([plan.x + plan.w / 2, plan.y + 2.6], 15, P, 'x'), label, { size: 2.6, tone: 'lo', anchor: 'middle' }));
  return `<g data-key="${i}" data-on="false" class="drop-keycard">${out.join('')}</g>`;
}

function cashBox() {
  const plan: Plan = { x: COIN.x - 14, y: COIN.y - 14, w: 28, d: 28, r: 2 };
  const out = [X.halo(plan, 0, 4), S(slab(plan, 0, 3, 3, 0.5), { tone: 'lo' })];
  out.push(S(slab({ x: plan.x, y: plan.y, w: plan.w, d: 3, r: 0.6 }, 3, 8, 2, 0.4), { tone: 'mid' }));
  out.push(S(slab({ x: plan.x, y: plan.y, w: 3, d: plan.d, r: 0.6 }, 3, 8, 2, 0.4), { tone: 'mid' }));
  out.push(L(k.ring(COIN.x, COIN.y, COIN.r + 2, 3, P, 28), { tone: 'faint' }));
  for (let i = 0; i < COIN.max; i++) {
    const z = 3 + i * COIN.h;
    out.push(`<g data-coin="${i}" data-on="false" class="drop-coin">${S(k.cylinder(COIN.x, COIN.y, COIN.r, z, COIN.h, P, 32, 0.3), { tone: 'hi', crease: 'lo' })}${L(k.ring(COIN.x, COIN.y, COIN.r - 1.6, z + COIN.h, P, 24), { tone: 'lo' })}</g>`);
  }
  return out.join('');
}
function cashFront() {
  const plan: Plan = { x: COIN.x - 14, y: COIN.y - 14, w: 28, d: 28, r: 2 };
  const out = [S(slab({ x: plan.x + plan.w - 3, y: plan.y, w: 3, d: plan.d, r: 0.6 }, 3, 4, 2, 0.3), { tone: 'mid' })];
  out.push(S(slab({ x: plan.x + 3, y: plan.y + plan.d - 3, w: plan.w - 6, d: 3, r: 0.6 }, 3, 4, 2, 0.3), { tone: 'mid' }));
  return out.join('');
}

function pressBack() {
  const { x, y, beam } = PRESS;
  const base: Plan = { x: x - 22, y: y - 30, w: 44, d: 60, r: 3 };
  const out = [X.halo(base, 0, 5), S(slab(base, 0, 6, 5, 0.8), { tone: 'mid' })];
  out.push(D(k.corners(base, 3.5).map(([cx, cy]) => at([cx, cy, 6])), 0.45));
  // 모루(도장 받는 판)
  out.push(S(slab({ x: x - 10, y: y - 10, w: 20, d: 20, r: 1.5 }, 6, 4, 3, 0.5), { tone: 'mid' }));
  out.push(L(k.planOutline({ x: x - 7, y: y - 7, w: 14, d: 14, r: 1 }, 10, P, 2), { tone: 'lo' }));
  // 먼 기둥
  out.push(S(k.cylinder(x, y - 24, 3, 6, beam - 6, P, 18), { tone: 'mid', crease: 'none' }));
  return out.join('');
}
export function headArt() {
  const { x, y, beam } = PRESS;
  const out = [S(k.cylinder(x, y, 2.2, 22, beam - 22, P, 16), { tone: 'mid', crease: 'none' })];
  out.push(S(slab({ x: x - 8, y: y - 8, w: 16, d: 16, r: 1.5 }, 14, 8, 3, 0.5), { tone: 'hi', lit: true }));
  return out.join('');
}
function pressFront() {
  const { x, y, beam } = PRESS;
  const out = [S(k.cylinder(x, y + 24, 3, 6, beam - 6, P, 18), { tone: 'mid', crease: 'none' })];
  out.push(S(slab({ x: x - 6, y: y - 28, w: 12, d: 56, r: 2 }, beam, 6, 4, 0.6), { tone: 'mid' }));
  out.push(S(k.cylinder(x, y, 4, beam + 6, 2, P, 20), { tone: 'mid' }));
  out.push(D([at([x, y - 24, beam + 6]), at([x, y + 24, beam + 6])], 0.5));
  return out.join('');
}

export function shuttleArt(lane: number) {
  const y = LANES[lane];
  const out = [X.carriage(SHUTTLE.home, y, SHUTTLE)];
  const card: Plan = { x: SHUTTLE.home - 9, y: y - 6, w: 14, d: 12, r: 0.8 };
  out.push(`<g data-part="card${lane}">${S(slab(card, SH_TOP, 1.2, 2, 0.3), { tone: 'hi', crease: 'lo' })}<g data-part="label${lane}"></g></g>`);
  out.push(`<g data-part="reply${lane}" data-on="false">${S(k.cylinder(SHUTTLE.home + 7, y, 3, SH_TOP, 2.4, P, 18, 0.3), { tone: 'hi', lit: true })}</g>`);
  return out.join('');
}
export const cardLabel = (lane: number, text: string) =>
  k.faceTextSvg(k.topMatrix([SHUTTLE.home - 2, LANES[lane] + 0.9], SH_TOP + 1.2, P, 'x'), text, { size: 2.8, tone: 'lo', anchor: 'middle' });

export const translate = (by: Point3) => k.translateAlong(P, by);

export function figure() {
  return k.figureSvg({
    width: WIDTH, height: HEIGHT,
    label: '멱등성 장치. 왼쪽 뒤의 레버는 주문 상태로 PAYMENT_WAIT, PAYING, PAID, FAILED 네 칸이 있다. 가운데 두 레인의 셔틀은 결제 요청이며 위에 멱등성 키 카드를 싣는다. 오른쪽 PG 프레스는 처음 보는 키를 찍어 동전 하나(카드 결제)를 떨어뜨리고 키를 보관함에 넣는다. 이미 보관함에 있는 키는 찍지 않고 저장된 결과를 돌려준다.',
    body: [
      X.plate(PLATE, { x: -60, y: -64, w: 46, d: 14, r: 1.5 }, { x: -144, w: 288 }),
      statusRail(),
      `<g data-part="knob">${knobArt()}</g>`,
      indexTray(),
      ...['205', '206', '207'].map((label, i) => keyCardArt(i, label)),
      cashBox(),
      cashFront(),
      pressBack(),
      `<g data-part="head">${headArt()}</g>`,
      X.rails(-80, 72, LANES[0]),
      `<g data-part="sh0">${shuttleArt(0)}</g>`,
      X.rails(-80, 72, LANES[1]),
      `<g data-part="sh1">${shuttleArt(1)}</g>`,
      pressFront(),
    ],
  });
}
