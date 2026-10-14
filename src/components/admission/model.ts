export type Visitor = { id: string; order: number };
export type AdmissionState = { waiting: Visitor[]; active: Visitor[]; finished: Visitor[]; time: number; nextOrder: number };
export type AdmissionChange = { state: AdmissionState; message: string };
export function initialAdmission(): AdmissionState {
  return { waiting: ['A', 'B', 'C', 'D', 'E'].map((id, i) => ({ id, order: i + 1 })), active: [], finished: [], time: 0, nextOrder: 6 };
}
export function enqueueVisitor(source: AdmissionState, id: string): AdmissionChange {
  const name = id.trim();
  if (!name) throw new Error('사용자 이름을 입력하세요.');
  if ([...source.waiting, ...source.active, ...source.finished].some(user => user.id === name)) throw new Error(`${name}은 이미 요청한 사용자입니다.`);
  if (source.waiting.length + source.active.length + source.finished.length >= 12) throw new Error('최대 12명까지 표시합니다. 초기화 후 다시 시도하세요.');
  return { state: { ...source, waiting: [...source.waiting, { id: name, order: source.nextOrder }], nextOrder: source.nextOrder + 1 }, message: `${name}을 접수 순서 ${source.nextOrder}로 대기열에 추가했습니다.` };
}
export function admitTick(source: AdmissionState, rate: number, capacity: number): AdmissionChange {
  if (!Number.isInteger(rate) || rate < 1 || !Number.isInteger(capacity) || capacity < 1) throw new Error('입장 인원과 상한은 1 이상의 정수로 입력하세요.');
  const count = Math.min(rate, Math.max(0, capacity - source.active.length), source.waiting.length);
  const admitted = source.waiting.slice(0, count);
  return { state: { ...source, time: source.time + 1, waiting: source.waiting.slice(count), active: [...source.active, ...admitted] }, message: count ? `${source.time + 1}초 · ${admitted.map(user => user.id).join(', ')} 입장. 활성 인원은 ${source.active.length + count} / ${capacity}명입니다.` : source.waiting.length ? `${source.time + 1}초 · 활성 인원이 상한에 도달했습니다. 완료할 때까지 대기열을 유지합니다.` : `${source.time + 1}초 · 입장시킬 대기자가 없습니다.` };
}
export function finishVisitor(source: AdmissionState, id: string): AdmissionChange {
  const user = source.active.find(user => user.id === id);
  if (!user) throw new Error('활성 사용자만 완료할 수 있습니다.');
  return { state: { ...source, active: source.active.filter(user => user.id !== id), finished: [...source.finished, user] }, message: `${id}의 처리가 완료되었습니다. 활성 자리 1개를 회수했습니다. 다음 입장 처리에서 대기자를 받을 수 있습니다.` };
}
