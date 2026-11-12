// 구매 자리 장치: 구멍이 하나뿐인 소켓(UNIQUE (회원, 드롭))에 두 탭의 캐리지가 핀을 꽂으려 한다.
// 먼저 꽂은 핀만 들어가고, 늦은 핀은 막혀 돌아간다. 뒤쪽 장부 트레이에는 주문 기록 카드가 쌓인다.
import * as k from '../iso/iso-kit';
import type { Plan, Point3 } from '../iso/iso-kit';
import { partsFor } from './common';

export const WIDTH = 640;
export const HEIGHT = 400;

const PLATE: Plan = { x: -152, y: -72, w: 304, d: 150, r: 9 };
export const RAIL_Y = 34;
export const SOCKET = { x: 0, y: RAIL_Y, half: 16, h: 12, hole: 5.2 };
const CAR = { w: 26, d: 22, h: 12 };
const CAR_TOP = 2.6 + CAR.h;
const ARM = 18;
export const HOME = { A: -100, B: 100 };
export const REACH = { A: -(CAR.w / 2 + ARM), B: CAR.w / 2 + ARM };
export const PEG = { r: 4.2, h: 12 };
export const PEG_DROP = CAR_TOP + 2 - (SOCKET.h - 6); // 소켓에 꽂히면 내려가는 높이

export const LEDGER = { x0: 34, x1: 118, y0: -56, y1: -6, floor: 3, wall: 3, h: 8 };
export const CARD: Plan = { x: 46, y: -48, w: 60, d: 34, r: 1.2 };
export const CARD_H = 1.6;
export const CARDS = 4;

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -17, 0), [HOME.A, RAIL_Y, CAR_TOP + PEG.h + 4]],
  WIDTH, HEIGHT, { pad: 22, azimuth: 40, elevation: 32 },
);
const X = partsFor(P);
const { at, S, L, D, slab } = X;

function socket() {
  const { x, y, half, h, hole } = SOCKET;
  const plan: Plan = { x: x - half, y: y - half, w: half * 2, d: half * 2, r: 2.5 };
  const out = [X.halo(k.insetPlan(plan, 2), 0, 4)];
  out.push(S(slab(plan, 0, h, 4, 0.8), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3), h, P, 4), { tone: 'faint' }));
  out.push(D(k.corners(plan, 3.5).map(([cx, cy]) => at([cx, cy, h])), 0.45));
  out.push(L(k.ring(x, y, hole + 1.6, h, P, 32), { tone: 'lo' }));
  out.push(S(k.cylinder(x, y, hole, h - 0.01, 0.01, P, 32), { tone: 'lo', flat: true }));
  out.push(L(k.ring(x, y, hole, h, P, 32), { tone: 'mid' }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + half - 4.5], h, P, 'x'), '(7, 1)', { size: 3.2, tone: 'lo', anchor: 'middle' }));
  return out.join('');
}

