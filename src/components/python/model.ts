import specifications from './specs.json';
import traces from './traces.json';
import type { CConcept } from '../c/model';
export type PythonValue = { kind: 'reference'; target: number; type: string } | { kind: 'value'; value: string; type: string };
export type PythonObject = { address: number; type: string; display: string; items: PythonValue[] };
export type PythonBinding = PythonValue & { name: string };
export type PythonFrame = { line: number; message: string; bindings: PythonBinding[]; objects: PythonObject[]; output: string; result: string; active: number[]; changedBindings: string[]; focus: { address: number; indices: number[] } | null; values: [string,string][] };
export type PythonLesson = { id: string; title: string; code: string[]; frames: PythonFrame[]; concepts: CConcept[]; expected: string };
export const pythonLessons: PythonLesson[] = specifications.map(spec => ({
  id: spec.id, title: spec.title, code: spec.source.split('\n'), expected: spec.expected,
  concepts: spec.concepts as CConcept[],
  frames: traces.find(trace => trace.id === spec.id)!.frames as PythonFrame[],
}));
export const pythonLessonById = Object.fromEntries(pythonLessons.map(l => [l.id,l]));
