import type { Frame, Lesson, JavaObject } from './model';
function lab(source: string, problem: string) {
  const code = source.trim().split('\n');
  const frames: Frame[] = [];
  const stack = ['main'];
  const objects: JavaObject[] = [];
  const output: string[] = [];
  let reference = '';
  const add = (source: string, message: string, locals: [string, string][] = [], result = '') => {
    const line = source ? code.findIndex(l => l.trim() === source) : -1;
    if (source && line < 0) throw new Error(`Missing overload source: ${source}`);
    frames.push({ line, message, stack: [...stack], fields: [], allocated: objects.length > 0, address: objects[0]?.address ?? null, objects: structuredClone(objects), reference, output: [...output], result, locals });
  };
  const ref = (next: string) => { reference = next; };
  add('', 'main에서 시작합니다. 각 호출의 인자 타입과 선택되는 시그니처를 따라갑니다.');
  return { add, stack, objects, output, ref, lesson: { title: 'Method Overloading', problem, code, frames } satisfies Lesson };
}
const numeric = lab(`public class Main {
  int func(int a, int b) {
    return a + b;
  }
  int func(char a, char b) {
    return b - a;
  }
  char func(char a) {
    return a;
  }
  public static void main(String[] args) {
    Main m = new Main();
    int r1 = m.func(4, 5);
    int r2 = m.func('A', 'C');
    char r3 = m.func('3');
    System.out.println(r1 + r2 + "2" + r3);
  }
}`, '정보처리기사 실기 · 2026년 제1회 · 타입과 연산');
numeric.objects.push({ address: 100, type: 'Main', fields: [] });
numeric.add('Main m = new Main();', 'Main 객체 100을 만들고 생성자 실행을 마칩니다.');
numeric.ref('Main m → 100');
let values: [string, string][] = [];
for (const [call, signature, body, parameters, result, variable] of [
  ['int r1 = m.func(4, 5);', 'func(int, int)', 'return a + b;', [['a · int', '4'], ['b · int', '5']], '9', 'r1 · int'],
  ["int r2 = m.func('A', 'C');", 'func(char, char)', 'return b - a;', [['a · char', "'A' · 65"], ['b · char', "'C' · 67"]], '2', 'r2 · int'],
  ["char r3 = m.func('3');", 'func(char)', 'return a;', [['a · char', "'3' · 51"]], "'3'", 'r3 · char'],
] as Array<[string, string, string, [string, string][], string, string]>) {
  numeric.add(call, `인자 타입과 개수로 ${signature}를 선택합니다. 반환 타입으로 선택하는 것이 아닙니다.`, [...values, ['선택된 시그니처', signature]]);
  numeric.stack.push(`Main.${signature}`);
  numeric.add(body, signature === 'func(char, char)' ? "char의 뺄셈은 int 연산으로 승격됩니다. 'C'의 67 − 'A'의 65 = 2입니다." : `이 메서드가 ${result}를 반환합니다.`, [['this', '100'], ...parameters], result);
  numeric.stack.pop();
  values = [...values, [variable, result]];
  numeric.add(call, `${variable.split(' · ')[0]}에 반환값 ${result}를 저장합니다.`, values);
}
const printNumeric = 'System.out.println(r1 + r2 + "2" + r3);';
numeric.add(printNumeric, '왼쪽부터 9 + 2를 먼저 계산합니다. 두 값 모두 int이므로 결과는 숫자 11입니다.', [...values, ['중간 결과', '11 · int']]);
numeric.add(printNumeric, '11 + "2"부터 문자열 연결이 됩니다. "112" 뒤에 문자 \'3\'을 붙여 "1123"을 만듭니다.', [...values, ['중간 결과', '"1123" · String']]);
numeric.output.push('1123');
numeric.add(printNumeric, '콘솔에 1123을 출력합니다.', values);

