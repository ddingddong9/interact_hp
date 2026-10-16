import type { Frame, Lesson, JavaObject } from './model';
function lab(source: string, problem: string) {
  const code = source.trim().split('\n');
  const objects: JavaObject[] = [], output: string[] = [], frames: Frame[] = [];
  let reference = '';
  function add(source: string, message: string, stack: string[] = ['main'], locals: [string, string][] = [], result = '', compile: Frame['compile'] = 'success') {
    const line = !source ? -1 : stack.some(call => call.startsWith('Circle.')) && source === 'return name + "=" + area();' ? code.map(l => l.trim()).lastIndexOf(source) : code.findIndex(l => l.trim() === source);
    if (source && line < 0) throw new Error(`Abstract source missing: ${source}`);
    frames.push({ line, message, stack, locals, result, compile, objects: structuredClone(objects), output: [...output], reference, fields: [], allocated: !!objects.length, address: objects[0]?.address ?? null });
  }
  add('', '컴파일 전입니다. 아직 호출 스택, 객체, 출력은 없습니다.', [], [], '', 'pending');
  return { code, objects, output, frames, add, ref(value: string) { reference = value; }, lesson: { title: 'Abstract Class', problem, code, frames } satisfies Lesson };
}
const exam = lab(`abstract class Vehicle {
    String name;
    abstract public String getName(String val);
    public String getName() {
        return "Vehicle name:" + name;
    }
    public void setName(String val) {
        name = val;
    }
}
class Car extends Vehicle {
    public Car(String val) {
        setName(val);
    }
    public String getName(String val) {
        return "Car name:" + val;
    }
    public String getName(byte val[]) {
        return "Car name:" + val;
    }
}
public class Gamja {
    public static void main(String[] args) {
        Vehicle obj = new Car("Spark");
        System.out.println(obj.getName());
    }
}`, '정보처리기사 실기 · 2020년 제3회');
exam.add('abstract public String getName(String val);', '추상 메서드는 getName(String)입니다. Car가 같은 매개변수 타입으로 구현했으므로 컴파일에 성공합니다.', []);
exam.objects.push({address:100,type:'Car',fields:[['Vehicle.name','null']]});
exam.add('Vehicle obj = new Car("Spark");', 'Car 객체 하나를 할당합니다. 상속받은 name도 이 객체 안에 있습니다. obj 대입은 생성자가 끝난 뒤입니다.', ['main','Car("Spark")']);
exam.add('public Car(String val) {', '생략된 super()로 Vehicle()와 Object() 생성자를 먼저 마칩니다. 추상 클래스도 자식 객체 초기화에 참여합니다.', ['main','Car("Spark")','Vehicle()'], [['this','100'],['val','"Spark"']]);
exam.add('setName(val);', 'Car가 재정의하지 않은 Vehicle.setName(String)을 호출합니다.', ['main','Car("Spark")','Vehicle.setName(String)'], [['this','100'],['val','"Spark"']]);
exam.objects[0].fields[0][1]='"Spark"';
exam.add('name = val;', '주소 100 안의 Vehicle.name에 문자열 Spark의 참조를 저장합니다. 반환값이나 콘솔 출력은 없습니다.', ['main','Car("Spark")','Vehicle.setName(String)'], [['this','100'],['val','"Spark"']]);
exam.ref('Vehicle obj → 100');
exam.add('Vehicle obj = new Car("Spark");', '생성자가 끝나고 Vehicle 타입 변수 obj가 Car 객체 100을 가리킵니다.');
exam.add('System.out.println(obj.getName());', '인자가 없으므로 getName()을 선택합니다. getName(String)과 getName(byte[])는 이번 호출에 맞지 않습니다.', ['main','Vehicle.getName()'], [['this','100']]);
exam.add('return "Vehicle name:" + name;', 'Car는 인자 없는 getName()을 재정의하지 않았습니다. Vehicle의 일반 메서드에서 문자열을 반환합니다. 아직 출력하지 않았습니다.', ['main','Vehicle.getName()'], [['this','100']], '"Vehicle name:Spark"');
exam.output.push('Vehicle name:Spark');
exam.add('System.out.println(obj.getName());', '반환된 문자열을 println이 한 줄 출력합니다. 콜론 뒤에 공백은 없습니다.');

