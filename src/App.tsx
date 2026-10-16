import { theoryChapters } from './components/theory/model';
import TheoryLearning from './pages/TheoryLearning';
import { pythonChapters } from './components/python/catalog';
import ChapterNavigation from './components/ChapterNavigation';
import CExecution from './pages/CExecution';
import { cLessons } from './components/c/lessons';
import { lazy, Suspense, useEffect } from 'react';
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

const PythonExecution = lazy(() => import('./pages/PythonExecution'));

const titles: Record<string, string> = {
  ...Object.fromEntries(theoryChapters.map(c => [`#theory-${c.id}`, c.title])),
  ...Object.fromEntries(pythonChapters.map(l => [`#python-${l.id}`, l.title])),
  ...Object.fromEntries(cLessons.map(l => [`#c-${l.id}`, l.title])),
  '#java-abstract-class': 'Abstract Class',
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
  return <><ThemeToggle visible={page === '#home'} />{page.startsWith('#theory-') ? <TheoryLearning key={page} kind={page.slice(8)} /> : page.startsWith('#python-') ? <Suspense fallback={null}><PythonExecution key={page} kind={page.slice(8)} /></Suspense> : page.startsWith('#c-') ? <CExecution key={page} kind={page.slice(3)} /> : page.startsWith('#java-') ? <JavaExecution key={page} kind={page.slice(6) as JavaKind} /> : page === '#home' ? <Home /> : page === '#hash-table' ? <HashTable /> : page === '#race-condition' ? <RaceCondition /> : page === '#lua-script' ? <LuaScript /> : page === '#admission-control' ? <AdmissionControl /> : <StructureLab key={page} kind={page.slice(1) as Kind} />}<ChapterNavigation page={page} /></>;
}
export default function App() {
  return <PageTransition getPage={getPage}>{page => <Page page={page} />}</PageTransition>;
}