const binding = lab(`class A {
  String f(Object x) { return "1"; }
  String g() { return f("a"); }
}
class B extends A {
  String f(Object x) { return "2"; }
  String f(String x) { return "3"; }
}
public class Test {
  public static void main(String[] args) {
    A a = new B();
    System.out.println(a.g());
  }
}`, '정보처리기사 실기 · 2026년 제1회 · 컴파일타임 바인딩');
binding.objects.push({ address: 100, type: 'B', fields: [] });
binding.add('A a = new B();', 'B 객체 100을 만들고 생성자 실행을 마칩니다. 변수 a의 선언 타입은 A입니다.');
binding.ref('A a → 100');
binding.stack.push('A.g()');
binding.add('System.out.println(a.g());', 'B가 g()를 재정의하지 않았으므로 상속받은 A.g()를 실행합니다.', [['this', '100']]);
binding.add('String g() { return f("a"); }', '이 호출은 A 안에 작성되어 있습니다. 컴파일러는 A에서 볼 수 있는 f(Object)를 선택합니다. B에만 있는 f(String)은 후보가 아닙니다.', [['인자 타입', 'String'], ['선택된 시그니처', 'f(Object)'], ['this', '100']]);
binding.stack.push('B.f(Object)');
binding.add('String f(Object x) { return "2"; }', '실제 객체가 B이므로 선택된 f(Object)의 재정의 구현 B.f(Object)를 실행합니다. f(String)으로 다시 고르지 않습니다.', [['x · Object', '"a"'], ['this', '100']], '"2"');
binding.stack.pop();
binding.add('String g() { return f("a"); }', 'f(Object)의 결과 "2"를 g()에서 반환합니다.', [['this', '100']], '"2"');
binding.stack.pop();
binding.output.push('2');
binding.add('System.out.println(a.g());', '콘솔에 2를 출력합니다. B.f(String)의 3은 사용하지 않습니다.');

const fibonacci = lab(`public class Gamja {
  public static void main(String[] args) {
    System.out.println(calc("5"));
  }
  static int calc(int value) {
    if(value <= 1) return value;
    return calc(value - 1) + calc(value - 2);
  }
  static int calc(String str) {
    int value = Integer.valueOf(str);
    if (value <= 1) return value;
    return calc(value - 1) + calc(value - 3);
  }
}`, '정보처리기사 실기 · 2025년 제1회 · 오버로딩과 재귀');
fibonacci.stack.push('calc(String "5")');
fibonacci.add('System.out.println(calc("5"));', '인자 "5"는 String입니다. 첫 호출은 calc(String)을 선택합니다.', [['str · String', '"5"']]);
fibonacci.add('int value = Integer.valueOf(str);', 'valueOf가 Integer 5를 반환하고, 언박싱(Unboxing)하여 int value에 5를 저장합니다.', [['str · String', '"5"'], ['value · int', '5']]);
fibonacci.add('if (value <= 1) return value;', '5 ≤ 1은 거짓입니다. 재귀 호출로 진행합니다.', [['value · int', '5']]);
fibonacci.add('return calc(value - 1) + calc(value - 3);', 'value는 int이므로 calc(4), calc(2)는 모두 calc(int)를 선택합니다. 왼쪽 호출부터 실행합니다.', [['value · int', '5'], ['호출 대상', 'calc(int 4) + calc(int 2)']]);
function calc(n: number): number {
  fibonacci.stack.push(`calc(int ${n})`);
  fibonacci.add('if(value <= 1) return value;', `${n} ≤ 1은 ${n <= 1 ? '참' : '거짓'}입니다.`, [['value · int', String(n)]]);
  if (n <= 1) {
    fibonacci.add('if(value <= 1) return value;', `기저 조건(Base Case)에 도달했습니다. ${n}을 반환합니다.`, [['value · int', String(n)]], String(n));
    fibonacci.stack.pop();
    return n;
  }
  fibonacci.add('return calc(value - 1) + calc(value - 2);', `calc(${n - 1}) + calc(${n - 2})를 계산합니다. 현재 호출은 결과를 기다립니다.`, [['value · int', String(n)]]);
  const left = calc(n - 1);
  fibonacci.add('return calc(value - 1) + calc(value - 2);', `왼쪽 결과 ${left}를 보관하고 오른쪽 calc(${n - 2})를 호출합니다.`, [['value · int', String(n)], ['왼쪽 결과', String(left)]]);
  const right = calc(n - 2);
  fibonacci.add('return calc(value - 1) + calc(value - 2);', `${left} + ${right} = ${left + right}를 반환합니다.`, [['value · int', String(n)], ['왼쪽 결과', String(left)], ['오른쪽 결과', String(right)]], String(left + right));
  fibonacci.stack.pop();
  return left + right;
}
const fibLeft = calc(4);
fibonacci.add('return calc(value - 1) + calc(value - 3);', `calc(4)의 결과 ${fibLeft}를 보관하고 calc(int 2)를 호출합니다.`, [['value · int', '5'], ['왼쪽 결과', String(fibLeft)]]);
const fibRight = calc(2);
fibonacci.add('return calc(value - 1) + calc(value - 3);', `${fibLeft} + ${fibRight} = ${fibLeft + fibRight}를 calc(String)에서 반환합니다.`, [['value · int', '5'], ['왼쪽 결과', String(fibLeft)], ['오른쪽 결과', String(fibRight)]], String(fibLeft + fibRight));
fibonacci.stack.pop();
fibonacci.output.push(String(fibLeft + fibRight));
fibonacci.add('System.out.println(calc("5"));', '콘솔에 4를 출력합니다. calc(String)은 처음 한 번만 호출되었습니다.');

