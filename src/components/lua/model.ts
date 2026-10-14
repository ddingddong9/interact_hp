export type LuaState = { seats: number; reserved: string[] };
export type LuaResult = 'NO_ENTRY' | 'DUPLICATE' | 'SOLD_OUT' | 'RESERVED';
export type LuaFrame = {
  state: LuaState; user: string; admitted: boolean; phase: number; message: string;
  duplicate?: boolean; checkedSeats?: number; result?: LuaResult;
};
export const initialLuaState = (): LuaState => ({ seats: 1, reserved: [] });
export const luaCode = [
  'local member = ARGV[1]',
  'if redis.call("SISMEMBER", KEYS[1], member) == 0 then',
  '  return "NO_ENTRY"',
  'end',
  'if redis.call("SISMEMBER", KEYS[2], member) == 1 then',
  '  return "DUPLICATE"',
  'end',
  'local seats = tonumber(redis.call("GET", KEYS[3]) or "0")',
  'if seats <= 0 then return "SOLD_OUT" end',
  'redis.call("DECR", KEYS[3])',
  'redis.call("SADD", KEYS[2], member)',
  'return "RESERVED"',
];
export function luaFrames(source: LuaState, user: string, admitted: boolean): LuaFrame[] {
  const clean = user.trim();
  if (!clean) throw new Error('사용자 이름을 입력하세요.');
  if (!Number.isInteger(source.seats) || source.seats < 0) throw new Error('좌석 수가 올바르지 않습니다.');
  let state = { seats: source.seats, reserved: [...source.reserved] };
  let duplicate: boolean | undefined;
  let checkedSeats: number | undefined;
  const frames: LuaFrame[] = [];
  const push = (phase: number, message: string, result?: LuaResult) => frames.push({ state: { seats: state.seats, reserved: [...state.reserved] }, user: clean, admitted, phase, message, duplicate, checkedSeats, result });
  push(0, `${clean}의 요청을 Redis 내부 스크립트로 전달합니다.`);
  push(1, admitted ? `${clean}의 입장 권한을 확인했습니다.` : `${clean}에게 입장 권한이 없습니다.`);
  if (!admitted) { push(1, 'NO_ENTRY · 좌석과 예약 기록을 변경하지 않고 종료합니다.', 'NO_ENTRY'); return frames; }
  duplicate = state.reserved.includes(clean);
  push(2, duplicate ? `${clean}의 좌석 확보 기록이 이미 있습니다.` : `${clean}의 기존 좌석 확보 기록이 없습니다.`);
  if (duplicate) { push(2, 'DUPLICATE · 같은 사용자의 재요청으로 좌석을 다시 차감하지 않습니다.', 'DUPLICATE'); return frames; }
  checkedSeats = state.seats;
  push(3, `잔여 좌석 ${checkedSeats}개를 확인합니다.`);
  if (checkedSeats === 0) { push(3, 'SOLD_OUT · 남은 좌석이 없어 종료합니다.', 'SOLD_OUT'); return frames; }
  state = { ...state, seats: state.seats - 1 };
  push(4, `DECR · 잔여 좌석을 ${checkedSeats}에서 ${state.seats}으로 차감합니다.`);
  state = { ...state, reserved: [...state.reserved, clean] };
  push(5, `SADD · ${clean}의 좌석 확보 기록을 저장합니다.`);
  push(6, 'RESERVED · 좌석 차감과 기록을 마치고 결과를 반환합니다.', 'RESERVED');
  return frames;
}
