"""Generate browser playback snapshots by executing the curated Python exercises."""
import contextlib
import io
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SPECS = ROOT / 'src/components/python/specs.json'
OUTPUT = ROOT / 'src/components/python/traces.json'

def run(spec):
    code = spec['source'].splitlines()
    filename = '<python-lesson-' + spec['id'] + '>'
    namespace = {'__name__': '__main__'}
    stdout = io.StringIO()
    identities = {}
    retained = []
    frames = [dict(line=-1,message='연습 예제입니다. 코드 실행에 따라 변수와 객체가 어떻게 바뀌는지 확인하세요.',bindings=[],objects=[],output='',result='',active=[],changedBindings=[],focus=None,values=[])]
    previous = None
    def value(v):
        if isinstance(v, (list, str)):
            key = id(v)
            if key not in identities:
                identities[key] = 100 + len(identities)
                retained.append(v)  # Avoid Python reusing an identifier during this trace.
            return dict(kind='reference',target=identities[key],type=type(v).__name__)
        return dict(kind='value',value=repr(v),type=type(v).__name__)
    def capture(line):
        variables = [(k,v) for k,v in namespace.items() if not k.startswith('__')]
        bindings = [dict(name=k,**value(v)) for k,v in variables]
        objects = []
        visited = set()
        def visit(v):
            if not isinstance(v,(list,str)) or id(v) in visited: return
            visited.add(id(v))
            address = value(v)['target']
            items = [dict(kind='value',value=repr(c),type='str') for c in v] if isinstance(v,str) else [value(x) for x in v]
            objects.append(dict(address=address,type=type(v).__name__,display=repr(v),items=items))
            if isinstance(v,list):
                for item in v: visit(item)
        for _,v in variables: visit(v)
        source=code[line].strip()
        old=frames[-1]
        old_objects={o['address']:o['items'] for o in old['objects']}
        active=[o['address'] for o in objects if old_objects.get(o['address'])!=o['items']]
        old_bindings={b['name']:b for b in old['bindings']}
        changed_bindings=[b['name'] for b in bindings if old_bindings.get(b['name'])!=b]
        selected = spec['focus'].get(source)
        focus = None
        if selected and selected['variable'] in namespace:
            focus=dict(address=value(namespace[selected['variable']])['target'],indices=selected['indices'])
        result=''
        if source=='x = a.append(5)' or source=='z = a.sort()': result='None'
        if source=='y = a.pop(2)': result=repr(namespace['y'])
        values=[]
        if focus: values.append(['선택한 인덱스', ', '.join(map(str,focus['indices']))])
        frames.append(dict(line=line,message=spec['notes'][source],bindings=bindings,objects=objects,output=stdout.getvalue(),result=result,active=active,changedBindings=changed_bindings,focus=focus,values=values))
    def trace(frame,event,arg):
        nonlocal previous
        if frame.f_code.co_filename!=filename: return trace
        if event=='line':
            if previous is not None: capture(previous)
            previous=frame.f_lineno-1
        elif event=='return':
            if previous is not None: capture(previous)
            previous=None
        return trace
    saved=sys.gettrace()
    try:
        with contextlib.redirect_stdout(stdout):
            sys.settrace(trace)
            exec(compile(spec['source'],filename,'exec'),namespace)
    finally:
        sys.settrace(saved)
    assert stdout.getvalue()==spec['expected'],(spec['id'],stdout.getvalue(),spec['expected'])
    return dict(id=spec['id'],frames=frames)

def generate():
    specs=json.loads(SPECS.read_text())
    return json.dumps([run(s) for s in specs],ensure_ascii=False,indent=2)+'\n'
if __name__=='__main__':
    text=generate()
    if '--check' in sys.argv:
        if OUTPUT.read_text()!=text: raise SystemExit('Python traces are out of date: run scripts/generate-python-lessons.py')
        print('9 Python traces match actual execution.')
    else:
        OUTPUT.write_text(text)
        print('Generated 9 Python execution traces.')
