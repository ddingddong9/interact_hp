import { useEffect, useMemo, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import { raceFrames } from '../components/race/model';
import type { Mode, User } from '../components/race/model';
import '../styles/hash-table.css';
import '../styles/race-condition.css';

export default function RaceCondition() {
  const [mode, setMode] = useState<Mode>('separate');
  const [first, setFirst] = useState<User>('A');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const frames = useMemo(() => raceFrames(mode, first), [mode, first]);
  const frame = frames[step];
  const atEnd = step === frames.length - 1;
  const successes = Object.values(frame.requests).filter(request => request.result === 'success').length;
  useEffect(() => {
    if (!playing || atEnd) return;
    const timer = window.setTimeout(() => setStep(old => old + 1), 1200 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, atEnd, step, speed]);
  useEffect(() => { if (atEnd) setPlaying(false); }, [atEnd]);
  const changeMode = (next: Mode) => { setPlaying(false); setStep(0); setMode(next); };
  return <main className="hash-page" data-page-scroll>
    <header className="hash-header"><h1>Race Condition</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual" aria-label="경쟁 조건과 원자성 시뮬레이션">
      <div className="race-options"><div className="structure-views race-mode" role="group" aria-label="처리 방식"><button aria-pressed={mode === 'separate'} onClick={() => changeMode('separate')}>개별 처리</button><button aria-pressed={mode === 'atomic'} onClick={() => changeMode('atomic')}>원자적 처리</button></div><label className="race-first">먼저 실행<select value={first} onChange={e => { setPlaying(false); setStep(0); setFirst(e.target.value as User); }}><option value="A">A</option><option value="B">B</option></select></label></div>
      <dl className="race-state"><div><dt>잔여 좌석</dt><dd>{frame.seats}</dd></div><div><dt>좌석 확보</dt><dd>{successes} / 1</dd></div><div><dt>실행 중</dt><dd>{frame.active ?? '—'}</dd></div></dl>
      <svg className="race-diagram" viewBox="0 0 840 370" role="img" aria-label={`잔여 좌석 ${frame.seats}. ${(['A', 'B'] as User[]).map(user => `${user}: 읽은 값 ${frame.requests[user].read ?? '없음'}, ${frame.requests[user].result === 'success' ? '성공' : frame.requests[user].result === 'failed' ? '실패' : '처리 전'}`).join('. ')}`}>
        <defs><marker id="race-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="currentColor" /></marker></defs>
        {['조회', '확인', '차감', '결과'].map((label, i) => <text key={label} x={220 + i * 170} y="30" textAnchor="middle" className="race-label">{label}</text>)}
        {(['A', 'B'] as User[]).map((user, row) => {
          const request = frame.requests[user];
          const y = 125 + row * 170;
          const positions = [220, 390, 560, 730];
          const active = frame.active === user;
          return <g key={user}>
            <text x="55" y={y} dominantBaseline="central" className="race-user">{user}</text>
            <path d={`M110 ${y} H775`} className="race-path" markerEnd="url(#race-arrow)" />
            {mode === 'atomic' && <><path d={`M190 ${y - 42} V${y - 52} H590 V${y - 42}`} className={`race-bracket ${frame.lockedBy === user ? 'active' : ''}`} /><text x="390" y={y - 64} textAnchor="middle" className="race-caption">{frame.waiting === user ? '진입 대기' : frame.lockedBy === user ? '확인·차감 실행 중' : '확인·차감을 하나로'}</text></>}
            {positions.map((x, index) => <circle key={index} cx={x} cy={y} r="7" className={request.step !== null && index <= request.step && !(index === 2 && request.approved === false) ? 'race-point visited' : 'race-point'} />)}
            {active && request.step !== null && <g className="race-cursor" style={{ transform: `translate(${positions[request.step]}px, ${y - 24}px)` }}><path d="M0 9 L-6 0 H6Z" /></g>}
            <text x="220" y={y + 55} textAnchor="middle" className="race-caption">읽은 값 <tspan className="race-number">{request.read ?? '—'}</tspan></text>
            <text x="390" y={y + 55} textAnchor="middle" className="race-caption">{request.approved === null ? '—' : request.approved ? '가능' : '좌석 없음'}</text>
            <text x="560" y={y + 55} textAnchor="middle" className="race-caption">{request.step !== null && request.step >= 2 && request.approved ? '0 저장' : '—'}</text>
            <text x="730" y={y + 55} textAnchor="middle" className={`race-result ${request.result !== 'pending' ? 'finished' : ''}`}>{request.result === 'success' ? '✓ 성공' : request.result === 'failed' ? '✕ 실패' : '—'}</text>
          </g>;
        })}
      </svg>
      <div className="hash-status" role="status">{frame.message}</div>
      <div className="hash-playback"><div><button disabled={step === 0} onClick={() => { setPlaying(false); setStep(old => old - 1); }} aria-label="이전 단계">←</button><button onClick={() => { if (atEnd) setStep(0); setPlaying(old => !old); }}>{playing ? '정지' : atEnd ? '다시 재생' : '재생'}</button><button disabled={atEnd} onClick={() => { setPlaying(false); setStep(old => old + 1); }} aria-label="다음 단계">→</button><span className="hash-step">{step + 1} / {frames.length}</span></div><div><label className="hash-speed">속도<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={() => { setPlaying(false); setStep(0); }}>초기화</button></div></div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="공유 상태(Shared State)" text="A와 B는 같은 잔여 좌석 수를 읽고 변경합니다. 이것이 공유 상태입니다. 각 요청이 읽어 둔 값은 해당 요청의 사본(Local Copy)으로, 다른 요청이 실제 좌석 수를 바꿔도 자동으로 최신값이 되지는 않습니다. 아래쪽 ‘읽은 값’과 위쪽 ‘잔여 좌석’이 서로 달라지는 순간을 보세요." />
      <ConceptSection title="경쟁 조건(Race Condition)" text="여러 요청이 공유 상태에 접근할 때 실행 순서에 따라 잘못된 결과가 생기는 상황입니다. 여기서는 A와 B가 모두 1을 읽고 각각 0을 저장합니다. 최종 숫자는 0이지만 성공은 두 번이므로 좌석 하나를 두 요청이 확보했습니다. 이처럼 한 요청의 변경이 덮어써지는 현상을 갱신 유실(Lost Update)이라고 합니다." />
      <ConceptSection title="읽기–확인–변경(Read–Check–Write)" text="좌석을 읽는 작업과 차감하는 작업이 각각 안전하더라도, 그 사이에 다른 요청이 들어오면 전체 과정은 안전하지 않을 수 있습니다. 빠르게 처리하거나 잔여 좌석 표시만 새로 고치는 것으로 해결되지 않습니다. 확인에 사용한 상태가 변경 순간에도 유효하도록 보장해야 합니다." />
      <ConceptSection title="원자성(Atomicity)과 임계 구역(Critical Section)" text="확인과 차감을 다른 요청이 끼어들 수 없는 하나의 실행 단위로 묶습니다. 이 공유 상태를 다루는 구간이 임계 구역입니다. 원자적 처리에서는 첫 요청이 1을 확인하고 0으로 바꾼 뒤, 다음 요청이 0을 읽어 실패합니다. 서버에서 실제로 이 실행 순서를 보장해야 합니다." comparison={{ headers: ['구분', '개별 처리', '원자적 처리'], rows: [['요청 간 개입', '조회와 차감 사이에 가능', '확인·차감 사이에 불가능'], ['두 번째 요청의 값', '이전에 읽은 1', '첫 차감 후의 0'], ['성공 건수', '2건 · 초과 확보', '1건']] }} />
      <ConceptSection title="원자성과 선착순(FIFO)" text="원자성은 마지막 좌석을 여러 요청이 동시에 확보하지 못하도록 합니다. 누가 먼저 처리될지는 별도의 순서 정책입니다. B가 먼저 실행되면 B가 성공합니다. 대기열 접수 순서와 처리 순서를 지키는 설계가 있어야 선착순도 보장할 수 있습니다." />
      <ConceptSection title="Redis Lua와 DB 저장" advanced text="Redis의 Lua 스크립트는 확인과 차감 등 Redis 내부 작업을 다른 명령이 끼어들지 않는 실행 단위로 묶을 수 있습니다. 여기서 성공은 좌석 확보 결과입니다. 실제 DB 예약 저장이나 결제까지 자동으로 같은 원자적 범위가 되는 것은 아니므로, 저장 실패와 재시도에 대한 정합성 설계가 별도로 필요합니다." />
    </section>
  </main>;
}
