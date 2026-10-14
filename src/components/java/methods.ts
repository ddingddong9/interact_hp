import type { Frame, Lesson, JavaObject } from './model';

function builder(source: string, title: string, problem: string) {
  const code = source.trim().split('\n');
  const frames: Frame[] = [];
  const objects: JavaObject[] = [];
  const output: string[] = [];
  const add = (line: string, message: string, stack = ['main'], reference = '', result = '', locals: [string, string][] = []) => {
    const index = line ? code.findIndex(l => l.trim() === line) : -1;
    if (line && index < 0) throw new Error(`Missing Java source line: ${line}`);
    frames.push({ line: index, message, stack, fields: [], output: [...output], allocated: objects.length > 0, address: objects[0]?.address ?? null, reference, result, objects: structuredClone(objects), locals });
  };
  return { objects, output, add, lesson: { title, problem, code, frames } satisfies Lesson };
}
const exam = builder(`public class Main {
  public static class Parent {
    public int x(int i) { return i + 2; }
    public static String id() { return "P"; }
  }
  public static class Child extends Parent {
    public int x(int i) { return i + 3; }
    public String x(String s) { return s + "R"; }
    public static String id() { return "C"; }
  }
  public static void main(String[] args) {
    Parent ref = new Child();
    System.out.println(ref.x(2) + ref.id());
  }
}`, 'Method Overriding', '정보처리기사 실기 · 2025년 제2회');
const expression = 'System.out.println(ref.x(2) + ref.id());';
exam.add('', 'main에서 시작합니다. 출력식을 왼쪽부터 평가합니다.');
exam.objects.push({ address: 100, type: 'Child', fields: [] });
exam.add('Parent ref = new Child();', '주소 100에 Child 객체를 만듭니다. 인스턴스 필드를 선언하지 않은 객체입니다.', ['main', 'Child()']);
exam.add('Parent ref = new Child();', '생략된 생성자를 Child → Parent → Object 순서로 호출하고 돌아옵니다.', ['main', 'Child()', 'Parent()', 'Object()']);
exam.add('Parent ref = new Child();', '생성자가 끝났습니다. 선언 타입 Parent인 ref에 객체 100의 참조를 저장합니다.', ['main'], 'Parent ref → 100');
exam.add(expression, '먼저 ref.x(2)를 평가합니다. 컴파일 때 ref의 선언 타입 Parent와 인자 타입 int로 x(int)를 선택했습니다. 실행할 본문은 실제 객체 타입을 확인해 결정합니다.', ['main'], 'Parent ref → 100', '', [['컴파일 시 선택한 메서드', 'x(int)']]);
exam.add(expression, '실제 객체 100은 Child입니다. 재정의된 Child.x(int)로 이동합니다.', ['main', 'Child.x(2)'], 'Parent ref → 100', '', [['this', '100'], ['i', '2']]);
exam.add('public int x(int i) { return i + 3; }', 'Child의 구현에서 2 + 3을 계산하여 5를 반환합니다.', ['main', 'Child.x(2)'], 'Parent ref → 100', '5', [['this', '100'], ['i', '2']]);
exam.add(expression, 'ref.x(2)의 결과 5를 남겨 두고, 오른쪽 ref.id()를 평가합니다.', ['main'], 'Parent ref → 100', '', [['왼쪽 결과', '5']]);
exam.add(expression, 'id는 static 메서드입니다. ref의 선언 타입 Parent에 따라 Parent.id()를 호출합니다.', ['main', 'Parent.id()'], 'Parent ref → 100', '', [['왼쪽 결과', '5'], ['호출 대상', 'Parent.id()']]);
exam.add('public static String id() { return "P"; }', 'Parent.id()가 문자열 "P"를 반환합니다. static 호출에는 this가 없습니다.', ['main', 'Parent.id()'], 'Parent ref → 100', '"P"', [['왼쪽 결과', '5']]);
exam.add(expression, '5 + "P"는 문자열 연결입니다. "5P"를 만든 뒤 println에 전달합니다.', ['main'], 'Parent ref → 100', '', [['왼쪽 결과', '5'], ['오른쪽 결과', '"P"'], ['연결 결과', '"5P"']]);
exam.output.push('5P');
exam.add(expression, '콘솔에 5P를 출력합니다. Child.id()와 x(String)은 실행하지 않았습니다.', ['main'], 'Parent ref → 100');

