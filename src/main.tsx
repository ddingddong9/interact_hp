import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@chadcn/ui/styles.css';
import App from './App';
import './App.css';

// App 컴포넌트를 화면에 출력
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
