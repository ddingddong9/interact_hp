import { useEffect, useState } from 'react';
import { emptyTable, operationFrames, SIZE } from '../components/hash/model';
import type { Frame, Operation, Table } from '../components/hash/model';
import '../styles/hash-table.css';
import CenteredNodeText from '../components/CenteredNodeText';
import ConceptSection from '../components/ConceptSection';

const topics = [
  { title: '키(Key)와 값(Value)', text: '키는 데이터를 찾는 이름표이고, 값은 그 이름표에 연결된 내용입니다. 예를 들어 키 10에 값 A를 저장하면 10으로 A를 찾습니다. 같은 키를 다시 저장하면 값이 바뀌지만, 서로 다른 키에 같은 값을 저장할 수는 있습니다.' },
  { title: '해시 함수(Hash Function)', text: '가능한 키마다 칸을 하나씩 만들면 너무 많은 공간이 필요합니다. 해시 함수는 키를 계산해 제한된 저장 위치로 보내는 규칙입니다. 이 화면은 키를 7로 나눈 나머지를 사용합니다. %는 나머지 연산(Modulo)으로, 10 % 7 = 3입니다. 같은 키는 같은 규칙과 테이블 크기에서 항상 같은 위치로 가야 저장한 데이터를 다시 찾을 수 있습니다. 실제 해시 함수는 문자열도 처리합니다.' },
  { title: '버킷(Bucket)', text: '해시 계산으로 선택되는 저장 칸입니다. 이 화면에는 0~6번 버킷이 있습니다. 조회할 때도 키로 위치를 계산하므로 테이블 전체를 순서대로 살펴볼 필요가 없습니다. 키가 여러 버킷에 고르게 분산될수록 한 칸에서 비교할 항목이 적어집니다.' },
  { title: '충돌(Collision)과 체이닝(Separate Chaining)', text: '10과 17은 서로 다른 키지만 7로 나눈 나머지가 모두 3입니다. 이렇게 다른 키가 같은 버킷에 도착하는 것이 충돌입니다. 같은 키를 다시 저장하는 중복 키와는 다릅니다. 체이닝은 한 버킷에 여러 항목을 연결해 모두 보관하는 충돌 해결 방법입니다. 조회할 때는 그 연결 안에서 원래 키를 비교합니다.' },
  { title: '조회(Search)와 삭제(Delete)', text: '계산한 버킷에 도착했다고 곧바로 원하는 데이터를 찾은 것은 아닙니다. 충돌한 항목들의 키를 비교해야 합니다. 일치하면 값을 읽거나 항목을 삭제하고, 연결 끝까지 없으면 조회가 실패합니다. 중간 항목을 삭제할 때는 뒤 항목으로 가는 연결을 유지해야 합니다.' },
  { title: '시간 복잡도(Time Complexity)', text: '데이터 수 N이 늘어날 때 필요한 작업량이 얼마나 증가하는지 나타냅니다. O(1)은 평균 확인 작업 수가 데이터 수와 함께 크게 늘지 않는다는 뜻이며, 정확히 한 번만 작업한다는 뜻은 아닙니다. 버킷 수가 적절하고 키가 고르게 분산되면 평균 조회가 O(1)입니다. 충돌이 한 버킷에 몰리면 최대 N개를 비교하는 O(N)이 됩니다.' },
  { title: '적재율(Load Factor)', text: '저장된 항목 수를 버킷 수로 나눈 값입니다. 버킷이 7개이고 항목이 14개라면 적재율은 2입니다. 체이닝에서는 1을 넘어도 저장할 수 있지만 버킷당 연결이 길어질 수 있습니다. 항목이 많아지면 버킷 수를 늘리고 새 크기에 맞춰 위치를 다시 계산하는 재해싱(Rehashing)으로 부담을 줄일 수 있습니다.' },
];

