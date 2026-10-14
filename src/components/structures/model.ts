export type Item = { id: string; value: number; height: number };
export type Kind = 'linked-list' | 'skip-list' | 'sorted-set';
export type Action = 'insert' | 'search' | 'delete' | 'rank';
export type Frame = {
  items: Item[];
  view: 'list' | 'skip' | 'index';
  message: string;
  focus?: string;
  level?: number;
  rank?: number;
  removing?: string;
  incoming?: Item;
  done?: boolean;
};
export type Request = { action: Action; value: number; member?: string; position?: number; nx?: boolean; height?: number };
let serial = 0;
export function compareMembers(a: string, b: string) {
  const encode = new TextEncoder();
  const x = encode.encode(a), y = encode.encode(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
}
export const ordered = (items: Item[]) => [...items].sort((a, b) => a.value - b.value || compareMembers(a.id, b.id));
export function initialItems(kind: Kind): Item[] {
  return [10, 20, 30, 40, 50].map((value, i) => ({ id: kind === 'sorted-set' ? ['A', 'B', 'C', 'D', 'E'][i] : kind === 'skip-list' ? `v-${value}` : `initial-${i}`, value, height: [3, 1, 2, 1, 3][i] }));
}
// Span is the difference between base-level positions. HEAD has position 0.
export function spanBetween(items: Item[], from: number, to: number) { return to - from; }
function skipTrace(items: Item[], target: Item, frames: Frame[], forRank = false) {
  let cursor = -1;
  let rank = 0;
  const lessOrEqual = (item: Item) => item.value < target.value || (item.value === target.value && compareMembers(item.id, target.id) <= 0);
  for (let level = 3; level >= 1; level--) {
    frames.push({ items, view: 'skip', level, focus: cursor < 0 ? 'HEAD' : items[cursor].id, rank, message: `L${level}에서 ${cursor < 0 ? 'HEAD' : items[cursor].value}부터 확인합니다.` });
    for (let i = cursor + 1; i < items.length; i++) {
      if (items[i].height < level) continue;
      if (!lessOrEqual(items[i])) break;
      const span = spanBetween(items, cursor, i);
      rank += span;
      cursor = i;
      frames.push({ items, view: 'skip', level, focus: items[i].id, rank, message: `L${level}: ${items[i].value}로 이동 · Span ${span}${forRank ? `을 더해 누적 ${rank}` : `개의 원소를 건너갑니다.`}` });
    }
  }
  return { cursor, rank };
}
export function makeFrames(kind: Kind, source: Item[], request: Request): Frame[] {
  const { action, value } = request;
  if (!Number.isFinite(value)) throw new Error('유효한 숫자를 입력하세요.');
  const items = kind === 'linked-list' ? [...source] : ordered(source);
  const view = kind === 'linked-list' ? 'list' : 'skip';
  const frames: Frame[] = [];
  const height = request.height ?? 1;
  if (kind === 'linked-list') {
    const position = request.position ?? items.length;
    if (action === 'insert' && (!Number.isInteger(position) || position < 0 || position > items.length)) throw new Error(`위치는 0~${items.length} 사이의 정수로 입력하세요.`);
    const index = action === 'insert' ? position : items.findIndex(item => item.value === value);
    frames.push({ items, view, focus: 'HEAD', message: 'HEAD에서 시작해 next 연결을 따라갑니다.' });
    const stop = action === 'insert' ? position - 1 : index < 0 ? items.length - 1 : index;
    for (let i = 0; i <= stop; i++) frames.push({ items, view, focus: items[i].id, message: action === 'insert' ? `${i}번 위치를 통과합니다.` : `${items[i].value} ${items[i].value === value ? '= ' : '≠ '}${value} · ${items[i].value === value ? '찾았습니다.' : '다음 노드로 이동합니다.'}` });
    const next = [...items];
    let focus: string | undefined;
    let message: string;
    if (action === 'insert') {
      const incoming = { id: `new-${++serial}`, value, height: 1 };
      frames.push({ items, view, incoming, focus: position === 0 ? 'HEAD' : items[position - 1].id, message: `${position}번 위치에 새 노드를 연결합니다.` });
      next.splice(position, 0, incoming); focus = incoming.id; message = `${value} 항목을 ${position}번 위치에 추가했습니다.`;
    } else if (index < 0) message = `NULL에 도달했습니다. ${value}는 없습니다.`;
    else if (action === 'delete') {
      frames.push({ items, view, focus: items[index].id, removing: items[index].id, message: '이 노드를 제거하고 앞 노드의 next를 뒤 노드로 연결합니다.' });
      next.splice(index, 1); message = `${value}의 첫 번째 노드를 삭제했습니다.`;
    } else { focus = items[index].id; message = `${value} 항목을 ${index}번 위치에서 찾았습니다.`; }
    frames.push({ items: next, view, focus, message, done: true });
    return frames;
  }
  const member = kind === 'sorted-set' ? request.member?.trim() ?? '' : `v-${value}`;
  if (!member) throw new Error('Member 이름을 입력하세요.');
  const existing = items.find(item => item.id === member);
  if (kind === 'sorted-set') {
    frames.push({ items, view: 'index', focus: member, message: `Member 인덱스에서 ${member}의 등록 여부를 확인합니다.` });
    if (action === 'insert' && existing && request.nx) {
      frames.push({ items, view: 'index', focus: member, message: `${member}는 이미 있습니다. NX 옵션으로 점수 ${existing.value}를 유지합니다.`, done: true }); return frames;
    }
    if (action !== 'insert' && !existing) { frames.push({ items, view: 'index', message: `${member}가 없어 조회를 종료합니다.`, done: true }); return frames; }
  }
  if (kind === 'skip-list' && action === 'insert' && existing) {
    frames.push({ items, view, focus: existing.id, level: 1, message: `${value}가 이미 있습니다. 이 모형은 중복 숫자를 추가하지 않습니다.`, done: true }); return frames;
  }
  const target = action === 'insert' ? { id: member, value, height: existing?.height ?? height } : existing ?? { id: member, value, height: 1 };
  const trace = skipTrace(items, target, frames, action === 'rank');
  let next = [...items];
  let message: string;
  let focus: string | undefined;
  if (action === 'insert') {
    if (existing) {
      frames.push({ items, view, focus: existing.id, removing: existing.id, level: 1, message: `${member}의 이전 위치를 해제하고 새 점수 위치로 옮깁니다.` });
      next = next.filter(item => item.id !== member);
    }
    frames.push({ items: next, view, incoming: target, focus: trace.cursor < 0 ? 'HEAD' : items[trace.cursor].id, level: 1, message: `${kind === 'sorted-set' ? member + ' · ' : ''}${value} 삽입 · 노드 높이 ${target.height}. 관련 층의 연결을 갱신합니다.` });
    next = ordered([...next, target]); focus = member;
    message = existing ? `${member}의 점수를 ${value}로 변경했습니다. Rank ${next.findIndex(item => item.id === member)}` : `${kind === 'sorted-set' ? member + ' · ' : ''}${value} 항목을 추가했습니다.`;
  } else if (!existing) message = `${value} 항목을 지나치거나 연결 끝에 도달했습니다. 찾는 값이 없습니다.`;
  else if (action === 'delete') {
    frames.push({ items, view, focus: member, removing: member, level: 1, message: '노드를 삭제하고 각 층의 연결과 Span을 갱신합니다.' });
    next = items.filter(item => item.id !== member); message = `${kind === 'sorted-set' ? member : value}를 삭제했습니다.`;
  } else if (action === 'rank') { focus = member; message = `누적 Span ${trace.rank} − 1 = Rank ${trace.rank - 1}. 사용자 순번은 ${trace.rank}번째입니다.`; }
  else { focus = member; message = `${kind === 'sorted-set' ? member + '의 점수 ' : ''}${existing.value}를 찾았습니다.`; }
  frames.push({ items: next, view, focus, level: 1, rank: action === 'rank' ? trace.rank : undefined, message, done: true });
  return frames;
}
