import { lesson, cLessons } from './model.ts';
const include = '#include <stdio.h>\n';
const basic = lesson('pointer-basics', 'Pointer Basics', include + `int main(void) {
  int n = 7;
  int *p = &n;
  *p = 12;
  printf("%d %d\\n", n, *p);
  return 0;
}`, [
  { title: '주소(Address)와 포인터(Pointer)', text: 'n은 정수 값을 저장하고 p는 n의 주소를 저장합니다. p 자신도 메모리에 놓인 변수이므로 p의 주소와 p 안에 저장된 주소는 다릅니다. &n은 n의 주소를 구하고, *p는 p에 저장된 주소를 따라가 n의 값에 접근합니다.' },
  { title: '별도의 정수가 만들어지는 것은 아닙니다', text: '*p = 12는 p가 가리키는 n에 12를 쓰는 대입입니다. n과 *p가 같은 칸을 읽기 때문에 두 출력값 모두 12입니다. 주소를 대입하는 p = &n과 값을 대입하는 *p = 12를 구분하세요.', comparison: { headers: ['표현', '읽는 내용', '예제 값'], rows: [['n', '정수 값', '12'], ['&n', 'n의 주소', '100'], ['p', 'p에 저장된 주소', '100'], ['&p', 'p 변수 자신의 주소', '1000'], ['*p', '주소 100의 정수', '12']] } },
  { title: '유효한 주소를 먼저 저장합니다', advanced: true, text: '선언만 한 포인터의 값은 미정입니다. NULL은 아무 객체도 가리키지 않는 포인터 값이며, 미정인 포인터와 NULL 모두 역참조하면 안 됩니다. 값을 읽거나 쓰기 전에 살아 있는 객체의 올바른 주소를 저장해야 합니다. 함수의 지역 변수 주소를 반환하면 함수가 끝난 뒤 그 객체에 접근할 수 없습니다.' },
  { title: '선언할 때의 *', text: 'int *p, q;에서 p는 포인터이고 q는 정수입니다. 두 변수를 모두 포인터로 만들려면 int *p, *q;로 선언합니다. 선언의 *는 타입을 나타내며, 식에서 쓰는 *p는 역참조(Dereference)입니다.' },
]);
basic.cell('n', 'int', 100, 7); basic.step('int n = 7;', '주소 100의 n에 정수 7을 저장합니다.', ['n']);
basic.cell('p', 'int *', 1000, 100, 100); basic.step('int *p = &n;', '&n의 값 100을 p에 저장합니다. p 자신은 주소 1000에 있습니다.', ['p', 'n']);
basic.cell('n', 'int', 100, 12); basic.step('*p = 12;', 'p의 주소값 100을 따라가 n의 값을 12로 바꿉니다. p의 주소값은 그대로입니다.', ['p', 'n']);
basic.print('12 12\n'); basic.step('printf("%d %d\\n", n, *p);', 'n과 *p 모두 같은 정수 칸에서 12를 읽습니다.', ['n']);
basic.step('return 0;', 'main이 0을 반환합니다. 반환값은 콘솔 출력과 별개입니다.', [], [], '0'); basic.value.expected = '12 12\n';

const arithmetic = lesson('pointer-arithmetic', 'Pointer Arithmetic', include + `int main(void) {
  int a[] = {4, 8, 12};
  int *p = a;
  int x = *p++;
  int y = (*p)++;
  printf("%d %d %d\\n", x, y, *p);
  return 0;
}`, [
  { title: '요소 단위의 이동', text: '포인터 산술(Pointer Arithmetic)의 p + 1은 다음 요소로 이동합니다. 이동량은 sizeof(*p)바이트입니다. 이 화면은 int 크기를 4바이트로 놓아 배열 주소가 100, 104, 108로 이어집니다. p[i]와 *(p + i)는 같은 요소에 접근합니다.' },
  { title: '괄호에 따라 바뀌는 대상', text: '*p++는 *(p++)입니다. 증가 전 주소의 값을 읽고 포인터를 다음 칸으로 이동합니다. (*p)++는 주소를 유지하고 그 칸의 정수를 증가시킵니다. 후위 증가(Post-increment)는 증가 전 값을 식의 결과로 사용합니다.', comparison: { headers: ['식', '식의 결과', '바뀌는 대상'], rows: [['*p++', '이동 전 칸의 값', '포인터 p'], ['(*p)++', '증가 전 정수 값', 'p가 가리키는 정수'], ['*++p', '이동 후 칸의 값', '포인터 p'], ['++*p', '증가 후 정수 값', 'p가 가리키는 정수']] } },
  { title: '배열 범위와 포인터의 차', advanced: true, text: '같은 배열 안에서 포인터를 이동하거나 두 포인터의 차를 구합니다. a + 3은 배열 바로 다음 위치를 나타낼 수 있지만 역참조할 수 없습니다. (a + 2) - a는 바이트 수가 아닌 요소 수 2입니다. 서로 무관한 객체 사이의 포인터 뺄셈은 사용할 수 없습니다.' },
], '4 8 9\n');
[4,8,12].forEach((v,i) => arithmetic.cell(`a[${i}]`, 'int',100+i*4,v)); arithmetic.step('int a[] = {4, 8, 12};', 'int 요소 3개가 연속해서 저장됩니다.', ['a[0]','a[1]','a[2]']);
arithmetic.cell('p','int *',1000,100,100); arithmetic.step('int *p = a;', '이 식에서 a는 첫 요소의 주소로 변환됩니다. p는 a[0]을 가리킵니다.', ['p','a[0]']);
arithmetic.cell('x','int',200,4); arithmetic.cell('p','int *',1000,104,104); arithmetic.step('int x = *p++;', '기존 주소 100의 값 4를 x에 저장하고, p를 다음 요소 주소 104로 옮깁니다.', ['p','x'], [['읽은 값','4'],['p 이동','100 → 104']]);
arithmetic.cell('y','int',204,8); arithmetic.cell('a[1]','int',104,9); arithmetic.step('int y = (*p)++;', '기존 값 8을 y에 저장하고 a[1]을 9로 증가시킵니다. p는 주소 104를 유지합니다.', ['y','a[1]','p']);
arithmetic.print('4 8 9\n'); arithmetic.step('printf("%d %d %d\\n", x, y, *p);','x는 4, y는 8, 현재 *p는 9입니다.');
arithmetic.step('return 0;', 'main을 종료합니다.', [], [], '0');

