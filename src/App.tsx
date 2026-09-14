import { useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import AssignmentBreaker from './pages/AssignmentBreaker';
import AssignmentSubmit from './pages/AssignmentSubmit';
import MousePlayground from './pages/MousePlayground';
import FoldPage from './pages/FoldPage';

const titles: Record<string, string> = {
  '#home': '권재원 Kwon Jaewon',
  '#assignment-breaker': 'Nebula Drift · Kwon Jaewon',
  '#assignment-submit': 'Blinds · Kwon Jaewon',
  '#orbit-playground': 'FOLD · Kwon Jaewon',
  '#type-playground': 'Type Drift · Kwon Jaewon',
};

function getPage() {
  const hash = window.location.hash;
  return Object.prototype.hasOwnProperty.call(titles, hash) ? hash : '#home';
}

function Page({ page }: { page: string }) {
  useEffect(() => { document.title = titles[page]; }, [page]);

  // 주소에 맞는 화면을 선택합니다.
  let content = <Home />;
  if (page === '#assignment-breaker') content = <AssignmentBreaker />;
  if (page === '#assignment-submit') content = <AssignmentSubmit />;
  if (page === '#orbit-playground') content = <FoldPage />;
  if (page === '#type-playground') content = <MousePlayground key="type" mode="type" />;

  return <><ThemeToggle visible={page === '#home'} />{content}</>;
}

function App() {
  return <PageTransition getPage={getPage}>{(page) => <Page page={page} />}</PageTransition>;
}

export default App;
