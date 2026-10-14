import { useEffect, useState } from 'react';
import { initialItems, makeFrames, spanBetween } from '../components/structures/model';
import type { Action, Frame, Kind } from '../components/structures/model';
import '../styles/hash-table.css';
import '../styles/structure-lab.css';
import CenteredNodeText from '../components/CenteredNodeText';
import ConceptSection from '../components/ConceptSection';

const titles = { 'linked-list': 'Linked List', 'skip-list': 'Skip List', 'sorted-set': 'Sorted Set' };
const notes: Record<Kind, { title: string; text: string }[]> = {
  'linked-list': [
    { title: '노드(Node)와 다음 연결(Next Pointer)', text: '노드는 값과 다음 노드의 메모리 주소(Memory Address)를 담습니다. 화살표는 그 주소를 이용한 연결입니다. 노드들은 메모리에서 서로 붙어 있을 필요가 없습니다. 화면의 가로 배치는 실제 메모리 위치가 아니라 연결 순서를 보여줍니다.' },
    { title: '시작 포인터(Head)와 연결 없음(Null)', text: 'Head는 첫 노드의 주소를 가리킵니다. 마지막 노드의 다음 연결은 Null로, 다음 노드가 없다는 뜻입니다. Null은 숫자 0이나 빈 문자열 값과 다릅니다. 빈 리스트에서는 Head가 바로 Null을 가리킵니다.' },
    { title: '삽입(Insertion)과 삭제(Deletion)', text: '중간에 삽입하려면 새 노드가 뒤 노드를 가리키게 하고, 앞 노드가 새 노드를 가리키게 합니다. 삭제하려면 앞 노드가 제거할 노드의 다음 노드를 가리키게 합니다. 첫 노드가 바뀌면 Head도 갱신합니다. 같은 값이 여러 노드에 있을 수 있으며 이 화면의 조회·삭제는 첫 번째 일치를 대상으로 합니다.' },
    { title: '배열(Array)과의 차이', text: '배열은 원소를 연속된 메모리 공간에 저장해 인덱스(Index)로 위치를 계산할 수 있습니다. 연결 리스트(Linked List)는 각 노드의 연결을 따라가야 합니다. 화면의 위치 번호는 현재 순서일 뿐, 그 번호로 노드에 즉시 접근할 수 있다는 뜻은 아닙니다.' },
    { title: '시간 복잡도(Time Complexity)', text: '데이터 수 N이 늘 때 필요한 작업량의 증가를 나타냅니다. 원하는 값이나 위치를 찾으려면 최대 N개 노드를 확인하므로 O(N)입니다. 앞 노드를 이미 알고 있다면 삽입·삭제를 위해 연결을 바꾸는 작업 자체는 O(1)입니다. 위치를 찾는 비용과 연결을 바꾸는 비용을 구분해야 합니다.' },
  ],
  'skip-list': [
    { title: '층(Level)과 연결', text: '스킵 리스트(Skip List)는 정렬된 연결 리스트에 여러 층의 지름길을 추가한 구조입니다. L1에는 모든 노드가 있고 위층에는 일부 노드의 연결만 있습니다. 세로로 같은 값이 반복되어 보여도 데이터가 여러 개 복제된 것이 아니라 같은 노드가 여러 층의 다음 연결을 가진 것입니다.' },
    { title: '탐색(Search)', text: '가장 높은 층에서 오른쪽으로 이동하다 다음 값이 목표보다 크면 그 위치에서 한 층 내려옵니다. 정렬되어 있으므로 더 큰 값을 지나갈 필요가 없습니다. 아래층에서는 더 촘촘한 연결로 남은 구간을 확인합니다. 가장 아래층에서 값이 일치하지 않으면 없는 값입니다.' },
    { title: '무작위 높이(Random Height)', text: '새 노드를 한 층 더 높일지 무작위로 결정하고, 같은 과정을 반복합니다. 위로 갈수록 노드가 적어져 긴 구간을 빠르게 지나갈 수 있습니다. 모든 노드가 높으면 연결 공간이 낭비되고, 모두 낮으면 일반 연결 리스트처럼 탐색하게 됩니다. 높이는 값의 크기나 중요도를 뜻하지 않습니다.' },
    { title: '건너가는 원소 수(Span)', text: '각 연결로 이동할 때 아래층의 원소를 몇 개 지나가는지 나타냅니다. 시작 노드는 세지 않고 도착 노드는 포함합니다. 10에서 30으로 이동하면 20과 30을 지나므로 Span은 2입니다. 아래층으로 내려가는 것만으로는 누적값이 증가하지 않습니다. 오른쪽으로 이동한 연결의 Span을 더하면 순번을 계산할 수 있습니다.' },
    { title: '삽입(Insertion)과 삭제(Deletion)', text: '삽입할 값 앞의 노드를 각 층에서 찾고, 새 노드가 참여하는 층의 연결을 갱신합니다. 삭제할 때는 해당 노드를 가리키던 연결을 뒤 노드로 이어 줍니다. 원소 수가 바뀌므로 관련 Span도 갱신합니다. 이 화면은 같은 숫자를 중복 저장하지 않습니다.' },
    { title: '시간 복잡도(Time Complexity)', text: '높은 층에서 긴 구간을 건너뛰면 데이터 수 N이 늘어도 탐색 단계는 평균적으로 O(log N)으로 증가합니다. O(N)처럼 모든 데이터를 따라가는 것보다 느리게 증가한다는 뜻입니다. 이는 무작위 높이에 따른 평균 성질이고, 최악에는 O(N)이 될 수 있습니다. 화면에서는 최대 3층까지 보여줍니다.' },
  ],
  'sorted-set': [
    { title: '원소(Member)와 점수(Score)', text: '정렬된 집합(Sorted Set)은 중복되지 않는 Member마다 정렬 기준인 Score를 붙입니다. 이름과 점수를 구분해야 합니다. A와 B가 모두 점수 10을 가져도 다른 Member이므로 함께 저장할 수 있습니다. 점수가 작은 순서로 정렬하고, 동점이면 이름의 UTF-8 바이트 순서로 결정합니다.' },
    { title: 'Member 인덱스와 스킵 리스트(Skip List)', text: '이름으로 찾는 일과 점수순 위치를 찾는 일은 다릅니다. 해시 테이블(Hash Table) 기반 Member 인덱스는 이름으로 등록 여부와 점수에 빠르게 접근하고, Skip List는 정렬된 위치와 순번을 찾습니다. 같은 Member를 두 관점으로 관리하는 것이며 서로 다른 집합 두 개를 만드는 것은 아닙니다.' },
    { title: '점수 변경과 신규 추가 조건(NX)', text: '같은 Member를 다시 추가하면 기본적으로 Score가 바뀌고 정렬 위치도 갱신됩니다. NX는 아직 존재하지 않는 Member만 추가하는 조건입니다. 이미 존재하면 이번 요청은 점수를 바꾸지 않습니다. NX를 끈 다른 요청으로는 기존 점수를 변경할 수 있으므로 최초 점수를 영구적으로 고정하는 기능은 아닙니다.' },
    { title: '점수(Score)와 순위(Rank)', text: 'Score는 정렬에 사용하는 값이고 Rank는 정렬 결과에서의 현재 위치입니다. A의 점수가 100이어도 맨 앞이면 Rank는 0입니다. 앞에 다른 Member가 들어오면 A의 Score는 그대로인데 Rank는 바뀝니다. Rank는 0부터 세며, 사람이 읽는 대기 순번은 Rank + 1입니다.' },
    { title: 'Span으로 순번 계산', text: 'Head에서 목표까지 오른쪽으로 이동하며 Span을 더하면 목표를 포함한 원소 수가 됩니다. 예를 들어 누적값이 5라면 다섯 번째 원소이고 Rank는 5 − 1 = 4입니다. 층을 내려갈 때는 같은 위치에 있으므로 더하지 않습니다. 이것이 모든 원소를 하나씩 세지 않고 순번을 구하는 방법입니다.' },
    { title: '대기열(Waiting Queue)에서의 의미', text: '접수 순서를 Score로 정하면 먼저 접수된 Member를 앞에 둘 수 있습니다. 다만 접수 시간이 같으면 Member 이름으로 정렬되므로 시간값만으로 엄격한 선착순이 완성되지는 않습니다. 재접수 시 점수를 바꿀지 유지할지도 정해야 합니다. 한 사람이 줄에 한 번만 서는 것과 예약이 한 번만 생성되는 것은 별개의 문제입니다.' },
    { title: '리스트팩(Listpack)', text: 'Redis는 원소가 적고 Member 크기가 작은 Sorted Set을 연속된 공간에 압축해 저장할 수 있습니다. 이 표현이 Listpack입니다. 작은 데이터에서는 연결과 인덱스를 따로 관리하는 비용보다 메모리를 절약하는 편이 유리합니다. 데이터가 커지면 설정 조건에 따라 Skip List 기반 표현으로 전환합니다.' },
  ],
};