function ledger() {
  const { x0, x1, y0, y1, floor, wall, h } = LEDGER;
  const out = [X.halo({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 2 }, 0, 5)];
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 1.5 }, 0, floor, 3, 0.5), { tone: 'lo' }));
  out.push(S(slab({ x: x0, y: y0, w: wall, d: y1 - y0, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  out.push(S(slab({ x: x0, y: y0, w: x1 - x0, d: wall, r: 0.6 }, floor, h, 2, 0.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(CARD, -1.5), floor, P, 2), { tone: 'faint' }));
  return out.join('');
}
function ledgerFront() {
  const { x0, x1, y0, y1, floor, wall } = LEDGER;
  const out = [S(slab({ x: x1 - wall, y: y0, w: wall, d: y1 - y0, r: 0.6 }, floor, 4, 2, 0.3), { tone: 'mid' })];
  out.push(S(slab({ x: x0 + 3, y: y1 - wall, w: x1 - x0 - 6, d: wall, r: 0.6 }, floor, 4, 2, 0.3), { tone: 'mid' }));
  return out.join('');
}

// 주문 기록 카드 한 장. 도장 자리: PAID는 채운 점, FAILED는 빈 고리, 대기는 흐린 고리.
function cardArt(i: number) {
  const z = LEDGER.floor + i * (CARD_H + 0.8);
  const out = [S(slab(CARD, z, CARD_H, 2, 0.3), { tone: 'hi', crease: 'lo' })];
  const top = z + CARD_H;
  for (const [n, len] of [34, 26, 30].entries()) out.push(L(k.lineOnTop([CARD.x + 6, CARD.y + 8 + n * 5], [CARD.x + 6 + len, CARD.y + 8 + n * 5], top, P), { tone: 'lo', free: true }));
  const stamp: [number, number] = [CARD.x + CARD.w - 10, CARD.y + CARD.d / 2];
  out.push(`<g class="drop-stamp-ring">${L(k.ring(stamp[0], stamp[1], 5, top, P, 24), { tone: 'mid' })}</g>`);
  out.push(`<g class="drop-stamp-fill">${S(k.cylinder(stamp[0], stamp[1], 3.4, top, 0.6, P, 20), { tone: 'hi', lit: true })}</g>`);
  return `<g data-card="${i}" data-status="NONE">${out.join('')}</g>`;
}

function carriage(side: 'A' | 'B') {
  const cx = HOME[side];
  const dir = side === 'A' ? 1 : -1;
  const out = [X.carriage(cx, RAIL_Y, CAR)];
  const armX = dir === 1 ? cx + CAR.w / 2 : cx - CAR.w / 2 - ARM;
  out.push(S(slab({ x: armX, y: RAIL_Y - 4, w: ARM + 4, d: 8, r: 1.2 }, CAR_TOP, 2, 2, 0.3), { tone: 'mid' }));
  return out.join('');
}

export function pegArt(side: 'A' | 'B') {
  const x = HOME[side] + (side === 'A' ? CAR.w / 2 + ARM : -(CAR.w / 2 + ARM)); // 팔 끝
  const z = CAR_TOP + 2;
  const out = [S(k.cylinder(x, RAIL_Y, PEG.r, z, PEG.h - 3, P, 24), { tone: 'hi', crease: 'lo' })];
  out.push(S(k.cylinder(x, RAIL_Y, PEG.r + 1.4, z + PEG.h - 3, 3, P, 28, 0.4), { tone: 'hi', lit: true }));
  out.push(L(k.knurl(x, RAIL_Y, PEG.r + 1.4, z + PEG.h - 3, z + PEG.h, 22, P), { tone: 'lo' }));
  out.push(k.faceTextSvg(k.topMatrix([x, RAIL_Y + 0.8], z + PEG.h, P, 'x'), side, { size: 3.4, tone: 'mid', anchor: 'middle' }));
  return out.join('');
}

export const translate = (by: Point3) => k.translateAlong(P, by);

export function figure() {
  return k.figureSvg({
    width: WIDTH, height: HEIGHT,
    label: '구매 자리 장치. 가운데 블록에는 구멍이 하나뿐인 소켓이 있고, 이것이 (회원 7, 드롭 1) 유니크 제약이다. 왼쪽과 오른쪽 캐리지는 같은 회원의 두 탭이 보낸 요청이며 각자 핀을 싣고 소켓으로 간다. 먼저 꽂은 핀만 들어간다. 뒤쪽 장부 트레이에는 주문 기록 카드가 쌓이고, 결제 실패나 만료가 되면 카드는 남기고 핀만 뽑는다.',
    body: [
      X.plate(PLATE, { x: -136, y: -64, w: 46, d: 14, r: 1.5 }, { x: -140, w: 280 }),
      ledger(),
      ...Array.from({ length: CARDS }, (_, i) => cardArt(i)),
      ledgerFront(),
      X.rails(-136, 130, RAIL_Y, [SOCKET.x - SOCKET.half, SOCKET.x + SOCKET.half]),
      `<g data-part="carA">${carriage('A')}</g>`,
      socket(),
      `<g data-part="carB">${carriage('B')}</g>`,
      `<g data-part="pegA">${pegArt('A')}</g>`,
      `<g data-part="pegB">${pegArt('B')}</g>`,
    ],
  });
}