const double = lesson('double-pointer','Double Pointer',include + `int main(void) {
  int a = 3, b = 9;
  int *p = &a;
  int **pp = &p;
  **pp = 6;
  *pp = &b;
  **pp = 14;
  printf("%d %d\\n", a, b);
  return 0;
}`, [
  { title: '포인터를 가리키는 포인터', text: '이중 포인터(Double Pointer) pp는 정수의 주소가 아니라 포인터 변수 p의 주소를 저장합니다. pp → p → a 순서로 따라갑니다. *pp는 p 자체이고 **pp는 p가 가리키는 정수입니다.' },
  { title: '값 변경과 연결 변경', text: '**pp = 6은 연결 끝의 정수를 바꿉니다. *pp = &b는 p에 b의 주소를 저장하여 연결 대상을 바꿉니다. 그 뒤 **pp = 14는 a가 아닌 b를 바꿉니다.', comparison:{headers:['표현','대상'],rows:[['pp','p의 주소'],['*pp','p에 저장된 주소'],['**pp','p가 가리키는 정수']]} },
], '6 14\n');
double.cell('a','int',100,3); double.cell('b','int',104,9); double.step('int a = 3, b = 9;','정수 a와 b를 서로 다른 칸에 저장합니다.', ['a','b']);
double.cell('p','int *',1000,100,100); double.step('int *p = &a;','p가 a를 가리킵니다.', ['p','a']);
double.cell('pp','int **',2000,1000,1000); double.step('int **pp = &p;','pp에는 p 자신의 주소 1000을 저장합니다.', ['pp','p']);
double.cell('a','int',100,6); double.step('**pp = 6;','pp → p → a를 따라가 a를 6으로 바꿉니다.', ['pp','p','a']);
double.cell('p','int *',1000,104,104); double.step('*pp = &b;','*pp는 p입니다. p의 저장값을 b의 주소 104로 바꿉니다.', ['pp','p','b']);
double.cell('b','int',104,14); double.step('**pp = 14;','이번에는 pp → p → b를 따라가 b를 14로 바꿉니다.', ['pp','p','b']);
double.print('6 14\n'); double.step('printf("%d %d\\n", a, b);','a는 6, b는 14입니다.'); double.step('return 0;','main을 종료합니다.',[],[],'0');

const rows = lesson('pointer-array','Pointer Array & Array Pointer',include + `int main(void) {
  int a[2][3] = {{1, 2, 3}, {4, 5, 6}};
  int *rows[2] = {a[1], a[0]};
  int (*p)[3] = a;
  rows[0][1] = 20;
  p++;
  printf("%d %d\\n", rows[0][1], (*p)[2]);
  return 0;
}`, [
  { title: '포인터 배열과 배열 포인터', text: 'int *rows[2]는 주소를 저장하는 칸이 2개인 포인터 배열(Array of Pointers)입니다. int (*p)[3]는 정수 3개짜리 배열 한 행을 가리키는 배열 포인터(Pointer to Array)입니다. 괄호가 선언의 의미를 바꿉니다.' },
  { title: '행을 따라 접근하기', text: 'a는 정수 3개짜리 행 2개가 연속된 배열입니다. rows[0]에는 두 번째 행의 시작 주소를 넣었습니다. rows[0][1]은 그 행의 두 번째 정수 a[1][1]입니다. p는 행을 가리키므로 p++는 정수 3개 크기인 12바이트를 이동합니다.', comparison:{headers:['선언','저장 내용','+1의 이동'],rows:[['int *rows[2]','int 포인터 2개','rows[0] + 1은 정수 1개'],['int (*p)[3]','3개짜리 행의 주소','p + 1은 행 1개']]} },
  { title: '2차원 배열은 int **가 아닙니다', advanced:true, text:'a가 식에서 변환되면 타입은 int (*)[3]입니다. 행 안에 정수가 연속되어 있으며, 행의 주소를 담은 별도 포인터 칸들이 들어 있는 것은 아닙니다. 따라서 int **에 그대로 대입할 수 없습니다.' },
], '20 6\n');
[1,2,3,4,5,6].forEach((v,i)=>rows.cell(`a[${Math.floor(i/3)}][${i%3}]`,'int',100+i*4,v)); rows.step('int a[2][3] = {{1, 2, 3}, {4, 5, 6}};','두 행의 정수 6개를 연속해서 저장합니다. 두 번째 행은 주소 112에서 시작합니다.');
rows.cell('rows[0]','int *',1000,112,112); rows.cell('rows[1]','int *',1008,100,100); rows.step('int *rows[2] = {a[1], a[0]};','rows는 두 행을 반대 순서로 가리킵니다. 정수 배열 자체는 이동하지 않습니다.', ['rows[0]','rows[1]']);
rows.cell('p','int (*)[3]',2000,100,100); rows.step('int (*p)[3] = a;','p는 첫 행 전체를 가리키는 포인터입니다.', ['p']);
rows.cell('a[1][1]','int',116,20); rows.step('rows[0][1] = 20;','rows[0]의 주소 112에서 한 정수만큼 이동하여 주소 116에 20을 씁니다.', ['rows[0]','a[1][1]']);
rows.cell('p','int (*)[3]',2000,112,112); rows.step('p++;','행 크기 3 × 4 = 12바이트를 이동합니다. p는 두 번째 행을 가리킵니다.', ['p']);
rows.print('20 6\n'); rows.step('printf("%d %d\\n", rows[0][1], (*p)[2]);','rows[0][1]은 20, p가 가리키는 행의 세 번째 정수는 6입니다.'); rows.step('return 0;','main을 종료합니다.',[],[],'0');

