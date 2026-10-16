export const theoryChapters = [
 { id:'process-scheduling',title:'Process Scheduling',korean:'프로세스 스케줄링',category:'Operating Systems' },
 { id:'subnet-mask',title:'Subnet Mask',korean:'서브넷 마스크',category:'Networks' },
 { id:'cidr-prefix',title:'CIDR & Prefix',korean:'CIDR 표기법과 프리픽스 길이',category:'Networks' },
 { id:'block-size',title:'Block Size',korean:'서브넷 마스크 블록 크기',category:'Networks' },
 { id:'subnetting',title:'Subnetting',korean:'서브넷팅',category:'Networks' },
 { id:'rumbaugh',title:'Rumbaugh Modeling',korean:'럼바우 모델링',category:'Software Design' },
];
export function parseIPv4(ip:string):number|null {
 const parts=ip.trim().split('.');if(parts.length!==4||parts.some(p=>!/^\d{1,3}$/.test(p)||Number(p)>255))return null;
 return parts.reduce((n,p)=>n*256+Number(p),0);
}
export function formatIPv4(n:number) {return [24,16,8,0].map(shift=>Math.floor(n/2**shift)%256).join('.');}
export function networkInfo(ip:string,prefix:number) {
 const address=parseIPv4(ip);if(address===null||!Number.isInteger(prefix)||prefix<0||prefix>32)return null;
 const size=2**(32-prefix),network=Math.floor(address/size)*size,broadcast=network+size-1,mask=2**32-size;
 const octet=prefix===32?3:Math.floor(prefix/8);
 const maskOctets=formatIPv4(mask).split('.').map(Number);
 return {address,prefix,size,network,broadcast,mask,maskText:formatIPv4(mask),hostBits:32-prefix,octet,block:256-maskOctets[octet],usable:prefix<31?size-2:prefix===31?2:1,first:prefix<31?network+1:network,last:prefix<31?broadcast-1:broadcast};
}
export type Algorithm='FCFS'|'SJF'|'HRN'|'SRT'|'RR';
export type Process={id:string;arrival:number;burst:number};
export function schedule(processes:Process[],algorithm:Algorithm,quantum=2) {
 if(!processes.length||processes.some(p=>!Number.isInteger(p.arrival)||p.arrival<0||p.arrival>30||!Number.isInteger(p.burst)||p.burst<1||p.burst>20)||!Number.isInteger(quantum)||quantum<1||quantum>10)throw new Error('Invalid scheduling input');
 const remaining=processes.map(p=>p.burst),completion=processes.map(()=>0),first=processes.map(()=>-1),queue:number[]=[],timeline:(number|null)[]=[];
 let current:number|null=null,slice=0,t=0;
 const order=(a:number,b:number)=>processes[a].arrival-processes[b].arrival||a-b;
 while(remaining.some(r=>r>0)){
  for(let i=0;i<processes.length;i++)if(processes[i].arrival===t)queue.push(i);
  if(algorithm==='RR'&&current!==null&&slice===quantum){queue.push(current);current=null;slice=0;}
  const ready=processes.map((_,i)=>i).filter(i=>processes[i].arrival<=t&&remaining[i]>0);
  if(algorithm==='SRT'){current=ready.sort((a,b)=>remaining[a]-remaining[b]||(a===current?-1:b===current?1:order(a,b)))[0]??null;}
  else if(current===null){
   if(algorithm==='RR')current=queue.shift()??null;
   else current=ready.sort((a,b)=>algorithm==='SJF'?remaining[a]-remaining[b]||order(a,b):algorithm==='HRN'?((t-processes[b].arrival+processes[b].burst)/processes[b].burst)-((t-processes[a].arrival+processes[a].burst)/processes[a].burst)||order(a,b):order(a,b))[0]??null;
  }
  timeline.push(current);
  if(current!==null){if(first[current]<0)first[current]=t;remaining[current]--;slice++;if(remaining[current]===0){completion[current]=t+1;current=null;slice=0;}}
  t++;
 }
 const metrics=processes.map((p,i)=>({ ...p,completion:completion[i],turnaround:completion[i]-p.arrival,waiting:completion[i]-p.arrival-p.burst,response:first[i]-p.arrival }));
 return {timeline,metrics};
}
