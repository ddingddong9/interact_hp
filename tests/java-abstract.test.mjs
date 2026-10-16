import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { abstractLessons } from '../src/components/java/abstract.ts';
const hasJdk = spawnSync('javac',['-version'],{encoding:'utf8'}).status === 0;
const expected = {
 'abstract-class':['Vehicle name:Spark'],
 'abstract-moving':['현대 이동 중','바퀴로 달린다','야마하 이동 중','물 위를 달린다'],
 'abstract-shapes':['R=12','C=75','87/2'],
};
for(const [kind,lesson] of Object.entries(abstractLessons))test(`${kind}: trace matches real Java compilation and output`,{ skip: !hasJdk && 'Java JDK unavailable' },()=>{
 const dir=mkdtempSync(join(tmpdir(),'java-abstract-'));
 try {
 const name=kind==='abstract-class'?'Gamja':'Main';const file=join(dir,`${name}.java`);writeFileSync(file,lesson.code.join('\n'));
 const compilation=spawnSync('javac',['-encoding','UTF-8','-d',dir,file],{encoding:'utf8'});
 if(kind.endsWith('-error')){
 assert.notEqual(compilation.status,0);assert.match(compilation.stderr,/abstract/);
 assert.ok(lesson.frames.every(f=>!f.allocated&&!f.objects.length&&!f.stack.length&&!f.output.length));
 assert.equal(lesson.frames.at(-1).compile,'error');
 }else{
 assert.equal(compilation.status,0,compilation.stderr);
 const run=spawnSync('java',['-cp',dir,name],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 assert.deepEqual(run.stdout.trimEnd().split('\n'),expected[kind]);assert.deepEqual(lesson.frames.at(-1).output,expected[kind]);
 }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('inherited getName and repeated abstract area calls preserve correct memory',()=>{
 const exam=abstractLessons['abstract-class'];assert.ok(exam.frames.some(f=>f.result==='"Vehicle name:Spark"'&&!f.output.length));
 assert.deepEqual(exam.frames.at(-1).objects[0].fields,[['Vehicle.name','"Spark"']]);
 const frames=abstractLessons['abstract-shapes'].frames;
 assert.equal(frames.at(-1).locals.find(([n])=>n==='Shape.count · static')[1],'2');
 assert.equal(frames.at(-1).locals.find(([n])=>n==='sum')[1],'87');
 assert.equal(frames.filter(f=>f.result==='12').length,2);assert.equal(frames.filter(f=>f.result==='75').length,2);
 assert.deepEqual(frames.at(-1).objects[0].fields,[['[0]','→ 100'],['[1]','→ 101']]);
});

test('supplied examples retain exact outputs and compile failures have no runtime state',()=>{
 for(const [kind,lines] of Object.entries(expected))assert.deepEqual(abstractLessons[kind].frames.at(-1).output,lines);
 for(const kind of ['abstract-new-error','abstract-missing-error']) {
 const frames=abstractLessons[kind].frames;assert.equal(frames.at(-1).compile,'error');assert.ok(frames.every(f=>!f.allocated&&!f.objects.length&&!f.stack.length&&!f.output.length));
 }
 const circle=abstractLessons['abstract-shapes'];for(const f of circle.frames.filter(f=>f.stack.at(-1)==='Circle.format()'&&f.result))assert.ok(f.line>circle.code.indexOf('class Circle extends Shape implements Printable {'));
});
