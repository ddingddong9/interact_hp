import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { cLessons, cLessonById } from '../src/components/c/lessons.ts';

test('every C trace has valid source lines, independent snapshots, and unique live cell addresses', () => {
  assert.equal(cLessons.length,15);
  for(const l of cLessons) {
    assert.equal(l.frames[0].line,-1);
    assert.equal(l.frames[0].cells.length,0);
    for(const f of l.frames.slice(1)) {
      assert.ok(f.line>=0&&f.line<l.code.length, l.id);
      assert.equal(new Set(f.cells.map(c=>c.address)).size,f.cells.length, l.id);
      for(const c of f.cells) if(c.target!==undefined) {
        assert.equal(c.value,String(c.target));
        assert.ok(f.cells.some(target=>target.address===c.target&&target.alive)||l.id==='string-copy',`${l.id}: ${c.name}`);
      }
    }
    assert.equal(l.frames.at(-1).output,l.expected,l.id);
  }
});

test('all fifteen example programs produce the same output under the C compiler and sanitizers', () => {
  const dir=mkdtempSync(join(tmpdir(),'c-pointer-lessons-'));
  try {
    for(const l of cLessons){
      const source=join(dir,`${l.id}.c`),binary=join(dir,l.id);
      writeFileSync(source,l.code.join('\n'));
      execFileSync('clang',['-std=c11','-Wall','-Wextra','-fsanitize=address,undefined',source,'-o',binary],{stdio:'pipe'});
      assert.equal(execFileSync(binary,{encoding:'utf8',timeout:5000}),l.expected,l.id);
    }
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('post-increment changes the pointer or pointee according to parentheses',()=>{
  const l=cLessonById['pointer-arithmetic'];
  const f=l.frames.find(f=>l.code[f.line]?.trim()==='int x = *p++;');
  assert.equal(f.cells.find(c=>c.name==='p').target,104);
  assert.equal(f.cells.find(c=>c.name==='a[0]').value,'4');
  const next=l.frames.find(f=>l.code[f.line]?.trim()==='int y = (*p)++;');
  assert.equal(next.cells.find(c=>c.name==='p').target,104);
  assert.equal(next.cells.find(c=>c.name==='a[1]').value,'9');
  assert.equal(f.cells.find(c=>c.name==='a[1]').value,'8');
});

test('parameter pointer reassignment leaves caller pointer intact',()=>{
 const l=cLessonById['pointer-parameter'];
 const f=l.frames.find(f=>l.code[f.line]?.trim()==='p = NULL;');
 assert.equal(f.cells.find(c=>c.name==='p').target,undefined);
 assert.equal(f.cells.find(c=>c.name==='q').target,100);
 assert.equal(f.cells.find(c=>c.name==='n').value,'30');
 assert.ok(!l.frames.at(-1).cells.some(c=>c.name==='p'));
});

test('heap release removes usable connections without prematurely assigning NULL',()=>{
 const l=cLessonById['dynamic-memory'];
 const f=l.frames.find(f=>l.code[f.line]?.trim()==='free(p);');
 assert.ok(f.cells.filter(c=>c.region==='heap').every(c=>!c.alive));
 assert.equal(f.cells.find(c=>c.name==='p').target,undefined);
 assert.notEqual(f.cells.find(c=>c.name==='p').value,'NULL');
 assert.equal(l.frames.at(-1).cells.find(c=>c.name==='p').value,'NULL');
});

test('list reversal preserves payloads and reverses all links',()=>{
 const f=cLessonById['linked-list-reverse'].frames.at(-1);
 for(const [name,value] of [['a.value','3'],['b.value','6'],['c.value','9']])assert.equal(f.cells.find(c=>c.name===name).value,value);
 assert.equal(f.cells.find(c=>c.name==='head').target,500);
 assert.equal(f.cells.find(c=>c.name==='c.next').target,300);
 assert.equal(f.cells.find(c=>c.name==='b.next').target,100);
 assert.equal(f.cells.find(c=>c.name==='a.next').value,'NULL');
});