const strings = lesson('string-pointer','String Pointer',include + `int main(void) {
  char s[] = "CODE";
  const char *p = "DATA";
  s[0] = 'N';
  p = s + 1;
  printf("%s %c\\n", p, *p);
  return 0;
}`, [
  { title:'문자 배열과 문자열 포인터', text:'s는 문자와 끝을 표시하는 널 문자(Null Character) \\0를 직접 저장하는 배열입니다. p는 문자열의 시작 주소를 저장합니다. s의 요소는 수정할 수 있지만 문자열 리터럴(Literal)의 내용을 수정하면 정의되지 않은 동작입니다. const char *로 읽기만 하도록 표시합니다.' },
  { title:'문자 한 개와 문자열 출력',text:'p = s + 1은 p가 두 번째 문자를 가리키게 합니다. %s는 그 주소부터 \\0 직전까지 출력하고, %c는 *p의 문자 하나를 출력합니다. p의 연결을 바꾸는 것과 문자열 내용을 바꾸는 것은 별개입니다.' },
], 'ODE O\n');
'CODE\0'.split('').forEach((c,i)=>strings.cell(`s[${i}]`,'char',100+i,c==='\0'?'\\0':c)); strings.step('char s[] = "CODE";','문자 4개와 끝 표시 \\0, 총 5칸을 준비합니다.');
'DATA\0'.split('').forEach((c,i)=>strings.cell(`literal[${i}]`,'const char',300+i,c==='\0'?'\\0':c,undefined,'literal')); strings.cell('p','const char *',1000,300,300); strings.step('const char *p = "DATA";','p는 문자열 리터럴의 첫 문자 주소 300을 저장합니다.', ['p']);
strings.cell('s[0]','char',100,'N'); strings.step("s[0] = 'N';",'수정 가능한 배열 s의 첫 문자를 N으로 바꿉니다.', ['s[0]']);
strings.cell('p','const char *',1000,101,101); strings.step('p = s + 1;','p를 s의 두 번째 문자 O에 연결합니다. 리터럴 DATA의 내용은 그대로입니다.', ['p','s[1]']);
strings.print('ODE O\n'); strings.step('printf("%s %c\\n", p, *p);','%s는 ODE를, %c는 O 하나를 출력합니다.', ['s[1]','s[2]','s[3]']); strings.step('return 0;','main을 종료합니다.',[],[],'0');

const copy = lesson('string-copy','String Copy',include + `int main(void) {
  const char *src = "SUN";
  char dst[4];
  char *d = dst;
  while ((*d++ = *src++) != '\\0') {
  }
  printf("%s\\n", dst);
  return 0;
}`, [
 {title:'주소 복사가 아닌 문자 복사',text:'d = dst는 주소를 저장하지만 *d = *src는 문자 한 개를 복사합니다. 원본과 대상은 별도의 배열입니다. 반복문에서 문자 하나를 대입하고 두 포인터를 다음 칸으로 옮깁니다.'},
 {title:'끝 표시까지 복사합니다',text:'대입식의 결과는 복사한 문자입니다. S, U, N에서는 조건이 참이고 \\0를 복사하면 거짓이 되어 끝납니다. 대상은 널 문자를 포함해 최소 4칸이어야 합니다. 마지막 증가로 배열 바로 다음 주소가 만들어져도 그 위치를 역참조하지는 않습니다.'},
], 'SUN\n');
'SUN\0'.split('').forEach((c,i)=>copy.cell(`src[${i}]`,'const char',300+i,c==='\0'?'\\0':c,undefined,'literal')); copy.cell('src','const char *',1000,300,300); copy.step('const char *src = "SUN";','src가 원본의 첫 문자 S를 가리킵니다.', ['src']);
for(let i=0;i<4;i++)copy.cell(`dst[${i}]`,'char',100+i,'미정'); copy.step('char dst[4];','dst의 4칸은 아직 초기화되지 않았습니다.');
copy.cell('d','char *',2000,100,100); copy.step('char *d = dst;','d가 대상의 첫 칸을 가리킵니다.', ['d']);
for(let i=0;i<4;i++) { const c=i===3?'\\0':'SUN'[i]; copy.cell(`dst[${i}]`,'char',100+i,c); copy.cell('src','const char *',1000,301+i,301+i); copy.cell('d','char *',2000,101+i,101+i); copy.step("while ((*d++ = *src++) != '\\0') {", `${c}를 dst[${i}]에 복사한 뒤 두 주소를 한 칸 이동합니다. ${i===3?'복사한 값이 \\0여서 반복을 끝냅니다.':'복사한 값이 \\0가 아니므로 반복을 계속합니다.'}`, [`dst[${i}]`,'src','d'],[['조건',i===3?'거짓':'참']]); if(i<3)copy.step('}', '빈 반복문 본문을 마치고 다음 문자를 복사하러 돌아갑니다.'); }
copy.print('SUN\n'); copy.step('printf("%s\\n", dst);','초기화가 완료된 dst에서 SUN을 출력합니다.'); copy.step('return 0;','main을 종료합니다.',[],[],'0');

