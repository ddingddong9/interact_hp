import test from 'node:test';
import assert from 'node:assert/strict';
import { playChapterMotion } from '../src/components/chapterMotion.ts';
function surface(log) {
  return {animate(frames, options) { log.push({frames,options}); return {finished:Promise.resolve(),cancel(){log.push('cancel');}}; }};
}
test('next and previous chapter turns commit between departure and arrival with opposite directions',async()=>{
 for(const direction of ['next','previous']) {
  const log=[];
  await playChapterMotion(surface(log),()=>log.push('commit'),new AbortController().signal,direction);
  assert.equal(log[1],'commit');
  assert.equal(log[0].frames[0].opacity,1);
  assert.equal(log[0].frames[1].opacity,0);
  assert.equal(log[2].frames[0].opacity,0);
  assert.equal(log[2].frames[1].opacity,1);
  assert.match(log[0].frames[1].transform,direction==='next'?/translateX\(-10%\)/:/translateX\(10%\)/);
  assert.equal(log.filter(x=>x==='cancel').length,2);
 }
});
test('aborting an outgoing turn cancels its animation and never commits the new chapter',async()=>{
 const controller=new AbortController();let cancelled=0,committed=false;
 const s={animate(){return{finished:new Promise((resolve,reject)=>{controller.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});}),cancel(){cancelled++;}};}};
 const promise=playChapterMotion(s,()=>{committed=true;},controller.signal,'next');
 controller.abort();await assert.rejects(promise);
 assert.equal(committed,false);assert.ok(cancelled>0);
});