const unique = lab(`class Gamja {
  public static String fn(String str, int index, boolean[] seen) {
    if (index < 0) return "";
    char c = str.charAt(index);
    String result = fn(str, index - 1, seen);
    if (!seen[c]) {
      seen[c] = true;
      return c + result;
    }
    return result;
  }
  public static void main(String[] args) {
    String str = "abacabcd";
    int length = str.length();
    boolean[] seen = new boolean[256];
    System.out.print(fn(str, length - 1, seen));
  }
}`, '정보처리기사 실기 · 2024년 제2회 · 문자열 재귀');
unique.objects.push({ address: 100, type: 'String', fields: [['내용', '"abacabcd"']] });
unique.ref('String str → 100');
unique.add('String str = "abacabcd";', '문자열 abacabcd를 str이 참조합니다.');
unique.add('int length = str.length();', '문자열 길이는 8입니다.', [['length · int', '8']]);
unique.objects.push({ address: 101, type: 'boolean[256]', fields: [['기본값 · 모든 칸', 'false']] });
unique.ref('String str → 100\nboolean[] seen → 101');
unique.add('boolean[] seen = new boolean[256];', 'seen 배열 101을 만들고 모든 칸을 false로 준비합니다.');
const seen = new Set<string>();
function fnString(index: number): string {
  unique.stack.push(`fn(index ${index})`);
  unique.add('if (index < 0) return "";', `${index} < 0은 ${index < 0 ? '참' : '거짓'}입니다.`, [['index · int', String(index)], ['seen · boolean[]', '→ 101']]);
  if (index < 0) {
    unique.add('if (index < 0) return "";', '기저 조건에 도달하여 빈 문자열을 반환합니다.', [['index · int', '-1']], '""');
    unique.stack.pop();
    return '';
  }
  const c = 'abacabcd'[index];
  unique.add('char c = str.charAt(index);', `현재 호출의 c에 '${c}'를 저장합니다. 호출마다 c는 따로 보관합니다.`, [['index', String(index)], ['c · char', `'${c}'`]]);
  unique.add('String result = fn(str, index - 1, seen);', `fn(index ${index - 1})을 호출합니다. 현재 c = '${c}'는 스택에 남겨 둡니다.`, [['index', String(index)], ['c', `'${c}'`]]);
  const result = fnString(index - 1);
  const local: [string, string][] = [['index', String(index)], ['c', `'${c}'`], ['result · String', `"${result}"`]];
  unique.add('String result = fn(str, index - 1, seen);', `하위 호출에서 "${result}"를 반환받았습니다. 이제 seen을 검사합니다.`, local);
  unique.add('if (!seen[c]) {', `'${c}'의 처리 여부는 ${seen.has(c)}입니다. ${seen.has(c) ? '이미 처리했으므로 건너뜁니다.' : '처음 만난 문자이므로 앞에 붙입니다.'}`, local);
  if (!seen.has(c)) {
    seen.add(c);
    unique.objects[1].fields = [['기본값 · 나머지 칸', 'false'], ...[...seen].map(ch => [`['${ch}'] · ${ch.charCodeAt(0)}`, 'true'] as [string, string])];
    unique.add('seen[c] = true;', `공유 배열 101의 seen['${c}']를 true로 바꿉니다. 모든 호출이 같은 배열을 사용합니다.`, local);
    unique.add('return c + result;', `'${c}' + "${result}" = "${c + result}"를 반환합니다.`, local, `"${c + result}"`);
    unique.stack.pop();
    return c + result;
  }
  unique.add('return result;', `중복 문자 '${c}'를 추가하지 않고 "${result}"를 반환합니다.`, local, `"${result}"`);
  unique.stack.pop();
  return result;
}
const uniqueResult = fnString(7);
unique.output.push(uniqueResult);
unique.add('System.out.print(fn(str, length - 1, seen));', `콘솔에 ${uniqueResult}를 출력합니다. 호출은 7에서 -1로 내려가고, 결과는 0에서 7로 돌아오며 만들어집니다.`);