const reverse = lesson('string-reverse','String Reverse',include + `int main(void) {
  char s[] = "ABCD";
  char *l = s, *r = s + 3;
  while (l < r) {
    char t = *l;
    *l = *r;
    *r = t;
    l++;
    r--;
  }
  printf("%s\\n", s);
  return 0;
}`, [
 {title:'양끝에서 안쪽으로',text:'두 포인터(Two Pointers) l과 r은 같은 배열의 양끝을 가리킵니다. 왼쪽 문자를 임시 변수 t에 보관한 뒤 오른쪽 문자를 왼쪽에, t를 오른쪽에 씁니다. 임시 값이 없으면 원래 왼쪽 문자를 잃습니다.'},
 {title:'널 문자는 이동하지 않습니다',text:'r은 마지막 문자 D를 가리키고 끝 표시 \\0는 그대로 둡니다. 교환 후 l은 오른쪽으로, r은 왼쪽으로 이동합니다. 같은 배열 안의 두 포인터가 만나거나 지나치면 반복을 마칩니다.'},
], 'DCBA\n');
const reverseChars = 'ABCD'.split(''); 'ABCD\0'.split('').forEach((c,i)=>reverse.cell(`s[${i}]`,'char',100+i,c==='\0'?'\\0':c)); reverse.step('char s[] = "ABCD";','수정 가능한 문자 배열을 준비합니다.');
reverse.cell('l','char *',1000,100,100); reverse.cell('r','char *',2000,103,103); reverse.step('char *l = s, *r = s + 3;','l은 A, r은 D를 가리킵니다.', ['l','r']);
for(let i=0;i<2;i++){const j=3-i,t=reverseChars[i]; reverse.step('while (l < r) {',`주소 ${100+i} < ${100+j}이므로 교환합니다.`,['l','r'],[['조건','참']]); reverse.cell('t','char',210,t); reverse.step('char t = *l;',`왼쪽 문자 ${t}를 t에 보관합니다.`,['t']); reverseChars[i]=reverseChars[j]; reverse.cell(`s[${i}]`,'char',100+i,reverseChars[j]); reverse.step('*l = *r;','오른쪽 문자를 왼쪽 칸에 복사합니다.',[`s[${i}]`]); reverseChars[j]=t; reverse.cell(`s[${j}]`,'char',100+j,t); reverse.step('*r = t;','보관한 원래 왼쪽 문자를 오른쪽 칸에 씁니다.',[`s[${j}]`]); reverse.cell('l','char *',1000,101+i,101+i); reverse.step('l++;','l을 한 문자 오른쪽으로 이동합니다.',['l']); reverse.cell('r','char *',2000,102-i,102-i); reverse.step('r--;','r을 한 문자 왼쪽으로 이동합니다.',['r']); reverse.remove('t'); reverse.step('}','이번 교환의 지역 변수 t가 범위를 벗어납니다.');}
reverse.step('while (l < r) {','주소 102 < 101은 거짓입니다. 교환을 멈춥니다.',[],[['조건','거짓']]); reverse.print('DCBA\n'); reverse.step('printf("%s\\n", s);','뒤집힌 문자열 DCBA를 출력합니다.'); reverse.step('return 0;','main을 종료합니다.',[],[],'0');

const value = lesson('pointer-parameter','Pointer Parameter',include + `void by_value(int x) {
  x = 30;
}
void by_pointer(int *p) {
  *p = 30;
  p = NULL;
}
int main(void) {
  int n = 10;
  int *q = &n;
  by_value(n);
  by_pointer(q);
  printf("%d %d\\n", n, *q);
  return 0;
}`, [
 {title:'C의 인자는 값으로 전달됩니다',text:'값 전달(Call by Value)은 인자의 값을 함수의 매개변수에 복사하는 방식입니다. by_value(n)는 정수 10을 x에 복사하므로 x를 바꿔도 n은 바뀌지 않습니다. by_pointer(q)는 q의 주소값 100을 p에 복사합니다.'},
 {title:'복사한 주소로 원본에 접근하기',text:'p와 q는 서로 다른 포인터 변수이지만 같은 n을 가리킵니다. *p = 30은 n을 바꾸며, p = NULL은 함수 안의 p만 바꿉니다. 호출자의 q 자체를 바꾸려면 q의 주소를 int ** 매개변수로 전달해야 합니다. 포인터를 전달해도 C의 전달 방식은 값 전달입니다.'},
], '30 30\n');
value.cell('n','int',100,10); value.step('int n = 10;','호출자의 n을 준비합니다.',['n']); value.cell('q','int *',1000,100,100); value.step('int *q = &n;','q는 n을 가리킵니다.',['q']);
value.step('by_value(n);','n의 값 10을 복사하여 함수를 호출합니다.'); value.stack.push('by_value(10)'); value.cell('x','int',200,10); value.step('void by_value(int x) {','함수의 별도 지역 변수 x에 10을 저장합니다.',['x']); value.cell('x','int',200,30); value.step('x = 30;','x만 30이 됩니다. n은 10입니다.',['x']); value.remove('x'); value.stack.pop(); value.step('by_value(n);','함수가 반환되었습니다. n은 여전히 10입니다.',['n']);
value.step('by_pointer(q);','q의 저장값 100을 복사하여 호출합니다.'); value.stack.push('by_pointer(100)'); value.cell('p','int *',2000,100,100); value.step('void by_pointer(int *p) {','지역 포인터 p와 호출자의 q는 같은 n을 가리킵니다.',['p','q']); value.cell('n','int',100,30); value.step('*p = 30;','주소 100의 원본 n을 30으로 바꿉니다.',['p','n']); value.cell('p','int *',2000,'NULL'); value.step('p = NULL;','지역 변수 p만 NULL로 바꿉니다. q는 계속 주소 100을 저장합니다.',['p','q']); value.remove('p'); value.stack.pop(); value.step('by_pointer(q);','함수를 나왔습니다. n의 변경은 남고 p는 사라집니다.',['n','q']); value.print('30 30\n'); value.step('printf("%d %d\\n", n, *q);','n과 *q는 모두 30입니다.'); value.step('return 0;','main을 종료합니다.',[],[],'0');

