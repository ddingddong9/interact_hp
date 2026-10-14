import { useEffect, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import { initialLuaState, luaCode, luaFrames } from '../components/lua/model';
import type { LuaFrame, LuaResult } from '../components/lua/model';
import '../styles/hash-table.css';
import '../styles/lua-script.css';
const results: Record<LuaResult, string> = { NO_ENTRY: '입장 권한 없음', DUPLICATE: '이미 확보한 사용자', SOLD_OUT: '매진', RESERVED: '좌석 확보 성공' };
export default function LuaScript() {
  const [inventory, setInventory] = useState(initialLuaState);
  const [user, setUser] = useState('A');
  const [admitted, setAdmitted] = useState(true);
  const [frames, setFrames] = useState<LuaFrame[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const frame = frames[step];
  const visible = frame?.state ?? inventory;
  const atEnd = frames.length > 0 && step === frames.length - 1;
  const busy = frames.length > 0 && !atEnd;
  useEffect(() => { if (!playing || atEnd) return; const timer = window.setTimeout(() => setStep(old => old + 1), 1200 / speed); return () => window.clearTimeout(timer); }, [playing, atEnd, step, speed]);
  useEffect(() => { if (atEnd) setPlaying(false); }, [atEnd]);
  function run() {
    try {
      const next = luaFrames(inventory, user, admitted);
      setInventory(next.at(-1)!.state); setFrames(next); setStep(0); setPlaying(true); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : '입력을 확인하세요.'); }
  }
  const phase = frame?.phase ?? 0;
  const labels = ['입장 권한', '중복 확인', '좌석 확인', '차감', '기록'];
  const captions = [
    phase >= 1 ? frame?.admitted ? '✓ 허용' : '✕ 거부' : '—',
    phase >= 2 ? frame?.duplicate ? '이미 확보' : '미확보' : '—',
    phase >= 3 ? `${frame?.checkedSeats}개` : '—',
    phase >= 4 ? `${visible.seats}개로 변경` : '—',
    phase >= 5 ? frame?.user : '—',
  ];
  return <main className="hash-page" data-page-scroll><header className="hash-header"><h1>Lua Script</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual" aria-label="Lua 좌석 확보 시뮬레이션">
      <dl className="lua-state"><div><dt>잔여 좌석</dt><dd>{visible.seats}</dd></div><div><dt>좌석 확보 기록</dt><dd>{visible.reserved.join(', ') || '—'}</dd></div><div><dt>반환 결과</dt><dd className="lua-return">{frame?.result ? results[frame.result] : busy ? '실행 중' : '—'}</dd></div></dl>
      <svg className="lua-diagram" viewBox="0 0 840 225" role="img" aria-label={`${frame?.user ?? user} 요청. ${labels.map((label, i) => `${label}: ${captions[i]}`).join('. ')}`}>
        <defs><marker id="lua-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="currentColor" /></marker></defs>
        <path d="M55 76 V64 H785 V76" className="lua-bracket" />
        <text x="420" y="43" textAnchor="middle" className="lua-caption">한 번의 원자적 실행</text>
        <path d="M55 120 H785" className="lua-path" markerEnd="url(#lua-arrow)" />
        {labels.map((label, i) => <g key={label}><text x={90 + i * 165} y="100" textAnchor="middle" className="lua-label">{label}</text><circle cx={90 + i * 165} cy="120" r="7" className={phase >= i + 1 ? 'lua-point visited' : 'lua-point'} /><text x={90 + i * 165} y={i === 4 && Array.from(captions[i]).length > 5 ? 166 : 180} textAnchor="middle" className={`lua-caption ${i === 4 ? 'lua-member' : ''}`}>{i === 4 && Array.from(captions[i]).length > 5 ? <><tspan x={90 + i * 165}>{Array.from(captions[i]).slice(0, 4).join('')}</tspan><tspan x={90 + i * 165} dy="26">{Array.from(captions[i]).slice(4).join('')}</tspan></> : captions[i]}</text></g>)}
        {phase >= 1 && <g className="lua-cursor" style={{ transform: `translate(${90 + (Math.min(phase, 5) - 1) * 165}px, 133px)` }}><path d="M0 0 L-5 8 H5Z" /></g>}
      </svg>
      <div className="hash-status" role="status">{error || frame?.message || '입장 권한과 기존 기록을 확인한 뒤 마지막 좌석을 처리합니다.'}</div>
      <form className="hash-inputs lua-inputs" onSubmit={e => { e.preventDefault(); run(); }}><label>사용자<input value={user} maxLength={8} disabled={busy} onChange={e => setUser(e.target.value)} /></label><label className="lua-entry"><input type="checkbox" checked={admitted} disabled={busy} onChange={e => setAdmitted(e.target.checked)} />입장 권한 있음</label><button type="submit" disabled={busy}>요청 실행</button></form>
      <div className="hash-playback"><div><button disabled={!frames.length || step === 0} onClick={() => { setPlaying(false); setStep(old => old - 1); }} aria-label="이전 단계">←</button><button disabled={!frames.length} onClick={() => { if (atEnd) setStep(0); setPlaying(old => !old); }}>{playing ? '정지' : atEnd ? '다시 재생' : '재생'}</button><button disabled={!frames.length || atEnd} onClick={() => { setPlaying(false); setStep(old => old + 1); }} aria-label="다음 단계">→</button><span className="hash-step">{frames.length ? `${step + 1} / ${frames.length}` : '—'}</span></div><div><label className="hash-speed">속도<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={() => { setPlaying(false); setFrames([]); setStep(0); setInventory(initialLuaState()); setError(''); }}>초기화</button></div></div>
    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      <ConceptSection title="서버 측 스크립트(Server-side Script)" text="애플리케이션이 조회와 변경 명령을 따로 보내면 요청 사이에 다른 명령이 실행될 수 있습니다. Lua 스크립트는 조건 판단과 Redis 명령을 Redis 서버 안에서 함께 실행합니다. 데이터를 읽은 뒤 결과에 따라 다른 작업을 선택할 수 있습니다." />
      <ConceptSection title="원자적 실행(Atomic Execution)" text="스크립트 실행 중에는 다른 클라이언트의 Redis 명령이 끼어들지 않습니다. 좌석을 확인한 뒤 차감하고 기록하는 과정이 끝난 후 다음 요청이 현재 상태를 확인합니다. 화면의 단계는 그 한 번의 실행 내부를 따라가는 것입니다. 다른 요청이 차감과 기록 사이의 상태를 조회할 수 있는 것은 아닙니다." />
      <ConceptSection title="조건 검사와 조기 반환(Early Return)" text="입장 권한이 없거나 이미 좌석을 확보했거나 매진이면 변경 전에 결과를 반환하고 종료합니다. 중복 여부를 좌석 수보다 먼저 확인하므로, A가 마지막 좌석을 확보한 뒤 A가 다시 요청하면 매진이 아니라 중복 결과가 나옵니다. 그 뒤 B가 요청하면 매진 결과가 나옵니다." comparison={{ headers: ['반환값', '의미', '좌석 차감'], rows: [['NO_ENTRY', '입장 권한 없음', '없음'], ['DUPLICATE', '기존 확보 기록 있음', '없음'], ['SOLD_OUT', '잔여 좌석 없음', '없음'], ['RESERVED', '차감과 기록 완료', '1개']] }} />
      <ConceptSection title="Redis 명령과 입력값" text="SISMEMBER는 집합에 사용자가 있는지 확인하고, GET은 좌석 수를 읽습니다. DECR은 숫자를 1 줄이고 SADD는 집합에 사용자를 추가합니다. KEYS에는 접근할 Redis 키 이름, ARGV에는 사용자 이름 같은 일반 입력값을 전달합니다.">
        <dl className="lua-key-map"><div><dt>KEYS[1]</dt><dd>입장 허용 사용자 집합</dd></div><div><dt>KEYS[2]</dt><dd>좌석 확보 사용자 집합</dd></div><div><dt>KEYS[3]</dt><dd>잔여 좌석 수</dd></div><div><dt>ARGV[1]</dt><dd>요청한 사용자 이름</dd></div></dl>
        <details className="concept-details"><summary><span className="concept-chevron" aria-hidden="true">›</span><h2>Lua 코드</h2></summary><div className="concept-details-content"><pre className="lua-code"><code>{luaCode.join('\n')}</code></pre></div></details>
      </ConceptSection>
      <ConceptSection title="중복 요청과 멱등성(Idempotency)" text="사용자가 버튼을 여러 번 누르거나 응답을 받지 못해 재시도해도 같은 사용자의 좌석은 한 번만 차감됩니다. 사용자 단위로 중복을 막는 예시입니다. 실제 서비스에서는 행사별 범위와 요청 식별자(Idempotency Key)를 정하고, 재시도에 같은 결과를 돌려줄지도 설계해야 합니다." />
      <ConceptSection title="DB 저장과 장애" advanced text="Redis의 원자성은 외부 DB 저장이나 결제까지 함께 보장하지 않습니다. 좌석 확보 후 DB 저장이 실패하면 재시도하거나 점유를 회수하는 과정이 필요합니다. 또한 스크립트 도중 오류가 나도 이미 수행한 변경이 자동으로 되돌아가는 롤백(Rollback)은 제공되지 않습니다. 변경 전에 조건과 데이터 형식을 검사해야 합니다." />
      <ConceptSection title="짧은 실행과 스크립트 캐시(Script Cache)" advanced text="스크립트가 실행되는 동안 다른 Redis 명령이 기다리므로 긴 반복문이나 많은 데이터 처리는 피해야 합니다. EVAL은 코드를 전달해 실행하고, SCRIPT LOAD로 올린 코드는 EVALSHA로 재사용할 수 있습니다. 재시작이나 장애 전환으로 캐시가 사라지면 NOSCRIPT 오류를 처리하고 다시 로드해야 합니다." />
    </section>
  </main>;
}
