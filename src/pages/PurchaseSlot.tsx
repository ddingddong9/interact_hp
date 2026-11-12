import { useEffect, useMemo, useRef, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import type { Point3 } from '../components/iso/iso-kit';
import { CARDS, HOME, PEG_DROP, REACH, figure, translate } from '../components/drop/slotFigure';
import { ease, reducedMotion, stepTween, useSiteTheme } from '../components/drop/common';
import type { Tween } from '../components/drop/common';
import '../components/iso/iso.css';
import '../styles/hash-table.css';
import '../styles/race-condition.css';
import '../styles/stock-reservation.css';

type Side = 'A' | 'B';
type Mode = 'together' | 'slot-first';
type Card = 'NONE' | 'PAYMENT_WAIT' | 'PAID' | 'FAILED';
type Car = { s: number; phase: 'home' | 'out' | 'back'; out: number };
type Peg = { attached: boolean; at: Point3; tween: Tween | null };
type Sim = { socket: Side | null; cards: Card[]; active: number | null; car: Record<Side, Car>; peg: Record<Side, Peg> };
type View = { socket: Side | null; cards: Card[]; active: number | null; busy: boolean; message: string };

const START = '회원 7이 드롭 1에서 살 수 있는 자리는 소켓 구멍 하나뿐입니다. 탭 두 개로 동시에 눌러 보세요.';
const OUT = 0.75;
const fresh = (): Sim => ({
  socket: null, cards: Array(CARDS).fill('NONE'), active: null,
  car: { A: { s: 0, phase: 'home', out: OUT }, B: { s: 0, phase: 'home', out: OUT } },
  peg: { A: { attached: true, at: [0, 0, 0], tween: null }, B: { attached: true, at: [0, 0, 0], tween: null } },
});
const sideName: Record<Side, string> = { A: '탭 A', B: '탭 B' };

export default function PurchaseSlot() {
  const theme = useSiteTheme();
  const svg = useMemo(() => figure(), []);
  const stage = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim>(fresh());
  const [mode, setMode] = useState<Mode>('together');
  const modeRef = useRef<Mode>('together');
  const [view, setView] = useState<View>({ socket: null, cards: Array(CARDS).fill('NONE'), active: null, busy: false, message: START });
  const api = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    root.innerHTML = svg;
    const car = { A: root.querySelector<SVGGElement>('[data-part="carA"]')!, B: root.querySelector<SVGGElement>('[data-part="carB"]')! };
    const peg = { A: root.querySelector<SVGGElement>('[data-part="pegA"]')!, B: root.querySelector<SVGGElement>('[data-part="pegB"]')! };
    const cards = Array.from({ length: CARDS }, (_, i) => root.querySelector<SVGGElement>(`[data-card="${i}"]`)!);
    let frame = 0, last = 0;
    const dur = (s: number) => (reducedMotion() ? 0.001 : s);
    const reach = (side: Side): Point3 => [REACH[side] - HOME[side], 0, 0];

    const publish = (message?: string) => {
      const s = sim.current;
      const busy = (['A', 'B'] as Side[]).some(x => s.car[x].phase !== 'home' || s.peg[x].tween);
      setView(old => ({ socket: s.socket, cards: [...s.cards], active: s.active, busy, message: message ?? old.message }));
    };
    const launch = (side: Side, out = OUT) => { const c = sim.current.car[side]; if (c.phase === 'home') { c.phase = 'out'; c.out = dur(out); } };
    const newCard = () => { const s = sim.current; const i = s.cards.indexOf('NONE'); if (i >= 0) { s.cards[i] = 'PAYMENT_WAIT'; s.active = i; } return i; };
    const seat = (side: Side) => {
      const p = sim.current.peg[side];
      p.attached = false;
      p.tween = { path: [reach(side), [reach(side)[0], 0, -PEG_DROP]], t: 0, dur: dur(0.35) };
    };
    const unseat = (side: Side, done?: () => void) => {
      const p = sim.current.peg[side];
      p.tween = { path: [[reach(side)[0], 0, -PEG_DROP], [reach(side)[0], 0, 6], [0, 0, 6], [0, 0, 0]], t: 0, dur: dur(1.1), done: () => { p.attached = true; done?.(); publish(); } };
    };
    const arrive = (side: Side) => {
      const s = sim.current;
      if (s.socket === null) {
        s.socket = side;
        seat(side);
        const i = newCard();
        publish(`${sideName[side]}의 INSERT가 먼저 들어갔습니다. 자리를 잡았고 주문 #${i + 1}이 생겼습니다(PAYMENT_WAIT).`);
      } else {
        publish(`${sideName[side]}도 같은 칸 (회원 7, 드롭 1)에 넣으려 했지만 이미 차 있습니다. 중복 키 에러 → "이미 구매하셨습니다". 조회 없이 DB가 거부했습니다.`);
      }
    };

    const draw = () => {
      const s = sim.current;
      (['A', 'B'] as Side[]).forEach(side => {
        const dx = (REACH[side] - HOME[side]) * ease(s.car[side].s);
        car[side].setAttribute('transform', translate([dx, 0, 0]));
        const p = s.peg[side];
        const at: Point3 = p.attached ? [dx, 0, 0] : p.at;
        peg[side].setAttribute('transform', translate(at));
      });
      s.cards.forEach((c, i) => cards[i].setAttribute('data-status', c));
    };
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
      last = now;
      const s = sim.current;
      (['A', 'B'] as Side[]).forEach(side => {
        const c = s.car[side];
        if (c.phase === 'out') { c.s = Math.min(1, c.s + dt / c.out); if (c.s >= 1) { c.phase = 'back'; arrive(side); } }
        else if (c.phase === 'back') { c.s = Math.max(0, c.s - dt / dur(OUT)); if (c.s <= 0) { c.phase = 'home'; publish(); } }
        const p = s.peg[side];
        if (p.tween) { const [at, next] = stepTween(p.tween, dt); if (at && !p.attached) p.at = at; p.tween = next; if (!next) publish(); }
      });
      draw();
      frame = requestAnimationFrame(tick);
    };

    api.current = {
      both: () => {
        const aFirst = Math.random() < 0.5;
        launch('A', aFirst ? OUT : OUT * 1.15);
        launch('B', aFirst ? OUT * 1.15 : OUT);
        publish('같은 회원이 두 탭에서 동시에 구매를 눌렀습니다. 두 요청이 같은 칸으로 갑니다.');
      },
      again: () => { launch('A'); publish('탭 A에서 다시 구매를 누릅니다.'); },
      paid: () => {
        const s = sim.current;
        if (s.active === null) return;
        s.cards[s.active] = 'PAID'; s.active = null;
        publish(s.cards.filter(c => c === 'PAID').length > 1
          ? '결제 완료(PAID). 이 회원의 PAID 주문이 두 건이 됐습니다. 1인 1켤레가 깨졌습니다. 자리를 먼저 지운 순서 때문입니다.'
          : '결제 완료(PAID). 자리는 그대로 둡니다. 구매가 확정된 사람의 자리입니다.');
      },
      fail: () => {
        const s = sim.current;
        if (s.active === null || !s.socket) return;
        const side = s.socket, i = s.active;
        if (modeRef.current === 'together') {
          s.cards[i] = 'FAILED'; s.active = null;
          publish(`한 트랜잭션: 주문 #${i + 1}을 FAILED로 바꾸는 데 성공한 뒤, 같은 트랜잭션에서 재고 +1과 자리 삭제를 합니다. 카드(기록)는 남고 핀(자리)만 빠집니다.`);
          unseat(side, () => { s.socket = null; publish('자리가 비었습니다. 이 사람은 다시 살 수 있습니다.'); });
          return;
        }
        publish('자리를 먼저 지웁니다(slot DELETE). 주문은 아직 PAYMENT_WAIT입니다.');
        unseat(side, () => {
          s.socket = null;
          s.cards[i] = 'PAID'; s.active = null;
          publish(`그 사이 결제가 먼저 끝났습니다(PAID). 만료 UPDATE는 0 rows라 물러납니다. 주문 #${i + 1}은 PAID인데 자리는 비어 있습니다. 다시 구매를 눌러 보세요.`);
        });
      },
      reset: () => { sim.current = fresh(); publish(START); },
    };
    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [svg]);

  const changeMode = (next: Mode) => { modeRef.current = next; setMode(next); api.current.reset?.(); };
  const paidCount = view.cards.filter(c => c === 'PAID').length;
  const used = view.cards.filter(c => c !== 'NONE').length;
  const record = view.cards.map((c, i) => (c === 'NONE' ? null : `#${i + 1} ${c === 'PAYMENT_WAIT' ? 'WAIT' : c}`)).filter(Boolean).join(' · ') || '—';
  const idle = !view.busy;
  return <main className="hash-page drop-page" data-page-scroll>
    <header className="hash-header"><h1>Purchase Slot</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual drop-visual" aria-label="1인 구매 제한 시뮬레이션">
      <div className="drop-options"><div className="structure-views race-mode" role="group" aria-label="만료 처리 순서"><button aria-pressed={mode === 'together'} onClick={() => changeMode('together')}>한 트랜잭션</button><button aria-pressed={mode === 'slot-first'} onClick={() => changeMode('slot-first')}>자리 먼저 삭제</button></div></div>
      <dl className="race-state drop-state">
        <div><dt>구매 자리</dt><dd>{view.socket ? sideName[view.socket] : '비어 있음'}</dd></div>
        <div className="drop-state__wide"><dt>주문 기록</dt><dd className="drop-small">{record}</dd></div>
        <div><dt>결제 완료</dt><dd className={paidCount > 1 ? 'is-alert' : ''}>{paidCount}켤레</dd></div>
      </dl>
      <div ref={stage} className="iso drop-stage" data-theme={theme} />
      <div className="hash-status" role="status">{view.message}</div>
      <div className="drop-controls">
        <div>
          <button onClick={() => api.current.both?.()} disabled={!idle || view.socket !== null || view.active !== null || used >= CARDS}>두 탭으로 동시 구매</button>
          <button onClick={() => api.current.paid?.()} disabled={!idle || view.active === null}>결제 완료</button>
          <button onClick={() => api.current.fail?.()} disabled={!idle || view.active === null}>{mode === 'together' ? '결제 실패' : '만료 처리'}</button>
          <button onClick={() => api.current.again?.()} disabled={!idle || view.active !== null || used >= CARDS}>다시 구매</button>
        </div>
        <div><button onClick={() => api.current.reset?.()}>초기화</button></div>
      </div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="조회 후 생성의 틈" text="‘이 회원이 이 드롭에서 산 적 있는지 조회하고, 없으면 주문을 만든다’는 방식은 확인과 변경 사이에 틈이 있습니다(check-then-act). 탭 두 개가 동시에 조회하면 둘 다 0건을 읽고 둘 다 주문을 만듭니다. 블랙 270과 화이트 270처럼 SKU가 다르면 재고 행에 락을 걸어도 두 요청이 같은 락에서 만나지 않습니다." />
      <ConceptSection title="유니크 제약(Unique Constraint)" text="조회하지 않고 INSERT를 바로 시도합니다. (회원, 드롭)에 유니크 제약을 걸면 두 요청이 같은 인덱스 칸에서 반드시 부딪히고, DB가 하나를 먼저 넣은 뒤 나머지를 중복 키 에러로 거부합니다. 그림의 소켓 구멍이 그 칸입니다. 거부된 쪽은 에러를 잡아 ‘이미 구매하셨습니다’로 응답합니다." />
      <ConceptSection title="기록과 자리를 나눈다" text="결제에 실패하거나 만료된 사람은 다시 살 수 있어야 합니다. 그런데 주문 테이블에 바로 유니크를 걸면 FAILED 주문이 자리를 계속 차지합니다. 주문 행을 지우면 CS 문의와 PG 대조에 필요한 기록이 사라집니다. 그래서 주문(기록)은 남기고, 구매 자리(drop_purchase_slot)를 따로 두어 그 행만 지웁니다. 지금 한 켤레를 잡고 있는 사람만 자리를 차지합니다." comparison={{ headers: ['주문 상태', '1인 제한에 포함', '자리'], rows: [['PAYMENT_WAIT', '포함', '유지'], ['PAID', '포함', '유지'], ['FAILED · EXPIRED', '제외', '삭제']] }} />
      <ConceptSection title="한 트랜잭션, 문지기는 맨 앞" text="상태 변경, 재고 +1, 자리 삭제를 한 트랜잭션으로 묶고 조건부 UPDATE를 맨 앞에 둡니다. 상태를 바꾸는 데 성공한 쪽만 뒷정리를 합니다. 자리를 먼저 지우면, 그 사이 결제가 이겼을 때 PAID 주문은 있는데 자리는 비어 있게 됩니다. 규칙을 지키는 자리와 기록이 서로 다른 말을 하고, 다시 구매하면 한 사람이 두 켤레를 갖습니다. 위에서 ‘자리 먼저 삭제’를 골라 확인해 보세요." ><pre className="drop-sql"><code>{`BEGIN;\nUPDATE orders SET status = 'EXPIRED'\n WHERE id = ? AND status = 'PAYMENT_WAIT';  -- 0 rows면 ROLLBACK\nUPDATE drop_item SET stock = stock + 1 WHERE id = ?;\nDELETE FROM drop_purchase_slot WHERE order_id = ?;\nCOMMIT;`}</code></pre></ConceptSection>
      <ConceptSection title="다중 계정" advanced text="계정을 여러 개 만들면 (회원, 드롭) 유니크로는 막을 수 없습니다. 같은 사람의 기준을 본인인증 명의로 바꾸면 같은 장치를 그대로 쓸 수 있습니다. 다만 강하게 막을수록 정상 고객도 함께 걸리므로, 배송지나 결제 수단 같은 신호는 정책으로 다룹니다." comparison={{ headers: ['기준', '막는 것', '못 막는 것 · 부작용'], rows: [['계정', '더블클릭, 탭 두 개', '다중 계정'], ['명의', '한 사람의 다중 계정', '명의 빌리기, 인증 이탈'], ['배송지', '한 주소로 모으기', '같은 집 가족의 정상 구매']] }} />
    </section>
  </main>;
}