const functions = lesson('function-pointer','Function Pointer',include + `int add(int x) {
  return x + 2;
}
int twice(int x) {
  return x * 2;
}
int main(void) {
  int (*fn)(int) = add;
  int a = fn(5);
  fn = twice;
  int b = (*fn)(5);
  printf("%d %d\\n", a, b);
  return 0;
}`, [
 {title:'함수의 주소를 저장합니다',text:'함수 포인터(Function Pointer) int (*fn)(int)는 int 하나를 받아 int를 반환하는 함수의 주소를 저장합니다. 함수 이름 add는 이 식에서 함수 포인터로 변환됩니다. fn(5)와 (*fn)(5)는 저장된 함수를 호출하는 두 표현입니다.'},
 {title:'선언을 안쪽부터 읽기',text:'(*fn)은 fn이 포인터임을, (int)는 가리키는 함수의 매개변수를, 앞의 int는 반환 타입을 뜻합니다. int *fn(int)와는 다릅니다. 후자는 int를 받아 int 포인터를 반환하는 함수 선언입니다.'},
 {title:'배열과 구조체에도 저장할 수 있습니다',advanced:true,text:'int (*ops[2])(int) = {add, twice};는 함수 포인터 배열이며 ops[1](5)는 twice(5)를 실행합니다. 구조체의 int (*run)(int) 멤버도 같은 방식으로 호출할 수 있습니다. 호출할 함수의 매개변수와 반환 타입이 포인터 선언과 호환되어야 합니다.'},
], '7 10\n');
functions.cell('add','int (int)',5000,'함수 코드',undefined,'code'); functions.cell('twice','int (int)',6000,'함수 코드',undefined,'code'); functions.cell('fn','int (*)(int)',1000,5000,5000); functions.step('int (*fn)(int) = add;','fn에 add의 코드 주소를 저장합니다.',['fn','add']);
functions.step('int a = fn(5);','fn이 가리키는 add에 5를 전달합니다.',['fn']); functions.stack.push('add(5)'); functions.cell('x','int',200,5); functions.step('return x + 2;','5 + 2의 결과 7을 반환합니다. 콘솔에는 아직 아무것도 출력하지 않습니다.',['x'],[],'7'); functions.remove('x'); functions.stack.pop(); functions.cell('a','int',100,7); functions.step('int a = fn(5);','반환값 7을 a에 저장합니다.',['a']);
functions.cell('fn','int (*)(int)',1000,6000,6000); functions.step('fn = twice;','fn의 연결을 twice로 바꿉니다.',['fn','twice']); functions.step('int b = (*fn)(5);','이번에는 twice(5)를 호출합니다.'); functions.stack.push('twice(5)'); functions.cell('x','int',200,5); functions.step('return x * 2;','5 × 2의 결과 10을 반환합니다.',['x'],[],'10'); functions.remove('x'); functions.stack.pop(); functions.cell('b','int',104,10); functions.step('int b = (*fn)(5);','반환값 10을 b에 저장합니다.',['b']); functions.print('7 10\n'); functions.step('printf("%d %d\\n", a, b);','두 반환값을 이제 콘솔에 출력합니다.'); functions.step('return 0;','main을 종료합니다.',[],[],'0');

const memory = lesson('dynamic-memory','Dynamic Memory',include + `#include <stdlib.h>
int main(void) {
  int *p = malloc(2 * sizeof *p);
  if (p == NULL) return 1;
  p[0] = 11;
  p[1] = 22;
  printf("%d\\n", p[0] + p[1]);
  free(p);
  p = NULL;
  return 0;
}`, [
 {title:'실행 중 확보하는 메모리',text:'동적 메모리 할당(Dynamic Allocation)은 실행 중에 필요한 공간을 확보하는 것입니다. malloc은 요청한 공간의 주소를 반환하며 실패하면 NULL을 반환합니다. 이 예제는 성공한 경로를 따라갑니다. 반환된 공간의 초기 값은 미정이므로 사용 전에 직접 값을 씁니다.'},
 {title:'포인터 변수와 할당된 공간의 수명',text:'지역 변수 p와 힙(Heap)의 정수 칸들은 별개입니다. free(p)는 힙 공간을 해제하며 p에 NULL을 자동으로 넣지는 않습니다. 이어서 p = NULL로 더 이상 가리키지 않게 합니다. 해제된 공간을 읽거나 두 번 해제하면 정의되지 않은 동작입니다.'},
 {title:'calloc과 realloc',advanced:true,text:'calloc은 할당한 공간의 모든 비트를 0으로 초기화합니다. realloc은 공간 크기를 바꾸면서 기존 내용을 보존하며 주소가 달라질 수 있습니다. 실패하면 기존 공간이 남으므로 반환값을 임시 포인터로 확인한 뒤 원래 포인터에 대입합니다. free(NULL)은 아무 작업도 하지 않습니다.'},
], '33\n');
memory.cell('heap[0]','int',10000,'미정',undefined,'heap'); memory.cell('heap[1]','int',10004,'미정',undefined,'heap'); memory.cell('p','int *',1000,10000,10000); memory.step('int *p = malloc(2 * sizeof *p);','정수 2개를 담을 힙 공간 8바이트를 확보합니다. p는 시작 주소 10000을 저장합니다.',['p','heap[0]','heap[1]']); memory.step('if (p == NULL) return 1;','이 경로에서는 할당에 성공해 p가 NULL이 아닙니다. 실행을 계속합니다.',[],[['조건','거짓']]); memory.cell('heap[0]','int',10000,11,undefined,'heap'); memory.step('p[0] = 11;','첫 힙 칸에 11을 씁니다.',['heap[0]']); memory.cell('heap[1]','int',10004,22,undefined,'heap'); memory.step('p[1] = 22;','두 번째 힙 칸에 22를 씁니다.',['heap[1]']); memory.print('33\n'); memory.step('printf("%d\\n", p[0] + p[1]);','11 + 22의 결과 33을 출력합니다.'); memory.release('heap'); memory.cell('p','int *',1000,'사용 불가 · 해제 후'); memory.step('free(p);','힙 공간을 해제합니다. p에 NULL을 대입한 것은 아니며 이전 연결을 사용할 수 없습니다.',['p','heap[0]','heap[1]']); memory.cell('p','int *',1000,'NULL'); memory.step('p = NULL;','p에 NULL을 저장해 해제된 공간과의 연결을 제거합니다.',['p']); memory.step('return 0;','main을 종료합니다.',[],[],'0');