const moving = lab(`abstract class Vehicle {
    String brand;
    Vehicle(String brand) {
        this.brand = brand;
    }
    abstract void move();
    void info() {
        System.out.println(brand + " 이동 중");
        move();
    }
}
class Car extends Vehicle {
    Car(String brand) {
        super(brand);
    }
    @Override
    void move() {
        System.out.println("바퀴로 달린다");
    }
}
class Boat extends Vehicle {
    Boat(String brand) {
        super(brand);
    }
    @Override
    void move() {
        System.out.println("물 위를 달린다");
    }
}
public class Main {
    public static void main(String[] args) {
        Vehicle v1 = new Car("현대");
        Vehicle v2 = new Boat("야마하");
        v1.info();
        v2.info();
    }
}`, '연습 1 · 출제 시기 미표기');
moving.add('abstract void move();','Car와 Boat가 move()를 구현했습니다. info()는 상속받아 사용할 수 있습니다.',[]);
for (const [type,brand,name,address] of [['Car','현대','v1',100],['Boat','야마하','v2',101]] as const) {
 moving.objects.push({address,type,fields:[['Vehicle.brand','null']]});
 const line=`Vehicle ${name} = new ${type}("${brand}");`;
 moving.add(line, `${type} 객체 ${address}를 할당하고 부모 생성자로 brand를 전달합니다.`, ['main',`${type}(String)`,'Vehicle(String)'],[['this',String(address)],['brand',`"${brand}"`]]);
 moving.objects.at(-1)!.fields[0][1]=`"${brand}"`;
 moving.add('this.brand = brand;', '부모 생성자가 같은 객체의 상속 필드를 초기화합니다.', ['main',`${type}(String)`,'Vehicle(String)'],[['this',String(address)],['brand',`"${brand}"`]]);
 moving.ref(address===100?'Vehicle v1 → 100':'Vehicle v1 → 100\nVehicle v2 → 101');
 moving.add(line, '생성자가 끝난 뒤 참조 변수에 객체 주소를 저장합니다.');
}
for(const [type,brand,name,address,sound]of [['Car','현대','v1',100,'바퀴로 달린다'],['Boat','야마하','v2',101,'물 위를 달린다']] as const){
 moving.add(`${name}.info();`, '두 객체 모두 Vehicle.info() 본문을 상속받았습니다.', ['main','Vehicle.info()'],[['this',String(address)]]);
 moving.output.push(`${brand} 이동 중`);
 moving.add('System.out.println(brand + " 이동 중");','현재 객체의 brand를 읽어 첫 줄을 출력합니다.', ['main','Vehicle.info()'],[['this',String(address)]]);
 moving.add('move();',`Vehicle.info() 안의 move()도 this.move()입니다. 실제 객체가 ${type}이므로 ${type}.move()로 이동합니다.`,['main','Vehicle.info()',`${type}.move()`],[['this',String(address)]]);
 moving.output.push(sound);
 moving.add(`System.out.println("${sound}");`,`${type}의 구현이 둘째 줄을 출력합니다. void 메서드이므로 반환값은 없습니다.`,['main','Vehicle.info()',`${type}.move()`],[['this',String(address)]]);
 moving.add(`${name}.info();`, '호출이 끝나고 main으로 돌아옵니다.');
}
const shapes=lab(`abstract class Shape {
    static int count = 0;
    String name;
    Shape(String name) {
        this.name = name;
        count++;
    }
    abstract int area();
}
interface Printable {
    String format();
}
class Rect extends Shape implements Printable {
    int w, h;
    Rect(int w, int h) {
        super("R");
        this.w = w;
        this.h = h;
    }
    int area() { return w * h; }
    public String format() {
        return name + "=" + area();
    }
}
class Circle extends Shape implements Printable {
    int r;
    Circle(int r) {
        super("C");
        this.r = r;
    }
    int area() { return r * r * 3; }
    public String format() {
        return name + "=" + area();
    }
}
public class Main {
    public static void main(String[] args) {
        Printable[] arr = { new Rect(3, 4), new Circle(5) };
        int sum = 0;
        for (Printable p : arr) {
            System.out.println(p.format());
            sum += ((Shape) p).area();
        }
        System.out.println(sum + "/" + Shape.count);
    }
}`, '연습 2 · 출제 시기 미표기');
let count=0,sum=0,sumInitialized=false;
function shapeAdd(source:string,message:string,stack:string[]=['main'],locals:[string,string][]=[],result='') {shapes.add(source,message,stack,[['Shape.count · static',String(count)],...(sumInitialized ? [['sum',String(sum)] as [string,string]] : []),...locals],result);}
shapeAdd('abstract int area();','Rect와 Circle은 area()와 Printable.format()을 구현했습니다. 컴파일에 성공합니다.',[]);
const arrayLine='Printable[] arr = { new Rect(3, 4), new Circle(5) };';
shapes.objects.push({address:102,type:'Printable[]',fields:[['[0]','null'],['[1]','null']]});
shapeAdd(arrayLine,'길이 2인 참조 배열 102를 먼저 준비합니다. 원소 객체는 왼쪽부터 생성합니다.');
for(const [type,address,name,fields,assignments]of [
 ['Rect',100,'R',[['Rect.w','0'],['Rect.h','0']],[['this.w = w;','Rect.w','3'],['this.h = h;','Rect.h','4']]],
 ['Circle',101,'C',[['Circle.r','0']],[['this.r = r;','Circle.r','5']]],
] as [string,number,string,[string,string][],[string,string,string][]][]){
 const obj={address,type,fields:[['Shape.name','null'] as [string,string],...fields]};shapes.objects.push(obj);
 shapeAdd(`super("${name}");`,`${type} 객체 ${address}의 부모 부분을 초기화합니다.`,['main',`${type}(...)`,'Shape(String)'],[['this',String(address)],['name',`"${name}"`]]);
 obj.fields[0][1]=`"${name}"`;
 shapeAdd('this.name = name;','동일 객체 안의 Shape.name에 문자열 참조를 저장합니다.',['main',`${type}(...)`,'Shape(String)'],[['this',String(address)]]);
 count++;
 shapeAdd('count++;','클래스가 공유하는 Shape.count를 1 증가시킵니다. 메서드 호출 횟수가 아니라 객체 생성 횟수입니다.',['main',`${type}(...)`,'Shape(String)'],[['this',String(address)]]);
 for(const[source,key,value]of assignments){obj.fields.find(f=>f[0]===key)![1]=value;shapeAdd(source,'부모 생성자가 끝난 뒤 자식 필드를 초기화합니다.',['main',`${type}(...)`],[['this',String(address)],[key.split('.')[1],value]]);}
 shapes.objects[0].fields[address===100?0:1][1]=`→ ${address}`;
 shapeAdd(arrayLine,`완성된 ${type} 참조를 배열에 저장합니다.`);
}
sumInitialized=true;shapes.ref('Printable[] arr → 102');shapeAdd('int sum = 0;','배열 참조를 대입한 뒤 지역 변수 sum을 0으로 초기화합니다.');
for(const[type,address,area,name]of [['Rect',100,12,'R'],['Circle',101,75,'C']] as const){
 shapes.ref(`Printable[] arr → 102\nPrintable p → ${address}`);
 shapeAdd('for (Printable p : arr) {',`배열에서 ${type} 객체 ${address}의 참조를 꺼냅니다.`);
 shapeAdd('System.out.println(p.format());',`Printable 타입으로 format()을 선택하고 ${type}.format() 본문을 실행합니다.`,['main',`${type}.format()`],[['this',String(address)]]);
 shapeAdd('return name + "=" + area();','문자열을 반환하기 전에 같은 객체의 area()를 먼저 계산합니다.',['main',`${type}.format()`,`${type}.area()`],[['this',String(address)]]);
 const areaSource=type==='Rect'?'int area() { return w * h; }':'int area() { return r * r * 3; }';
 shapeAdd(areaSource,type==='Rect'?'3 × 4 = 12를 반환합니다.':'5 × 5 × 3 = 75를 반환합니다. 이 코드에서는 원주율 대신 정수 3을 사용합니다.',['main',`${type}.format()`,`${type}.area()`],[['this',String(address)]],String(area));
 shapeAdd('return name + "=" + area();','area()의 반환값을 문자열과 연결합니다. 아직 콘솔 출력은 아닙니다.',['main',`${type}.format()`],[['this',String(address)]],`"${name}=${area}"`);
 shapes.output.push(`${name}=${area}`);shapeAdd('System.out.println(p.format());','format()이 반환한 문자열을 출력합니다.');
 shapeAdd('sum += ((Shape) p).area();','실제 객체가 Shape의 자식이므로 형 변환이 가능합니다. 객체는 그대로이며 area()를 한 번 더 호출합니다.',['main',`${type}.area()`],[['this',String(address)]]);
 shapeAdd(areaSource,'같은 객체에서 면적을 다시 계산합니다. 생성자를 부르지 않으므로 count는 그대로 2입니다.',['main',`${type}.area()`],[['this',String(address)]],String(area));
 sum+=area;shapeAdd('sum += ((Shape) p).area();',`반환값 ${area}를 sum에 더해 ${sum}이 됩니다.`);
}
shapes.ref('Printable[] arr → 102');shapes.output.push('87/2');shapeAdd('System.out.println(sum + "/" + Shape.count);','sum은 87, 생성된 Shape 자식 객체 수는 2이므로 87/2를 출력합니다. 반복문의 p는 범위를 벗어났습니다.');
function invalid(missing:boolean){
 const source=missing?`abstract class Vehicle { abstract void move(); }
class Car extends Vehicle { }
public class Main {
    public static void main(String[] args) { }
}`:`abstract class Vehicle { }
public class Main {
    public static void main(String[] args) {
        Vehicle v = new Vehicle();
    }
}`;
 const l=lab(source,'개념 비교 · 컴파일 오류');
 l.add(missing?'class Car extends Vehicle { }':'Vehicle v = new Vehicle();',missing?'구체 클래스 Car가 추상 메서드 move()를 구현하지 않아 컴파일 오류입니다. Car도 abstract로 선언하면 구현을 다음 자식에게 미룰 수 있습니다.':'추상 메서드가 없어도 abstract 클래스는 직접 new 할 수 없습니다.',[],[],'','error');
 l.frames.at(-1)!.diagnostic=missing?'Car is not abstract and does not override abstract method move() in Vehicle':'Vehicle is abstract; cannot be instantiated';return l.lesson;
}
export const abstractLessons={
 'abstract-class':exam.lesson,
 'abstract-moving':moving.lesson,
 'abstract-shapes':shapes.lesson,
 'abstract-new-error':invalid(false),
 'abstract-missing-error':invalid(true),
};
