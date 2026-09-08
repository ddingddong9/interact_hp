import { useEffect, useState } from 'react';
import Home from './pages/Home';
import AssignmentBreaker from './pages/AssignmentBreaker';
import AssignmentSubmit from './pages/AssignmentSubmit';

function App() {
  const [page, setPage] = useState<string>(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = window.location.hash;
      setPage(nextPage);
      if (nextPage === '#assignment-breaker') document.title = '과제 부수기 · 권재원';
      else if (nextPage === '#assignment-submit') document.title = '과제 제출 · 권재원';
      else document.title = '권재원 Kwon Jaewon';
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page === '#assignment-breaker') {
    return <AssignmentBreaker />;
  }

  if (page === '#assignment-submit') {
    return <AssignmentSubmit />;
  }

  return <Home />;
}

export default App;