const structs = lesson('struct-pointer','Struct Pointer',include + `struct Item {
  int count;
  int price;
};
int main(void) {
  struct Item items[2] = {{2, 5}, {3, 8}};
  struct Item *p = items;
  p->count = 4;
  p++;
  printf("%d %d\\n", items[0].count, (*p).price);
  return 0;
}`, [
 {title:'하나로 묶은 멤버(Member)',text:'구조체(Structure)는 count와 price처럼 여러 값을 하나의 타입으로 묶습니다. items는 구조체 2개를 담는 배열입니다. 각 구조체의 멤버는 그 구조체 내부에 있습니다. 이 예제 배치에서는 정수 멤버 두 개를 합쳐 구조체 하나가 8바이트입니다.'},
 {title:'.과 ->의 차이',text:'items[0].count는 구조체 값에서 멤버를 찾습니다. p->count는 포인터를 한 번 따라간 구조체에서 멤버를 찾으므로 (*p).count와 같습니다. p++는 멤버 한 칸이 아닌 구조체 한 개만큼 이동합니다.',comparison:{headers:['식','읽는 순서'],rows:[['items[0].count','첫 구조체 → count'],['p->count','p의 주소 → 구조체 → count'],['(*p).price','p의 주소 → 구조체 → price']]}},
], '4 8\n');
for(let i=0;i<2;i++){structs.cell(`items[${i}].count`,'int',100+i*8,[2,3][i]); structs.cell(`items[${i}].price`,'int',104+i*8,[5,8][i]);} structs.step('struct Item items[2] = {{2, 5}, {3, 8}};','구조체 2개를 연속해서 초기화합니다.'); structs.cell('p','struct Item *',1000,100,100); structs.step('struct Item *p = items;','p는 첫 구조체의 시작 주소 100을 저장합니다.',['p']); structs.cell('items[0].count','int',100,4); structs.step('p->count = 4;','주소 100의 구조체 안에 있는 count만 4로 바꿉니다.',['items[0].count']); structs.cell('p','struct Item *',1000,108,108); structs.step('p++;','구조체 하나 크기 8바이트를 이동해 두 번째 구조체를 가리킵니다.',['p']); structs.print('4 8\n'); structs.step('printf("%d %d\\n", items[0].count, (*p).price);','첫 구조체의 count 4와 두 번째 구조체의 price 8을 출력합니다.',['items[0].count','items[1].price']); structs.step('return 0;','main을 종료합니다.',[],[],'0');

const nested = lesson('nested-struct','Nested Struct',include + `struct Detail { int score; };
struct Student {
  struct Detail detail;
  struct Detail *link;
};
int main(void) {
  struct Detail other = {70};
  struct Student s = {{50}, &other};
  struct Student *p = &s;
  p->detail.score = 60;
  p->link->score = 80;
  printf("%d %d\\n", s.detail.score, other.score);
  return 0;
}`, [
 {title:'안에 포함된 값과 밖을 가리키는 주소',text:'s.detail은 s 안에 포함된 구조체 값입니다. s.link는 s 밖의 other를 가리키는 포인터입니다. 둘 다 Detail과 관련되지만 저장하는 방식이 다릅니다. 내부 값과 외부 연결을 나누어 보세요.'},
 {title:'왼쪽부터 타입을 확인합니다',text:'p는 포인터이므로 p->detail로 구조체에 접근합니다. detail은 포인터가 아닌 구조체 값이므로 다음은 .score입니다. p->link는 포인터 값이므로 그 다음에도 ->score를 씁니다. 화살표 개수는 중첩 깊이보다 각 단계의 타입으로 결정합니다.',comparison:{headers:['표현','경로'],rows:[['p->detail.score','p → s → 내부 detail → score'],['p->link->score','p → s → link의 주소 → other → score']]}},
], '60 80\n');
nested.cell('other.score','int',300,70); nested.step('struct Detail other = {70};','other를 s와 별개의 구조체로 준비합니다.',['other.score']); nested.cell('s.detail.score','int',100,50); nested.cell('s.link','struct Detail *',108,300,300); nested.step('struct Student s = {{50}, &other};','s 내부에는 score 값 50과 other의 주소 300을 저장하는 link가 있습니다.'); nested.cell('p','struct Student *',1000,100,100); nested.step('struct Student *p = &s;','p가 s를 가리킵니다.',['p']); nested.cell('s.detail.score','int',100,60); nested.step('p->detail.score = 60;','s 내부의 detail.score를 60으로 바꿉니다.',['p','s.detail.score']); nested.cell('other.score','int',300,80); nested.step('p->link->score = 80;','s.link의 주소 300을 다시 따라가 other.score를 80으로 바꿉니다.',['s.link','other.score']); nested.print('60 80\n'); nested.step('printf("%d %d\\n", s.detail.score, other.score);','내부 값 60과 외부 값 80을 출력합니다.'); nested.step('return 0;','main을 종료합니다.',[],[],'0');