const divide = lab(`public class Gamja {
  static int fn(int[] a, int st, int end) {
    if (st >= end) return 0;
    int mid = (st + end) / 2;
    return a[mid] + Math.max(fn(a, st, mid), fn(a, mid + 1, end));
  }
  public static void main(String[] args) {
    int[] values = {3, 5, 8, 12, 17};
    System.out.println(fn(values, 0, values.length - 1));
  }
}`, '정보처리기사 실기 · 2025년 제1회 · 배열 재귀');
divide.objects.push({ address: 100, type: 'int[]', fields: [3, 5, 8, 12, 17].map((n, i) => [`[${i}]`, String(n)]) });
divide.ref('int[] values → 100');
divide.add('int[] values = {3, 5, 8, 12, 17};', '배열 100을 만들고 values에 참조를 저장합니다.');
const divideLine = 'return a[mid] + Math.max(fn(a, st, mid), fn(a, mid + 1, end));';
function fnArray(st: number, end: number): number {
  divide.stack.push(`fn(${st}, ${end})`);
  const local: [string, string][] = [['a · int[]', '→ 100'], ['st', String(st)], ['end', String(end)]];
  divide.add('if (st >= end) return 0;', `${st} ≥ ${end}은 ${st >= end ? '참' : '거짓'}입니다.`, local);
  if (st >= end) {
    divide.add('if (st >= end) return 0;', '원소 값을 반환하는 것이 아니라 0을 반환합니다.', local, '0');
    divide.stack.pop();
    return 0;
  }
  const mid = Math.trunc((st + end) / 2);
  const value = [3, 5, 8, 12, 17][mid];
  const extended: [string, string][] = [...local, ['mid', String(mid)], ['a[mid]', String(value)]];
  divide.add('int mid = (st + end) / 2;', `int 나눗셈으로 mid = ${mid}입니다.`, extended);
  divide.add(divideLine, `a[${mid}] = ${value}를 남겨 두고 왼쪽 fn(${st}, ${mid})부터 계산합니다.`, extended);
  const left = fnArray(st, mid);
  divide.add(divideLine, `왼쪽 결과 ${left}를 보관하고 오른쪽 fn(${mid + 1}, ${end})를 호출합니다.`, [...extended, ['왼쪽 결과', String(left)]]);
  const right = fnArray(mid + 1, end);
  const result = value + Math.max(left, right);
  divide.add(divideLine, `${value} + max(${left}, ${right}) = ${result}를 반환합니다.`, [...extended, ['왼쪽 결과', String(left)], ['오른쪽 결과', String(right)]], String(result));
  divide.stack.pop();
  return result;
}
const divideResult = fnArray(0, 4);
divide.output.push(String(divideResult));
divide.add('System.out.println(fn(values, 0, values.length - 1));', `콘솔에 ${divideResult}를 출력합니다. 이 예제에는 오버로딩 없이 fn 하나만 있습니다.`);