function Diagram({ frame, kind, arriving }: { frame: Frame; kind: Kind; arriving?: string }) {
  const items = frame.items;
  const isList = frame.view === 'list';
  const width = Math.max(900, 300 + items.length * 145);
  const x = (i: number) => 200 + i * 145;
  const y = (level: number) => isList ? 170 : 100 + (3 - level) * 110;
  const cursor = frame.focus === 'HEAD' ? -1 : items.findIndex(item => item.id === frame.focus);
  if (frame.view === 'index') return <div className="lab-stage"><div className="member-index" aria-label="Member 인덱스">{items.length ? items.map(item => <div key={item.id} className={frame.focus === item.id ? 'index-row highlighted' : 'index-row'}><strong>{item.id}</strong><span>→</span><span>Score {item.value}</span></div>) : <p>비어 있음</p>}</div></div>;
  return <div className="hash-diagram-scroll lab-stage"><svg className="structure-diagram" viewBox={`0 0 ${width} 460`} role="img" aria-label={items.length ? items.map((item, i) => `${i}번: ${kind === 'sorted-set' ? item.id + ' 점수 ' : ''}${item.value}`).join('. ') : '빈 자료구조'}>
    <defs><marker id={`arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="currentColor" /></marker></defs>
    {!isList && items.map((item, i) => <line key={item.id} x1={x(i)} x2={x(i)} y1={y(item.height)} y2={y(1)} className="tower-line" />)}
    {(isList ? [1] : [3, 2, 1]).map(level => {
      const positions = [-1, ...items.flatMap((item, i) => isList || item.height >= level ? [i] : [])];
      return <g key={level}>
        {!isList && <text x="5" y={y(level)} dominantBaseline="central" className="level-label">L{level}</text>}
        {positions.map((from, j) => {
          const to = positions[j + 1];
          const end = to === undefined ? items.length : to;
          const startX = from < 0 ? 65 : x(from);
          const endX = to === undefined ? x(items.length) : x(to);
          return <g key={`link-${from}`}><path d={`M${startX + (from < 0 ? 36 : 58)} ${y(level)} H${endX - 61}`} className={`structure-link ${frame.level === level && cursor === end ? 'traversed-link' : ''}`} markerEnd={`url(#arrow-${kind})`} />{!isList && to !== undefined && <text x={(startX + endX) / 2} y={y(level) - 15} className="span-label">{spanBetween(items, from, to)}</text>}</g>;
        })}
        <g transform={`translate(65 ${y(level)})`}><rect x="-34" y="-20" width="68" height="40" rx="4" className={`structure-node ${frame.focus === 'HEAD' && (isList || frame.level === level) ? 'highlighted' : ''}`} /><text textAnchor="middle" y="0" dominantBaseline="central">HEAD</text></g>
        <text x={x(items.length)} y={y(level)} dominantBaseline="central" textAnchor="middle" className="null-label">NULL</text>
      </g>;
    })}
    {items.map((item, i) => <g key={item.id} className={`structure-item ${frame.removing === item.id ? 'removing' : ''} ${arriving === item.id ? 'is-arriving' : ''}`} style={{ transform: `translate(${x(i)}px, 0px)` }}>
      {(isList ? [1] : [3, 2, 1].filter(level => item.height >= level)).map(level => <g key={level} transform={`translate(0 ${y(level)})`}><rect x="-56" y="-42" width="112" height="84" rx="5" className={`structure-node ${frame.focus === item.id && (isList || frame.level === level) ? 'highlighted' : ''}`} /><CenteredNodeText primary={String(item.value)} secondary={kind === 'sorted-set' ? item.id : undefined} secondaryClass="member-label" gap={26} /></g>)}
      <text textAnchor="middle" y={y(1) + 65} className="position-label">{isList ? `위치 ${i}` : `rank ${i}`}</text>
    </g>)}
    {cursor >= 0 && <g className="structure-cursor" style={{ transform: `translate(${x(cursor) - 69}px, ${y(frame.level ?? 1) + 24}px)` }}><path d="M0 -5 L7 0 L0 5Z" /></g>}
    {!isList && frame.rank !== undefined && <text x={width / 2} y="435" textAnchor="middle" className="span-total">누적 Span {frame.rank}</text>}
    {frame.incoming && <g className="incoming-node" transform={`translate(${width / 2} 40)`}><rect x="-60" y="-22" width="120" height="44" rx="5" /><text textAnchor="middle" y="0" dominantBaseline="central" textLength={String(frame.incoming.value).length > 8 ? 104 : undefined} lengthAdjust="spacingAndGlyphs">{frame.incoming.value}</text></g>}
    {!items.length && <text x="350" y="350" className="null-label">비어 있음</text>}
  </svg></div>;
}
export default function StructureLab({ kind }: { kind: Kind }) {
  const [items, setItems] = useState(() => initialItems(kind));
  const [frames, setFrames] = useState<Frame[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [value, setValue] = useState('25');
  const [member, setMember] = useState('F');
  const [position, setPosition] = useState('2');
  const [nx, setNx] = useState(false);
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState(1);
  const [idleView, setIdleView] = useState<'skip' | 'index'>('skip');
  const frame: Frame = frames[step] ?? { items, view: kind === 'linked-list' ? 'list' : idleView, message: '추가·조회·삭제를 실행해 보세요.' };
  const atEnd = frames.length > 0 && step === frames.length - 1;
  useEffect(() => { if (!playing || atEnd) return; const timer = window.setTimeout(() => setStep(old => old + 1), 1000 / speed); return () => window.clearTimeout(timer); }, [playing, atEnd, step, speed]);
  useEffect(() => { if (atEnd) setPlaying(false); }, [atEnd]);
  function run(action: Action, example = false) {
    try {
      const source = example ? initialItems(kind) : frame.items;
      const inputValue = example ? 40 : Number(value.trim() || 'NaN');
      const inputMember = example ? 'E' : member.trim();
      if (!Number.isFinite(inputValue) && (kind !== 'sorted-set' || action === 'insert')) throw new Error('유효한 숫자를 입력하세요.');
      if (Math.abs(inputValue) > 9999 && (kind !== 'sorted-set' || action === 'insert')) throw new Error('숫자는 -9999~9999 사이로 입력하세요.');
      if (action === 'insert' && source.length >= 10 && (kind === 'linked-list' || !source.some(item => kind === 'sorted-set' ? item.id === inputMember : item.value === inputValue))) throw new Error('이 모형은 최대 10개까지 표시합니다. 먼저 삭제해 주세요.');
      const height = Math.random() < .25 ? 3 : Math.random() < .5 ? 2 : 1;
      const next = makeFrames(kind, source, { action, value: kind === 'sorted-set' && action !== 'insert' ? 0 : inputValue, member: inputMember, position: Number(position.trim() || 'NaN'), nx, height });
      if (example) { setValue(kind === 'sorted-set' ? '50' : '40'); setMember('E'); }
      setItems(next.at(-1)!.items); setFrames(next); setStep(0); setPlaying(true); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : '입력을 확인하세요.'); }
  }
  return <main className="hash-page" data-page-scroll><header className="hash-header"><h1>{titles[kind]}</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual" aria-label={`${titles[kind]} 시각화`}>
      {kind === 'sorted-set' && <div className="structure-views" role="group" aria-label="구조 선택"><button disabled={playing} aria-pressed={frame.view === 'index'} onClick={() => { setItems(frame.items); setFrames([]); setIdleView('index'); }}>Member 인덱스</button><button disabled={playing} aria-pressed={frame.view === 'skip'} onClick={() => { setItems(frame.items); setFrames([]); setIdleView('skip'); }}>Score 정렬</button></div>}
      <Diagram frame={frame} kind={kind} arriving={atEnd ? frames.at(-2)?.incoming?.id : undefined} />
      <div className="hash-status" role="status">{error || frame.message}</div>
      <form className="hash-inputs" onSubmit={e => { e.preventDefault(); run('insert'); }}>
        {kind === 'sorted-set' && <label>Member<input value={member} maxLength={8} onChange={e => setMember(e.target.value)} /></label>}
        <label>{kind === 'sorted-set' ? 'Score' : '값'}<input type="number" value={value} onChange={e => setValue(e.target.value)} /></label>
        {kind === 'linked-list' && <label>삽입 위치<input type="number" min={0} value={position} onChange={e => setPosition(e.target.value)} /></label>}
        <button type="submit" disabled={playing}>추가</button><button type="button" disabled={playing} onClick={() => run('search')}>조회</button><button type="button" disabled={playing} onClick={() => run('delete')}>삭제</button>
        {kind === 'sorted-set' && <><button type="button" disabled={playing} onClick={() => run('rank')}>순번 조회</button><label className="nx-option"><input type="checkbox" checked={nx} onChange={e => setNx(e.target.checked)} />NX · 신규만 추가</label></>}
      </form>
      <div className="hash-playback"><div><button disabled={!frames.length || step === 0} onClick={() => { setPlaying(false); setStep(old => old - 1); }} aria-label="이전 단계">←</button><button disabled={!frames.length} onClick={() => { if (atEnd) setStep(0); setPlaying(old => !old); }}>{playing ? '정지' : atEnd ? '다시 재생' : '재생'}</button><button disabled={!frames.length || atEnd} onClick={() => { setPlaying(false); setStep(old => old + 1); }} aria-label="다음 단계">→</button><span className="hash-step">{frames.length ? `${step + 1} / ${frames.length}` : '—'}</span></div><div><label className="hash-speed">속도<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={() => { setPlaying(false); setFrames([]); setItems(initialItems(kind)); setError(''); setStep(0); }}>초기화</button></div></div>
    </section><section className="hash-explanation" aria-label="개념 설명">{notes[kind].map((note, i) => <ConceptSection key={note.title} title={note.title}
        advanced={note.title.startsWith('시간 복잡도') || note.title.startsWith('리스트팩')}
        text={kind === 'linked-list' && i === 3 ? '화면의 위치 번호는 연결 순서를 뜻합니다. 배열의 인덱스처럼 곧바로 접근하는 주소가 아닙니다.' : kind === 'sorted-set' && i === 3 ? 'Score는 정렬 기준이고 Rank는 정렬 결과입니다. A의 점수가 100이어도 맨 앞이면 Rank는 0입니다.' : note.text}
        comparison={kind === 'linked-list' && i === 3 ? { headers: ['구분', '배열(Array)', '연결 리스트(Linked List)'], rows: [['메모리 배치', '연속된 공간', '떨어진 노드도 연결 가능'], ['원소 접근', '인덱스로 위치 계산', 'Head부터 연결을 따라 이동'], ['중간 삽입·삭제', '뒤 원소를 옮겨야 함', '앞 노드를 찾은 뒤 연결 변경']] } : kind === 'sorted-set' && i === 3 ? { headers: ['구분', '점수(Score)', '순위(Rank)'], rows: [['의미', '정렬에 사용하는 값', '정렬된 현재 위치'], ['변하는 때', '점수 변경 요청', '앞쪽 원소 추가·삭제·이동'], ['숫자 범위', '음수·소수도 가능', '0부터 시작'], ['대기 순번', '순서 결정에 사용', 'Rank + 1']] } : undefined}>{i === 1 && <button onClick={() => { run(kind === 'sorted-set' ? 'rank' : 'search', true); document.querySelector('.hash-page')?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>예시 재생 ↗</button>}</ConceptSection>)}</section>
  </main>;
}
