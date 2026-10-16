import test from 'node:test';
import assert from 'node:assert/strict';
import {networkInfo,formatIPv4,parseIPv4,schedule,theoryChapters} from '../src/components/theory/model.ts';
const ps=[{id:'A',arrival:0,burst:7},{id:'B',arrival:2,burst:4},{id:'C',arrival:4,burst:1}];
test('FCFS and shortest job distinguish arrival from execution and wait',()=>{
 const fcfs=schedule(ps,'FCFS');assert.deepEqual(fcfs.timeline,[...Array(7).fill(0),...Array(4).fill(1),2]);assert.deepEqual(fcfs.metrics.map(m=>m.waiting),[0,5,7]);
 assert.deepEqual(schedule(ps,'SJF').timeline,[...Array(7).fill(0),2,...Array(4).fill(1)]);
 assert.deepEqual(schedule(ps,'SRT').timeline,[0,0,1,1,2,1,1,0,0,0,0,0]);
});
test('RR enqueues arrivals before expired process; long quantum is FCFS',()=>{
 assert.deepEqual(schedule(ps,'RR',2).timeline,[0,0,1,1,0,0,2,1,1,0,0,0]);
 assert.deepEqual(schedule(ps,'RR',10).timeline,schedule(ps,'FCFS').timeline);
});
test('HRN reevaluates waiting ratios at dispatch',()=>{
 const input=[{id:'A',arrival:0,burst:6},{id:'B',arrival:1,burst:4},{id:'C',arrival:5,burst:2}];
 const hrn=schedule(input,'HRN');assert.equal(hrn.timeline[6],1);assert.equal(schedule(input,'SJF').timeline[6],2);
});
test('idle intervals and response times remain exact across algorithms',()=>{
 for(const algo of ['FCFS','SJF','HRN','SRT','RR']){
 const p=[{id:'A',arrival:3,burst:2},{id:'B',arrival:8,burst:1}];const r=schedule(p,algo);
 assert.deepEqual(r.timeline,[null,null,null,0,0,null,null,null,1]);assert.deepEqual(r.metrics.map(m=>m.response),[0,0]);
 for(const m of r.metrics){assert.equal(m.turnaround,m.completion-m.arrival);assert.equal(m.waiting,m.turnaround-m.burst);}
 }
});
test('IPv4 validates input and handles /0 /31 /32 without signed shifts',()=>{
 for(const p of [-1,33,2.5])assert.equal(networkInfo('1.2.3.4',p),null);
 for(const ip of ['1.2.3','1.2.3.256','1.2.-1.0','1.2.3.'])assert.equal(parseIPv4(ip),null);
 assert.equal(formatIPv4(parseIPv4('255.255.255.255')),'255.255.255.255');
 assert.equal(networkInfo('200.1.1.2',0).size,2**32);assert.equal(networkInfo('10.0.0.0',31).usable,2);assert.equal(networkInfo('10.0.0.1',32).usable,1);
});
test('network boundaries and block arithmetic agree for all prefixes',()=>{
 for(let prefix=0;prefix<=32;prefix++){
 const n=networkInfo('172.16.6.140',prefix);assert.equal(n.block*256**(3-n.octet),n.size);
 assert.ok(n.network<=n.address&&n.address<=n.broadcast);assert.equal(n.network%n.size,0);assert.equal(n.broadcast-n.network+1,n.size);
 }
 const n=networkInfo('172.16.6.140',22);assert.equal(formatIPv4(n.network),'172.16.4.0');assert.equal(formatIPv4(n.broadcast),'172.16.7.255');assert.equal(n.usable,1022);
 const subnets=Array.from({length:4},(_,i)=>networkInfo(`192.168.1.${i*64}`,26));assert.deepEqual(subnets.map(n=>formatIPv4(n.network)),['192.168.1.0','192.168.1.64','192.168.1.128','192.168.1.192']);
 assert.equal(formatIPv4(subnets[1].first),'192.168.1.65');assert.equal(formatIPv4(subnets[1].last),'192.168.1.126');
});
test('requested topics are six cards in three distinct categories',()=>{assert.equal(theoryChapters.length,6);assert.equal(theoryChapters.filter(c=>c.category==='Networks').length,4);assert.equal(new Set(theoryChapters.map(c=>c.category)).size,3);});
