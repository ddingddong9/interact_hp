import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/components/java/model.ts';
test('all execution steps map to visible source lines', () => {
  for (const lesson of Object.values(lessons)) {
    assert.equal(lesson.frames[0].line, -1);
    for (const frame of lesson.frames.slice(1)) assert.ok(frame.line >= 0 && frame.line < lesson.code.length);
  }
});
test('constructor delegation initializes one object parent before child', () => {
  const frames = lessons['constructor-chaining'].frames;
  assert.deepEqual(frames[4].stack, ['main', 'Rectangle()', 'Rectangle(10, 20)', 'Shape("사각형")', 'Object()']);
  assert.deepEqual(frames[5].fields.map(f => f[1]), ['"사각형"', '0', '0']);
  assert.deepEqual(frames.at(-1).fields.map(f => f[1]), ['"사각형"', '10', '20']);
  assert.ok(frames.slice(1).every(f => f.fields.length === 3));
});
test('inherited area returns 100 without console output', () => {
  const end = lessons['super-this'].frames.at(-1);
  assert.match(end.result, /^100/);
  assert.deepEqual(end.output, []);
});
test('field hiding retains both fields and dynamic dispatch selects Dog', () => {
  const frames = lessons['field-hiding'].frames;
  assert.equal(frames[6].stack.at(-1), 'Dog.sound()');
  assert.deepEqual(frames.at(-1).fields, [['Animal.name', '"동물"'], ['Dog.name', '"강아지"']]);
  assert.deepEqual(frames.at(-1).output, ['강아지 왈왈', '동물']);
});
test('2025 session 2 selects Child instance method but Parent static method', () => {
  const lesson = lessons['method-dispatch'];
  assert.equal(lesson.problem, '정보처리기사 실기 · 2025년 제2회');
  assert.ok(lesson.frames.some(f => f.stack.at(-1) === 'Child.x(2)' && f.result === '5'));
  assert.ok(lesson.frames.some(f => f.stack.at(-1) === 'Parent.id()' && f.result === '"P"'));
  assert.ok(lesson.frames.every(f => !f.stack.some(call => call === 'Child.id()' || call === 'Child.x(String)')));
  assert.deepEqual(lesson.frames.at(-1).output, ['5P']);
});
test('practice preserves separate objects, aliases and repeated side effects', () => {
  const lesson = lessons['overriding-practice'];
  const end = lesson.frames.at(-1);
  assert.equal(lesson.problem, '추가 연습 문제 · 출제 시기 미표기');
  assert.deepEqual(end.output, ['멍이!10', '냥이', '바둑이!10']);
  assert.deepEqual(end.objects.find(o => o.address === 103).fields, [['[0]', '→ 100'], ['[1]', '→ 101'], ['[2]', '→ 102']]);
  for (const [address, energy] of [[100, '10'], [101, '20'], [102, '10']]) {
    assert.equal(end.objects.find(o => o.address === address).fields[1][1], energy);
  }
  const firstAllocation = lesson.frames[1];
  assert.deepEqual(firstAllocation.objects.map(o => o.type), ['Animal[]']);
  assert.ok(firstAllocation.objects[0].fields.every(f => f[1] === 'null'));
  const firstDog = lesson.frames.find(f => f.objects?.some(o => o.address === 100));
  assert.equal(firstDog.objects.find(o => o.address === 100).fields[1][1], '0');
  assert.ok(lesson.frames.some(f => f.reference.endsWith('Animal p → 101') && f.stack.at(-1) === 'Animal.act()'));
});
test('Override annotation does not change valid dynamic dispatch', () => {
  for (const kind of ['override-annotation', 'override-without']) {
    const frames = lessons[kind].frames;
    assert.deepEqual(frames.at(-1).output, ['Child']);
    assert.ok(frames.some(f => f.stack.at(-1) === 'Child.show()'));
    assert.ok(frames.every(f => f.compile === 'success' || (!f.allocated && f.stack.length === 0)));
  }
});
test('unannotated typo compiles and inherits Parent.show while annotated typo prevents execution', () => {
  const typo = lessons['override-typo'].frames;
  assert.deepEqual(typo.at(-1).output, ['Parent']);
  assert.ok(typo.some(f => f.stack.at(-1) === 'Parent.show()'));
  const error = lessons['override-error'].frames;
  assert.equal(error.at(-1).compile, 'error');
  assert.match(error.at(-1).diagnostic, /does not override or implement/);
  assert.ok(error.every(f => !f.allocated && f.stack.length === 0 && f.output.length === 0));
});
test('annotation exercises preserve overload selection and print without newlines', () => {
  assert.deepEqual(lessons['override-practice-basic'].frames.at(-1).output, ['C']);
  const overload = lessons['override-practice-overload'];
  assert.equal(overload.problem, '연습 문제 2 · 출제 시기 미표기');
  assert.ok(overload.frames.some(f => f.stack.at(-1) === 'Child.show()' && f.output[0] === 'C'));
  assert.ok(overload.frames.some(f => f.stack.at(-1) === 'Parent.show(3)' && f.locals.some(([name, value]) => name === 'n' && value === '3')));
  assert.deepEqual(overload.frames.at(-1).output, ['CP3']);
});
test('overload exercises produce exact outputs and retain source session labels', () => {
  for (const [kind, output, session] of [
    ['method-overloading', ['1123'], '2026년 제1회'],
    ['overload-binding', ['2'], '2026년 제1회'],
    ['overload-recursion', ['4'], '2025년 제1회'],
    ['overload-string-recursion', ['dcba'], '2024년 제2회'],
    ['overload-array-recursion', ['20'], '2025년 제1회'],
    ['overload-basic', ['I3S2'], '출제 시기 미표기'],
    ['overload-shapes', ['빨강 도형', '빨강 도형 크기:10', '파랑 원'], '출제 시기 미표기'],
  ]) {
    assert.deepEqual(lessons[kind].frames.at(-1).output, output);
    assert.ok(lessons[kind].problem.includes(session));
  }
});
test('compile-time overload signature remains Object during runtime override', () => {
  const frames = lessons['overload-binding'].frames;
  assert.ok(frames.some(f => f.locals.some(([name, value]) => name === '선택된 시그니처' && value === 'f(Object)')));
  assert.ok(frames.some(f => f.stack.at(-1) === 'B.f(Object)' && f.result === '"2"'));
  assert.ok(frames.every(f => !f.stack.includes('B.f(String)')));
});
test('recursive calls retain pending callers, resolve left before right and return to main', () => {
  const frames = lessons['overload-recursion'].frames;
  assert.ok(frames.some(f => f.stack.length >= 6));
  const firstInt = frames.find(f => f.stack.at(-1)?.startsWith('calc(int'));
  assert.equal(firstInt.stack.at(-1), 'calc(int 4)');
  assert.ok(frames.some(f => f.stack.at(-1) === 'calc(String "5")' && f.result === '4'));
  assert.deepEqual(frames.at(-1).stack, ['main']);
});
test('shared seen array is mutated on unwind while earlier snapshots remain unchanged', () => {
  const frames = lessons['overload-string-recursion'].frames;
  const earlyArray = frames.find(f => f.objects?.length === 2).objects[1];
  assert.deepEqual(earlyArray.fields, [['기본값 · 모든 칸', 'false']]);
  const finalArray = frames.at(-1).objects[1];
  assert.equal(finalArray.address, 101);
  assert.equal(finalArray.fields.filter(([name, value]) => value === 'true').length, 4);
  assert.ok(frames.some(f => f.stack.at(-1) === 'fn(index -1)' && f.result === '""'));
});
test('binding selection completes before object allocation and never changes at runtime', () => {
  const frames = lessons['compile-time-binding'].frames;
  const compile = frames.filter(f => f.binding?.phase === 'compile');
  assert.equal(compile.length, 2);
  assert.ok(compile.every(f => !f.allocated && f.stack.length === 0));
  assert.deepEqual(compile.map(f => f.binding.signature), ['f(Object)', 'f(String)']);
  for (const frame of frames.filter(f => f.binding?.phase === 'runtime')) {
    assert.equal(frame.binding.signature, frame.binding.site.startsWith('a.') ? 'f(Object)' : 'f(String)');
  }
  assert.deepEqual(frames.at(-1).objects.map(o => [o.address, o.type]), [[100, 'B'], [101, 'B']]);
  assert.deepEqual(frames.at(-1).output, ['2', '3']);
});
test('binding exam fixes A.g scope before runtime B.f(Object)', () => {
  const lesson = lessons['binding-exam'];
  assert.equal(lesson.problem, '정보처리기사 실기 · 2026년 제1회');
  assert.equal(lesson.frames[1].binding.phase, 'compile');
  assert.deepEqual(lesson.frames[1].binding.candidates, ['f(Object)']);
  assert.equal(lesson.frames[1].allocated, false);
  assert.ok(lesson.frames.some(f => f.stack.at(-1) === 'B.f(Object)' && f.binding.implementation === 'B.f(Object)'));
  assert.deepEqual(lesson.frames.at(-1).output, ['2']);
});
