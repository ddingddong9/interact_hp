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
add(aCall, 'a의 선언 타입은 A입니다. 컴파일러는 A에 선언된 f(Object)를 기준으로 호출을 확인합니다. 문자열도 Object로 받을 수 있으므로 f(Object)를 선택합니다. 실행할 본문은 이후 실제 객체 타입으로 결정합니다.', [], aBinding);
add(bCall, 'b의 선언 타입은 B입니다. B의 f(Object)와 f(String) 중 문자열을 더 정확하게 받는 f(String)을 컴파일 때 선택합니다.', [], bBinding);
add('public static void main(String[] args) {', '컴파일 때 a의 호출은 f(Object), b의 호출은 f(String)으로 정해졌습니다. 이제 main 실행을 시작합니다.', ['main']);
objects.push({ address: 100, type: 'B', fields: [] });
reference = 'A a → 100';
add('A a = new B();', 'B 객체 100의 생성자 실행을 마치고 A 타입 변수 a에 참조를 저장합니다.', ['main']);
objects.push({ address: 101, type: 'B', fields: [] });
reference = 'A a → 100\nB b → 101';
add('B b = new B();', '두 번째 B 객체 101을 만들고 B 타입 변수 b에 참조를 저장합니다. 실제 객체 타입은 둘 다 B입니다.', ['main']);
add(aCall, '컴파일 때 정한 매개변수 타입은 Object입니다. 실제 객체 100은 B이므로, A의 f(Object)를 재정의한 B.f(Object) 본문을 실행합니다.', ['main'], { ...aBinding, phase: 'runtime', implementation: 'B.f(Object)' });
add('String f(Object x) { return "2"; }', 'B.f(Object)가 "2"를 반환합니다. 런타임에 f(String)으로 다시 선택하지 않습니다.', ['main', 'B.f(Object)'], { ...aBinding, phase: 'runtime', implementation: 'B.f(Object)' }, '"2"');
output.push('2');
add(aCall, '첫 번째 호출의 결과 2를 출력합니다.', ['main'], { ...aBinding, phase: 'runtime', implementation: 'B.f(Object)' });
add(bCall, '컴파일 때 f(String)을 선택했습니다. 이제 객체 101에서 B.f(String) 본문을 실행합니다.', ['main'], { ...bBinding, phase: 'runtime', implementation: 'B.f(String)' });
add('String f(String x) { return "3"; }', 'B.f(String)이 "3"을 반환합니다.', ['main', 'B.f(String)'], { ...bBinding, phase: 'runtime', implementation: 'B.f(String)' }, '"3"');
output.push('3');
add(bCall, '두 번째 호출의 결과 3을 출력합니다. 두 객체 모두 B이지만 a는 A 타입, b는 B 타입으로 선언되어 있어 컴파일 때 선택한 매개변수 타입이 다릅니다.', ['main'], { ...bBinding, phase: 'runtime', implementation: 'B.f(String)' });
const exam = overloadLessons['overload-binding'];
const examBinding: BindingState = { phase: 'compile', site: 'A.g 안의 f("a")', declared: 'A · g 본문의 this', argument: 'String', candidates: ['f(Object)'], signature: 'f(Object)' };
const blank: Frame = { line: -1, message: '기출 코드의 컴파일 단계부터 시작합니다. A.g 안에서 어떤 매개변수 타입의 f를 호출할지 확인합니다.', stack: [], fields: [], output: [], allocated: false, address: null, objects: [], reference: '', result: '' };
const examFrames: Frame[] = [blank, { ...blank, line: exam.code.findIndex(l => l.trim() === 'String g() { return f("a"); }'), message: 'A의 g()를 컴파일할 때는 A에 선언된 f(Object)를 기준으로 f("a")를 확인합니다. B에만 있는 f(String)은 비교 대상이 아닙니다. 이때 정하는 것은 매개변수 타입 Object이며, A와 B 중 어느 본문을 실행할지는 실행 때 결정합니다.', binding: examBinding }, ...exam.frames.slice(1).map(frame => ({ ...frame, binding: frame.stack.length > 1 || frame.output.length ? { ...examBinding, phase: 'runtime' as const, implementation: 'B.f(Object)' } : undefined }))];
export const bindingLessons = {
  'compile-time-binding': { title: 'Compile-time Binding', code, frames } satisfies Lesson,
  'binding-exam': { ...exam, title: 'Compile-time Binding', problem: '정보처리기사 실기 · 2026년 제1회', frames: examFrames } satisfies Lesson,
};
