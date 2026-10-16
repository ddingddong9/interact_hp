import { useEffect, useMemo, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import { theoryChapters, networkInfo, formatIPv4, schedule, type Algorithm, type Process } from '../components/theory/model';
import '../styles/hash-table.css';
import '../styles/theory-learning.css';
function Table({headers,rows}:{headers:string[];rows:(string|number)[][]}){return <table className="theory-table"><thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>;}
function Scheduling(){
 const [algorithm,setAlgorithm]=useState<Algorithm>('FCFS'),[quantum,setQuantum]=useState(2),[time,setTime]=useState(0),[playing,setPlaying]=useState(false);
 const [processes,setProcesses]=useState<Process[]>([{id:'A',arrival:0,burst:7},{id:'B',arrival:2,burst:4},{id:'C',arrival:4,burst:1}]);
 const result=useMemo(()=>schedule(processes,algorithm,quantum),[processes,algorithm,quantum]);
 const reset=()=>{setTime(0);setPlaying(false);};
 useEffect(()=>{if(!playing)return;if(time>=result.timeline.length){setPlaying(false);return;}const id=setTimeout(()=>setTime(t=>t+1),650);return()=>clearTimeout(id);},[playing,time,result]);
 const executed=processes.map((_,i)=>result.timeline.slice(0,time).filter(p=>p===i).length);
 const segments:{process:number|null;start:number;end:number}[]=[];
 result.timeline.slice(0,time).forEach((p,t)=>{const last=segments.at(-1);if(last&&last.process===p)last.end=t+1;else segments.push({process:p,start:t,end:t+1});});
 return <><section className="hash-visual theory-visual">
  <div className="theory-controls"><label>알고리즘<select value={algorithm} onChange={e=>{setAlgorithm(e.target.value as Algorithm);reset();}}>{['FCFS','SJF','HRN','SRT','RR'].map(a=><option key={a}>{a}</option>)}</select></label>{algorithm==='RR'&&<label>시간 할당량<input type="number" min="1" max="10" value={quantum} onChange={e=>{const n=Number(e.target.value);if(n>=1&&n<=10){setQuantum(Math.floor(n));reset();}}}/></label>}</div>
  <table className="theory-table"><thead><tr><th>프로세스</th><th>도착</th><th>실행</th><th>현재 상태</th></tr></thead><tbody>{processes.map((p,i)=><tr key={p.id}><th scope="row">{p.id}</th>{(['arrival','burst'] as const).map(key=><td key={key}><input aria-label={`${p.id} ${key==='arrival'?'도착':'실행'} 시간`} type="number" min={key==='burst'?1:0} max={key==='burst'?20:30} value={p[key]} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=(key==='burst'?1:0)&&n<=(key==='burst'?20:30)){setProcesses(ps=>ps.map((v,j)=>j===i?{...v,[key]:n}:v));reset();}}}/></td>)}<td>{time<p.arrival?'도착 전':executed[i]===p.burst?'완료':result.timeline[time]===i?'실행 예정':'준비'}</td></tr>)}</tbody></table>
  <p className="theory-status" role="status">시각 {time} · {time===result.timeline.length?'모든 프로세스 완료':result.timeline[time]===null?'CPU 유휴':`${processes[result.timeline[time]!].id} 실행 예정`}</p>
  <svg viewBox="0 0 880 150" className="schedule-diagram" role="img" aria-label="시간에 따른 CPU 실행 구간"><line x1="20" y1="90" x2="860" y2="90" stroke="currentColor" strokeWidth="1"/>{segments.map(s=>{const unit=840/result.timeline.length;return <g key={s.start}><rect x={20+s.start*unit} y="30" width={(s.end-s.start)*unit} height="48" fill={s.process===null?'var(--site-bg)':['#a7bc7980','#68acbc80','#df955180'][s.process]} stroke="currentColor" strokeWidth="1"/><text x={20+(s.start+s.end)/2*unit} y="60" fontSize="14" textAnchor="middle" fill="currentColor">{s.process===null?'—':processes[s.process].id}</text></g>;})}{Array.from({length:Math.floor(result.timeline.length/(result.timeline.length>25?5:1))+1},(_,i)=>i*(result.timeline.length>25?5:1)).map(t=><text key={t} x={20+t*840/result.timeline.length} y="113" fontSize="13" textAnchor="middle" fill="currentColor">{t}</text>)}<text x="860" y="140" fontSize="13" textAnchor="end" fill="currentColor">전체 {result.timeline.length} · 현재 {time}</text></svg>
  <div className="theory-controls"><button disabled={!time} onClick={()=>{setPlaying(false);setTime(t=>t-1);}}>이전</button><button onClick={()=>{if(time===result.timeline.length)setTime(0);setPlaying(p=>!p);}}>{playing?'정지':'재생'}</button><button disabled={time===result.timeline.length} onClick={()=>{setPlaying(false);setTime(t=>t+1);}}>다음</button><button onClick={reset}>초기화</button><label>시각<input aria-label="실행 시각" type="range" min="0" max={result.timeline.length} value={time} onChange={e=>{setPlaying(false);setTime(Number(e.target.value));}}/></label></div>
  <Table headers={['프로세스','완료','반환','대기','응답']} rows={result.metrics.map(m=>[m.id,...(m.completion<=time?[m.completion,m.turnaround,m.waiting,m.response]:['—','—','—','—'])])}/>
  {time===result.timeline.length&&<p>평균 대기 {(result.metrics.reduce((n,m)=>n+m.waiting,0)/processes.length).toFixed(2)} · 평균 반환 {(result.metrics.reduce((n,m)=>n+m.turnaround,0)/processes.length).toFixed(2)}</p>}
 </section><section className="hash-explanation">
 <ConceptSection title="프로세스 스케줄링(Process Scheduling)" text="준비 상태인 프로세스 중 CPU를 사용할 대상을 정하는 규칙입니다. 위 계산은 CPU 하나, 각 프로세스의 CPU 실행 구간 하나를 비교합니다. 실행 중 I/O 요청이 생기면 대기로 이동하고, I/O 완료 뒤 준비 상태로 돌아옵니다. 선점은 실행 중인 작업을 중단해 준비 상태로 돌리는 것입니다."/>
 <ConceptSection title="선점과 선택 기준" text="FCFS는 도착 순서, SJF는 준비된 작업 중 실행 시간이 짧은 순서입니다. HRN은 선택 시점의 (대기 시간 + 실행 시간) ÷ 실행 시간이 큰 작업을 고릅니다. SRT는 남은 시간이 더 짧은 작업이 도착하면 선점합니다. RR은 준비 큐 순서로 정해진 시간 할당량만큼 실행합니다. 동률은 도착 순서, 그다음 A·B·C 순서입니다. SRT는 남은 시간이 같으면 현재 작업을 유지합니다. RR 경계에서는 새 도착을 먼저 큐에 넣고 기존 작업을 뒤에 넣습니다." comparison={{headers:['규칙','선점','특징'],rows:[['FCFS / FIFO','없음','긴 작업 뒤 짧은 작업이 지연'],['SJF','없음','긴 작업의 기아 가능'],['HRN','없음','오래 기다릴수록 비율 상승'],['SRT','있음','가장 짧은 남은 시간'],['RR','있음','시간 할당량 만료 시 뒤로']]}}/>
 <ConceptSection title="시간 계산" text="반환 시간(Turnaround Time)은 완료 − 도착, 대기 시간(Waiting Time)은 반환 − CPU 실행 시간, 응답 시간(Response Time)은 첫 실행 시작 − 도착입니다. 선점되면 대기는 여러 구간에 걸쳐 누적됩니다. 시각 t 표시는 [0, t)까지 실행을 마쳤다는 뜻이며 완료된 프로세스의 값부터 표에 표시합니다."/>
 <ConceptSection title="기아와 문맥 교환" text="짧은 작업이나 높은 우선순위 작업이 계속 오면 다른 작업이 오래 기다리는 기아(Starvation)가 생길 수 있습니다. 에이징(Aging)은 오래 기다린 작업의 우선순위를 높이는 방법입니다. RR 할당량이 크면 FCFS에 가까워지고 작으면 문맥 교환(Context Switching) 부담이 커집니다. 위 시간 계산에는 문맥 교환 비용을 더하지 않습니다."/>
 <ConceptSection title="우선순위와 기한부" text="우선순위 스케줄링은 정해진 우선순위를 기준으로 고르며 선점형과 비선점형 모두 가능합니다. 기한부 스케줄링은 마감 시간을 만족시키는 것이 목표이며 EDF는 가장 이른 마감 시각을 우선합니다. 두 방식 모두 선점 여부를 이름만으로 단정할 수 없습니다."/>
 <ConceptSection title="프로세스 간 통신(IPC)" text="공유 메모리는 같은 영역을 함께 사용하므로 동기화가 필요합니다. 메시지 큐는 메시지를 주고받고, 파이프는 데이터 스트림을 전달하며 소켓은 같은 컴퓨터나 네트워크의 프로세스를 연결합니다. 세마포어는 동시 접근을 조율하는 동기화 수단입니다." advanced/>
 </section></>;
}
function Networking({kind}:{kind:string}){
 const [ip,setIp]=useState('192.168.1.123'),[prefix,setPrefix]=useState(kind==='block-size'?27:26),[borrow,setBorrow]=useState(2),[selected,setSelected]=useState(0);
 const info=networkInfo(ip,prefix),split=kind==='subnetting';
 const borrowed=Math.min(borrow,32-prefix),childPrefix=prefix+borrowed;
 const children=info?Array.from({length:2**borrowed},(_,i)=>networkInfo(formatIPv4(info.network+i*2**(32-childPrefix)),childPrefix)!):[];
 const current=split?children[Math.min(selected,children.length-1)]:info;
 const bits=(n:number)=>n.toString(2).padStart(32,'0');
 const choose=(value:number)=>{setPrefix(value);setSelected(0);};
 return <><section className="hash-visual theory-visual">
 <div className="theory-controls"><label>IPv4 주소<input value={ip} onChange={e=>setIp(e.target.value)} spellCheck={false} inputMode="decimal" aria-invalid={!info}/></label><label>{split?'부모 프리픽스':'프리픽스'} /{prefix}<input type="range" min="0" max="32" value={prefix} onChange={e=>choose(Number(e.target.value))}/></label>{split&&<label>빌릴 비트<select value={borrowed} onChange={e=>{setBorrow(Number(e.target.value));setSelected(0);}}>{Array.from({length:Math.min(4,32-prefix)+1},(_,n)=><option key={n} value={n}>{n}비트 · {2**n}개</option>)}</select></label>}</div>
 <div className="theory-controls" aria-label="주소 예시"><button onClick={()=>{setIp('192.168.1.123');choose(26);}}>192.168.1.123/26</button><button onClick={()=>{setIp('172.16.6.140');choose(22);}}>172.16.6.140/22</button>{split&&<button onClick={()=>{setIp('192.168.1.0');choose(24);setBorrow(2);}}> /24 → /26 네 개</button>}</div>
 {!info||!current?<p role="alert">0~255인 숫자 네 개를 점으로 구분해 입력하세요.</p>:<>
 <p className="theory-status" role="status">{split?`부모 /${prefix} + ${borrowed}비트 = 자식 /${childPrefix}`:`${ip}/${prefix} · ${info.maskText}`}</p>
 <div className="network-legend"><span>네트워크</span><span>호스트</span></div>
 <div className="network-bits" aria-label="32비트 마스크">{[0,1,2,3].map(o=><div key={o}><div className="network-octet">{bits(current.mask).slice(o*8,o*8+8).split('').map((bit,i)=><span key={i} className={o*8+i<current.prefix?'network-bit':'host-bit'}>{bit}</span>)}</div><small>{current.maskText.split('.')[o]}</small></div>)}</div>
 {kind==='subnet-mask'&&<div className="network-calculation"><span>IP</span><code>{ip}</code><span>AND</span><code>{info.maskText}</code><span>네트워크</span><code>{formatIPv4(info.network)}</code><span>와일드카드</span><code>{formatIPv4(2**32-1-info.mask)}</code><span>OR 결과</span><code>{formatIPv4(info.broadcast)}</code></div>}
 {kind==='cidr-prefix'&&<p className="network-formula">{prefix} 네트워크 비트 + {32-prefix} 호스트 비트 = 32<br/>2<sup>{32-prefix}</sup> = {info.size.toLocaleString()}개 주소</p>}
 {kind==='block-size'&&<div className="network-formula"><p>{prefix===32?'호스트 비트 없음 · 주소 한 개':`${info.octet+1}번째 옥텟: 256 − ${info.maskText.split('.')[info.octet]} = ${info.block}`}</p><p>{prefix===32?formatIPv4(info.network):`${ip.split('.')[info.octet]} ÷ ${info.block} → 몫 ${Math.floor(Number(ip.split('.')[info.octet])/info.block)} → 시작 ${Math.floor(Number(ip.split('.')[info.octet])/info.block)*info.block}`}</p><p>전체 주소 수 = {info.block} × 256<sup>{3-info.octet}</sup> = {info.size.toLocaleString()}</p></div>}
 {split&&<><div className="subnet-choices" aria-label="자식 서브넷 선택">{children.map((c,i)=><button key={i} aria-pressed={i===Math.min(selected,children.length-1)} onClick={()=>setSelected(i)}>{i+1}. {formatIPv4(c.network)}/{c.prefix}</button>)}</div><p>선택한 서브넷 {Math.min(selected,children.length-1)+1} · 주소 {current.size.toLocaleString()}개</p></>}
 <Table headers={['구분','계산 결과']} rows={[
 ['네트워크 주소',formatIPv4(current.network)],
 [current.prefix<31?'브로드캐스트 주소':'주소 구간의 끝',formatIPv4(current.broadcast)],
 ['전체 주소 개수',current.size.toLocaleString()],
 [current.prefix===31?'포인트 투 포인트 주소':current.prefix===32?'단일 주소':'할당 가능한 호스트',current.usable.toLocaleString()],
 ['주소 범위',`${formatIPv4(current.first)} ~ ${formatIPv4(current.last)}`],
 ]}/>
 {current.prefix>=31&&<p>/31은 포인트 투 포인트 링크에서 두 주소를 사용하고, /32는 단일 주소를 나타냅니다. 일반 서브넷의 네트워크·브로드캐스트 예약 공식을 적용하지 않습니다.</p>}
 </>}
 </section><section className="hash-explanation">
 {kind==='subnet-mask'&&<>
 <ConceptSection title="서브넷 마스크(Subnet Mask)" text="IPv4는 8비트 옥텟(Octet) 네 개, 총 32비트입니다. 마스크의 앞쪽 연속된 1은 네트워크 부분, 뒤쪽 0은 호스트 부분을 가리킵니다. 255.255.255.192는 마지막 옥텟이 11000000이라 네트워크 26비트와 호스트 6비트로 나뉩니다."/>
 <ConceptSection title="AND와 OR로 주소 구하기" text="주소와 마스크를 비트별 AND하면 네트워크 주소가 됩니다. 마스크를 반전한 와일드카드(Wildcard Mask)를 네트워크 주소에 OR하면 호스트 비트가 모두 1인 브로드캐스트 주소가 됩니다. 기본 예제의 123 AND 192는 64이므로 192.168.1.64가 시작, 192.168.1.127이 끝입니다."/>
 <ConceptSection title="전체 주소와 호스트 수" text="호스트 비트가 h개면 전체 주소는 2의 h제곱 개입니다. 일반적인 /0~ /30 서브넷에서는 시작과 끝 주소를 제외하므로 할당 가능한 호스트 수는 전체 − 2입니다. /26의 64개 주소와 62개 호스트를 혼동하지 마세요."/>
 </>}
 {kind==='cidr-prefix'&&<>
 <ConceptSection title="CIDR와 프리픽스(Prefix)" text="CIDR(Classless Inter-Domain Routing)은 클래스 A·B·C의 고정 경계 대신 프리픽스 길이로 주소 블록을 표현합니다. /n은 앞쪽 네트워크 비트가 n개라는 뜻이며 0부터 32까지 가능합니다. /24는 255.255.255.0, /26은 255.255.255.192입니다."/>
 <ConceptSection title="주소 개수에서 거꾸로 찾기" text="정렬된 연속 블록에 전체 주소 64개가 있다면 호스트 비트는 6개이고 프리픽스는 32 − 6 = 26입니다. 64대의 장치가 필요하다는 조건은 다릅니다. 일반 서브넷의 /26은 호스트가 62개라 부족하므로 /25를 선택해야 합니다. 주소 구간 크기뿐 아니라 시작 주소가 그 크기의 경계에 맞는지도 확인합니다."/>
 <ConceptSection title="프리픽스 기준 비교" text="프리픽스가 길수록 같은 네트워크로 묶이는 범위가 작아집니다. IP 뒤에 /26을 쓴 값이 반드시 네트워크 시작 주소는 아닙니다. 192.168.1.123/26은 그 호스트의 프리픽스 표기이고, 포함된 네트워크는 192.168.1.64/26입니다." comparison={{headers:['프리픽스','마스크','전체 / 일반 호스트'],rows:[['/24','255.255.255.0','256 / 254'],['/25','255.255.255.128','128 / 126'],['/26','255.255.255.192','64 / 62'],['/27','255.255.255.224','32 / 30'],['/30','255.255.255.252','4 / 2']]}}/>
 </>}
 {kind==='block-size'&&<>
 <ConceptSection title="블록 크기(Block Size)" text="마지막 옥텟에서 경계가 나뉘는 /25~ /30은 256에서 마스크의 마지막 값을 빼면 주소 구간의 간격을 구할 수 있습니다. /27의 224라면 간격은 32이고 시작은 0, 32, 64, 96 순서입니다. 주소 123은 96~127 구간에 속합니다."/>
 <ConceptSection title="셋째 옥텟까지 바뀌는 경우" text="/22의 마스크는 255.255.252.0입니다. 이때 무조건 마지막 0을 빼지 말고 경계가 있는 셋째 옥텟에서 256 − 252 = 4를 구합니다. 172.16.6.140은 셋째 값 4~7의 블록에 속하여 네트워크는 172.16.4.0, 브로드캐스트는 172.16.7.255입니다."/>
 <ConceptSection title="간격과 전체 크기 구분" text="경계 옥텟 뒤에 온전한 옥텟이 남아 있다면 그만큼 256을 곱해야 전체 주소 수가 됩니다. /22의 간격은 셋째 옥텟에서 4이고 전체 주소는 4 × 256 = 1024개입니다. 시작은 몫을 내림해 간격을 곱하고, 끝 주소는 다음 블록 시작에서 1을 뺍니다."/>
 </>}
 {split&&<>
 <ConceptSection title="서브넷팅(Subnetting)과 FLSM" text="기존 호스트 비트의 앞부분을 새 네트워크 비트로 빌려 주소 블록을 나누는 작업입니다. 고정 길이 서브넷 마스크(FLSM)는 모든 자식의 크기를 같게 나눕니다. /24에서 2비트를 빌리면 /26이 되고 2² = 4개 서브넷이 만들어집니다."/>
 <ConceptSection title="필요한 서브넷 수에서 비트 찾기" text="필요한 개수가 k개라면 2의 b제곱이 k 이상인 가장 작은 b를 고릅니다. 세 개가 필요해도 2비트를 빌려 네 블록을 만듭니다. 새 프리픽스는 부모 + b, 자식 전체 주소는 2의 (32 − 새 프리픽스)제곱입니다. 호스트 수도 충족하는지 별도로 검사합니다."/>
 <ConceptSection title="분할 후 주소 계산" text="192.168.1.0/24를 /26으로 나누면 시작은 .0, .64, .128, .192입니다. 각 블록은 주소 64개, 일반 호스트 62개를 가집니다. 두 번째 블록은 .64~.127, 장치에 할당하는 범위는 .65~.126입니다. 서브넷 개수에 예전의 −2 규칙은 적용하지 않습니다."/>
 <ConceptSection title="가변 길이 서브넷 마스크(VLSM)" text="VLSM은 필요한 호스트 수에 맞춰 서로 다른 크기를 할당합니다. 큰 블록부터 정렬된 주소 경계에 놓고, 다음 블록이 이전 블록과 겹치지 않게 배치합니다. 위 선택기는 같은 길이를 쓰는 FLSM을 계산합니다." advanced/>
 </>}
 </section></>;
}
const views=[
 {name:'객체 모델',en:'Object Model',question:'어떤 객체와 관계가 있는가?',diagram:'객체 다이어그램',text:'정적 구조를 나타냅니다. 객체·클래스, 속성, 연산과 관계를 찾습니다. 예매에서는 회원과 예약이 있고, 한 회원이 여러 예약을 갖는 관계를 표현합니다.',labels:['회원','예약'],edge:'1 → 여러 개'},
 {name:'동적 모델',en:'Dynamic Model',question:'이벤트에 따라 상태가 어떻게 바뀌는가?',diagram:'상태 다이어그램',text:'시간에 따른 상태와 이벤트, 전이를 나타냅니다. 예약이 결제 대기에서 결제 완료로 바뀌는 조건을 살펴봅니다. 데이터가 흘러가는 경로 자체와는 구분합니다.',labels:['결제 대기','예약 확정'],edge:'결제 성공'},
 {name:'기능 모델',en:'Functional Model',question:'입력 데이터가 어떤 처리로 출력이 되는가?',diagram:'자료 흐름도 · DFD',text:'데이터 변환과 흐름을 나타냅니다. 예매 요청이 검증 처리에 들어가 예약 결과로 바뀌는 과정입니다. 외부 개체, 처리, 저장소와 흐름을 표현하며 실행 순서나 상태 전이와 구분합니다.',labels:['예매 요청','예약 처리','예약 결과'],edge:'자료 흐름'},
];
function Rumbaugh(){const[view,setView]=useState(0),[answer,setAnswer]=useState<number|null>(null),[quiz,setQuiz]=useState(0);const v=views[view];const questions=[{q:'결제 성공 이벤트로 예약 상태가 대기에서 확정으로 변한다.',a:1},{q:'회원의 이름·연락처와 회원-예약 관계를 정의한다.',a:0},{q:'주문 데이터가 금액 계산을 거쳐 청구서 데이터로 변환된다.',a:2}];return <><section className="hash-visual theory-visual"><div className="theory-controls" role="group" aria-label="모델 관점 선택">{views.map((v,i)=><button key={v.en} aria-pressed={view===i} onClick={()=>setView(i)}>{v.name}</button>)}</div><h2>{v.name} <small>{v.en}</small></h2><p>{v.question}</p><svg viewBox="0 0 720 190" className="rumbaugh-diagram" role="img" aria-label={`${v.name}: ${v.labels.join(' → ')} · ${v.edge}`}>
{v.labels.map((label,i)=>{const x=v.labels.length===2?90+i*390:20+i*250;return <g key={label}>{view===2&&i===1?<ellipse cx={x+90} cy="100" rx="88" ry="38" fill="none" stroke="currentColor"/>:<rect x={x} y="62" width="180" height="76" rx={view===1?35:0} fill="none" stroke="currentColor"/>}<text x={x+90} y="106" textAnchor="middle" fill="currentColor" fontSize="20">{label}</text>{i<v.labels.length-1&&<><line x1={x+180} x2={v.labels.length===2?480:x+250} y1="100" y2="100" stroke="currentColor"/><path d={`M ${v.labels.length===2?470:x+240} 95 l 10 5 l -10 5`} fill="none" stroke="currentColor"/></>}</g>})}<text x="360" y="35" textAnchor="middle" fill="currentColor" fontSize="17">{v.edge}</text></svg><p>{v.text}</p><p>대표 표현: {v.diagram}</p>
 <div className="rumbaugh-quiz"><h2>관점 구분 연습</h2><p>{questions[quiz].q}</p><div className="theory-controls">{views.map((v,i)=><button key={i} aria-pressed={answer===i} onClick={()=>setAnswer(i)}>{v.name}</button>)}</div>{answer!==null&&<p role="status">{answer===questions[quiz].a?'맞습니다.':'다시 살펴보세요.'} {views[questions[quiz].a].question}</p>}<button onClick={()=>{setQuiz(q=>(q+1)%questions.length);setAnswer(null);}}>다음 문제</button></div>
 </section><section className="hash-explanation"><ConceptSection title="럼바우(Rumbaugh)의 OMT" text="객체 모델링 기법(OMT, Object Modeling Technique)은 시스템을 객체·동적·기능의 세 관점으로 분석합니다. 서로 다른 세 시스템을 만드는 것이 아니라 같은 시스템의 구조, 시간에 따른 행위, 데이터 변환을 각각 살펴보는 것입니다."/><ConceptSection title="객체·동적·기능 구분" text="객체 모델은 무엇이 존재하는지, 동적 모델은 언제 어떤 이벤트로 상태가 바뀌는지, 기능 모델은 입력이 어떤 처리를 거쳐 출력이 되는지를 묻습니다. 시험에서는 정보·정적 구조는 객체, 이벤트·상태는 동적, 처리·자료 흐름은 기능으로 연결해 판단합니다." comparison={{headers:['모델','핵심','대표 표현'],rows:[['객체(정보)','객체·속성·연산·관계','객체 다이어그램'],['동적','상태·이벤트·전이','상태 다이어그램'],['기능','입력·처리·출력','자료 흐름도(DFD)']]}}/><ConceptSection title="암기 뒤에는 관점을 확인" text="객·동·기는 객체 → 동적 → 기능의 학습 순서를 기억하는 단서입니다. 상태 전이도의 화살표는 이벤트에 따른 전이를, DFD의 화살표는 데이터를 의미합니다. 모양이 비슷해도 화살표가 뜻하는 것을 확인하면 구분할 수 있습니다."/></section></>;}
export default function TheoryLearning({kind}:{kind:string}){const chapter=theoryChapters.find(c=>c.id===kind)!;return <main className="hash-page" data-page-scroll><header className="hash-header"><h1>{chapter.title}<small className="theory-subtitle">{chapter.korean}</small></h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>{kind==='process-scheduling'?<Scheduling/>:kind==='rumbaugh'?<Rumbaugh/>:<Networking kind={kind}/>}</main>;}
