export type JavaToken = { text: string; kind: string };
const keywords = new Set('abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp switch synchronized throw throws transient try void volatile while record sealed permits var'.split(' '));
const builtins = new Set(['String', 'Object', 'Integer', 'Math', 'System', 'Boolean', 'Character', 'Long', 'Double']);
// Tokenize the whole source so comments and quoted literals keep their content intact.
export function highlightJava(source: string): JavaToken[][] {
  const types = new Set([...builtins, ...[...source.matchAll(/\b(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/g)].map(match => match[1])]);
  const parameters = new Set<number>();
  for (const declaration of source.matchAll(/\b(?:[A-Za-z_$][\w$]*(?:\[\])?\s+)?[A-Za-z_$][\w$]*\s*\(([^()]*)\)\s*\{/g)) {
    const start = declaration.index! + declaration[0].indexOf('(') + 1;
    for (const parameter of declaration[1].matchAll(/\b([A-Za-z_$][\w$]*)(?:\[\])?\s+([A-Za-z_$][\w$]*)/g)) {
      if (keywords.has(parameter[1]) || types.has(parameter[1])) parameters.add(start + parameter.index! + parameter[0].lastIndexOf(parameter[2]));
    }
  }
  const lines: JavaToken[][] = [[]];
  const expression = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z_$][\w$]*|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[+\-*\/%=<>!&|^~?:]+|\s+|./g;
  for (const match of source.matchAll(expression)) {
    const text = match[0];
    const after = source.slice(match.index! + text.length);
    const kind = text.startsWith('//') || text.startsWith('/*') ? 'comment'
      : text.startsWith('"') || text.startsWith("'") ? 'string'
      : text.startsWith('@') ? 'annotation'
      : /^(this|super|null|true|false)$/.test(text) ? 'literal'
      : keywords.has(text) ? 'keyword'
      : /^\d/.test(text) ? 'number'
      : parameters.has(match.index!) ? 'parameter'
      : types.has(text) ? 'type'
      : /^[A-Za-z_$]/.test(text) && /^\s*\(/.test(after) ? 'method'
      : /^[+\-*\/%=<>!&|^~?:]+$/.test(text) ? 'operator' : '';
    text.split('\n').forEach((piece, index) => {
      if (index) lines.push([]);
      if (piece) lines[lines.length - 1].push({ text: piece, kind });
    });
  }
  return lines;
}
