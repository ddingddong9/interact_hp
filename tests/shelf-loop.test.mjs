import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestBookShift, rebaseShelf, wrapIndex } from '../src/components/shelfLoop.ts';
test('book indices wrap in both directions after repeated revolutions',()=>{
  assert.equal(wrapIndex(-1,8),7);
  assert.equal(wrapIndex(8,8),0);
  assert.equal(wrapIndex(-801,8),7);
  assert.equal(wrapIndex(808,8),0);
});
test('adjacent navigation crosses the last/first seam by one book rather than jumping across the shelf',()=>{
 const spacing=300,period=2400,center=400;
 for(let direction of [-1,1]){
  let index=0,position=center-150;
  for(let i=0;i<80;i++){
   index=wrapIndex(index+direction,8);
   const base=index*spacing+150;
   const shift=nearestBookShift(base,position,center,period);
   const next=center-base-shift;
   assert.equal(next-position,-direction*spacing);
   position=rebaseShelf(next,period);
  }
 }
});
test('rebasing preserves every book position on screen and keeps all links unique',()=>{
 const period=2400,center=400;
 for(const position of [-240010,-13300,-10,13700,240020]){
  const rebased=rebaseShelf(position,period);
  assert.ok(Math.abs(rebased)<=period/2);
  const positions=[];
  for(let i=0;i<8;i++){
   const base=150+i*300;
   const before=base+position+nearestBookShift(base,position,center,period);
   const after=base+rebased+nearestBookShift(base,rebased,center,period);
   assert.equal(after,before);
   positions.push(after);
  }
  assert.equal(new Set(positions).size,8);
 }
});
