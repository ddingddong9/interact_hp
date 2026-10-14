import type { Frame, JavaKind, JavaObject } from './model';
function objectsOf(frame: Frame, kind: JavaKind): JavaObject[] {
  if (!frame.allocated) return [];
  if (frame.objects) return frame.objects;
  const type = kind === 'constructor-chaining' ? 'Rectangle' : kind === 'super-this' ? 'Square' : 'Dog';
  return [{ address: frame.address!, type, fields: frame.fields }];
}
function stringsOf(objects: JavaObject[]) {
  return objects.filter(object => object.type !== 'String').flatMap(object => object.fields.map(([, value]) => value)).filter(value => /^"[\s\S]*"$/.test(value));
}
export default function JavaMemory({ frame, frames, step, kind }: { frame: Frame; frames: Frame[]; step: number; kind: JavaKind }) {
  const objects = objectsOf(frame, kind);
  const allStrings = [...new Set(frames.flatMap(snapshot => stringsOf(objectsOf(snapshot, kind))))];
  const currentStrings = [...new Set(frames.slice(0, step + 1).flatMap(snapshot => stringsOf(objectsOf(snapshot, kind))))];
  const addressOf = (value: string) => 300 + allStrings.indexOf(value);
  const rawReferences = frame.objects ? frame.reference : frame.reference ? `${frame.reference.split(' → ')[0]} → ${frame.address}` : '';
  const references = rawReferences.split('\n').flatMap(line => {
    const match = line.match(/^(.*?) → (\d+)$/);
    if (!match) return [];
    const [type, ...names] = match[1].split(' ');
    return [{ name: names.join(' ') || type, type: names.length ? type : '', address: match[2] }];
  });
  const activeThis = frame.locals?.find(([name]) => name === 'this')?.[1];
  const constructing = frame.stack.some(call => /^[A-Z][\w$]*\(/.test(call));
  const declaringClass = frame.stack[frame.stack.length - 1]?.match(/^([A-Z][\w$]*)(?:\.|\()/)?.[1];
  if (activeThis || (constructing && objects.length)) references.push({ name: 'this', type: declaringClass || objects[objects.length - 1]?.type || '', address: activeThis || String(objects[objects.length - 1].address) });
  const activeMethod = frame.stack[frame.stack.length - 1]?.match(/^([A-Z][\w$]*)\.(.+)$/);
  return <section className={`java-memory ${currentStrings.length ? 'has-strings' : ''}`} aria-label="객체 주소와 참조 관계">
    <div className="java-memory-references"><h2>참조 변수 <small>Reference</small></h2>{references.length ? references.map((reference, i) => <div className="java-reference-flow" key={`${reference.name}-${i}`}><div className="java-memory-reference"><header><code>{reference.name}</code>{reference.type && <small>선언 타입 {reference.type}</small>}</header><div><span>참조값</span><code>{reference.address}</code></div></div><span className="java-memory-arrow" aria-hidden="true">→</span></div>) : <p className="java-empty">{objects.length ? '아직 변수에 저장되지 않음' : '아직 참조 없음'}</p>}</div>
    <div className="java-memory-objects"><h2>객체 <small>Object</small></h2>{objects.length ? objects.map(object => {
      const groups = new Map<string, [string, string][]>();
      for (const [name, value] of object.fields) {
        const owner = name.includes('.') ? name.split('.')[0] : object.type;
        const fields = groups.get(owner) ?? [];
        fields.push([name.includes('.') ? name.slice(name.indexOf('.') + 1) : name, value]);
        groups.set(owner, fields);
      }
      return <article className="java-memory-object" key={object.address}><header><strong>{object.type} 객체</strong><span>주소 <code>{object.address}</code></span></header>{object.fields.length ? [...groups].map(([owner, fields]) => <section className="java-memory-part" key={owner} data-active={activeMethod?.[1] === owner}><h3>{owner}{owner !== object.type && ' 부분'}</h3><div className="java-memory-columns"><span>필드</span><span>타입</span><span>저장값</span></div>{fields.map(([name, value]) => {
        const stringReference = object.type !== 'String' && /^"[\s\S]*"$/.test(value);
        const isReference = stringReference || value.startsWith('→') || value === 'null';
        return <div className="java-memory-row" key={name}><code>{name}</code><span>{isReference ? stringReference ? 'String 참조' : '참조' : /^(true|false)$/.test(value) ? 'boolean' : /^-?\d+$/.test(value) ? 'int' : '값'}</span><code key={value} className={isReference ? 'reference-value' : ''}>{stringReference ? `→ ${addressOf(value)}` : value}</code></div>;
      })}{activeMethod?.[1] === owner && <p className="java-memory-method"><code>{activeMethod[1]}.{activeMethod[2]}</code> 실행 중</p>}</section>) : <p className="java-empty">인스턴스 필드 없음</p>}</article>;
    }) : <p className="java-empty">아직 생성되지 않음</p>}</div>
    {!!currentStrings.length && <div className="java-memory-strings"><h2>문자열 <small>String</small></h2><div className="java-string-cells">{currentStrings.map(value => <div key={value}><code>{value}</code><span>주소 <code>{addressOf(value)}</code></span></div>)}</div></div>}
  </section>;
}
