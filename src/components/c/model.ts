export type Cell = { name: string; type: string; address: number; value: string; target?: number; region: 'local' | 'heap' | 'literal' | 'code'; alive: boolean };
export type CFrame = { line: number; message: string; cells: Cell[]; stack: string[]; output: string; result: string; active: string[]; values: [string, string][] };
export type CConcept = { title: string; text: string; advanced?: boolean; comparison?: { headers: string[]; rows: string[][] } };
export type CLesson = { id: string; title: string; code: string[]; frames: CFrame[]; concepts: CConcept[]; expected: string };
export const cLessons: CLesson[] = [];
export function lesson(id: string, title: string, source: string, concepts: CConcept[], expected = '') {
  const code = source.trim().split('\n');
  const cells: Cell[] = [];
  const frames: CFrame[] = [];
  const stack = ['main'];
  let output = '';
  function cell(name: string, type: string, address: number, value: string | number, target?: number, region: Cell['region'] = 'local') {
    const existing = cells.find(c => c.name === name);
    const next = { name, type, address, value: String(value), target, region, alive: true };
    if (existing) Object.assign(existing, next); else cells.push(next);
  }
  function step(source: string, message: string, active: string[] = [], values: [string, string][] = [], result = '') {
    const line = source ? code.findIndex(l => l.trim() === source) : -1;
    if (source && line < 0) throw new Error(`Missing C source: ${id}: ${source}`);
    frames.push({ line, message, cells: structuredClone(cells), stack: source ? [...stack] : [], output, result, active, values });
  }
  function print(text: string) { output += text; }
  function remove(...names: string[]) { names.forEach(name => { const i = cells.findIndex(c => c.name === name); if (i >= 0) cells.splice(i, 1); }); }
  function release(region: Cell['region']) { cells.filter(c => c.region === region).forEach(c => { c.alive = false; c.value = '해제됨'; }); }
  step('', '연습 예제입니다. 재생하거나 다음 단계로 이동해 코드와 메모리의 변화를 확인하세요.');
  const value = { id, title, code, frames, concepts, expected };
  const existing = cLessons.findIndex(l => l.id === id);
  if (existing < 0) cLessons.push(value); else cLessons[existing] = value;
  return { cell, step, print, remove, release, stack, cells, value };
}
