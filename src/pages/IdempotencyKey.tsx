import { useEffect, useMemo, useRef, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import { COIN, INDEX, PRESS, SHUTTLE, STATUS, cardLabel, figure, translate } from '../components/drop/idempotencyFigure';
import { ease, reducedMotion, useSiteTheme } from '../components/drop/common';
import '../components/iso/iso.css';
import '../styles/hash-table.css';
import '../styles/race-condition.css';
import '../styles/stock-reservation.css';

type Status = 'PAYMENT_WAIT' | 'PAYING' | 'PAID' | 'FAILED';
type Lane = { s: number; phase: 'home' | 'out' | 'back'; key: string | null; lose: boolean; reply: boolean; charged: boolean; out: number };
type Sim = { status: Status; orderNo: number; charges: number; stored: string[]; lanes: Lane[]; press: number; knob: number; lost: boolean };
type View = { status: Status; orderNo: number; charges: number; stored: string[]; busy: boolean; lost: boolean; message: string };

const KEYS = ['205', '206', '207'];
const stopOf: Record<Status, number> = { PAYMENT_WAIT: 0, PAYING: 1, PAID: 2, FAILED: 3 };
const START = '주문 #205가 결제를 기다립니다(PAYMENT_WAIT). 결제 버튼을 누르면 셔틀이 PG로 승인 요청을 싣고 갑니다.';
const lane = (): Lane => ({ s: 0, phase: 'home', key: null, lose: false, reply: false, charged: false, out: 0.8 });
const fresh = (): Sim => ({ status: 'PAYMENT_WAIT', orderNo: 0, charges: 0, stored: [], lanes: [lane(), lane()], press: 1, knob: 0, lost: false });

export default function IdempotencyKey() {
  const theme = useSiteTheme();
  const svg = useMemo(() => figure(), []);
  const stage = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim>(fresh());
  const [paying, setPaying] = useState(true);
  const [useKey, setUseKey] = useState(true);
  const opts = useRef({ paying: true, useKey: true });
  const [view, setView] = useState<View>({ status: 'PAYMENT_WAIT', orderNo: 0, charges: 0, stored: [], busy: false, lost: false, message: START });
  const api = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    root.innerHTML = svg;
    const q = (sel: string) => root.querySelector<SVGGElement>(sel)!;
    const knob = q('[data-part="knob"]'), head = q('[data-part="head"]');
    const shuttles = [q('[data-part="sh0"]'), q('[data-part="sh1"]')];
    const replies = [q('[data-part="reply0"]'), q('[data-part="reply1"]')];
    const labels = [q('[data-part="label0"]'), q('[data-part="label1"]')];
    const coins = Array.from({ length: COIN.max }, (_, i) => q(`[data-coin="${i}"]`));
    const keyCards = Array.from({ length: INDEX.max }, (_, i) => q(`[data-key="${i}"]`));
    let frame = 0, last = 0;
    const dur = (s: number) => (reducedMotion() ? 0.001 : s);

    const publish = (message?: string) => {
      const s = sim.current;
      setView(old => ({ status: s.status, orderNo: s.orderNo, charges: s.charges, stored: [...s.stored], busy: s.lanes.some(l => l.phase !== 'home'), lost: s.lost, message: message ?? old.message }));
    };
    const key = () => KEYS[sim.current.orderNo];
    const label = (i: number) => { const k = sim.current.lanes[i].key; labels[i].innerHTML = cardLabel(i, k ?? '—'); };

    const arrive = (i: number) => {
      const s = sim.current, l = s.lanes[i];
      if (l.key && s.stored.includes(l.key)) {
        l.reply = true;
        publish(`PG가 키 ${l.key}를 이미 압니다. 다시 찍지 않고 저장해 둔 결과(승인)를 돌려줍니다. 카드 결제는 그대로 ${s.charges}번입니다.`);
        return;
      }
      s.charges += 1; l.charged = true; l.reply = true; s.press = 0;
      if (l.key) s.stored.push(l.key);
      publish(l.key ? `처음 보는 키 ${l.key}. PG가 실제로 결제하고(동전 하나), 결과를 키와 함께 보관합니다.` : '키가 없으니 PG는 이 요청이 처음인지 알 수 없습니다. 그대로 결제합니다(동전 하나).');
    };
    const back = (i: number) => {
      const s = sim.current, l = s.lanes[i];
      if (l.lose) {
        l.reply = false; s.lost = true;
        publish(`응답이 오다가 끊겼습니다. 셔틀은 빈손으로 돌아왔고 서버는 결과를 모릅니다. 주문은 ${s.status} 그대로입니다. 실패가 아니라 ‘모름’입니다.`);
        return;
      }
      const from: Status = opts.current.paying ? 'PAYING' : 'PAYMENT_WAIT';
      if (s.status === from) {
        s.status = 'PAID'; s.lost = false;
        publish(s.orderNo > 0 && s.charges > 1
          ? `→ 1 row, 결제 완료. 그런데 카드 결제는 ${s.charges}번입니다. 끊겼던 첫 결제도 사실 승인돼 있었습니다. 신발은 한 켤레인데 돈은 두 번 빠졌습니다.`
          : `UPDATE … SET status = 'PAID' WHERE status = '${from}' → 1 row. 결제 완료.`);
      } else if (l.charged && s.status === 'PAID') {
        publish('이 응답의 UPDATE는 0 rows입니다. 이미 PAID인데 카드에서는 한 번 더 빠졌습니다. 이 결제는 취소해야 합니다.');
      } else {
        publish('UPDATE는 0 rows. 이미 처리된 주문이라 아무것도 바꾸지 않습니다.');
      }
      l.reply = false;
    };
    const send = (i: number, { retry = false, lose = false } = {}) => {
      const s = sim.current, l = s.lanes[i];
      if (l.phase !== 'home') return false;
      if (!retry && opts.current.paying) {
        if (s.status !== 'PAYMENT_WAIT') { publish(`두 번째 클릭: UPDATE … SET status = 'PAYING' WHERE status = 'PAYMENT_WAIT' → 0 rows. 이미 결제 중이라 PG를 부르지 않습니다.`); return false; }
        s.status = 'PAYING';
      }
      Object.assign(l, { phase: 'out', key: opts.current.useKey ? key() : null, lose, reply: false, charged: false, out: dur(0.8) });
      label(i);
      return true;
    };

    const draw = () => {
      const s = sim.current;
      s.lanes.forEach((l, i) => {
        shuttles[i].setAttribute('transform', translate([(SHUTTLE.pg - SHUTTLE.home) * ease(l.s), 0, 0]));
        replies[i].setAttribute('data-on', String(l.reply && l.phase === 'back'));
      });
      const bump = s.press < 1 ? Math.sin(Math.PI * s.press) : 0;
      head.setAttribute('transform', translate([0, 0, -PRESS.stroke * bump * 0.5]));
      const x = STATUS.stops[0] + (STATUS.stops[1] - STATUS.stops[0]) * s.knob;
      knob.setAttribute('transform', translate([x - STATUS.stops[0], 0, 0]));
      coins.forEach((c, i) => c.setAttribute('data-on', String(i < s.charges)));
      keyCards.forEach((c, i) => c.setAttribute('data-on', String(s.stored.includes(KEYS[i]))));
    };
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
      last = now;
      const s = sim.current;
      s.lanes.forEach((l, i) => {
        if (l.phase === 'out') { l.s = Math.min(1, l.s + dt / l.out); if (l.s >= 1) { l.phase = 'back'; arrive(i); } }
        else if (l.phase === 'back') { l.s = Math.max(0, l.s - dt / dur(0.8)); if (l.s <= 0) { l.phase = 'home'; back(i); } }
      });
      if (s.press < 1) s.press = Math.min(1, s.press + dt / dur(0.5));
      s.knob += (stopOf[s.status] - s.knob) * (1 - Math.exp(-dt / dur(0.18)));
      draw();
      frame = requestAnimationFrame(tick);
    };

    api.current = {
      pay: () => { if (send(0)) publish(opts.current.paying ? 'UPDATE … SET status = \'PAYING\' WHERE status = \'PAYMENT_WAIT\' → 1 row. PG를 부르기 전에 상태부터 바꿨습니다.' : '바로 PG에 승인을 요청합니다.'); },
      double: () => {
        const first = send(0);
        window.setTimeout(() => { send(1); publish(); }, reducedMotion() ? 0 : 120);
        if (first) publish('결제 버튼을 두 번 눌렀습니다.');
      },
      lose: () => { if (send(0, { lose: true })) publish('결제 요청을 보냅니다. 이번엔 PG의 응답이 돌아오는 길에 끊깁니다.'); },
      retry: () => { if (send(0, { retry: true })) publish(`같은 키 ${opts.current.useKey ? key() : '(없음)'}로 PG에 다시 묻습니다.`); },
      fresh: () => {
        const s = sim.current;
        if (s.orderNo >= KEYS.length - 1) return;
        s.status = 'FAILED';
        publish('응답이 끊긴 것을 실패로 처리했습니다(FAILED). 재고 +1, 자리 삭제. 사용자는 새 주문으로 다시 결제합니다.');
        window.setTimeout(() => {
          s.orderNo += 1; s.status = 'PAYMENT_WAIT'; s.lost = false;
          if (send(0)) publish(`새 주문 #${key()}, 새 키 ${opts.current.useKey ? key() : ''}. PG 입장에서는 처음 보는 요청입니다.`);
        }, reducedMotion() ? 0 : 900);
      },
      reset: () => { sim.current = fresh(); labels.forEach((_, i) => { labels[i].innerHTML = ''; }); publish(START); },
    };
    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [svg]);

  const toggle = (name: 'paying' | 'useKey', value: boolean) => {
    opts.current[name] = value;
    if (name === 'paying') setPaying(value); else setUseKey(value);
    api.current.reset?.();
  };
  const idle = !view.busy;
  const waiting = view.status === 'PAYMENT_WAIT';
  const unknown = view.lost && (view.status === 'PAYING' || view.status === 'PAYMENT_WAIT');
  return <main className="hash-page drop-page" data-page-scroll>
    <header className="hash-header"><h1>Idempotency Key</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual drop-visual" aria-label="결제 멱등성 시뮬레이션">
      <div className="drop-options">
        <div className="structure-views race-mode" role="group" aria-label="보호 장치">
          <button aria-pressed={paying} onClick={() => toggle('paying', !paying)}>PAYING 단계</button>
          <button aria-pressed={useKey} onClick={() => toggle('useKey', !useKey)}>멱등성 키</button>
        </div>
      </div>
      <dl className="race-state drop-state">
        <div><dt>주문</dt><dd className="drop-small">#{KEYS[view.orderNo]} {view.status}</dd></div>
        <div><dt>카드 결제</dt><dd className={view.charges > 1 ? 'is-alert' : ''}>{view.charges}번</dd></div>
        <div><dt>PG 키 보관함</dt><dd className="drop-small">{view.stored.length ? view.stored.join(' · ') : '—'}</dd></div>
        <div><dt>결과</dt><dd className="drop-small">{unknown ? '모름' : view.status === 'PAID' ? '확정' : '—'}</dd></div>
      </dl>
      <div ref={stage} className="iso drop-stage" data-theme={theme} />
      <div className="hash-status" role="status">{view.message}</div>
      <div className="drop-controls">
        <div>
          <button onClick={() => api.current.pay?.()} disabled={!idle || !waiting || view.lost}>결제</button>
          <button onClick={() => api.current.double?.()} disabled={!idle || !waiting || view.lost}>두 번 클릭</button>
          <button onClick={() => api.current.lose?.()} disabled={!idle || !waiting || view.lost}>응답 끊김</button>
          <button onClick={() => api.current.retry?.()} disabled={!idle || !unknown}>같은 키로 다시 묻기</button>
          <button onClick={() => api.current.fresh?.()} disabled={!idle || !unknown || view.orderNo >= KEYS.length - 1}>실패로 보고 새 주문</button>
        </div>
        <div><button onClick={() => api.current.reset?.()}>초기화</button></div>
      </div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="조건부 UPDATE가 지키지 못하는 곳" text="주문 상태를 조건부 UPDATE로 바꾸면 두 번 눌러도 PAID는 한 번만 됩니다. 하지만 PG 승인은 DB 바깥에서 일어납니다. 두 요청이 UPDATE에 도착했을 때는 이미 둘 다 카드에서 돈을 빼 간 뒤입니다. 위에서 두 보호 장치를 모두 끄고 ‘두 번 클릭’을 눌러 보세요." />
      <ConceptSection title="응답이 끊기면" text="PG는 승인했는데 응답이 오는 길에 끊기면, 서버는 결과를 모릅니다. 이때 다시 결제를 보내면 두 번째 결제는 정상 성공처럼 보이고, 첫 번째 결제는 서버가 존재조차 모르는 결제가 됩니다. 더블클릭은 0 rows라는 흔적이라도 남지만, 응답 유실은 흔적이 없습니다." />
      <ConceptSection title="멱등성 키(Idempotency Key)" text="요청마다 이름표를 붙여 보냅니다. PG는 처음 보는 키면 실제로 결제하고 결과를 키와 함께 저장합니다. 이미 본 키면 다시 결제하지 않고 저장된 결과를 돌려줍니다. 몇 번을 다시 보내도 결과가 한 번 보낸 것과 같아지는 성질이 멱등성입니다. 같은 결제의 재시도는 같은 키, 다른 결제는 다른 키여야 합니다. 실패한 주문을 다시 쓰지 않고 새 주문을 만드는 설계라면 주문 번호를 키로 써도 됩니다. 실제 PG마다 이 기능의 이름과 동작은 조금씩 다릅니다." />
      <ConceptSection title="실패와 모름은 다르다" text="응답이 없다는 것은 실패가 아니라 결과를 모르는 것입니다. 이를 실패로 처리하고 새 주문으로 다시 결제하면 키도 새것이라 PG는 처음 보는 요청으로 결제합니다. 그런데 첫 결제도 사실은 승인돼 있었으니 카드에서는 두 번 빠집니다. 결과를 모를 때는 확정하지 않고, 같은 키로 다시 묻거나 PG에 결제 상태를 조회합니다." comparison={{ headers: ['PG 응답', '의미', '처리'], rows: [['거절', '실패 확정', 'FAILED · 재고 +1 · 새 주문 허용'], ['승인', '성공 확정', 'PAID'], ['없음', '모름', '확정하지 않음 · 같은 키로 다시 묻기']] }} />
      <ConceptSection title="PG를 부르기 전에 PAYING" text="PG를 부르기 직전에 PAYMENT_WAIT → PAYING을 조건부 UPDATE로 바꿉니다. 두 번째 클릭은 0 rows가 나와 PG를 아예 부르지 않습니다. 응답이 없으면 PAYING에 머물고, 확인 작업이 같은 키로 결과를 물어 PAID나 FAILED로 확정합니다. 만료 스케줄러는 PAYMENT_WAIT만 건드리므로, 결과를 모르는 주문의 재고를 돌려주지 않습니다." ><pre className="drop-sql"><code>{`UPDATE orders SET status = 'PAYING'\nWHERE id = ? AND status = 'PAYMENT_WAIT';\n-- 1 row  → PG 호출\n-- 0 rows → 이미 누가 결제 중이거나 끝났다`}</code></pre></ConceptSection>
    </section>
  </main>;
}
