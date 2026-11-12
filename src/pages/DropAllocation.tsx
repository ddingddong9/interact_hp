import { useEffect, useMemo, useRef, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import type { Point3 } from '../components/iso/iso-kit';
import { BIN, BIN_X, BIN_Y, BOX, GATE_RISE, LEVELS, LEVER, LIFT, PAD, PAD_Z, REST_X, TRAY, TRAY_X, figure, translate } from '../components/drop/allocationFigure';
import { ease, reducedMotion, stepTween, useSiteTheme } from '../components/drop/common';
import type { Tween } from '../components/drop/common';
import '../components/iso/iso.css';
import '../styles/hash-table.css';
import '../styles/race-condition.css';
import '../styles/stock-reservation.css';

type Drop = 'READY' | 'OPEN' | 'CLOSED' | 'SETTLED';
type Mode = 'condition' | 'time';
type Loc = { kind: 'shelf' } | { kind: 'tray'; slot: number } | { kind: 'pad' } | { kind: 'bin'; n: number };
type Sim = { drop: Drop; locs: Loc[]; at: Point3[]; tweens: (Tween | null)[]; shipped: number; gate: number; gateOpen: boolean; lever: number; leverTo: number };
type View = { sku: number; dropItem: number; drop: Drop; pending: boolean; orphan: number; busy: boolean; message: string };

const EXIT = -66 - REST_X;
const shelfAt = (i: number): Point3 => [0, 0, LEVELS[i]];
const trayAt = (j: number): Point3 => [TRAY_X[j] - REST_X, 0, TRAY.floor];
const padAt: Point3 = [PAD.x - REST_X, PAD.y, PAD_Z];
const binAt = (n: number): Point3 => [BIN_X - REST_X, BIN_Y, BIN.floor + n * BOX.h];
const leverStop: Record<Drop, number> = { READY: 0, OPEN: 0, CLOSED: 1, SETTLED: 2 };
const dropName: Record<Drop, string> = { READY: '준비', OPEN: 'OPEN', CLOSED: 'CLOSED', SETTLED: 'SETTLED' };
const START = '창고 선반에 블랙 270이 4켤레 있습니다. 드롭을 열기 전에 이 중 2켤레를 드롭 전용 트레이로 옮겨 둡니다.';

const fresh = (): Sim => ({
  drop: 'READY', locs: LEVELS.map(() => ({ kind: 'shelf' })), at: LEVELS.map((_, i) => shelfAt(i)), tweens: LEVELS.map(() => null),
  shipped: 0, gate: 0, gateOpen: false, lever: 0, leverTo: 0,
});

export default function DropAllocation() {
  const theme = useSiteTheme();
  const svg = useMemo(() => figure(), []);
  const stage = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim>(fresh());
  const [mode, setMode] = useState<Mode>('condition');
  const modeRef = useRef<Mode>('condition');
  const [view, setView] = useState<View>({ sku: 4, dropItem: 0, drop: 'READY', pending: false, orphan: 0, busy: false, message: START });
  const api = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    root.innerHTML = svg;
    const boxEls = LEVELS.map((_, i) => root.querySelector<SVGGElement>(`[data-box="${i}"]`)!);
    const gate = root.querySelector<SVGGElement>('[data-part="gate"]')!;
    const lever = root.querySelector<SVGGElement>('[data-part="lever"]')!;
    const lamp = root.querySelector<SVGGElement>('[data-part="pending"]')!;
    let frame = 0, last = 0;
    const dur = (s: number) => (reducedMotion() ? 0.001 : s);

    const count = (kind: Loc['kind']) => sim.current.locs.filter(l => l.kind === kind).length;
    const publish = (message?: string) => {
      const s = sim.current;
      const inTray = count('tray');
      setView(old => ({
        sku: count('shelf'), dropItem: s.drop === 'SETTLED' ? 0 : inTray, drop: s.drop, pending: count('pad') > 0,
        orphan: s.drop === 'SETTLED' ? inTray : 0, busy: s.tweens.some(Boolean), message: message ?? old.message,
      }));
    };
    const move = (i: number, path: Point3[], to: Loc, done?: () => void) => {
      const s = sim.current;
      s.tweens[i] = { path, t: 0, dur: dur(1.3), done: () => { s.locs[i] = to; done?.(); publish(); } };
    };
    const freeSlot = () => [0, 1].find(j => !sim.current.locs.some(l => l.kind === 'tray' && l.slot === j));
    const boxIn = (kind: Loc['kind']) => sim.current.locs.findIndex(l => l.kind === kind);
    const setDrop = (drop: Drop) => { sim.current.drop = drop; sim.current.leverTo = leverStop[drop]; };
    const toShelfPath = (i: number, from: Point3): Point3[] => [from, [EXIT, 0, Math.max(from[2], LEVELS[i])], [EXIT, 0, LEVELS[i]], shelfAt(i)];

    const draw = () => {
      const s = sim.current;
      s.at.forEach((p, i) => boxEls[i].setAttribute('transform', translate(p)));
      gate.setAttribute('transform', translate([0, 0, ease(s.gate) * GATE_RISE]));
      const x = LEVER.stops[0] + (LEVER.stops[1] - LEVER.stops[0]) * s.lever;
      lever.setAttribute('transform', translate([x - LEVER.stops[0], 0, 0]));
      lamp.setAttribute('data-on', String(s.locs.some(l => l.kind === 'pad')));
    };
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
      last = now;
      const s = sim.current;
      s.tweens.forEach((tw, i) => { const [p, next] = stepTween(tw, dt); if (p) s.at[i] = p; s.tweens[i] = next; });
      s.gate += Math.sign((s.gateOpen ? 1 : 0) - s.gate) * Math.min(Math.abs((s.gateOpen ? 1 : 0) - s.gate), dt / dur(0.5));
      s.lever += (s.leverTo - s.lever) * (1 - Math.exp(-dt / dur(0.18)));
      draw();
      frame = requestAnimationFrame(tick);
    };
    const later = (seconds: number, fn: () => void) => window.setTimeout(fn, reducedMotion() ? 0 : seconds * 1000);

    api.current = {
      allocate: () => {
        const s = sim.current;
        if (s.drop !== 'READY') return;
        s.gateOpen = true;
        publish('한 트랜잭션 안에서 Sku 4 → 2, DropItem 0 → 2. 두 값이 함께 바뀌거나, 둘 다 바뀌지 않습니다.');
        later(0.4, () => {
          [3, 2].forEach((i, j) => move(i, [shelfAt(i), [EXIT, 0, LEVELS[i]], trayAt(j)], { kind: 'tray', slot: j }, () => {
            if (j === 1) { s.gateOpen = false; setDrop('OPEN'); publish('드롭이 열렸습니다(OPEN). 이제 일반 판매가 창고 재고를 다 팔아도 드롭 몫 2켤레는 남아 있습니다.'); }
          }));
        });
      },
      order: () => {
        const s = sim.current;
        if (s.drop !== 'OPEN' || boxIn('pad') >= 0) return;
        const i = s.locs.findIndex(l => l.kind === 'tray');
        if (i < 0) { publish('트레이가 비었습니다. 드롭 품절은 DropItem.stock == 0 하나로 판단합니다.'); return; }
        const from = s.at[i];
        move(i, [from, [from[0], 0, LIFT], [padAt[0], PAD.y, LIFT], padAt], { kind: 'pad' }, () => publish('결제 대기 중입니다(PAYMENT_WAIT). 결과가 정해지지 않은 주문이 하나 있습니다.'));
        publish('주문이 트레이(DropItem)에서 한 켤레를 선점합니다. 창고 선반은 건드리지 않습니다.');
      },
      paid: () => {
        const s = sim.current;
        const i = boxIn('pad');
        if (i < 0) return;
        const n = s.shipped++;
        move(i, [padAt, [padAt[0], PAD.y, LIFT], [BIN_X - REST_X, BIN_Y, LIFT + n * BOX.h], binAt(n)], { kind: 'bin', n }, () => publish('결제 완료(PAID). 출고함으로 나갔습니다. 대기 중인 주문이 없어졌습니다.'));
      },
      failed: () => {
        const s = sim.current;
        const i = boxIn('pad');
        if (i < 0) return;
        if (s.drop === 'SETTLED' && modeRef.current === 'condition') {
          s.gateOpen = true;
          move(i, toShelfPath(i, padAt), { kind: 'shelf' }, () => { s.gateOpen = false; publish('반납이 끝난 뒤의 +1은 창고(Sku)로 보냅니다(방어 경로).'); });
          return;
        }
        const j = freeSlot() ?? 0;
        move(i, [padAt, [padAt[0], PAD.y, LIFT], [trayAt(j)[0], 0, LIFT], trayAt(j)], { kind: 'tray', slot: j }, () => publish(s.drop === 'SETTLED'
          ? '결제 실패로 +1이 트레이(DropItem)에 돌아왔습니다. 그런데 드롭은 이미 반납까지 끝났습니다. 아무도 살 수 없는 고아 재고입니다.'
          : '결제 실패(FAILED). 드롭 중이라 트레이(DropItem)로 돌아왔습니다. 다른 사람이 다시 살 수 있습니다.'));
      },
      close: () => { const s = sim.current; if (s.drop !== 'OPEN') return; setDrop('CLOSED'); publish('드롭 종료(CLOSED). 새 주문은 막혔습니다. 결제를 기다리는 주문이 있으면 그 결과부터 기다립니다.'); publish(); },
      settle: () => {
        const s = sim.current;
        if (s.drop !== 'CLOSED') return;
        if (modeRef.current === 'condition' && boxIn('pad') >= 0) { publish('결과를 기다리는 주문이 있어 게이트가 열리지 않습니다. 반납 조건: CLOSED이면서 PAYMENT_WAIT 0건.'); return; }
        s.gateOpen = true; setDrop('SETTLED');
        const inTray = s.locs.map((l, i) => (l.kind === 'tray' ? i : -1)).filter(i => i >= 0);
        publish(modeRef.current === 'time' ? '시각이 됐으니 반납합니다. 대기 중인 주문이 있든 없든 상관하지 않습니다.' : '조건을 만족해서 반납합니다. UPDATE … WHERE status = \'CLOSED\' → 1 row, 남은 수량은 창고로.');
        if (!inTray.length) { later(0.5, () => { s.gateOpen = false; publish(); }); return; }
        later(0.4, () => inTray.forEach((i, n) => move(i, toShelfPath(i, s.at[i]), { kind: 'shelf' }, () => { if (n === inTray.length - 1) { s.gateOpen = false; publish('반납 완료(SETTLED). 남은 수량이 창고로 돌아가 일반 판매에서 팔 수 있습니다.'); } })));
      },
      reset: () => { sim.current = fresh(); publish(START); },
    };
    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [svg]);

  const changeMode = (next: Mode) => { modeRef.current = next; setMode(next); api.current.reset?.(); };
  const { drop, pending, busy } = view;
  return <main className="hash-page drop-page" data-page-scroll>
    <header className="hash-header"><h1>Drop Allocation</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual drop-visual" aria-label="드롭 재고 할당과 반납 시뮬레이션">
      <div className="drop-options"><div className="structure-views race-mode" role="group" aria-label="반납 기준"><button aria-pressed={mode === 'condition'} onClick={() => changeMode('condition')}>조건 기준 반납</button><button aria-pressed={mode === 'time'} onClick={() => changeMode('time')}>시각 기준 반납</button></div></div>
      <dl className="race-state drop-state drop-state--five">
        <div><dt>Sku 재고</dt><dd>{view.sku}</dd></div>
        <div><dt>DropItem 재고</dt><dd>{view.dropItem}</dd></div>
        <div><dt>드롭 상태</dt><dd>{dropName[drop]}</dd></div>
        <div><dt>결제 대기</dt><dd>{pending ? 1 : 0}</dd></div>
        <div><dt>고아 재고</dt><dd className={view.orphan ? 'is-alert' : ''}>{view.orphan}</dd></div>
      </dl>
      <div ref={stage} className="iso drop-stage" data-theme={theme} />
      <div className="hash-status" role="status">{view.message}</div>
      <div className="drop-controls">
        <div>
          <button onClick={() => api.current.allocate?.()} disabled={drop !== 'READY' || busy}>드롭 준비</button>
          <button onClick={() => api.current.order?.()} disabled={drop !== 'OPEN' || pending || busy || view.dropItem === 0}>주문</button>
          <button onClick={() => api.current.paid?.()} disabled={!pending || busy}>결제 완료</button>
          <button onClick={() => api.current.failed?.()} disabled={!pending || busy}>결제 실패</button>
          <button onClick={() => api.current.close?.()} disabled={drop !== 'OPEN' || busy}>드롭 종료</button>
          <button onClick={() => api.current.settle?.()} disabled={drop !== 'CLOSED' || busy}>반납</button>
        </div>
        <div><button onClick={() => api.current.reset?.()}>초기화</button></div>
      </div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="재고 단위(SKU)" text="재고는 상품이 아니라 SKU(Stock Keeping Unit)마다 셉니다. 고객이 바꿔 신을 수 없는 것은 서로 다른 재고입니다. 덩크 로우 블랙 270과 화이트 270은 같은 상품이어도 다른 SKU입니다. 상품 하나에 재고 숫자 하나만 두면 블랙 270이 다 팔린 뒤에도 남은 숫자가 0보다 커서 주문이 통과하고, 창고에 없는 신발이 팔립니다." />
      <ConceptSection title="드롭 할당(Allocation)" text="드롭 직전에 Sku 재고 일부를 드롭 전용 재고(DropItem)로 옮겨 둡니다. 가격 같은 판매 조건도 DropItem이 가집니다. 옮기기는 한 트랜잭션에서 Sku를 줄이고 DropItem을 늘리는 일입니다. 이렇게 하면 일반 판매가 드롭 몫을 먹지 못하고, 드롭 품절은 DropItem.stock == 0 하나로 판단합니다. 드롭 주문과 일반 주문이 서로 다른 행을 잠그는 것도 장점입니다." comparison={{ headers: ['구분', '할당(옮겨 두기)', '예약 수량(Sku.reserved)'], rows: [['재고 위치', 'Sku와 DropItem 두 곳', 'Sku 한 곳'], ['일반 판매와 분리', '행이 달라 자연스럽게 분리', '계산식으로 분리'], ['대가', '남은 수량을 돌려줘야 함', '드롭 주문도 Sku 행을 잠금']] }} />
      <ConceptSection title="복구 방향" text="결제 실패나 만료로 돌아오는 한 켤레는 원래 나온 곳으로 돌아가야 합니다. 드롭 중이라면 DropItem입니다. 그래서 주문 항목(OrderItem)에 어느 재고에서 나왔는지(drop_item_id)를 기록해 둡니다." />
      <ConceptSection title="시각 기준 반납이 깨지는 곳" text="‘드롭 종료 10분 뒤에는 다 끝났겠지’ 하고 시각으로 반납하면, 늦게 도착한 결제 실패가 반납이 끝난 DropItem에 +1을 돌려줍니다. 드롭은 닫혔고 일반 판매에서도 보이지 않으니 아무도 살 수 없는 고아 재고가 됩니다. 위에서 ‘시각 기준 반납’을 고르고, 결제 대기 중에 드롭 종료 → 반납 → 결제 실패 순서로 눌러 보세요." />
      <ConceptSection title="조건 기준 반납과 상태(SETTLED)" text="반납은 ‘드롭이 닫혔고 결과를 기다리는 주문이 0건’일 때만 합니다. DropItem에 OPEN → CLOSED → SETTLED 상태를 두고, 반납 자체도 조건부 UPDATE로 한 번만 일어나게 합니다. 그래도 SETTLED 뒤에 +1이 들어오면 DropItem이 아니라 Sku로 보냅니다. 상태를 두고, 상태를 조건으로 바꾸는 방식입니다." ><pre className="drop-sql"><code>{`UPDATE drop_item SET status = 'SETTLED'\nWHERE id = ? AND status = 'CLOSED';`}</code></pre></ConceptSection>
    </section>
  </main>;
}
