export type Entry = { key: number; value: string };
export type Table = Entry[][];
export type Operation = 'insert' | 'search' | 'delete';
export type Frame = {
  table: Table;
  phase: 'input' | 'hash' | 'bucket' | 'compare' | 'place' | 'remove' | 'done';
  bucket: number;
  index?: number;
  message: string;
  result?: 'found' | 'missing' | 'inserted' | 'updated' | 'deleted';
};
export const SIZE = 7;
export const emptyTable = (): Table => Array.from({ length: SIZE }, () => []);
export function operationFrames(table: Table, operation: Operation, key: number, value = ''): Frame[] {
  if (!Number.isSafeInteger(key) || key < 0) throw new Error('키는 0 이상의 안전한 정수여야 합니다.');
  const bucket = key % SIZE;
  const chain = table[bucket];
  const frames: Frame[] = [];
  const push = (phase: Frame['phase'], message: string, index?: number) => frames.push({ table, phase, bucket, index, message });
  push('input', `키 ${key}로 ${operation === 'insert' ? '추가' : operation === 'search' ? '조회' : '삭제'}를 시작합니다.`);
  push('hash', `${key} ÷ ${SIZE}의 나머지는 ${bucket}입니다.`);
  push('bucket', `${bucket}번 버킷으로 이동합니다.${chain.length ? ' 저장된 키를 비교합니다.' : ' 비어 있습니다.'}`);
  const found = chain.findIndex(entry => entry.key === key);
  for (let index = 0; index < (found < 0 ? chain.length : found + 1); index++) {
    push('compare', `${chain[index].key} ${chain[index].key === key ? '= ' + key + ' · 같은 키를 찾았습니다.' : '≠ ' + key + ' · 다음 항목을 확인합니다.'}`, index);
  }
  const next = table.map(entries => entries.map(entry => ({ ...entry })));
  let result: Frame['result'];
  let message: string;
  let index = found;
  if (operation === 'insert') {
    if (found < 0) {
      next[bucket].push({ key, value });
      index = chain.length;
      push('place', chain.length ? `충돌: ${key} 항목을 기존 항목 뒤에 연결합니다.` : `${key} 항목을 빈 버킷에 저장합니다.`, index);
      result = 'inserted';
      message = chain.length ? `다른 키가 같은 버킷에 도착했습니다. ${key} 항목을 연결해 저장합니다. (충돌)` : `${bucket}번 버킷에 ${key} 항목을 저장했습니다.`;
    } else {
      next[bucket][found].value = value;
      result = 'updated';
      message = `같은 키 ${key}의 값을 “${value}”로 변경했습니다. 새 항목은 만들지 않습니다.`;
    }
  } else if (found < 0) {
    result = 'missing';
    message = `${chain.length ? '연결 끝에 도달했습니다.' : '버킷이 비어 있습니다.'} 키 ${key}는 없습니다.`;
  } else if (operation === 'delete') {
    push('remove', `${key} 항목을 지우고 남은 항목을 연결합니다.`, found);
    next[bucket].splice(found, 1);
    result = 'deleted';
    message = `${key} 항목을 삭제했습니다. 남은 항목의 연결을 이어 줍니다.`;
  } else {
    result = 'found';
    message = `${key} 항목을 찾았습니다. 저장된 값은 “${chain[found].value}”입니다.`;
  }
  frames.push({ table: next, phase: 'done', bucket, index: index < 0 ? undefined : index, result, message });
  return frames;
}
