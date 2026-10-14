export type User = 'A' | 'B';
export type Mode = 'separate' | 'atomic';
export type Step = 0 | 1 | 2 | 3;
export type RequestState = { read: number | null; approved: boolean | null; result: 'pending' | 'success' | 'failed'; step: Step | null };
export type RaceFrame = { seats: number; requests: Record<User, RequestState>; active: User | null; lockedBy: User | null; waiting: User | null; message: string };
export function raceFrames(mode: Mode, first: User): RaceFrame[] {
  const second: User = first === 'A' ? 'B' : 'A';
  let state: RaceFrame = {
    seats: 1,
    requests: { A: { read: null, approved: null, result: 'pending', step: null }, B: { read: null, approved: null, result: 'pending', step: null } },
    active: null, lockedBy: null, waiting: null,
    message: '마지막 좌석 1개에 두 요청이 도착했습니다.',
  };
  const frames: RaceFrame[] = [];
  const push = (message: string) => {
    state = { ...state, message };
    frames.push({ ...state, requests: { A: { ...state.requests.A }, B: { ...state.requests.B } } });
  };
  const update = (user: User, data: Partial<RequestState>) => { state.requests = { ...state.requests, [user]: { ...state.requests[user], ...data } }; state.active = user; };
  const read = (user: User) => { update(user, { read: state.seats, step: 0 }); push(`${user}가 잔여 좌석 ${state.seats}을 읽습니다.`); };
  const check = (user: User) => { const approved = state.requests[user].read! > 0; update(user, { approved, step: 1 }); push(`${user}는 자신이 읽은 값 ${state.requests[user].read}로 ${approved ? '예약 가능' : '좌석 없음'}을 판단합니다.`); };
  const deduct = (user: User) => { state.seats = state.requests[user].read! - 1; update(user, { step: 2 }); push(`${user}가 읽은 값 ${state.requests[user].read}에서 1을 빼 ${state.seats}을 저장합니다.${mode === 'separate' && user === second ? ' 앞선 요청의 차감 결과가 덮어써집니다.' : ''}`); };
  const finish = (user: User) => { update(user, { step: 3, result: state.requests[user].approved ? 'success' : 'failed' }); push(`${user}의 좌석 확보가 ${state.requests[user].approved ? '성공' : '실패'}합니다.`); };
  push(state.message);
  if (mode === 'separate') {
    read(first); read(second); check(first); check(second); deduct(first); finish(first); deduct(second); finish(second);
    state.active = null;
    push('좌석은 1개인데 두 요청이 모두 성공했습니다. 두 요청이 같은 이전 값을 사용한 결과입니다.');
  } else {
    state.lockedBy = first; state.active = first; state.waiting = second;
    push(`${first}가 확인·차감 구간을 시작합니다. ${second}는 이 구간에 진입하지 못하고 기다립니다.`);
    read(first); check(first); deduct(first);
    state.lockedBy = null; state.waiting = null;
    finish(first);
    state.lockedBy = second; state.active = second;
    push(`${first}의 확인·차감이 끝났습니다. 이제 ${second}가 현재 잔여 좌석을 확인합니다.`);
    read(second); check(second);
    state.lockedBy = null;
    finish(second); state.active = null;
    push('좌석 확보는 한 요청만 성공했습니다. 확인과 차감 사이에 다른 요청이 끼어들지 않았습니다.');
  }
  return frames;
}