const sizes = lesson('sizeof-array','sizeof & Array',include + `void inspect(int a[]) {
  printf("%zu\\n", sizeof a);
}
int main(void) {
  int a[3] = {2, 4, 6};
  int *p = a;
  size_t n = sizeof a / sizeof a[0];
  printf("%zu %zu %zu\\n", sizeof a, sizeof p, n);
  inspect(a);
  return 0;
}`, [
 {title:'배열의 크기와 포인터의 크기',text:'sizeof는 바이트 단위 크기를 구하고 size_t 타입으로 반환합니다. 배열 a 자체에 sizeof를 적용하면 모든 요소의 크기를 합합니다. p는 배열을 가리켜도 포인터 변수 하나이므로 sizeof p는 포인터의 크기입니다. %zu는 size_t 값을 출력합니다.'},
 {title:'배열 매개변수는 포인터로 조정됩니다',text:'함수 선언의 int a[] 매개변수는 int *a로 조정됩니다. 호출할 때 전체 배열을 복사하는 것이 아니라 첫 요소의 주소를 전달합니다. 따라서 inspect 안의 sizeof a는 포인터 크기입니다. 배열 길이가 필요하면 별도 인자로 전달해야 합니다.',comparison:{headers:['이 예제의 식','대상','바이트'],rows:[['main의 sizeof a','정수 3개 배열','12'],['sizeof p','포인터 변수','8'],['inspect의 sizeof a','포인터 매개변수','8']]}},
 {title:'sizeof가 값을 읽는 것은 아닙니다',advanced:true,text:'이 화면은 int 4바이트, 포인터 8바이트인 배치로 계산합니다. 다른 환경에서는 크기가 달라질 수 있습니다. 일반적인 고정 크기 타입의 sizeof 식은 피연산자를 평가하지 않으므로 sizeof *p는 역참조로 정수 값을 읽지 않습니다. 가변 길이 배열(VLA)은 별도로 평가 규칙을 확인해야 합니다.'},
], '12 8 3\n8\n');
[2,4,6].forEach((v,i)=>sizes.cell(`a[${i}]`,'int',100+i*4,v)); sizes.step('int a[3] = {2, 4, 6};','main의 a는 정수 3개를 직접 저장하는 배열입니다.'); sizes.cell('p','int *',1000,100,100); sizes.step('int *p = a;','p는 주소 하나를 저장하는 포인터 변수입니다.',['p']); sizes.cell('n','size_t',200,3); sizes.step('size_t n = sizeof a / sizeof a[0];','전체 크기 12를 요소 크기 4로 나누어 요소 수 3을 구합니다.',['n'],[['sizeof a','12'],['sizeof a[0]','4']]); sizes.print('12 8 3\n'); sizes.step('printf("%zu %zu %zu\\n", sizeof a, sizeof p, n);','배열 크기 12, 포인터 크기 8, 요소 수 3을 출력합니다.'); sizes.step('inspect(a);','첫 요소의 주소 100을 inspect로 전달합니다.'); sizes.stack.push('inspect(100)'); sizes.cell('inspect.a','int *',2000,100,100); sizes.step('void inspect(int a[]) {','함수의 a는 별도의 포인터 매개변수입니다. main의 배열 a와 구분합니다.',['inspect.a']); sizes.print('8\n'); sizes.step('printf("%zu\\n", sizeof a);','여기서 sizeof a는 배열이 아닌 포인터의 크기 8입니다.',['inspect.a']); sizes.remove('inspect.a'); sizes.stack.pop(); sizes.step('inspect(a);','inspect가 반환되었습니다.'); sizes.step('return 0;','main을 종료합니다.',[],[],'0');