const practice = builder(`class Animal {
  String name;
  int energy;
  Animal(String name, int energy) {
    this.name = name;
    this.energy = energy;
  }
  String act() {
    energy -= 10;
    return name + ":" + energy;
  }
}
class Dog extends Animal {
  Dog(String name) { super(name, 50); }
  String act() {
    energy -= 20;
    return name + "!" + energy;
  }
}
class Cat extends Animal {
  Cat(String name) { super(name, 30); }
}
public class Main {
  public static void main(String[] args) {
    Animal[] pets = { new Dog("멍이"), new Cat("냥이"), new Dog("바둑이") };
    for (Animal p : pets) {
      p.act();
      if (p.energy > 20) {
        System.out.println(p.act());
      } else {
        System.out.println(p.name);
      }
    }
  }
}`, 'Overriding Practice', '추가 연습 문제 · 출제 시기 미표기');
const allocation = 'Animal[] pets = { new Dog("멍이"), new Cat("냥이"), new Dog("바둑이") };';
practice.add('', 'main에서 시작합니다. 각 객체의 에너지 변화와 반복 호출을 따라갑니다.');
practice.objects.push({ address: 103, type: 'Animal[]', fields: [['[0]', 'null'], ['[1]', 'null'], ['[2]', 'null']] });
practice.add(allocation, '먼저 배열 객체 103을 만들고, 세 칸을 null로 준비합니다. 각 초기화 식을 왼쪽부터 평가합니다.');
const pets = [{ type: 'Dog', name: '멍이', energy: 50 }, { type: 'Cat', name: '냥이', energy: 30 }, { type: 'Dog', name: '바둑이', energy: 50 }];
for (const [i, pet] of pets.entries()) {
  const address = 100 + i;
  const fields: [string, string][] = [['Animal.name', 'null'], ['Animal.energy', '0']];
  practice.objects.push({ address, type: pet.type, fields });
  practice.add(allocation, `${pet.type} 객체를 주소 ${address}에 만듭니다. 필드는 null과 0으로 준비됩니다.`, ['main', `${pet.type}("${pet.name}")`]);
  practice.add(pet.type === 'Dog' ? 'Dog(String name) { super(name, 50); }' : 'Cat(String name) { super(name, 30); }', `부모 생성자에 name = "${pet.name}", energy = ${pet.energy}를 전달합니다.`, ['main', `${pet.type}("${pet.name}")`, `Animal("${pet.name}", ${pet.energy})`], '', '', [['this', String(address)], ['name', `"${pet.name}"`], ['energy', String(pet.energy)]]);
  practice.add('Animal(String name, int energy) {', 'Animal에서 생략된 Object 생성자를 호출한 뒤 돌아옵니다.', ['main', `${pet.type}("${pet.name}")`, `Animal("${pet.name}", ${pet.energy})`, 'Object()']);
  fields[0][1] = `"${pet.name}"`;
  practice.add('this.name = name;', `주소 ${address}의 name에 "${pet.name}"를 저장합니다.`, ['main', `${pet.type}("${pet.name}")`, 'Animal(name, energy)'], '', '', [['this', String(address)]]);
  fields[1][1] = String(pet.energy);
  practice.add('this.energy = energy;', `주소 ${address}의 energy에 ${pet.energy}를 저장합니다.`, ['main', `${pet.type}("${pet.name}")`, 'Animal(name, energy)'], '', '', [['this', String(address)]]);
  practice.objects[0].fields[i][1] = `→ ${address}`;
  practice.add(allocation, `${pet.type} 생성자가 끝났습니다. 배열 [${i}]에 참조 ${address}를 저장합니다.`);
}
practice.add(allocation, 'pets에는 배열 103의 참조를 저장합니다. 배열의 각 칸은 서로 다른 동물 객체를 가리킵니다.', ['main'], 'Animal[] pets → 103');
for (const [i, pet] of pets.entries()) {
  const obj = practice.objects.find(object => object.address === 100 + i)!;
  const address = obj.address;
  const ref = `Animal[] pets → 103\nAnimal p → ${address}`;
  const impl = pet.type === 'Dog' ? 'Dog' : 'Animal';
  const delta = pet.type === 'Dog' ? 20 : 10;
  let energy = pet.energy;
  practice.add('for (Animal p : pets) {', `${i + 1}번째 반복입니다. p에 pets[${i}]의 참조 ${address}를 복사합니다. 객체를 복제하지 않습니다.`, ['main'], ref);
  const act = (line: string, used: boolean) => {
    practice.add(line, `${pet.type} 객체 ${address}의 ${impl}.act()를 호출합니다.${impl === 'Animal' ? ' Cat은 act를 재정의하지 않아 부모 구현을 사용합니다.' : ''}`, ['main', `${impl}.act()`], ref, '', [['this', String(address)]]);
    energy -= delta;
    obj.fields[1][1] = String(energy);
    practice.add(`energy -= ${delta};`, `같은 객체 ${address}의 energy를 ${energy + delta}에서 ${energy}으로 변경합니다.`, ['main', `${impl}.act()`], ref, '', [['this', String(address)]]);
    const value = `${pet.name}${impl === 'Dog' ? '!' : ':'}${energy}`;
    practice.add(impl === 'Dog' ? 'return name + "!" + energy;' : 'return name + ":" + energy;', `"${value}"를 반환합니다.${used ? ' 이 값은 println이 출력합니다.' : ' 반환값은 사용하지 않지만 에너지 변경은 남습니다.'}`, ['main', `${impl}.act()`], ref, `"${value}"`, [['this', String(address)]]);
    if (used) {
      practice.output.push(value);
      practice.add(line, `콘솔에 ${value}를 출력합니다.`, ['main'], ref);
    } else practice.add(line, 'main으로 돌아옵니다. 첫 act()의 반환값은 버립니다.', ['main'], ref);
  };
  act('p.act();', false);
  practice.add('if (p.energy > 20) {', `${energy} > 20은 ${energy > 20 ? '참' : '거짓'}입니다. ${energy > 20 ? 'println 안에서 act()를 한 번 더 호출합니다.' : '이름만 출력하는 else로 이동합니다.'}`, ['main'], ref, '', [['조건 결과', energy > 20 ? 'true' : 'false']]);
  if (energy > 20) act('System.out.println(p.act());', true);
  else {
    practice.output.push(pet.name);
    practice.add('System.out.println(p.name);', `이름 ${pet.name}를 출력합니다. 여기서는 act()를 다시 호출하지 않습니다.`, ['main'], ref);
  }
}
practice.add('for (Animal p : pets) {', '모든 반복이 끝났습니다. 멍이!10, 냥이, 바둑이!10이 순서대로 출력되었습니다.', ['main'], 'Animal[] pets → 103');
export const methodLessons = { 'method-dispatch': exam.lesson, 'overriding-practice': practice.lesson };
