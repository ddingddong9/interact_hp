import { abstractLessons } from './abstract.ts';
import { bindingLessons } from './binding.ts';
import { overloadLessons } from './overload.ts';
import { annotationLessons, type CompileState } from './annotation.ts';
import { methodLessons } from './methods.ts';
export type JavaKind = 'constructor-chaining' | 'super-this' | 'field-hiding' | 'method-dispatch' | 'overriding-practice' | keyof typeof annotationLessons | keyof typeof overloadLessons | keyof typeof bindingLessons | keyof typeof abstractLessons;
export type JavaObject = { address: number; type: string; fields: [string, string][] };
export type BindingState = { phase: 'compile' | 'runtime'; site: string; declared: string; argument: string; candidates: string[]; signature: string; implementation?: string };
export type Frame = { line: number; message: string; stack: string[]; fields: [string, string][]; output: string[]; allocated: boolean; address: number | null; reference: string; result: string; objects?: JavaObject[]; locals?: [string, string][]; compile?: CompileState; diagnostic?: string; binding?: BindingState };
export type Lesson = { title: string; problem?: string; code: string[]; frames: Frame[] };
function trace(code: string, title: string, steps: Array<[string, string, string[], [string, string][], string?, string?, string?]>): Lesson {
  const lines = code.trim().split('\n');
  return { title, code: lines, frames: steps.map(([source, message, stack, fields, output = '', reference = '', result = '']) => ({ line: source ? lines.findIndex(line => line.trim() === source) : -1, message, stack, fields, output: output ? output.split('\n') : [], allocated: fields.length > 0, address: fields.length > 0 ? 100 : null, reference, result })) };
}
const defaults: [string, string][] = [['Shape.type', 'null'], ['Rectangle.width', '0'], ['Rectangle.height', '0']];
const typed: [string, string][] = [['Shape.type', '"사각형"'], ['Rectangle.width', '0'], ['Rectangle.height', '0']];
const filled: [string, string][] = [['Shape.type', '"사각형"'], ['Rectangle.width', '10'], ['Rectangle.height', '20']];
const squareDefaults: [string, string][] = [['Rectangle.width', '0'], ['Rectangle.height', '0']];
const squareFilled: [string, string][] = [['Rectangle.width', '10'], ['Rectangle.height', '10']];
const dogDefaults: [string, string][] = [['Animal.name', 'null'], ['Dog.name', 'null']];
const animal: [string, string][] = [['Animal.name', '"동물"'], ['Dog.name', 'null']];
const dog: [string, string][] = [['Animal.name', '"동물"'], ['Dog.name', '"강아지"']];
export const lessons: Record<JavaKind, Lesson> = {
  ...abstractLessons,
  ...methodLessons,
  ...annotationLessons,
  ...overloadLessons,
  ...bindingLessons,
  'constructor-chaining': trace(`class Shape {
  String type;
  Shape(String type) {
    this.type = type;
  }
}
class Rectangle extends Shape {
  int width, height;
  Rectangle() {
    this(10, 20);
  }
  Rectangle(int width, int height) {
    super("사각형");
    this.width = width;
    this.height = height;
  }
}
class Main {
  public static void main(String[] args) {
    Rectangle r = new Rectangle();
  }
}`, 'Constructor Chaining', [
    ['', 'main에서 시작합니다. 아직 객체는 없습니다.', ['main'], []],
    ['Rectangle r = new Rectangle();', 'Rectangle 객체 하나를 만들고, 모든 필드를 기본값으로 준비합니다.', ['main', 'Rectangle()'], defaults],
    ['this(10, 20);', '같은 객체의 다른 생성자를 호출합니다. width = 10, height = 20을 전달합니다.', ['main', 'Rectangle()', 'Rectangle(10, 20)'], defaults],
    ['super("사각형");', '부모 Shape 생성자에 type = "사각형"을 전달합니다. Rectangle의 대입은 아직 실행되지 않았습니다.', ['main', 'Rectangle()', 'Rectangle(10, 20)', 'Shape("사각형")'], defaults],
    ['Shape(String type) {', 'Shape도 Object를 상속합니다. 생략된 super()로 Object 생성자를 호출합니다.', ['main', 'Rectangle()', 'Rectangle(10, 20)', 'Shape("사각형")', 'Object()'], defaults],
    ['this.type = type;', 'Object 생성자가 끝났습니다. Shape 생성자에서 매개변수 type을 객체 필드에 저장합니다.', ['main', 'Rectangle()', 'Rectangle(10, 20)', 'Shape("사각형")'], typed],
    ['this.width = width;', 'Shape 생성자가 끝나고 Rectangle으로 돌아옵니다. width에 10을 저장합니다.', ['main', 'Rectangle()', 'Rectangle(10, 20)'], [['Shape.type', '"사각형"'], ['Rectangle.width', '10'], ['Rectangle.height', '0']]],
    ['this.height = height;', 'height에 20을 저장합니다.', ['main', 'Rectangle()', 'Rectangle(10, 20)'], filled],
    ['this(10, 20);', '매개변수 생성자가 끝나고 Rectangle()으로 돌아옵니다. 추가로 실행할 문장은 없습니다.', ['main', 'Rectangle()'], filled],
    ['Rectangle r = new Rectangle();', '생성자 연결이 끝났습니다. r이 완성된 객체를 참조합니다.', ['main'], filled, '', 'Rectangle r → Rectangle 객체'],
  ]),
  'super-this': trace(`class Rectangle {
  int width, height;
  Rectangle(int width, int height) {
    this.width = width;
    this.height = height;
  }
  int getArea() {
    return width * height;
  }
}
class Square extends Rectangle {
  Square(int s) {
    super(s, s);
  }
  int getSquareArea() {
    return width * height;
  }
}
class Main {
  public static void main(String[] args) {
    Square sq = new Square(10);
    sq.getArea();
  }
}`, 'super & this', [
    ['', 'main에서 시작합니다.', ['main'], []],
    ['Square sq = new Square(10);', 'Square 객체 하나를 만들고 Square 생성자에 s = 10을 전달합니다.', ['main', 'Square(10)'], squareDefaults],
    ['super(s, s);', '부모 Rectangle 생성자에 10, 10을 전달합니다.', ['main', 'Square(10)', 'Rectangle(10, 10)'], squareDefaults],
    ['Rectangle(int width, int height) {', '생략된 Object 생성자를 먼저 호출합니다.', ['main', 'Square(10)', 'Rectangle(10, 10)', 'Object()'], squareDefaults],
    ['this.width = width;', 'Object에서 돌아왔습니다. 오른쪽 width는 매개변수 10, 왼쪽 this.width는 객체 필드입니다.', ['main', 'Square(10)', 'Rectangle(10, 10)'], [['Rectangle.width', '10'], ['Rectangle.height', '0']]],
    ['this.height = height;', '객체의 height에도 매개변수 10을 저장합니다.', ['main', 'Square(10)', 'Rectangle(10, 10)'], squareFilled],
    ['super(s, s);', 'Rectangle에서 Square로 돌아옵니다. 부모 필드는 같은 Square 객체 안에 있습니다.', ['main', 'Square(10)'], squareFilled],
    ['Square sq = new Square(10);', 'sq가 완성된 Square 객체를 참조합니다.', ['main'], squareFilled, '', 'Square sq → Square 객체'],
    ['sq.getArea();', 'Square에 getArea 재정의가 없으므로 상속받은 Rectangle.getArea를 호출합니다.', ['main', 'Rectangle.getArea()'], squareFilled, '', 'Square sq → Square 객체'],
    ['return width * height;', '10 × 10을 계산하여 100을 반환합니다. getSquareArea는 호출하지 않았습니다.', ['main', 'Rectangle.getArea()'], squareFilled, '', 'Square sq → Square 객체', '100'],
    ['sq.getArea();', 'main으로 100이 반환됩니다. println이 없으므로 콘솔에는 출력되지 않습니다.', ['main'], squareFilled, '', 'Square sq → Square 객체', '100 (사용하지 않은 반환값)'],
  ]),
  'field-hiding': trace(`class Animal {
  String name = "동물";
  void sound() {
    System.out.println(name + " 소리");
  }
}
class Dog extends Animal {
  String name = "강아지";
  @Override
  void sound() {
    System.out.println(name + " 왈왈");
  }
}
class Main {
  public static void main(String[] args) {
    Animal a = new Dog();
    a.sound();
    System.out.println(a.name);
  }
}`, 'Field Hiding', [
    ['', 'main에서 시작합니다.', ['main'], []],
    ['Animal a = new Dog();', 'Dog 객체 하나를 만듭니다. 이름이 같아도 Animal.name과 Dog.name은 별개의 필드입니다.', ['main', 'Dog()'], dogDefaults],
    ['Animal a = new Dog();', '생략된 생성자는 Dog → Animal → Object 순서로 호출됩니다.', ['main', 'Dog()', 'Animal()', 'Object()'], dogDefaults],
    ['String name = "동물";', 'Object에서 돌아온 뒤 Animal의 필드 초기화가 실행됩니다.', ['main', 'Dog()', 'Animal()'], animal],
    ['String name = "강아지";', 'Animal 초기화가 끝나면 Dog의 필드 초기화를 실행합니다.', ['main', 'Dog()'], dog],
    ['Animal a = new Dog();', 'a의 선언 타입은 Animal이고, 실제로 가리키는 객체는 Dog입니다.', ['main'], dog, '', 'Animal a → Dog 객체'],
    ['a.sound();', '인스턴스 메서드는 실제 객체 타입을 따라갑니다. 재정의된 Dog.sound를 호출합니다.', ['main', 'Dog.sound()'], dog, '', 'Animal a → Dog 객체'],
    ['System.out.println(name + " 왈왈");', 'Dog 안의 name은 Dog.name입니다. "강아지 왈왈"을 출력합니다.', ['main', 'Dog.sound()'], dog, '강아지 왈왈', 'Animal a → Dog 객체'],
    ['a.sound();', 'sound 실행이 끝나고 main으로 돌아옵니다.', ['main'], dog, '강아지 왈왈', 'Animal a → Dog 객체'],
    ['System.out.println(a.name);', '필드 접근은 참조 변수의 선언 타입으로 결정됩니다. Animal.name의 "동물"을 출력합니다.', ['main'], dog, '강아지 왈왈\n동물', 'Animal a → Dog 객체'],
  ]),
};
