import { useEffect, useState } from 'react';
import Home from './pages/Home';
import AssignmentBreaker from './pages/AssignmentBreaker';

function App() {
  const [page, setPage] = useState<string>(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = window.location.hash;
      setPage(nextPage);
      document.title = nextPage === '#assignment-breaker' ? '과제 부수기 · 권재원' : '권재원 Kwon Jaewon';
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page === '#assignment-breaker') {
    return <AssignmentBreaker />;
  }

  return <Home />;
}

export default App;
