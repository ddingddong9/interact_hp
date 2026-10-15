import { bilingualChapterName } from '../data/chapterNames';
import { useEffect, useMemo, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import { pythonLessonById, pythonLessons } from '../components/python/model';
import PythonMemory from '../components/python/PythonMemory';
import { highlightPython } from '../components/python/highlight';
import '../styles/hash-table.css';
import '../styles/java-execution.css';
import '../styles/c-execution.css';
import '../styles/python-execution.css';
export default function PythonExecution({kind}:{kind:string}) {
  const lesson=pythonLessonById[kind];
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1);
  const frame=lesson.frames[step], atEnd=step===lesson.frames.length-1;
  const colored=useMemo(()=>highlightPython(lesson.code.join('\n')),[lesson]);
  useEffect(()=>{if(!playing||atEnd)return;const timer=window.setTimeout(()=>setStep(s=>s+1),1900/speed);return()=>window.clearTimeout(timer);},[playing,atEnd,step,speed]);
  useEffect(()=>{if(atEnd)setPlaying(false);},[atEnd]);
  const visits=useMemo(()=>{const map=new Map<number,{order:number;step:number}[]>();let previous=-1,order=0;for(let i=0;i<=step;i++){const f=lesson.frames[i];if(f.line<0)continue;if(f.line!==previous){order++;map.set(f.line,[...(map.get(f.line)??[]),{order,step:i}]);}previous=f.line;}return map;},[lesson,step]);
  const go=(n:number)=>{setPlaying(false);setStep(n);};
  return <main className="hash-page c-page python-page" data-page-scroll>
    <header className="hash-header"><h1>{lesson.title}</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual java-visual" aria-label="Python 코드 실행 순서">
      <label className="java-example-select">챕터<select value={kind} onChange={e=>{window.location.hash=`python-${e.target.value}`;}}>{pythonLessons.map((l,i)=><option value={l.id} key={l.id}>{i+1}p · {bilingualChapterName(l.title)}</option>)}</select></label>
      <p className="java-problem-date">2026년 3회 공부 범위 · 1순위 · 연습 예제</p>
      <div className="hash-status" role="status">{frame.message}</div>
      <div className="hash-playback"><div><button disabled={!step} onClick={()=>go(step-1)} aria-label="이전 단계">←</button><button onClick={()=>{if(atEnd)setStep(0);setPlaying(p=>!p);}}>{playing?'정지':atEnd?'다시 재생':'재생'}</button><button disabled={atEnd} onClick={()=>go(step+1)} aria-label="다음 단계">→</button><span className="hash-step">{step+1} / {lesson.frames.length}</span></div><div><label className="hash-speed">속도<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={()=>go(0)}>초기화</button></div></div>
      <div className="java-workspace">
        <div className="java-source"><div className="java-source-labels"><span>코드</span><span>실행 순서</span></div><pre className="java-code" aria-label="Python 소스 코드"><code>{lesson.code.map((line,i)=>{const orders=visits.get(i)??[];return <span key={i} className={`java-line ${frame.line===i?'current':''}`} aria-current={frame.line===i?'step':undefined}><span className="java-line-number" aria-hidden="true">{i+1}</span><span>{colored[i]?.map((t,j)=><span className={t.kind?`java-token-${t.kind}`:undefined} key={j}>{t.text}</span>)??line}</span><span className="java-line-orders">{orders.length>2&&<span aria-hidden="true">…</span>}{orders.slice(-2).map(v=><span key={v.order} className={frame.line===i&&v===orders.at(-1)?'active':''}><button onClick={()=>go(v.step)} aria-label={`${v.order}번째 실행으로 이동`}>{v.order}</button></span>)}</span></span>;})}</code></pre></div>
        <div className="java-inspector"><PythonMemory frame={frame} />
          {!!frame.values.length&&<div className="java-runtime"><section><h2>현재 계산</h2><dl className="java-fields">{frame.values.map(([key,val])=><div key={key}><dt>{key}</dt><dd>{val}</dd></div>)}</dl></section></div>}
        </div>
      </div>
      <section className="java-output" aria-label="실행 결과"><h2>콘솔 <small>Console</small></h2><div className="java-console"><pre>{frame.output||'출력 없음'}</pre></div>{frame.result&&<p className="java-return">메서드 반환값 <strong>{frame.result}</strong></p>}</section>
    </section>
    <section className="hash-explanation" aria-label="개념 설명"><ConceptSection title="변수의 연결과 객체의 내용" text="변수는 객체를 가리키는 이름입니다. 화살표의 숫자는 예시 객체 번호이며 같은 번호는 같은 객체를 뜻합니다. 리스트의 요소도 다른 리스트를 가리킬 수 있습니다. 정수와 None은 값으로 간단히 표시하고, 문자열과 리스트는 내용이 보이는 객체로 펼칩니다. 문자열 칸 위에는 앞에서 세는 인덱스와 뒤에서 세는 음수 인덱스를 함께 표시합니다." />{lesson.concepts.map(c=><ConceptSection key={c.title} {...c}/>)}</section>
  </main>;
}
