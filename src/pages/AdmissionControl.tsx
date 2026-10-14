import { useEffect, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import CenteredNodeText from '../components/CenteredNodeText';
import { admitTick, enqueueVisitor, finishVisitor, initialAdmission } from '../components/admission/model';
import type { AdmissionChange } from '../components/admission/model';
import '../styles/hash-table.css';
import '../styles/admission-control.css';

export default function AdmissionControl() {
  const [state, setState] = useState(initialAdmission);
  const [rate, setRate] = useState(2);
  const [capacity, setCapacity] = useState(3);
  const [user, setUser] = useState('F');
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('초당 2명씩, 최대 3명이 동시에 활성 상태가 됩니다.');
  const [pending, setPending] = useState<AdmissionChange | null>(null);
  const [leaving, setLeaving] = useState<string[]>([]);
  const [arriving, setArriving] = useState<string[]>([]);
  const lanes = [state.waiting, state.active, state.finished];
  const width = Math.max(840, 170 + Math.max(...lanes.map(lane => lane.length), capacity) * 90);
  function apply(change: AdmissionChange) {
    const oldRows = [state.waiting, state.active, state.finished];
    const newRows = [change.state.waiting, change.state.active, change.state.finished];
    const moved = oldRows.flatMap((row, i) => row.filter(visitor => !newRows[i].some(next => next.id === visitor.id)).map(visitor => visitor.id));
    const entered = newRows.flatMap((row, i) => row.filter(visitor => !oldRows[i].some(old => old.id === visitor.id)).map(visitor => visitor.id));
    setLeaving(moved); setArriving(entered); setMessage(change.message); setPending(change);
  }
  useEffect(() => {
    if (!pending) return;
    const commit = window.setTimeout(() => { setState(pending.state); setLeaving([]); }, 350);
    const settle = window.setTimeout(() => { setPending(null); setArriving([]); }, 950);
    return () => { window.clearTimeout(commit); window.clearTimeout(settle); };
  }, [pending]);
  useEffect(() => {
    if (!playing || pending) return;
    if (!state.waiting.length || state.active.length >= capacity) { setPlaying(false); return; }
    const tick = window.setTimeout(() => apply(admitTick(state, rate, capacity)), 1000);
    return () => window.clearTimeout(tick);
  }, [playing, pending, state, rate, capacity]);
  function finish(id: string) { if (!pending) { setPlaying(false); apply(finishVisitor(state, id)); } }
  return <main className="hash-page" data-page-scroll><header className="hash-header"><h1>Admission Control</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual" aria-label="대기열 입장 제어 시뮬레이션">
      <div className="hash-inputs admission-settings"><label>초당 입장 인원<input type="number" value={rate} min="1" max="5" disabled={Boolean(pending) || playing} onChange={e => { const next = e.target.valueAsNumber; if (Number.isInteger(next) && next >= 1 && next <= 5) setRate(next); }} /></label><label>동시 활성 상한<input type="number" value={capacity} min={Math.max(1, state.active.length)} max="8" disabled={Boolean(pending) || playing} onChange={e => { const next = e.target.valueAsNumber; if (Number.isInteger(next) && next >= Math.max(1, state.active.length) && next <= 8) setCapacity(next); }} /></label><span className="admission-time">{state.time}초 · 활성 {state.active.length} / {capacity}명</span></div>
      <svg className="admission-diagram" viewBox={`0 0 ${width} 485`} role="group" aria-label="대기열, 활성 사용자, 완료 사용자">
        {['대기열', '활성 사용자', '완료'].map((label, row) => <g key={label}><text x="20" y={45 + row * 155} className="admission-lane">{label} <tspan className="admission-count">{lanes[row].length}명</tspan></text><path d={`M20 ${150 + row * 155} H${width - 20}`} className="admission-rule" /></g>)}
        {Array.from({ length: capacity }, (_, i) => <rect key={i} x={50 + i * 90} y="227" width="70" height="46" rx="3" className="admission-slot" />)}
        {lanes.map((lane, row) => lane.map((visitor, index) => {
          const characters = Array.from(visitor.id);
          return <g key={visitor.id} className={`admission-user ${leaving.includes(visitor.id) ? 'leaving' : ''} ${arriving.includes(visitor.id) ? 'arriving' : ''}`} style={{ transform: `translate(${85 + index * 90}px, ${95 + row * 155}px)` }} role={row === 1 ? 'button' : undefined} tabIndex={row === 1 ? 0 : undefined} aria-label={row === 1 ? `${visitor.id} 처리 완료` : `${visitor.id} ${row === 0 ? `대기 순번 ${index + 1}` : '완료'}`} aria-disabled={row === 1 ? Boolean(pending) : undefined} onClick={row === 1 ? () => finish(visitor.id) : undefined} onKeyDown={row === 1 ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(visitor.id); } } : undefined}>
            <rect x="-35" y="-23" width="70" height="46" rx="3" className={row === 1 ? 'admission-node active' : 'admission-node'} />
            <CenteredNodeText primary={characters.slice(0, 4).join('')} secondary={characters.length > 4 ? characters.slice(4).join('') : undefined} primaryClass="admission-name" secondaryClass="admission-name" gap={20} maxWidth={58} />
            <text textAnchor="middle" y="43" className="admission-caption">{row === 0 ? `${index + 1}번째` : row === 1 ? '완료 ↗' : '✓'}</text>
          </g>;
        }))}
        {!state.waiting.length && <text x="85" y="100" textAnchor="middle" className="admission-caption">비어 있음</text>}
        {!state.finished.length && <text x="85" y="410" textAnchor="middle" className="admission-caption">—</text>}
      </svg>
      <div className="hash-status" role="status">{message}</div>
      <form className="hash-inputs" onSubmit={e => { e.preventDefault(); try { apply(enqueueVisitor(state, user)); } catch (err) { setMessage(err instanceof Error ? err.message : '입력을 확인하세요.'); } }}><label>새 요청 사용자<input value={user} maxLength={8} disabled={Boolean(pending) || playing} onChange={e => setUser(e.target.value)} /></label><button type="submit" disabled={Boolean(pending) || playing}>대기열 추가</button></form>
      <div className="hash-playback admission-playback"><div><button disabled={Boolean(pending) || !state.waiting.length || state.active.length >= capacity} onClick={() => setPlaying(old => !old)}>{playing ? '정지' : '재생'}</button><button disabled={Boolean(pending) || playing} onClick={() => apply(admitTick(state, rate, capacity))}>1초 진행</button></div><div><button onClick={() => { setPending(null); setPlaying(false); setState(initialAdmission()); setLeaving([]); setArriving([]); setMessage('초기 대기열로 돌아왔습니다.'); }}>초기화</button></div></div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="입장 제어(Admission Control)" text="모든 요청을 예약 서버와 DB로 바로 보내지 않고, 처리할 수 있는 만큼만 통과시킵니다. 기다리는 사람은 대기열에 남고 입장한 사람만 예약을 시도할 수 있습니다. 입장은 좌석 확보나 예약 확정과 다릅니다." />
      <ConceptSection title="입장 속도와 동시 활성 인원" text="초당 입장 인원은 한 번에 몇 명을 새로 받는지, 동시 활성 상한은 아직 처리를 마치지 않은 사람이 몇 명까지 머물 수 있는지입니다. 초당 2명·상한 3명이라면 처음에 2명, 다음에는 빈자리만큼 1명만 받습니다. 처리 완료가 없으면 더 입장시키지 않습니다." comparison={{ headers: ['구분', '입장 속도', '활성 상한'], rows: [['제한 대상', '시간당 새로 입장하는 수', '현재 처리 중인 전체 수'], ['예시', '초당 2명', '동시에 최대 3명'], ['필요한 이유', '순간 유입 조절', '머무는 요청의 누적 방지']] }} />
      <ConceptSection title="선입선출(FIFO)과 접수 순서" text="대기열에서 앞에 있는 사람부터 빈 활성 자리를 채웁니다. 새 요청은 뒤에 들어가고 같은 사용자의 중복 요청은 새 줄을 만들지 않습니다. 분산 서버에서는 클라이언트 시계보다 서버가 확정한 접수 순서를 기준으로 삼고, 같은 시간값의 순서도 정해야 합니다." />
      <ConceptSection title="스케줄러(Scheduler)와 빈자리 계산" text="주기적으로 실행되는 작업이 대기열에서 다음 사람을 꺼냅니다. 입장 인원은 초당 한도, 활성 상한에서 현재 활성 인원을 뺀 빈자리, 실제 대기자 수 중 가장 작은 값입니다. 이 화면의 1초 진행은 한 번의 입장 처리를 뜻합니다. 재생은 자리가 찰 때까지 반복합니다." />
      <ConceptSection title="처리 완료와 자리 회수" text="활성 사용자 노드의 완료를 누르면 활성 자리를 회수합니다. 다음 입장 처리에서 앞쪽 대기자가 그 자리를 채웁니다. 대기 순번은 줄어들지만 접수 순서는 유지됩니다. 중간에 떠나거나 응답하지 않는 사용자까지 회수하려면 만료 시간(TTL)과 활성 권한의 수명 관리가 필요합니다." />
      <ConceptSection title="역압(Backpressure)과 DB 부하" text="예약 서버가 처리 중인 작업을 마치지 못하면 더 입장시키지 않는 방식으로 유입을 조절합니다. 이렇게 뒤쪽 처리 속도에 맞춰 앞쪽 유입을 늦추는 것이 역압입니다. 예매 대기열은 유입을 완충하지만 순번 조회 트래픽도 있으므로 Polling 간격과 조회 부하까지 따로 관리해야 합니다." />
      <ConceptSection title="여러 스케줄러와 원자성(Atomicity)" advanced text="스케줄러가 여러 서버에서 동시에 실행되면 같은 빈자리를 보고 상한보다 많은 사람을 입장시킬 수 있습니다. 빈자리 확인, 대기열 추출, 활성 등록을 하나의 원자적 실행으로 처리하거나 작업 담당자를 하나로 제한해야 합니다. 대기열에서 꺼내는 것만 원자적이라고 전체 이동이 안전해지는 것은 아닙니다." />
    </section>
  </main>;
}
