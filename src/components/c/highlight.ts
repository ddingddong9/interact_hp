import type { JavaToken } from '../java/highlight';
const keywords = new Set('auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool size_t'.split(' '));
export function highlightC(source: string): JavaToken[][] {
  const types = new Set([...source.matchAll(/\b(?:struct|enum|union)\s+(\w+)/g)].map(m => m[1]));
  const lines: JavaToken[][] = [[]];
  const pattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|^\s*#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|[A-Za-z_]\w*|->|[+\-*\/%=<>!&|^~?:]+|\s+|./gm;
  for(const match of source.matchAll(pattern)) {
    const text=match[0], after=source.slice(match.index!+text.length);
    const kind=text.startsWith('//')||text.startsWith('/*')?'comment':text.trim().startsWith('#')?'annotation':/^["']/.test(text)?'string':text==='NULL'?'literal':keywords.has(text)?'keyword':/^\d/.test(text)?'number':types.has(text)?'type':/^[A-Za-z_]/.test(text)&&/^\s*\(/.test(after)?'method':/^(->|[+\-*\/%=<>!&|^~?:]+)$/.test(text)?'operator':'';
    text.split('\n').forEach((piece,i)=>{if(i)lines.push([]);if(piece)lines.at(-1)!.push({text:piece,kind});});
  }
  return lines;
}
