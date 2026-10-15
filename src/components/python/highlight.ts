import type { JavaToken } from '../java/highlight';
const keywords=new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
export function highlightPython(source:string):JavaToken[][] {
  const lines:JavaToken[][]=[[]];
  const pattern=/#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|[A-Za-z_]\w*|[+\-*\/%=<>!&|^~:]+|\s+|./gm;
  for(const match of source.matchAll(pattern)){
    const text=match[0],after=source.slice(match.index!+text.length);
    const kind=text.startsWith('#')?'comment':/^["']/.test(text)?'string':/^(None|True|False)$/.test(text)?'literal':keywords.has(text)?'keyword':/^\d/.test(text)?'number':/^[A-Za-z_]/.test(text)&&/^\s*\(/.test(after)?'method':/^[+\-*\/%=<>!&|^~:]+$/.test(text)?'operator':'';
    text.split('\n').forEach((piece,i)=>{if(i)lines.push([]);if(piece)lines.at(-1)!.push({text:piece,kind});});
  }
  return lines;
}
