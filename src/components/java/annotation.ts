import type { Frame, Lesson } from './model';
export type CompileState = 'pending' | 'checking' | 'success' | 'error';
function annotationLesson(annotation: boolean, typo: boolean, practice: 0 | 1 | 2 = 0): Lesson {
  const method = typo ? 'shwo' : 'show';
  const parent = practice ? 'P' : 'Parent';
  const child = practice ? 'C' : 'Child';
  const code = `class Parent {
  void show() {
    System.out.print("${parent}");
  }${practice === 2 ? '\n  void show(int n) {\n    System.out.print("P" + n);\n  }' : ''}
}
class Child extends Parent {
${annotation ? '  @Override\n' : ''}  void ${method}() {
    System.out.print("${child}");
  }
}
public class Main {
  public static void main(String[] args) {
    Parent p = new Child();
    p.show();${practice === 2 ? '\n    p.show(3);' : ''}
  }
}`.split('\n');
  const frames: Frame[] = [];
  const failed = annotation && typo;
  const add = (source: string, message: string, compile: CompileState, stack: string[] = [], allocated = false, output = '', reference = '', locals: [string, string][] = [], diagnostic = '') => {
    // Parent and Child can have identical declarations: locate the Child declaration after its class.
    const start = source === `void ${method}() {` || source === '@Override' ? code.findIndex(l => l.trim() === 'class Child extends Parent {') : 0;
    const line = source ? code.findIndex((l, i) => i >= start && l.trim() === source) : -1;
    if (source && line < 0) throw new Error(`Missing annotation source: ${source}`);
    frames.push({ line, message, compile, diagnostic, stack, allocated, address: allocated ? 100 : null, fields: [], objects: allocated ? [{ address: 100, type: 'Child', fields: [] }] : [], output: output ? [output] : [], reference, result: '', locals });
  };
  add('', '먼저 컴파일 검사부터 시작합니다. 아직 main이나 생성자는 실행되지 않았습니다.', 'pending');
  add(`void ${method}() {`, `컴파일러가 Child의 ${method}() 선언을 확인합니다.`, 'checking');
  if (annotation) {
    add('@Override', typo ? '@Override가 재정의 여부를 검사합니다. 부모의 show()와 자식의 shwo()는 이름이 다릅니다.' : '@Override가 재정의 여부를 검사합니다. 부모의 show()와 이름·매개변수가 일치합니다.', 'checking');
  }
  if (failed) {
    add('void shwo() {', '컴파일 오류입니다. shwo()는 부모 메서드를 재정의하지 않으므로 실행 단계로 넘어가지 않습니다.', 'error', [], false, '', '', [], 'method does not override or implement a method from a supertype');
    return { title: '@Override', code, frames };
  }
  add(`void ${method}() {`, typo ? '컴파일 성공. @Override가 없으므로 shwo()는 새 메서드로 인정됩니다. show()를 재정의한 것은 아닙니다.' : `컴파일 성공. ${annotation ? '@Override 검사도 통과했습니다.' : '@Override가 없어도 show()는 재정의됩니다.'}`, 'success');
  add('public static void main(String[] args) {', '이제 main을 실행합니다. @Override는 실행 중에 호출되는 명령이 아닙니다.', 'success', ['main']);
  add('Parent p = new Child();', '주소 100에 Child 객체를 만들고 생성자를 호출합니다.', 'success', ['main', 'Child()'], true);
  add('Parent p = new Child();', '생략된 Child → Parent → Object 생성자 호출이 끝나고 main으로 돌아옵니다.', 'success', ['main'], true, '', 'Parent p → 100');
  const implementation = typo ? 'Parent' : 'Child';
  add('p.show();', typo ? '실제 객체는 Child지만 show()를 재정의하지 않았습니다. 상속받은 Parent.show()를 호출합니다.' : '실제 객체 Child의 재정의된 show()를 호출합니다.', 'success', ['main', `${implementation}.show()`], true, '', 'Parent p → 100', [['this', '100']]);
  const firstOutput = typo ? parent : child;
  add(`System.out.print("${firstOutput}");`, `${firstOutput}를 출력합니다. print는 줄바꿈을 추가하지 않습니다.`, 'success', ['main', `${implementation}.show()`], true, firstOutput, 'Parent p → 100', [['this', '100']]);
  add('p.show();', 'show()가 끝나고 main으로 돌아옵니다.', 'success', ['main'], true, firstOutput, 'Parent p → 100');
  if (practice === 2) {
    add('p.show(3);', '인자가 int인 3이므로 show(int)를 선택합니다. Child는 이 메서드를 재정의하지 않아 Parent 구현을 사용합니다.', 'success', ['main', 'Parent.show(3)'], true, firstOutput, 'Parent p → 100', [['this', '100'], ['n', '3']]);
    add('System.out.print("P" + n);', '"P" + 3은 문자열 "P3"입니다. 앞의 C 뒤에 줄바꿈 없이 이어서 출력합니다.', 'success', ['main', 'Parent.show(3)'], true, 'CP3', 'Parent p → 100', [['this', '100'], ['n', '3']]);
    add('p.show(3);', 'main으로 돌아옵니다. 최종 출력은 CP3 한 줄입니다.', 'success', ['main'], true, 'CP3', 'Parent p → 100');
  }
  return { title: '@Override', problem: practice ? `연습 문제 ${practice} · 출제 시기 미표기` : undefined, code, frames };
}
export const annotationLessons = {
  'override-annotation': annotationLesson(true, false),
  'override-without': annotationLesson(false, false),
  'override-typo': annotationLesson(false, true),
  'override-error': annotationLesson(true, true),
  'override-practice-basic': annotationLesson(true, false, 1),
  'override-practice-overload': annotationLesson(true, false, 2),
};
