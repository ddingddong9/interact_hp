import type { Frame } from './model';
export type ExecutionVisit = { order: number; step: number };
export function executionOrder(frames: Frame[], step: number): Map<number, ExecutionVisit[]> {
  const visits = new Map<number, ExecutionVisit[]>();
  let previous = -1;
  let order = 0;
  for (let index = 0; index <= step; index++) {
    const frame = frames[index];
    if (frame.line < 0 || !frame.stack.length || frame.binding?.phase === 'compile' || (frame.compile && frame.compile !== 'success')) continue;
    // Adjacent explanatory frames for the same line belong to one visit.
    if (frame.line !== previous) {
      order++;
      const row = visits.get(frame.line) ?? [];
      row.push({ order, step: index });
      visits.set(frame.line, row);
    }
    previous = frame.line;
  }
  return visits;
}
