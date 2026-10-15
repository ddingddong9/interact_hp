import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const specs=JSON.parse(readFileSync(new URL('../src/components/python/specs.json',import.meta.url)));
const traces=JSON.parse(readFileSync(new URL('../src/components/python/traces.json',import.meta.url)));
const trace=id=>traces.find(t=>t.id===id);
const spec=id=>specs.find(s=>s.id===id);
const at=(id,source)=>{const s=spec(id);return trace(id).frames.find(f=>s.source.split('\n')[f.line]?.trim()===source);};
const objectFor=(frame,name)=>{const b=frame.bindings.find(b=>b.name===name);return frame.objects.find(o=>o.address===b.target);};

test('all nine first-priority chapters match actual Python execution at every source step',()=>{
 const result=execFileSync('python3',['scripts/generate-python-lessons.py','--check'],{encoding:'utf8'});
 assert.match(result,/9 Python traces match/);
 assert.equal(specs.length,9);
 for(const s of specs){
  const frames=trace(s.id).frames;
  assert.equal(frames[0].line,-1);
  assert.equal(frames[0].bindings.length,0);
  assert.equal(frames.at(-1).output,s.expected);
  assert.equal(new Set(frames.slice(1).map(f=>f.line)).size,s.source.split('\n').length);
  for(const f of frames){
   assert.equal(new Set(f.objects.map(o=>o.address)).size,f.objects.length);
   for(const b of [...f.bindings,...f.objects.flatMap(o=>o.items)])if(b.kind==='reference')assert.ok(f.objects.some(o=>o.address===b.target));
  }
 }
});
test('string slices select stop-exclusive forward and reverse indices and preserve an empty result',()=>{
 assert.deepEqual(at('string-slicing','a = s[1:6:2]').focus.indices,[1,3,5]);
 const f=at('string-slicing','d = s[20:30]');
 assert.equal(objectFor(f,'a').display,"'BDF'");
 assert.equal(objectFor(f,'b').display,"'GFEDCBA'");
 assert.equal(objectFor(f,'c').display,"'FD'");
 assert.equal(objectFor(f,'d').items.length,0);
});
test('implicit whitespace split and explicit separators retain different empty elements',()=>{
 const f=trace('string-split').frames.at(-1);
 assert.equal(objectFor(f,'words').items.length,2);
 assert.equal(objectFor(f,'spaces').items.length,8);
 assert.equal(objectFor(f,'parts').display,"['A', '', 'B', '']");
 assert.equal(objectFor(f,'limited').display,"['a', 'b:c']");
});
test('mutating list methods retain identity, return None, and pop returns the removed value',()=>{
 const initial=objectFor(at('list-methods','a = [3, 1]'),'a');
 const final=trace('list-methods').frames.at(-1);
 assert.equal(objectFor(final,'a').address,initial.address);
 assert.equal(objectFor(final,'a').display,'[2, 3, 5, 9]');
 assert.equal(final.bindings.find(b=>b.name==='x').value,'None');
 assert.equal(final.bindings.find(b=>b.name==='y').value,'1');
 assert.equal(final.bindings.find(b=>b.name==='z').value,'None');
 assert.equal(initial.display,'[3, 1]');
});
test('repeated nested rows share a row while explicitly created rows remain separate',()=>{
 const f=trace('nested-list').frames.at(-1);
 const repeated=objectFor(f,'rows'),separate=objectFor(f,'a');
 assert.equal(repeated.items[0].target,repeated.items[1].target);
 assert.notEqual(separate.items[0].target,separate.items[1].target);
 assert.equal(repeated.display,'[[0, 7], [0, 7]]');
 assert.equal(separate.display,'[[1, 2], [8, 4]]');
});
test('list += changes the shared object while + rebinds only the assigned name',()=>{
 const changed=at('list-concatenation','a += [4]');
 assert.equal(objectFor(changed,'a').address,objectFor(changed,'b').address);
 assert.equal(objectFor(changed,'b').display,'[1, 2, 4]');
 const final=trace('list-concatenation').frames.at(-1);
 assert.notEqual(objectFor(final,'a').address,objectFor(final,'b').address);
 assert.equal(objectFor(final,'b').display,'[1, 2, 4]');
});
test('shallow copy shares inner lists but replacing a row changes only one outer list',()=>{
 const copied=at('shallow-copy','b = a[:]');
 assert.equal(objectFor(copied,'alias').address,objectFor(copied,'a').address);
 assert.notEqual(objectFor(copied,'a').address,objectFor(copied,'b').address);
 assert.equal(objectFor(copied,'a').items[0].target,objectFor(copied,'b').items[0].target);
 const f=trace('shallow-copy').frames.at(-1);
 assert.equal(objectFor(f,'a').items[0].target,objectFor(f,'b').items[0].target);
 assert.notEqual(objectFor(f,'a').items[1].target,objectFor(f,'b').items[1].target);
 assert.equal(f.output,'[[1, 2, 9], [3, 4]]\n[[1, 2, 9], [8]]\nTrue False True\n');
});