const basic = lab(`public class Main {
  static String pick(int n) {
    return "I" + n;
  }
  static String pick(String s) {
    return "S" + s.length();
  }
  public static void main(String[] args) {
    System.out.print(pick(3) + pick("ab"));
  }
}`, '연습 문제 1 · 출제 시기 미표기');
const basicLine = 'System.out.print(pick(3) + pick("ab"));';
basic.stack.push('pick(int 3)');
basic.add(basicLine, '왼쪽 인자 3은 int이므로 pick(int)를 선택합니다.', [['n · int', '3']]);
basic.add('return "I" + n;', '문자열 I에 3을 연결해 "I3"을 반환합니다.', [['n · int', '3']], '"I3"');
basic.stack.pop();
basic.add(basicLine, '왼쪽 결과 "I3"를 보관하고 오른쪽 호출로 진행합니다.', [['왼쪽 결과', '"I3"']]);
basic.stack.push('pick(String "ab")');
basic.add('return "S" + s.length();', '인자 "ab"는 String입니다. 길이 2를 S와 연결해 "S2"를 반환합니다.', [['s · String', '"ab"'], ['s.length()', '2']], '"S2"');
basic.stack.pop();
basic.output.push('I3S2');
basic.add(basicLine, '"I3"와 "S2"를 연결하여 I3S2를 출력합니다.', [['왼쪽 결과', '"I3"'], ['오른쪽 결과', '"S2"']]);

const shape = lab(`class Shape {
  String color;
  Shape(String color) {
    this.color = color;
  }
  void draw() {
    System.out.println(color + " 도형");
  }
  void draw(int size) {
    System.out.println(color + " 도형 크기:" + size);
  }
}
class Circle extends Shape {
  Circle(String color) {
    super(color);
  }
  @Override
  void draw() {
    System.out.println(color + " 원");
  }
}
public class Main {
  public static void main(String[] args) {
    Shape s = new Shape("빨강");
    s.draw();
    s.draw(10);
    Circle c = new Circle("파랑");
    c.draw();
  }
}`, '연습 문제 2 · 출제 시기 미표기');
function makeShape(address: number, type: string, color: string, call: string) {
  shape.objects.push({ address, type, fields: [['Shape.color', 'null']] });
  shape.stack.push(`${type}("${color}")`);
  shape.add(call, `${type} 객체 ${address}를 만들고 color를 null로 준비합니다.`);
  if (type === 'Circle') {
    shape.add('super(color);', '같은 객체의 부모 Shape 생성자에 색상을 전달합니다.', [['this', String(address)], ['color', `"${color}"`]]);
    shape.stack.push(`Shape("${color}")`);
  }
  shape.add('Shape(String color) {', '생략된 Object 생성자를 실행하고 돌아옵니다.', [['this', String(address)]]);
  shape.objects[shape.objects.length - 1].fields[0][1] = `"${color}"`;
  shape.add('this.color = color;', `객체 ${address}의 color에 "${color}"를 저장합니다.`, [['this', String(address)], ['color', `"${color}"`]]);
  if (type === 'Circle') shape.stack.pop();
  shape.stack.pop();
  shape.ref(type === 'Circle' ? 'Shape s → 100\nCircle c → 101' : 'Shape s → 100');
  shape.add(call, '생성자가 끝났습니다. 변수에 완성된 객체의 참조를 저장합니다.');
}
makeShape(100, 'Shape', '빨강', 'Shape s = new Shape("빨강");');
function draw(call: string, impl: string, print: string, text: string, address: number, params: [string, string][] = []) {
  shape.stack.push(impl);
  shape.add(call, `${impl}를 선택하여 실행합니다.`, [['this', String(address)], ...params]);
  shape.output.push(text);
  shape.add(print, `콘솔에 ${text}를 출력합니다.`, [['this', String(address)], ...params]);
  shape.stack.pop();
  shape.add(call, '메서드 실행이 끝나고 main으로 돌아옵니다.');
}
draw('s.draw();', 'Shape.draw()', 'System.out.println(color + " 도형");', '빨강 도형', 100);
draw('s.draw(10);', 'Shape.draw(int)', 'System.out.println(color + " 도형 크기:" + size);', '빨강 도형 크기:10', 100, [['size · int', '10']]);
makeShape(101, 'Circle', '파랑', 'Circle c = new Circle("파랑");');
draw('c.draw();', 'Circle.draw()', 'System.out.println(color + " 원");', '파랑 원', 101);
export const overloadLessons = {
  'method-overloading': numeric.lesson,
  'overload-binding': binding.lesson,
  'overload-recursion': fibonacci.lesson,
  'overload-string-recursion': unique.lesson,
  'overload-array-recursion': divide.lesson,
  'overload-basic': basic.lesson,
  'overload-shapes': shape.lesson,
};
