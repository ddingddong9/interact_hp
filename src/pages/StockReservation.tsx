import { useEffect, useMemo, useRef, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import type { Point3 } from '../components/iso/iso-kit';
import {
  BIN_FLOOR, BIN_X, BOX, HOLD_X, HOLD_Z, PAY_HOME, PAY_REACH, REST_X, SCHED_HOME, SCHED_REACH, SHELF_Z,
  figure, needleAt, translate,
} from '../components/drop/reservationFigure';
import { along, ease, useSiteTheme } from '../components/drop/common';
import '../components/iso/iso.css';
import '../styles/hash-table.css';
import '../styles/stock-reservation.css';

type Status = 'IDLE' | 'MOVING' | 'PAYMENT_WAIT' | 'PAID' | 'EXPIRED';
type Arm = 'pay' | 'sched';
type Tween = { path: Point3[]; t: number; dur: number; done?: () => void };
type ArmState = { s: number; phase: 'home' | 'out' | 'back'; out: number; back: number };
type Sim = {
  onShelf: boolean[];
  shipped: number;
  status: Status;
  box: number | null;
  elapsed: number;
  token: 'cup' | Arm | 'none';
  tokenAlpha: number;
  scheduled: boolean;
  boxes: { at: Point3; tween: Tween | null }[];
  arms: Record<Arm, ArmState>;
};
type View = { stock: number; shipped: number; status: Status; message: string; busy: boolean; payHome: boolean };

const WAIT = 8; // 결제 대기 10분을 8초로 줄여 보여 준다(가정).
const OUT = 0.7;
const SHELF_EXIT = -64 - REST_X;
const shelfAt = (i: number): Point3 => [0, 0, SHELF_Z[i]];
const holdAt: Point3 = [HOLD_X - REST_X, 0, HOLD_Z];
const binAt = (n: number): Point3 => [BIN_X - REST_X, 0, BIN_FLOOR + n * BOX.h];
const statusName: Record<Status, string> = { IDLE: '주문 없음', MOVING: '선점 중', PAYMENT_WAIT: 'PAYMENT_WAIT', PAID: 'PAID', EXPIRED: 'EXPIRED' };

const fresh = (): Sim => ({
  onShelf: [true, true, true], shipped: 0, status: 'IDLE', box: null, elapsed: 0, token: 'none', tokenAlpha: 0, scheduled: false,
  boxes: SHELF_Z.map((_, i) => ({ at: shelfAt(i), tween: null })),
  arms: { pay: { s: 0, phase: 'home', out: OUT, back: OUT }, sched: { s: 0, phase: 'home', out: OUT, back: OUT } },
});

export default function StockReservation() {
  const theme = useSiteTheme();
  const svg = useMemo(() => figure(), []);
  const stage = useRef<HTMLDivElement>(null);
  const remaining = useRef<HTMLElement>(null);
  const sim = useRef<Sim>(fresh());
  const [view, setView] = useState<View>({ stock: 3, shipped: 0, status: 'IDLE', message: '선반에 3켤레가 있습니다. 주문하면 한 켤레가 보류 받침으로 나와 결제를 기다립니다.', busy: false, payHome: true });
  const api = useRef<{ order: () => void; pay: () => void; race: () => void; skip: () => void; reset: () => void } | null>(null);

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    root.innerHTML = svg;
    const boxEls = SHELF_Z.map((_, i) => root.querySelector<SVGGElement>(`[data-box="${i}"]`)!);
    const pay = root.querySelector<SVGGElement>('[data-part="pay"]')!;
    const sched = root.querySelector<SVGGElement>('[data-part="sched"]')!;
    const token = root.querySelector<SVGGElement>('[data-part="token"]')!;
    const needle = root.querySelector<SVGPathElement>('[data-part="needle"]')!;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, last = 0;

    const publish = (message?: string) => {
      const s = sim.current;
      const moving = s.boxes.some(b => b.tween) || s.arms.pay.phase !== 'home' || s.arms.sched.phase !== 'home';
      setView(old => ({ stock: s.onShelf.filter(Boolean).length, shipped: s.shipped, status: s.status, message: message ?? old.message, busy: moving, payHome: s.arms.pay.phase === 'home' }));
    };
    const moveBox = (i: number, path: Point3[], done?: () => void) => {
      sim.current.boxes[i].tween = { path, t: 0, dur: still.matches ? 0.001 : 1.2, done };
    };
    const launch = (arm: Arm, out = OUT) => {
      const a = sim.current.arms[arm];
      if (a.phase !== 'home') return;
      a.phase = 'out'; a.out = still.matches ? 0.001 : out; a.back = still.matches ? 0.001 : OUT;
    };
    const resolve = (arm: Arm) => {
      const s = sim.current;
      if (s.status === 'PAYMENT_WAIT' && s.token === 'cup') {
        s.token = arm;
        s.status = arm === 'pay' ? 'PAID' : 'EXPIRED';
        publish(arm === 'pay'
          ? '결제 팔이 먼저 토큰을 집었습니다. UPDATE … WHERE status = \'PAYMENT_WAIT\' → 1 row. 주문은 PAID가 되고, 재고는 이미 줄어 있으니 그대로입니다.'
          : '결제 대기 시간이 지나 만료 팔이 먼저 토큰을 집었습니다. → 1 row. 주문은 EXPIRED가 되고, 상자는 선반으로 돌아갑니다(재고 +1).');
      } else {
        const other = arm === 'pay' ? '만료' : '결제';
        publish(`${arm === 'pay' ? '결제' : '만료'} 팔이 도착했지만 받침이 비어 있습니다. ${other} 쪽이 이미 상태를 바꿨습니다. → 0 rows. 재고를 건드리지 않고 물러납니다.${arm === 'pay' ? ' (결제는 취소 처리)' : ''}`);
      }
    };
    const finish = (arm: Arm) => {
      const s = sim.current;
      if (s.token !== arm || s.box === null) { publish(); return; }
      const i = s.box;
      s.tokenAlpha = 0; s.token = 'none';
      if (s.status === 'PAID') {
        const n = s.shipped;
        moveBox(i, [holdAt, binAt(n)], () => { s.shipped += 1; s.box = null; publish('출고함으로 나갔습니다. 결제가 끝나도 재고 숫자는 바뀌지 않습니다. 이미 주문할 때 줄였기 때문입니다.'); });
      } else {
        moveBox(i, [holdAt, [SHELF_EXIT, 0, SHELF_Z[i]], shelfAt(i)], () => { s.onShelf[i] = true; s.box = null; publish('만료된 상자가 선반으로 돌아왔습니다. 만료는 판매가 아닙니다. 다시 살 수 있는 재고입니다.'); });
      }
      publish();
    };

    const draw = () => {
      const s = sim.current;
      s.boxes.forEach((b, i) => boxEls[i].setAttribute('transform', translate(b.at)));
      const payX = PAY_HOME + (PAY_REACH - PAY_HOME) * ease(s.arms.pay.s);
      const schedX = SCHED_HOME + (SCHED_REACH - SCHED_HOME) * ease(s.arms.sched.s);
      pay.setAttribute('transform', translate([payX - PAY_HOME, 0, 0]));
      sched.setAttribute('transform', translate([schedX - SCHED_HOME, 0, 0]));
      const tokenX = s.token === 'pay' ? payX - PAY_REACH : s.token === 'sched' ? schedX - SCHED_REACH : 0;
      token.setAttribute('transform', translate([tokenX, 0, s.token === 'pay' || s.token === 'sched' ? 1.5 : 0]));
      token.setAttribute('opacity', s.tokenAlpha.toFixed(2));
      const share = s.status === 'PAYMENT_WAIT' || s.status === 'PAID' || s.status === 'EXPIRED' ? Math.min(1, s.elapsed / WAIT) : 0;
      needle.setAttribute('d', needleAt(share));
      if (remaining.current) remaining.current.textContent = s.status === 'PAYMENT_WAIT' ? `${Math.max(0, WAIT - s.elapsed).toFixed(1)}초` : '—';
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
      last = now;
      const s = sim.current;
      for (const b of s.boxes) {
        if (!b.tween) continue;
        b.tween.t += dt / b.tween.dur;
        b.at = along(b.tween.path, b.tween.t);
        if (b.tween.t >= 1) { const done = b.tween.done; b.tween = null; done?.(); }
      }
      for (const arm of ['pay', 'sched'] as Arm[]) {
        const a = s.arms[arm];
        if (a.phase === 'out') { a.s = Math.min(1, a.s + dt / a.out); if (a.s >= 1) { a.phase = 'back'; resolve(arm); } }
        else if (a.phase === 'back') { a.s = Math.max(0, a.s - dt / a.back); if (a.s <= 0) { a.phase = 'home'; finish(arm); } }
      }
      if (s.status === 'PAYMENT_WAIT') {
        s.elapsed += dt;
        if (s.elapsed >= WAIT && !s.scheduled) { s.scheduled = true; launch('sched'); publish('결제 대기 시간이 끝났습니다. 스케줄러가 만료 팔을 보냅니다.'); }
      }
      if (s.token === 'cup' && s.tokenAlpha < 1) s.tokenAlpha = Math.min(1, s.tokenAlpha + dt / (still.matches ? 0.001 : 0.4));
      draw();
      frame = requestAnimationFrame(tick);
    };

    api.current = {
      order: () => {
        const s = sim.current;
        if (s.box !== null) return;
        const i = [2, 1, 0].find(n => s.onShelf[n]);
        if (i === undefined) { publish('선반이 비었습니다. 재고 0 — 더 이상 선점할 수 없으니 "품절"입니다.'); return; }
        s.onShelf[i] = false; s.box = i; s.status = 'MOVING'; s.elapsed = 0; s.scheduled = false;
        publish('주문이 들어왔습니다. 결제 전이지만 지금 재고를 줄입니다(선점). 다른 사람은 이 상자를 살 수 없습니다.');
        moveBox(i, [shelfAt(i), [SHELF_EXIT, 0, SHELF_Z[i]], holdAt], () => {
          s.status = 'PAYMENT_WAIT'; s.token = 'cup'; s.tokenAlpha = 0;
          publish(`결제를 기다립니다. 서버가 기억하는 만료 시각(expires_at)까지 ${WAIT}초 남았습니다. 토큰은 이 주문의 상태(status) 한 칸입니다.`);
        });
      },
      pay: () => { if (sim.current.status === 'PAYMENT_WAIT') { launch('pay'); publish('결제 팔을 보냅니다.'); } },
      race: () => {
        const s = sim.current;
        if (s.status !== 'PAYMENT_WAIT') return;
        s.elapsed = WAIT; s.scheduled = true;
        const payFirst = Math.random() < 0.5;
        launch('pay', payFirst ? OUT : OUT * 1.12);
        launch('sched', payFirst ? OUT * 1.12 : OUT);
        publish('결제와 만료가 거의 동시에 도착합니다. 누가 먼저일지는 정해져 있지 않습니다. 그래도 토큰을 집는 쪽은 하나뿐입니다.');
      },
      skip: () => { const s = sim.current; if (s.status === 'PAYMENT_WAIT') s.elapsed = Math.max(s.elapsed, WAIT - 0.8); },
      reset: () => { sim.current = fresh(); publish('선반에 3켤레가 있습니다. 주문하면 한 켤레가 보류 받침으로 나와 결제를 기다립니다.'); },
    };
    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [svg]);

  const waiting = view.status === 'PAYMENT_WAIT';
  return <main className="hash-page drop-page" data-page-scroll>
    <header className="hash-header"><h1>Stock Reservation</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual drop-visual" aria-label="재고 선점과 결제 대기 만료 시뮬레이션">
      <dl className="race-state drop-state">
        <div><dt>재고</dt><dd>{view.stock} / 3</dd></div>
        <div><dt>주문 상태</dt><dd>{statusName[view.status]}</dd></div>
        <div><dt>남은 시간</dt><dd ref={remaining}>—</dd></div>
        <div><dt>출고</dt><dd>{view.shipped}</dd></div>
      </dl>
      <div ref={stage} className="iso drop-stage" data-theme={theme} />
      <div className="hash-status" role="status">{view.message}</div>
      <div className="drop-controls">
        <div>
          <button onClick={() => api.current?.order()} disabled={view.status === 'MOVING' || waiting || view.busy}>주문</button>
          <button onClick={() => api.current?.pay()} disabled={!waiting || !view.payHome}>결제</button>
          <button onClick={() => api.current?.skip()} disabled={!waiting}>시간 빨리 감기</button>
          <button onClick={() => api.current?.race()} disabled={!waiting || !view.payHome}>동시에 도착</button>
        </div>
        <div><button onClick={() => api.current?.reset()}>초기화</button></div>
      </div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="선점(Reservation)" text="한정판 드롭에서는 결제가 끝날 때가 아니라 주문하는 순간 재고를 줄입니다. 결제할 때 줄이면 재고보다 훨씬 많은 사람이 결제까지 마친 뒤에야 품절을 알게 되고, 대부분의 결제를 다시 취소해야 합니다. 주문 시점에 한 켤레를 잡아 두면 결제창에 들어간 사람은 이미 자기 몫이 있는 사람입니다." comparison={{ headers: ['구분', '결제할 때 차감', '주문할 때 선점'], rows: [['품절을 아는 시점', '결제를 마친 뒤', '주문 버튼을 누를 때'], ['초과 결제', '많이 생김 · 취소 필요', '생기지 않음'], ['대가', '—', '결제를 안 하면 재고가 묶임']] }} />
      <ConceptSection title="결제 대기 시간과 만료(Expiry)" text="선점한 사람이 결제를 하지 않으면 그 재고는 아무도 살 수 없게 묶입니다. 그래서 결제 대기 시간을 두고, 지나면 재고를 돌려줍니다. 시간은 정책이라 설정값으로 둡니다. 너무 짧으면 실제 구매자를 놓치고, 너무 길면 재고가 오래 묶입니다. 만료 여부는 화면의 타이머가 아니라 서버가 저장한 만료 시각(expires_at)으로 판단합니다. 화면 타이머는 보여 주기용입니다." />
      <ConceptSection title="만료는 판매가 아니다" text="만료(EXPIRED)는 결제되지 않은 주문입니다. 상자는 선반으로 돌아가고 재고는 다시 늘어납니다. 결제 완료(PAID)는 재고를 그대로 둡니다. 주문할 때 이미 줄였기 때문입니다. 주문 하나는 PAYMENT_WAIT에서 PAID, FAILED, EXPIRED 중 정확히 한 곳으로만 갑니다." />
      <ConceptSection title="조건부 UPDATE(Conditional Update)" text="결제와 만료가 거의 동시에 일어나면, 먼저 상태를 확인하고 나중에 바꾸는 방식은 둘 다 통과시킬 수 있습니다. 그래서 확인과 변경을 한 문장으로 합칩니다. 그림의 토큰이 그 한 칸입니다. 먼저 집은 쪽은 1 row로 이겨서 다음 일을 하고, 늦게 온 쪽은 0 rows를 받고 아무것도 건드리지 않습니다." comparison={{ headers: ['결과', '의미', '할 일'], rows: [['1 row', '내가 상태를 바꿨다', '만료라면 재고 +1, 결제라면 PAID 확정'], ['0 rows', '다른 쪽이 먼저 바꿨다', '재고는 건드리지 않음 · 결제 쪽이면 결제 취소']] }}><pre className="drop-sql"><code>{`UPDATE orders SET status = 'EXPIRED'\nWHERE id = ? AND status = 'PAYMENT_WAIT';`}</code></pre></ConceptSection>
      <ConceptSection title="만료를 찾아내는 방법" advanced text="만료 시각이 지난 주문을 일정 간격으로 조회해 정리하는 스케줄러(Scheduler)를 둡니다. status와 expires_at에 인덱스를 걸어 PAYMENT_WAIT이면서 만료 시각이 지난 주문만 빠르게 찾습니다. 결제 요청이 들어올 때도 만료 여부를 다시 확인합니다. 스케줄러가 늦게 돌더라도 결제 쪽 조건부 UPDATE가 막아 주기 때문에, 두 경로가 함께 있어도 상태는 한 번만 바뀝니다." />
    </section>
  </main>;
}