export default function HashTable() {
  const [table, setTable] = useState<Table>(emptyTable);
  const [keyInput, setKeyInput] = useState('10');
  const [value, setValue] = useState('A');
  const [frames, setFrames] = useState<Frame[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [currentKey, setCurrentKey] = useState(10);
  const [speed, setSpeed] = useState(1);
  const frame = frames[step];
  const visibleTable = frame?.table ?? table;
  const atEnd = Boolean(frame && step === frames.length - 1);
  useEffect(() => {
    if (!playing || atEnd) return;
    const timer = window.setTimeout(() => setStep(old => old + 1), 1100 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, step, atEnd, speed]);
  useEffect(() => { if (atEnd) setPlaying(false); }, [atEnd]);

  function run(operation: Operation, source = visibleTable, key = Number(keyInput.trim() || 'NaN'), inputValue = value) {
    if (!Number.isSafeInteger(key) || key < 0 || key > 9999) {
      setError('키는 0~9999 사이의 정수로 입력하세요.'); return;
    }
    if (operation === 'insert' && !inputValue.trim()) { setError('저장할 값을 입력하세요.'); return; }
    if (operation === 'insert' && source[key % SIZE].length >= 6 && !source[key % SIZE].some(item => item.key === key)) {
      setError('이 모형은 버킷마다 최대 6개까지 표시합니다. 삭제하거나 초기화해 주세요.'); return;
    }
    const nextFrames = operationFrames(source, operation, key, inputValue.trim());
    setTable(nextFrames.at(-1)!.table);
    setCurrentKey(key); setFrames(nextFrames); setStep(0); setPlaying(true); setError('');
  }
  function example(collision: boolean) {
    const start = emptyTable();
    if (collision) start[3] = [{ key: 10, value: 'A' }];
    setKeyInput(collision ? '17' : '10'); setValue(collision ? 'B' : 'A');
    run('insert', start, collision ? 17 : 10, collision ? 'B' : 'A');
  }
  function reset() { setPlaying(false); setFrames([]); setTable(emptyTable()); setStep(0); setError(''); }
  const maxChain = Math.max(2, ...visibleTable.map(chain => chain.length));
  const diagramHeight = 235 + maxChain * 85;
  const targetX = frame ? 75 + frame.bucket * 120 : 75;
  const tokenX = frame && frame.phase !== 'input' ? 270 : 90;
  const pendingValue = frame ? frames.at(-1)?.table[frame.bucket].find(entry => entry.key === currentKey)?.value ?? '' : '';
  const showPointer = frame && ['bucket', 'compare', 'remove'].includes(frame.phase);
  const pointerY = frame?.phase === 'bucket' ? 144 : 224 + (frame?.index ?? 0) * 85;
  return <main className="hash-page" data-page-scroll>
    <header className="hash-header"><h1>Hash Table</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual" aria-label="해시 테이블 시각화">
      <div className="hash-diagram-scroll lab-stage"><svg className="hash-diagram" viewBox={`0 0 900 ${diagramHeight}`} role="img" aria-label={`7개의 버킷. ${visibleTable.map((chain, i) => `${i}번: ${chain.map(e => `${e.key} 값 ${e.value}`).join(', ') || '비어 있음'}`).join('. ')}`}>
        <defs><marker id="hash-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        <text x="90" y="12" textAnchor="middle" dominantBaseline="central" className="diagram-label">키</text>
        <path d="M 150 44 H 348" className="hash-route" markerEnd="url(#hash-arrow)" />
        <rect x="355" y="23" width="145" height="42" rx="21" className={frame?.phase === 'hash' ? 'hash-function is-highlighted' : 'hash-function'} />
        <text x="427.5" y="44" textAnchor="middle" dominantBaseline="central">{frame && frame.phase !== 'input' ? `${currentKey} % 7 = ${frame.bucket}` : '키 % 7'}</text>
        {frame && frame.phase !== 'input' && <path d={`M 510 44 H 865 V 95 H ${targetX} V 120`} className="hash-route hash-route-active" markerEnd="url(#hash-arrow)" />}
        {visibleTable.map((chain, b) => <g key={b}>
          <rect x={35 + b * 120} y="125" width="80" height="38" rx="3" className={`hash-bucket ${frame?.bucket === b && frame.phase !== 'input' && frame.phase !== 'hash' ? 'is-highlighted' : ''}`} />
          <text x={75 + b * 120} y="144" textAnchor="middle" dominantBaseline="central" className="bucket-number">{b}</text>
          {!chain.length && !(frame?.phase === 'place' && frame.bucket === b) && <text x={75 + b * 120} y="208" textAnchor="middle" className="empty-label">비어 있음</text>}
          {chain.map((entry, index) => <g key={entry.key} className={`hash-entry ${frame?.phase === 'remove' && frame.bucket === b && frame.index === index ? 'is-removing' : ''}`} style={{ transform: `translate(${75 + b * 120}px, ${224 + index * 85}px)` }}>
            <path d={index === 0 ? 'M 0 -57 V -35' : 'M 0 -50 V -35'} className="chain-link" markerEnd="url(#hash-arrow)" />
            <rect x="-45" y="-32" width="90" height="64" rx="5" className={`hash-node ${frame?.bucket === b && frame.index === index && (frame.phase === 'compare' || (frame.phase === 'done' && frame.result !== 'deleted')) ? 'is-highlighted' : ''}`} />
            <CenteredNodeText primary={String(entry.key)} secondary={entry.value} primaryClass="entry-key" secondaryClass="entry-value" gap={20} maxWidth={76} />
          </g>)}
        </g>)}
        {<g className="hash-token" style={{ transform: `translate(${tokenX}px, 44px)` }}><rect x="-33" y="-19" width="66" height="38" rx="19" /><text textAnchor="middle" y="0" dominantBaseline="central">{frame ? currentKey : keyInput.trim() || '—'}</text></g>}
        {showPointer && <g className="hash-pointer" style={{ transform: `translate(${targetX - 57}px, ${pointerY}px)` }}><path d="M0 -5 L7 0 L0 5Z" /></g>}
        {frame?.phase === 'place' && <g className="hash-pending" transform={`translate(${targetX} ${224 + (frame.index ?? 0) * 85})`}><rect x="-45" y="-32" width="90" height="64" rx="5" className="hash-node is-highlighted" /><CenteredNodeText primary={String(currentKey)} secondary={pendingValue} primaryClass="entry-key" secondaryClass="entry-value" gap={20} maxWidth={76} /></g>}
      </svg></div>
      <div className="hash-status" role="status">{error || frame?.message || '키와 값을 입력한 뒤 추가해 보세요.'}</div>
      <form className="hash-inputs" onSubmit={event => { event.preventDefault(); run('insert'); }}>
        <label>키<input type="number" min="0" max="9999" step="1" value={keyInput} onChange={e => setKeyInput(e.target.value)} /></label>
        <label>값<input maxLength={8} value={value} onChange={e => setValue(e.target.value)} /></label>
        <button type="submit" disabled={playing}>추가</button><button type="button" disabled={playing} onClick={() => run('search')}>조회</button><button type="button" disabled={playing} onClick={() => run('delete')}>삭제</button>
      </form>
      <div className="hash-playback"><div>
        <button disabled={!frame || step === 0} onClick={() => { setPlaying(false); setStep(old => old - 1); }} aria-label="이전 단계">←</button>
        <button disabled={!frame} onClick={() => { if (atEnd) setStep(0); setPlaying(old => !old); }}>{playing ? '정지' : atEnd ? '다시 재생' : '재생'}</button>
        <button disabled={!frame || atEnd} onClick={() => { setPlaying(false); setStep(old => old + 1); }} aria-label="다음 단계">→</button>
        <span className="hash-step">{frame ? `${step + 1} / ${frames.length}` : '—'}</span>
      </div><div><label className="hash-speed">속도<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={reset}>초기화</button></div></div>
    </section>
    <section className="hash-explanation" aria-label="해시 테이블 개념 설명">
      {topics.map((topic, i) => <ConceptSection key={topic.title} title={topic.title} text={topic.text} advanced={i >= 5}>{(i === 1 || i === 3) && <button onClick={() => { example(i === 3); document.querySelector('.hash-page')?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>예시 재생 ↗</button>}</ConceptSection>)}
    </section>
  </main>;
}
