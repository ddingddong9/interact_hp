import { useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import JavaExecution from './pages/JavaExecution';
import type { JavaKind } from './components/java/model';
import HashTable from './pages/HashTable';
import RaceCondition from './pages/RaceCondition';
import LuaScript from './pages/LuaScript';
import AdmissionControl from './pages/AdmissionControl';
import StructureLab from './pages/StructureLab';
import type { Kind } from './components/structures/model';

const titles: Record<string, string> = {
  '#java-constructor-chaining': 'Constructor Chaining',
  '#java-super-this': 'super & this',
  '#java-compile-time-binding': 'Compile-time Binding',
  '#java-method-overloading': 'Method Overloading',
  '#java-override-annotation': '@Override',
  '#java-method-dispatch': 'Method Overriding',
  '#java-field-hiding': 'Field Hiding',
  '#home': '권재원 Kwon Jaewon',
  '#hash-table': 'Hash Table',
  '#linked-list': 'Linked List',
  '#skip-list': 'Skip List',
  '#sorted-set': 'Sorted Set',
  '#race-condition': 'Race Condition',
  '#lua-script': 'Lua Script',
  '#admission-control': 'Admission Control',
};
function getPage() {
  const hash = window.location.hash;
  return Object.prototype.hasOwnProperty.call(titles, hash) ? hash : '#home';
}
function Page({ page }: { page: string }) {
  useEffect(() => { document.title = titles[page]; }, [page]);
  return <><ThemeToggle visible={page === '#home'} />{page.startsWith('#java-') ? <JavaExecution key={page} kind={page.slice(6) as JavaKind} /> : page === '#home' ? <Home /> : page === '#hash-table' ? <HashTable /> : page === '#race-condition' ? <RaceCondition /> : page === '#lua-script' ? <LuaScript /> : page === '#admission-control' ? <AdmissionControl /> : <StructureLab key={page} kind={page.slice(1) as Kind} />}</>;
}
export default function App() {
  return <PageTransition getPage={getPage}>{page => <Page page={page} />}</PageTransition>;
}
