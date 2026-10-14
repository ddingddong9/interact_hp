import { useEffect, useMemo, useState } from 'react';
import ConceptSection from '../components/ConceptSection';
import JavaMemory from '../components/java/JavaMemory';
import { executionOrder } from '../components/java/executionOrder';
import { highlightJava } from '../components/java/highlight';
import { lessons, type JavaKind } from '../components/java/model';
import '../styles/hash-table.css';
import '../styles/java-execution.css';

export default function JavaExecution({ kind }: { kind: JavaKind }) {
  const [example, setExample] = useState<JavaKind>(kind);
  const lesson = lessons[example];
  const coloredCode = useMemo(() => highlightJava(lesson.code.join('\n')), [lesson]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const frame = lesson.frames[step];
  const visits = useMemo(() => executionOrder(lesson.frames, step), [lesson, step]);
  const atEnd = step === lesson.frames.length - 1;
  useEffect(() => {
    if (!playing || atEnd) return;
    const timer = window.setTimeout(() => setStep(s => s + 1), 1900 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, atEnd, step, speed]);
  useEffect(() => { if (atEnd) setPlaying(false); }, [atEnd]);
  const move = (delta: number) => { setPlaying(false); setStep(s => s + delta); };
  return <main className="hash-page" data-page-scroll>
    <header className="hash-header"><h1>{lesson.title}</h1><a href="#home" aria-label="홈으로 돌아가기">×</a></header>
    <section className="hash-visual java-visual" aria-label="Java 코드 실행 순서">
      {kind === 'method-dispatch' && <div className="structure-views java-examples" role="group" aria-label="문제 선택"><button aria-pressed={example === 'method-dispatch'} onClick={() => { setPlaying(false); setStep(0); setExample('method-dispatch'); }}>기출 문제</button><button aria-pressed={example === 'overriding-practice'} onClick={() => { setPlaying(false); setStep(0); setExample('overriding-practice'); }}>추가 연습</button></div>}
      {kind === 'override-annotation' && <label className="java-example-select">예제<select value={example} onChange={e => { setPlaying(false); setStep(0); setExample(e.target.value as JavaKind); }}><optgroup label="개념 비교"><option value="override-annotation">정상 · @Override 있음</option><option value="override-without">정상 · @Override 없음</option><option value="override-typo">오타 · @Override 없음</option><option value="override-error">오타 · @Override 있음</option></optgroup><optgroup label="연습 문제"><option value="override-practice-basic">연습 1 · show()</option><option value="override-practice-overload">연습 2 · show()와 show(int)</option></optgroup></select></label>}
      {kind === 'method-overloading' && <label className="java-example-select">문제<select value={example} onChange={e => { setPlaying(false); setStep(0); setExample(e.target.value as JavaKind); }}><optgroup label="기출 문제"><option value="method-overloading">2026년 1회 · 타입과 연산</option><option value="overload-binding">2026년 1회 · 컴파일타임 바인딩</option><option value="overload-recursion">2025년 1회 · 오버로딩과 재귀</option><option value="overload-string-recursion">2024년 2회 · 문자열 재귀</option><option value="overload-array-recursion">2025년 1회 · 배열 재귀</option></optgroup><optgroup label="연습 문제"><option value="overload-basic">연습 1 · pick(int), pick(String)</option><option value="overload-shapes">연습 2 · Shape, Circle</option></optgroup></select></label>}
      {kind === 'compile-time-binding' && <div className="structure-views java-examples" role="group" aria-label="예제 선택"><button aria-pressed={example === 'compile-time-binding'} onClick={() => { setPlaying(false); setStep(0); setExample('compile-time-binding'); }}>선언 타입 비교</button><button aria-pressed={example === 'binding-exam'} onClick={() => { setPlaying(false); setStep(0); setExample('binding-exam'); }}>기출 문제</button></div>}
      {lesson.problem && <p className="java-problem-date">{lesson.problem}</p>}
      <div className="hash-status" role="status">{frame.message}</div>
      <div className="hash-playback"><div><button disabled={step === 0} onClick={() => move(-1)} aria-label="이전 단계">←</button><button onClick={() => { if (atEnd) setStep(0); setPlaying(p => !p); }}>{playing ? '정지' : atEnd ? '다시 재생' : '재생'}</button><button disabled={atEnd} onClick={() => move(1)} aria-label="다음 단계">→</button><span className="hash-step">{step + 1} / {lesson.frames.length}</span></div><div><label className="hash-speed">속도<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onClick={() => { setPlaying(false); setStep(0); }}>초기화</button></div></div>
      <div className="java-workspace">
        <div className="java-source"><div className="java-source-labels"><span>코드</span><span>실행 순서</span></div><pre className="java-code" aria-label="Java 소스 코드"><code>{lesson.code.map((line, index) => {
          const orders = visits.get(index) ?? [];
          return <span key={index} className={`java-line ${index === frame.line ? 'current' : ''}`} aria-current={index === frame.line ? 'step' : undefined}><span className="java-line-number" aria-hidden="true">{index + 1}</span><span>{coloredCode[index]?.map((token, i) => token.kind ? <span key={i} className={`java-token-${token.kind}`}>{token.text}</span> : token.text) ?? line}</span><span className="java-line-orders" title={orders.length ? `실행 순서: ${orders.map(visit => visit.order).join(' → ')}` : undefined}>{orders.length > 2 && <span aria-hidden="true">…</span>}{orders.slice(-2).map((visit, i) => <span key={visit.order} className={index === frame.line && visit === orders[orders.length - 1] ? 'active' : ''}>{i > 0 && <span aria-hidden="true">›</span>}<button aria-label={`${visit.order}번째 실행, ${index + 1}번 줄로 이동`} onClick={() => { setPlaying(false); setStep(visit.step); }}>{visit.order}</button></span>)}</span></span>;
        })}</code></pre></div>
        <div className="java-inspector">
          <JavaMemory frame={frame} frames={lesson.frames} step={step} kind={example} />
        <div className="java-runtime">
          {frame.binding && <section className="java-binding"><h2>{frame.binding.phase === 'compile' ? '컴파일타임' : '런타임'} <small>{frame.binding.phase === 'compile' ? 'Compile Time' : 'Runtime'}</small></h2><p className="java-binding-site"><code>{frame.binding.site}</code></p><dl className="java-fields"><div><dt>선언 타입</dt><dd>{frame.binding.declared}</dd></div><div><dt>인자 타입</dt><dd>{frame.binding.argument}</dd></div></dl><p className="java-hint">컴파일 시점의 후보</p><ul className="java-candidates">{frame.binding.candidates.map(candidate => <li key={candidate} className={candidate === frame.binding!.signature ? 'selected' : ''}><span aria-hidden="true">{candidate === frame.binding!.signature ? '→' : '·'}</span><code>{candidate}</code>{candidate === frame.binding!.signature && <small>선택</small>}</li>)}</ul><p className="java-binding-fixed">컴파일 시 선택한 메서드 <code>{frame.binding.signature}</code></p>{frame.binding.implementation && <p className="java-binding-fixed">실행할 구현 <code>{frame.binding.implementation}</code></p>}</section>}
          {frame.compile && <section className="java-compilation"><h2>컴파일 <small>Compilation</small></h2><p>{({ pending: '검사 전', checking: '검사 중', success: '성공 · 실행 가능', error: '오류 · 실행 불가' })[frame.compile]}</p>{frame.diagnostic && <p className="java-diagnostic"><code>{frame.diagnostic}</code></p>}</section>}
          <section><h2>호출 스택 <small>Call Stack</small></h2><p className="java-hint">{frame.stack.length ? '현재 실행 중인 호출이 맨 위입니다.' : '실행 전 · 호출 없음'}</p><ol className="java-stack">{[...frame.stack].reverse().map((call, index) => <li key={call} className={index === 0 ? 'executing' : ''}><span aria-hidden="true">{index === 0 ? '→' : '·'}</span><code>{call}</code></li>)}</ol></section>
          {!!frame.locals?.length && <section><h2>현재 값 <small>Local Values</small></h2><dl className="java-fields">{frame.locals.map(([name, value]) => <div key={name}><dt>{name}</dt><dd key={value}>{value}</dd></div>)}</dl></section>}

        </div>
        </div>
      </div>
      <section className="java-output" aria-label="실행 결과"><h2>콘솔 <small>Console</small></h2><div className="java-console">{frame.output.length ? frame.output.map((line, i) => <p key={i}>{line}</p>) : <p className="java-empty">출력 없음</p>}</div>{frame.result && <p className="java-return">반환값 <strong>{frame.result}</strong></p>}</section>

    </section>
    <section className="hash-explanation" aria-label="개념 설명">
      {lesson.frames.some(snapshot => snapshot.allocated) && <ConceptSection title="객체 주소와 참조(Reference)" text="주소 100은 객체를 식별하기 위한 예시 숫자입니다. 참조 변수에는 객체 자체가 아니라 그 객체를 가리키는 참조가 저장됩니다. 생성자에서 사용하는 this도 같은 객체를 가리킵니다. 부모 필드와 자식 필드는 주소 100의 객체 안에 함께 존재합니다. 새로운 객체가 추가되면 101, 102처럼 다른 예시 주소로 구분할 수 있습니다." />}
      {kind === 'compile-time-binding' && <>
        <ConceptSection title="컴파일타임 바인딩(Compile-time Binding)" text="컴파일러는 호출 지점에서 볼 수 있는 메서드 후보 중 인자 타입에 맞는 시그니처를 선택합니다. 변수로 호출할 때는 변수의 선언 타입(Declared Type)이 후보를 찾는 기준입니다. 선택이 끝난 뒤에는 실제 객체에 더 구체적인 오버로드가 있더라도 호출 시그니처를 다시 고르지 않습니다." />
        <ConceptSection title="후보 집합과 더 구체적인 메서드" text="A 타입의 a에서는 f(Object)만 보입니다. String은 Object의 하위 타입이므로 이 메서드에 전달할 수 있습니다. B 타입의 b에서는 f(Object)와 f(String)이 모두 보이며 f(String)이 더 구체적이어서 선택됩니다. 후보 집합에는 선언 타입에서 접근 가능한 상속 메서드도 포함됩니다." comparison={{ headers: ['호출 지점', '후보', '컴파일 시 선택한 메서드', '실행 구현'], rows: [['a · A 타입', 'f(Object)', 'f(Object)', 'B.f(Object) → 2'], ['b · B 타입', 'f(Object), f(String)', 'f(String)', 'B.f(String) → 3']] }} />
        <ConceptSection title="런타임 바인딩(Runtime Binding)" text="컴파일 때 선택한 시그니처의 실제 구현을 실행할 때 찾습니다. a가 가리키는 객체 100은 B이므로 f(Object)는 재정의된 B.f(Object)를 실행합니다. f(String)을 실행하는 것으로 바뀌지는 않습니다. 오버로딩 선택과 오버라이딩 구현 선택을 두 단계로 나누어 보세요." />
        <ConceptSection title="메서드 본문이 작성된 위치" text="기출의 g()는 A에 작성되어 있습니다. 그 안의 f(&quot;a&quot;)는 this.f(&quot;a&quot;)와 같으며, 컴파일할 때 this의 타입은 A입니다. B 객체가 g를 실행해도 A의 본문을 B의 후보 집합으로 다시 컴파일하지 않습니다. f(Object)가 선택되고 런타임에는 B.f(Object)가 2를 반환합니다." />
        <ConceptSection title="업캐스팅(Upcasting)" text="A a = new B()는 자식 객체의 참조를 부모 타입 변수에 담는 업캐스팅입니다. 객체 자체가 A로 바뀌거나 부모 객체로 복제되는 것은 아닙니다. 선언 타입은 호출할 수 있는 메서드의 시야를 정하고 실제 객체 타입은 재정의 구현을 정합니다." />
      </>}
      {kind === 'method-overloading' && <>
        <ConceptSection title="오버로딩(Overloading)과 시그니처(Signature)" text="같은 이름의 메서드를 매개변수 타입이나 개수를 다르게 선언하는 것입니다. func(int, int), func(char, char), func(char)는 서로 다른 메서드입니다. 반환 타입이나 매개변수 이름만 바꾸어서는 오버로딩할 수 없습니다. 호출할 시그니처는 컴파일할 때 선언 타입과 인자 타입을 바탕으로 선택됩니다." />
        <ConceptSection title="오버로딩 선택 → 오버라이딩 구현" text="호출할 시그니처를 먼저 정하고, 인스턴스 메서드가 재정의되었다면 실행 시 실제 객체에 따라 구현을 선택합니다. 컴파일타임 바인딩 문제의 A.g 안에서는 A의 f(Object)만 보입니다. 실행할 때 B.f(Object)로 이동하지만 B.f(String)으로 시그니처를 다시 선택하지는 않습니다." comparison={{ headers: ['단계', '판단 기준', 'A.g의 f 호출'], rows: [['컴파일타임(Compile Time)', '선언 타입 · 인자 타입 · 후보', 'f(Object) 선택'], ['런타임(Runtime)', '실제 객체의 재정의 구현', 'B.f(Object) 실행']] }} />
        {example === 'method-overloading' && <ConceptSection title="char 연산과 문자열 연결" text="char는 문자를 나타내는 숫자 값을 가집니다. 이 예제의 A는 65, C는 67이며 뺄셈에서는 int로 승격(Promotion)되어 2가 됩니다. 출력식의 9 + 2는 먼저 11이 되고, 그 뒤 문자열 2와 문자 3이 이어져 1123이 됩니다. 문자 '3'과 문자열 &quot;3&quot;, 숫자 3은 타입이 서로 다릅니다." />}
        {example === 'overload-recursion' && <>
          <ConceptSection title="타입 변환과 언박싱(Unboxing)" text="Integer.valueOf(str)는 숫자 문자열을 Integer 객체로 변환합니다. int 변수에 대입할 때 정수 값으로 언박싱됩니다. 그 뒤 value - 1과 value - 3은 int 연산이므로 calc(int)를 호출합니다. calc(String)은 첫 입구에서만 실행되고 이후 재귀는 calc(int) 안에서 이어집니다." />
          <ConceptSection title="재귀 호출(Recursion)과 반환" text="각 호출은 자기만의 value와 계산 중인 값을 스택에 보관합니다. value가 0이나 1이면 기저 조건(Base Case)으로 값을 반환합니다. 왼쪽 호출의 결과를 보관하고 오른쪽 호출을 실행한 뒤 더합니다. 이 문제는 calc(int 4)의 3과 calc(int 2)의 1을 더해 4를 출력합니다." />
        </>}
        {example === 'overload-string-recursion' && <>
          <ConceptSection title="공유 배열과 호출별 지역 변수(Local Variable)" text="모든 fn 호출이 같은 seen 배열 101을 참조하지만 index, c, result는 호출마다 따로 보관합니다. 먼저 index를 7부터 -1까지 줄여 호출하고, 돌아올 때 0부터 7까지 문자의 중복 여부를 검사합니다. 처리한 문자는 공유 배열에 true로 표시합니다." />
          <ConceptSection title="문자열을 만드는 순서" text="처음 만난 문자는 c + result로 앞에 붙입니다. a → ba → cba → dcba 순서로 만들어지며, 이미 처리한 a, b, c는 건너뜁니다. 이 문제에는 fn 메서드가 하나뿐이므로 오버로딩이 아니라 재귀와 공유 상태를 추적하는 예제입니다." />
        </>}
        {example === 'overload-array-recursion' && <ConceptSection title="분할 정복(Divide and Conquer)" text="구간의 mid를 구한 뒤 왼쪽과 오른쪽 호출을 계산합니다. 두 결과 중 큰 값에 a[mid]를 더합니다. st ≥ end일 때는 배열 원소를 읽지 않고 0을 반환한다는 점에 주의합니다. 최상위 결과는 8 + max(8, 12) = 20입니다. fn 메서드가 하나뿐인 재귀 예제입니다." />}
        {example === 'overload-basic' && <ConceptSection title="인자 타입이 다른 두 호출" text="pick(3)은 int 인자를 받아 I3를 반환합니다. pick(&quot;ab&quot;)는 String 인자를 받아 문자열 길이 2를 S에 연결합니다. 두 반환값을 합친 I3S2가 출력됩니다. 같은 이름이지만 각 호출이 실행하는 본문은 다릅니다." />}
        {example === 'overload-shapes' && <ConceptSection title="중첩되는 두 개념" text="Shape의 draw()와 draw(int)는 오버로딩입니다. Circle의 draw()는 부모 draw()의 오버라이딩입니다. s.draw(10)는 int 매개변수 메서드, c.draw()는 Circle의 재정의 구현을 실행합니다. s와 c는 주소 100, 101의 별개 객체이므로 색상도 독립적으로 저장합니다." />}
        <ConceptSection title="타입이 정확히 일치하지 않을 때" advanced text="호출 후보 중 적용 가능한 메서드를 찾고 가장 구체적인 것을 선택합니다. 기본형 확대 변환(Widening), 박싱(Boxing), 가변 인자(Varargs)도 선택에 영향을 줄 수 있습니다. 전달한 객체의 실제 타입만 보고 무조건 같은 타입의 매개변수를 선택한다고 생각하면 안 됩니다." />
      </>}
      {kind === 'override-annotation' && <>
        <ConceptSection title="어노테이션(Annotation)" text="어노테이션은 코드에 붙이는 메타데이터(Metadata)입니다. @Override는 메서드가 상위 타입의 메서드를 재정의하거나 구현한다는 의도를 표시합니다. 컴파일러는 이 선언이 맞는지 검사합니다. 인터페이스의 메서드를 구현할 때도 사용할 수 있습니다." />
        <ConceptSection title="@Override가 없어도 재정의됩니다" text="실제로 재정의되는지는 메서드의 선언과 상속 관계로 결정됩니다. 정상적인 show()는 @Override를 붙여도, 빼도 Child.show()가 실행됩니다. @Override가 메서드 선택을 바꾸거나 실행 중에 부모 메서드를 자식 메서드로 전환하는 것은 아닙니다." />
        <ConceptSection title="오타를 컴파일 오류로 찾습니다" text="shwo()는 show()와 이름이 달라 별개의 메서드입니다. @Override가 없으면 이 예제는 컴파일되지만 p.show()는 Parent.show()를 실행합니다. @Override를 붙이면 재정의 조건을 만족하지 않아 컴파일 단계에서 멈춥니다. 따라서 객체 생성과 콘솔 출력도 일어나지 않습니다." comparison={{ headers: ['Child의 선언', '@Override 없음', '@Override 있음'], rows: [['show()', '재정의 · Child 실행', '검사 통과 · Child 실행'], ['shwo()', '새 메서드 · Parent.show 실행', '컴파일 오류 · 실행 불가']] }} />
        <ConceptSection title="메서드 시그니처(Method Signature)" text="show()와 show(int)는 이름이 같아도 매개변수가 달라 다른 시그니처입니다. Child가 show()를 재정의해도 show(int)까지 재정의한 것은 아닙니다. 연습 2에서 p.show()는 Child가 C를 출력하고, p.show(3)는 부모에게 상속받은 구현이 P3을 출력합니다. print는 줄바꿈하지 않아 결과는 CP3입니다." />
        <ConceptSection title="다른 어노테이션과 구분하기" advanced text="@Override는 컴파일러의 재정의 검사에 사용되며 소스 수준에서 유지됩니다. 모든 어노테이션이 단순한 메모인 것은 아닙니다. 다른 어노테이션은 코드 생성 도구나 실행 중 프레임워크가 읽어 동작에 영향을 줄 수도 있습니다." />
      </>}
      {example === 'method-dispatch' && <>
        <ConceptSection title="메서드 재정의(Overriding)와 동적 바인딩(Dynamic Binding)" text="컴파일할 때 ref의 선언 타입 Parent에서 호출 가능한 x(int)를 찾습니다. 실행할 때는 실제 객체 100의 타입 Child에 따라 재정의된 구현을 선택합니다. 그래서 Parent.x의 i + 2 대신 Child.x의 i + 3이 실행되어 5를 반환합니다." />
        <ConceptSection title="정적 메서드(Static Method)와 하이딩(Hiding)" text="id는 static이므로 실제 객체 타입으로 구현을 바꾸지 않습니다. ref의 선언 타입 Parent에서 선택된 Parent.id가 P를 반환합니다. Child.id는 부모 메서드의 하이딩이며 오버라이딩이 아닙니다. static 메서드는 Parent.id()처럼 클래스 이름으로 호출하면 선택 기준이 명확해집니다." comparison={{ headers: ['호출', '선택 기준', '반환값'], rows: [['ref.x(2)', 'int 시그니처 → 실제 객체 Child', '5'], ['ref.id()', '선언 타입 Parent · static', '"P"']] }} />
        <ConceptSection title="오버로딩(Overloading)" text="x(int)와 x(String)은 이름이 같지만 매개변수 타입이 다릅니다. 이 문제에서는 인자가 정수 2이므로 x(int)를 선택합니다. Child에만 있는 x(String)은 Parent 타입의 ref로 바로 호출할 수 없습니다. 오버로딩은 선언 타입과 인자 타입으로 호출할 시그니처를 정하고, 오버라이딩은 그 뒤 실제 객체에 따라 구현을 선택합니다." />
        <ConceptSection title="문자열 연결(String Concatenation)" text="출력식은 왼쪽의 ref.x(2)를 평가한 뒤 오른쪽의 ref.id()를 평가합니다. 한쪽 결과가 문자열 P이므로 +는 숫자 덧셈이 아니라 문자열 연결이 됩니다. 5와 P가 이어져 콘솔에 5P 한 줄이 출력됩니다." />
        <ConceptSection title="오버라이딩 조건" advanced text="메서드 이름과 매개변수 타입이 일치해야 하며, 부모보다 접근 범위를 좁힐 수 없습니다. 참조 타입의 반환값은 부모 반환 타입의 하위 타입으로 바꿀 수 있습니다. 이를 공변 반환 타입(Covariant Return Type)이라고 합니다. 반환 타입만 바꾸는 것은 오버로딩이 아닙니다. @Override는 올바른 재정의인지 컴파일러가 확인하도록 하며, 표시가 없어도 조건을 만족하면 재정의됩니다." />
      </>}
      {example === 'overriding-practice' && <>
        <ConceptSection title="배열의 참조와 반복 변수" text="배열 103의 각 칸은 객체 100, 101, 102의 참조를 저장합니다. 반복 변수 p는 매번 그 참조 하나를 받습니다. 새 객체를 만드는 것이 아니므로 p.act()가 바꾼 에너지는 배열에서 다시 접근해도 그대로 남습니다." />
        <ConceptSection title="재정의와 상속받은 구현" text="p의 선언 타입은 항상 Animal이지만 Dog 객체에서는 재정의된 Dog.act가 에너지를 20 줄입니다. Cat은 act를 재정의하지 않아 상속받은 Animal.act가 에너지를 10 줄입니다. 객체마다 에너지를 독립적으로 보관합니다." />
        <ConceptSection title="반환값을 버려도 상태는 바뀝니다" text="첫 p.act()의 문자열은 출력하지 않지만 에너지는 이미 감소했습니다. Dog는 50에서 30이 되어 조건을 통과하고, println 안의 두 번째 act에서 10으로 줄어듭니다. Cat은 30에서 20이 되므로 energy > 20이 거짓입니다. 두 번째 act 없이 이름만 출력합니다." comparison={{ headers: ['객체', '첫 호출 후', '두 번째 호출', '출력'], rows: [['100 · 멍이', '30', '10으로 감소', '멍이!10'], ['101 · 냥이', '20', '호출하지 않음', '냥이'], ['102 · 바둑이', '30', '10으로 감소', '바둑이!10']] }} />
      </>}
      {example === 'constructor-chaining' && <>
        <ConceptSection title="생성자 연결(Constructor Chaining)" text="new는 객체를 하나 만든 뒤 생성자를 실행합니다. this(10, 20)는 같은 클래스의 다른 생성자에, super(사각형)는 부모 생성자에 초기화를 맡깁니다. 호출할 때마다 새 객체가 만들어지는 것이 아닙니다. 부모에게서 물려받은 필드도 같은 Rectangle 객체 안에 있습니다." />
        <ConceptSection title="호출과 실행 순서" text="호출은 Rectangle() → Rectangle(int, int) → Shape(String) → Object() 순서로 깊어집니다. 이 코드에서 필드에 값을 대입하는 순서는 돌아올 때의 Shape → Rectangle입니다. 스택에 남아 있는 생성자는 안쪽 호출이 끝나기를 기다립니다. 부모 생성자가 끝났다고 전체 객체 초기화가 끝난 것은 아닙니다." />
        <ConceptSection title="기본값과 기본 생성자(Default Constructor)" text="객체가 만들어질 때 참조 필드는 null, int 필드는 0으로 준비됩니다. 이것은 생성자가 대입하는 값과 다릅니다. 생성자를 하나도 선언하지 않은 클래스에만 컴파일러가 기본 생성자를 제공합니다. 직접 작성한 Rectangle()은 매개변수 없는 생성자이며, 매개변수 생성자를 작성했다고 자동으로 추가되지는 않습니다." />
      </>}
      {example === 'super-this' && <>
        <ConceptSection title="this와 super" text="this는 현재 객체를 가리킵니다. this.width = width에서 왼쪽은 객체의 필드이고 오른쪽은 생성자의 매개변수(Parameter)입니다. super(s, s)는 부모 생성자를 호출합니다. super는 부모 객체를 따로 만드는 표현이 아니며, super.메서드()는 부모 쪽 구현을 직접 호출할 때 사용합니다." />
        <ConceptSection title="상속(Inheritance)" text="Square는 Rectangle의 width, height와 getArea를 물려받습니다. 생성자는 상속되지 않으므로 Square 생성자가 super로 Rectangle 초기화를 연결합니다. sq.getArea()는 재정의되지 않은 Rectangle.getArea를 실행하며, 이름이 비슷한 getSquareArea는 자동으로 실행되지 않습니다." />
        <ConceptSection title="반환값(Return Value)과 출력" text="return은 계산 결과를 호출한 곳으로 돌려줍니다. System.out.println은 콘솔에 표시합니다. 이 예제는 100을 반환하지만 그 값을 저장하거나 출력하지 않아 콘솔이 비어 있습니다. private인 부모 필드는 자식에서 직접 읽을 수 없어도 객체에 존재하며, 부모 생성자와 메서드가 접근할 수 있습니다." />
      </>}
      {example === 'field-hiding' && <>
        <ConceptSection title="참조 타입과 실제 객체" text="Animal a = new Dog()에서 a의 선언 타입(Declared Type)은 Animal이고 실제 객체의 타입(Runtime Type)은 Dog입니다. 변수의 타입이 Animal이라고 해서 Dog 객체가 Animal 객체로 바뀌지는 않습니다." />
        <ConceptSection title="필드 하이딩(Field Hiding)과 메서드 재정의(Overriding)" text="Dog가 같은 이름의 name을 선언해도 Animal.name은 사라지지 않습니다. 한 객체에 두 필드가 있습니다. 필드 접근은 참조의 선언 타입으로 결정되고, 재정의된 인스턴스 메서드는 실제 객체 타입으로 결정됩니다. Dog.sound 안의 name은 Dog에 선언된 필드를 뜻합니다." comparison={{headers: ['코드', '선택되는 대상', '출력'], rows: [['a.sound()', 'Dog.sound() → Dog.name', '강아지 왈왈'], ['a.name', 'Animal.name', '동물']]}} />
        <ConceptSection title="super.name과 static 메서드" advanced text="Dog 안에서 this.name은 Dog.name, super.name은 Animal.name을 읽습니다. static 메서드는 인스턴스 메서드처럼 재정의되어 실행되는 것이 아니라 선언 타입에 따라 선택되는 하이딩입니다. 혼동을 줄이려면 static 메서드는 변수 대신 클래스 이름으로 호출합니다." />
      </>}
    </section>
  </main>;
}
