import { bilingualChapterName } from '../data/chapterNames';
import { useEffect, useMemo, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import { cLessonById, cLessons } from '../components/c/lessons';
import { highlightC } from '../components/c/highlight';
import type { Cell } from '../components/c/model';
import '../styles/hash-table.css';
import '../styles/java-execution.css';
import '../styles/c-execution.css';
const regions = { local: '지역 변수', heap: '힙', literal: '문자열 리터럴', code: '함수 코드' };
export default function CExecution({kind}:{kind:string}) {
  const lesson=cLessonById[kind];
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[selected,setSelected]=useState<string|null>(null);
  const frame=lesson.frames[step], atEnd=step===lesson.frames.length-1;
  const colored=useMemo(()=>highlightC(lesson.code.join('\n')),[lesson]);
  useEffect(()=>{if(!playing||atEnd)return;const timer=window.setTimeout(()=>setStep(s=>s+1),1900/speed);return()=>window.clearTimeout(timer);},[playing,atEnd,step,speed]);
  useEffect(()=>{if(atEnd)setPlaying(false);},[atEnd]);
  const visits=useMemo(()=>{const map=new Map<number,{order:number;step:number}[]>();let previous=-1,order=0;for(let i=0;i<=step;i++){const f=lesson.frames[i];if(f.line<0)continue;if(f.line!==previous){order++;map.set(f.line,[...(map.get(f.line)??[]),{order,step:i}]);}previous=f.line;}return map;},[lesson,step]);
  const path:Cell[]=[];
  let pointer=frame.cells.find(c=>c.name===selected);
  while(pointer&&!path.some(c=>c.name===pointer!.name)){path.push(pointer);pointer=pointer.alive&&pointer.target!==undefined?frame.cells.find(c=>c.alive&&c.address===pointer!.target):undefined;}
  const go=(n:number)=>{setPlaying(false);setStep(n);setSelected(null);};
  return <main className="hash-page c-page" data-page-scroll>
    <header className="hash-header"><h1>{lesson.title}</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual java-visual" aria-label="C 코드 실행 순서">
      <label className="java-example-select">챕터<select value={kind} onChange={e=>{window.location.hash=`c-${e.target.value}`;}}>{cLessons.map((l,i)=><option value={l.id} key={l.id}>{i+1}p · {bilingualChapterName(l.title)}</option>)}</select></label>
      <p className="java-problem-date">연습 예제</p>
      <div className="hash-status" role="status">{frame.message}</div>
      <div className="hash-playback"><div><button disabled={!step} onClick={()=>go(step-1)} aria-label="이전 단계">←</button><button onClick={()=>{if(atEnd)setStep(0);setPlaying(p=>!p);}}>{playing?'정지':atEnd?'다시 재생':'재생'}</button><button disabled={atEnd} onClick={()=>go(step+1)} aria-label="다음 단계">→</button><span className="hash-step">{step+1} / {lesson.frames.length}</span></div><div><label className="hash-speed">속도<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={()=>go(0)}>초기화</button></div></div>
      <div className="java-workspace">
        <div className="java-source"><div className="java-source-labels"><span>코드</span><span>실행 순서</span></div><pre className="java-code" aria-label="C 소스 코드"><code>{lesson.code.map((line,i)=>{const orders=visits.get(i)??[];return <span key={i} className={`java-line ${frame.line===i?'current':''}`} aria-current={frame.line===i?'step':undefined}><span className="java-line-number" aria-hidden="true">{i+1}</span><span>{colored[i]?.map((t,j)=><span className={t.kind?`java-token-${t.kind}`:undefined} key={j}>{t.text}</span>)??line}</span><span className="java-line-orders">{orders.length>2&&<span aria-hidden="true">…</span>}{orders.slice(-2).map(v=><span key={v.order} className={frame.line===i&&v===orders.at(-1)?'active':''}><button onClick={()=>go(v.step)} aria-label={`${v.order}번째 실행으로 이동`}>{v.order}</button></span>)}</span></span>;})}</code></pre></div>
        <div className="java-inspector"><section className="c-memory" aria-label="메모리"><h2>메모리 <small>Memory</small></h2><p className="java-hint">칸을 선택하면 저장된 주소를 따라갑니다.</p>{frame.cells.length?Object.entries(regions).map(([region,label])=>{const cells=frame.cells.filter(c=>c.region===region);return cells.length?<div className="c-memory-region" key={region}><h3>{label}</h3><div className="c-cells">{cells.map(cell=>{const target=cell.target!==undefined?frame.cells.find(c=>c.alive&&c.address===cell.target):undefined;return <div className="c-cell-flow" key={cell.name}><button className={`c-cell ${frame.active.includes(cell.name)?'is-current':''} ${path.some(c=>c.name===cell.name)?'is-selected':''} ${!cell.alive?'is-freed':''}`} aria-pressed={selected===cell.name} onClick={()=>setSelected(s=>s===cell.name?null:cell.name)} aria-label={`${cell.name}, 자신의 주소 ${cell.address}, 저장값 ${cell.value}${target?`, ${target.name}을 가리킴`:''}`}><header><strong>{cell.name}</strong><span>{cell.type}</span></header><div><span>자신의 주소</span><code>{cell.address}</code></div><div><span>저장값</span><code>{cell.value}</code></div></button>{cell.target!==undefined&&cell.alive&&<div className="c-target"><span aria-hidden="true">→</span>{target?<button onClick={()=>setSelected(cell.name)}>{target.name} <code>@{target.address}</code></button>:<span>배열 바로 다음 위치 <code>@{cell.target}</code></span>}</div>}</div>;})}</div></div>:null;}):<p className="java-empty">아직 선언된 변수 없음</p>}{selected&&path.length>0&&<p className="c-path" aria-live="polite">{path.map(c=>c.name).join(' → ')}{path.at(-1)?.target!==undefined&&!frame.cells.some(c=>c.address===path.at(-1)!.target)?' → 배열 바로 다음 위치':''}</p>}</section>
          <div className="java-runtime"><section><h2>호출 스택 <small>Call Stack</small></h2><ol className="java-stack">{[...frame.stack].reverse().map((call,i)=><li key={`${call}-${i}`} className={!i?'executing':''}><span aria-hidden="true">{!i?'→':'·'}</span><code>{call}</code></li>)}</ol>{!frame.stack.length&&<p className="java-empty">실행 전 · 호출 없음</p>}</section>{!!frame.values.length&&<section><h2>현재 계산</h2><dl className="java-fields">{frame.values.map(([key,val])=><div key={key}><dt>{key}</dt><dd>{val}</dd></div>)}</dl></section>}</div>
        </div>
      </div>
      <section className="java-output" aria-label="실행 결과"><h2>콘솔 <small>Console</small></h2><div className="java-console"><pre>{frame.output||'출력 없음'}</pre></div>{frame.result&&<p className="java-return">반환값 <strong>{frame.result}</strong></p>}</section>
    </section>
    <section className="hash-explanation" aria-label="개념 설명"><ConceptSection title="메모리 칸을 읽는 방법" text="자신의 주소는 그 변수의 위치이고 저장값은 그 칸 안에 들어 있는 내용입니다. 포인터 칸의 저장값은 다른 칸의 주소입니다. 화살표는 그 연결을 나타냅니다. 주소는 예시로 배치했으며 int 4바이트, 포인터 8바이트를 사용하는 예제로 요소 간 이동을 계산합니다." />{lesson.concepts.map(c=><ConceptSection key={c.title} {...c}/>)}</section>
  </main>;
}
