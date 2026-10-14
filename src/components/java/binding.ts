import type { Frame, Lesson, BindingState, JavaObject } from './model';
import { overloadLessons } from './overload.ts';
const code = `class A {
  String f(Object x) { return "1"; }
}
class B extends A {
  String f(Object x) { return "2"; }
  String f(String x) { return "3"; }
}
public class Main {
  public static void main(String[] args) {
    A a = new B();
    B b = new B();
    System.out.println(a.f("hello"));
    System.out.println(b.f("hello"));
  }
}`.split('\n');
const frames: Frame[] = [];
const objects: JavaObject[] = [];
const output: string[] = [];
let reference = '';
const aCall = 'System.out.println(a.f("hello"));';
const bCall = 'System.out.println(b.f("hello"));';
const aBinding: BindingState = { phase: 'compile', site: 'a.f("hello")', declared: 'A', argument: 'String', candidates: ['f(Object)'], signature: 'f(Object)' };
const bBinding: BindingState = { phase: 'compile', site: 'b.f("hello")', declared: 'B', argument: 'String', candidates: ['f(Object)', 'f(String)'], signature: 'f(String)' };
function add(source: string, message: string, stack: string[], binding?: BindingState, result = '') {
  const line = source ? code.findIndex(l => l.trim() === source) : -1;
  if (source && line < 0) throw new Error(`Missing binding source: ${source}`);
  frames.push({ line, message, stack, binding, allocated: objects.length > 0, address: objects[0]?.address ?? null, objects: structuredClone(objects), fields: [], output: [...output], reference, result });
}
add('', '먼저 소스 코드의 호출을 컴파일합니다. 객체는 아직 생성되지 않았습니다.', []);
add(aCall, 'a의 선언 타입은 A입니다. A에서 접근 가능한 후보는 f(Object) 하나입니다. String 인자를 Object로 전달할 수 있어 이 시그니처를 선택합니다.', [], aBinding);
add(bCall, 'b의 선언 타입은 B입니다. f(Object)와 f(String)이 모두 후보이며, String 인자에는 더 구체적인 f(String)을 선택합니다.', [], bBinding);
add('public static void main(String[] args) {', '두 호출의 시그니처 선택이 끝났습니다. 이제 main 실행을 시작합니다.', ['main']);
objects.push({ address: 100, type: 'B', fields: [] });
reference = 'A a → 100';
add('A a = new B();', 'B 객체 100의 생성자 실행을 마치고 A 타입 변수 a에 참조를 저장합니다.', ['main']);
objects.push({ address: 101, type: 'B', fields: [] });
reference = 'A a → 100\nB b → 101';
add('B b = new B();', '두 번째 B 객체 101을 만들고 B 타입 변수 b에 참조를 저장합니다. 실제 객체 타입은 둘 다 B입니다.', ['main']);
add(aCall, 'a 호출은 컴파일 때 선택한 f(Object)를 유지합니다. 객체 100의 타입 B에서 그 시그니처의 재정의 구현을 찾습니다.', ['main'], { ...aBinding, phase: 'runtime', implementation: 'B.f(Object)' });
add('String f(Object x) { return "2"; }', 'B.f(Object)가 "2"를 반환합니다. 런타임에 f(String)으로 다시 선택하지 않습니다.', ['main', 'B.f(Object)'], { ...aBinding, phase: 'runtime', implementation: 'B.f(Object)' }, '"2"');
output.push('2');
add(aCall, '첫 번째 호출의 결과 2를 출력합니다.', ['main'], { ...aBinding, phase: 'runtime', implementation: 'B.f(Object)' });
add(bCall, 'b 호출은 컴파일 때 선택한 f(String)을 유지합니다. B 객체 101에서 해당 구현을 실행합니다.', ['main'], { ...bBinding, phase: 'runtime', implementation: 'B.f(String)' });
add('String f(String x) { return "3"; }', 'B.f(String)이 "3"을 반환합니다.', ['main', 'B.f(String)'], { ...bBinding, phase: 'runtime', implementation: 'B.f(String)' }, '"3"');
output.push('3');
add(bCall, '두 번째 호출의 결과 3을 출력합니다. 객체 타입이 같아도 선언 타입의 후보 집합이 달라 결과가 다릅니다.', ['main'], { ...bBinding, phase: 'runtime', implementation: 'B.f(String)' });
const exam = overloadLessons['overload-binding'];
const examBinding: BindingState = { phase: 'compile', site: 'A.g 안의 f("a")', declared: 'A · g 본문의 this', argument: 'String', candidates: ['f(Object)'], signature: 'f(Object)' };
const blank: Frame = { line: -1, message: '기출 코드의 컴파일 단계부터 시작합니다. A.g 내부 호출의 시야를 확인합니다.', stack: [], fields: [], output: [], allocated: false, address: null, objects: [], reference: '', result: '' };
const examFrames: Frame[] = [blank, { ...blank, line: exam.code.findIndex(l => l.trim() === 'String g() { return f("a"); }'), message: 'g의 본문은 A에 작성되어 있습니다. f("a")의 후보는 f(Object)뿐이며, 호출 시그니처가 컴파일 때 고정됩니다.', binding: examBinding }, ...exam.frames.slice(1).map(frame => ({ ...frame, binding: frame.stack.length > 1 || frame.output.length ? { ...examBinding, phase: 'runtime' as const, implementation: 'B.f(Object)' } : undefined }))];
export const bindingLessons = {
  'compile-time-binding': { title: 'Compile-time Binding', code, frames } satisfies Lesson,
  'binding-exam': { ...exam, title: 'Compile-time Binding', problem: '정보처리기사 실기 · 2026년 제1회', frames: examFrames } satisfies Lesson,
};