const lists = lesson('linked-list','Linked List Pointers',include + `struct Node {
  int value;
  struct Node *next;
};
int main(void) {
  struct Node b = {5, NULL};
  struct Node a = {2, &b};
  struct Node *head = &a;
  struct Node *p = head;
  while (p != NULL) {
    printf("%d ", p->value);
    p = p->next;
  }
  printf("\\n");
  return 0;
}`, [
 {title:'다음 노드의 주소를 저장합니다',text:'연결 리스트(Linked List)의 노드(Node)는 값과 다음 노드의 주소를 함께 담습니다. head는 첫 노드를 가리키고 마지막 노드의 next는 NULL입니다. 노드들이 배열처럼 붙어 있어야 하는 것은 아닙니다.'},
 {title:'주소를 이동하는 두 가지 방식',text:'p = p->next는 현재 노드에 저장된 다음 주소로 이동합니다. p++는 구조체 크기만큼 산술 이동하므로 리스트 순회에 사용할 수 없습니다. 순회용 p를 움직여도 head와 노드 안의 next는 그대로 남습니다.'},
], '2 5 \n');
lists.cell('b.value','int',300,5); lists.cell('b.next','struct Node *',308,'NULL'); lists.step('struct Node b = {5, NULL};','마지막 노드 b의 next를 NULL로 둡니다.'); lists.cell('a.value','int',100,2); lists.cell('a.next','struct Node *',108,300,300); lists.step('struct Node a = {2, &b};','a의 next에 b의 주소 300을 저장합니다.',['a.next','b.value']); lists.cell('head','struct Node *',1000,100,100); lists.step('struct Node *head = &a;','head를 첫 노드 a에 연결합니다.',['head']); lists.cell('p','struct Node *',2000,100,100); lists.step('struct Node *p = head;','순회용 p에 head의 주소값을 복사합니다.',['p']);
for(const [name,addr,num,next] of [['a',100,2,300],['b',300,5,null]] as const){lists.step('while (p != NULL) {',`p가 노드 ${name}을 가리키므로 본문을 실행합니다.`,['p'],[['조건','참']]); lists.print(`${num} `); lists.step('printf("%d ", p->value);',`노드 ${name}의 value ${num}를 출력합니다.`,[`${name}.value`]); lists.cell('p','struct Node *',2000,next??'NULL',next??undefined); lists.step('p = p->next;',next===null?'b.next가 NULL이므로 p도 NULL이 됩니다.':'a.next의 주소 300을 읽어 p가 b를 가리키게 합니다.',['p',`${name}.next`]); lists.step('}','다음 반복 조건을 확인합니다.');}
lists.step('while (p != NULL) {','p가 NULL이므로 반복을 끝냅니다. head는 여전히 a를 가리킵니다.',['head','p'],[['조건','거짓']]); lists.print('\n'); lists.step('printf("\\n");','줄바꿈을 출력합니다.'); lists.step('return 0;','main을 종료합니다.',[],[],'0');

const listReverse = lesson('linked-list-reverse','Linked List Reverse',include + `struct Node { int value; struct Node *next; };
int main(void) {
  struct Node c = {9, NULL};
  struct Node b = {6, &c};
  struct Node a = {3, &b};
  struct Node *head = &a;
  struct Node *prev = NULL, *cur = head;
  while (cur != NULL) {
    struct Node *next = cur->next;
    cur->next = prev;
    prev = cur;
    cur = next;
  }
  head = prev;
  printf("%d %d %d\\n", head->value,
    head->next->value, head->next->next->value);
  return 0;
}`, [
 {title:'값 대신 연결을 뒤집습니다',text:'노드의 value는 바꾸지 않고 next에 저장된 주소를 반대 방향으로 바꿉니다. prev는 뒤집은 부분의 첫 노드, cur는 지금 처리할 노드, next는 아직 처리하지 않은 부분으로 이어지는 원래 주소입니다.'},
 {title:'원래 다음 주소를 먼저 보관합니다',text:'cur->next = prev를 먼저 하면 원래 다음 노드의 주소를 잃습니다. 그래서 next = cur->next로 보관한 뒤 연결을 바꿉니다. prev와 cur를 이동하며 반복하고, cur가 NULL이 되면 head = prev로 새로운 첫 노드를 지정합니다.'},
], '9 6 3\n');
for(const [name,addr,num,target] of [['c',500,9,null],['b',300,6,500],['a',100,3,300]] as const){listReverse.cell(`${name}.value`,'int',addr,num); listReverse.cell(`${name}.next`,'struct Node *',addr+8,target??'NULL',target??undefined); listReverse.step(`struct Node ${name} = {${num}, ${target===null?'NULL':name==='b'?'&c':'&b'}};`,`노드 ${name}의 값과 다음 주소를 준비합니다.`);}
listReverse.cell('head','struct Node *',1000,100,100); listReverse.step('struct Node *head = &a;','기존 순서는 a → b → c입니다.',['head']); listReverse.cell('prev','struct Node *',2000,'NULL'); listReverse.cell('cur','struct Node *',3000,100,100); listReverse.step('struct Node *prev = NULL, *cur = head;','뒤집은 부분은 비어 있고 cur는 a를 가리킵니다.');
for(const [name,addr,original,prev] of [['a',100,300,null],['b',300,500,100],['c',500,null,300]] as const){listReverse.step('while (cur != NULL) {',`cur가 ${name}을 가리키므로 처리합니다.`,['cur'],[['조건','참']]); listReverse.cell('next','struct Node *',4000,original??'NULL',original??undefined); listReverse.step('struct Node *next = cur->next;','원래 다음 주소를 지역 변수 next에 먼저 보관합니다.',['next',`${name}.next`]); listReverse.cell(`${name}.next`,'struct Node *',addr+8,prev??'NULL',prev??undefined); listReverse.step('cur->next = prev;','현재 노드의 연결을 이미 뒤집은 부분으로 돌립니다.',[`${name}.next`,'prev']); listReverse.cell('prev','struct Node *',2000,addr,addr); listReverse.step('prev = cur;','현재 노드를 뒤집은 부분의 첫 노드로 삼습니다.',['prev']); listReverse.cell('cur','struct Node *',3000,original??'NULL',original??undefined); listReverse.step('cur = next;','보관한 원래 다음 주소로 cur를 이동합니다.',['cur','next']); listReverse.remove('next'); listReverse.step('}','이번 반복의 지역 변수 next가 범위를 벗어납니다.');}
listReverse.step('while (cur != NULL) {','cur가 NULL이므로 모든 연결을 뒤집었습니다.',[],[['조건','거짓']]); listReverse.cell('head','struct Node *',1000,500,500); listReverse.step('head = prev;','head를 c에 연결합니다. 새로운 순서는 c → b → a입니다.',['head']); listReverse.print('9 6 3\n'); listReverse.step('printf("%d %d %d\\n", head->value,','새 head부터 연결을 따라 9, 6, 3을 출력합니다.'); listReverse.step('return 0;','main을 종료합니다.',[],[],'0');

export { cLessons };
export const cLessonById = Object.fromEntries(cLessons.map(l => [l.id, l]));
