import { useEffect, useState } from 'react';
import Assignment from './components/Assignment';
import FlyingLetters, { type FlyingLetter } from './components/FlyingLetters';
import Guide from './components/Guide';
import Monkey from './components/Monkey';

const MAX_HITS = 12;

function App() {
  const [hitCount, setHitCount] = useState<number>(0);
  const [letters, setLetters] = useState<FlyingLetter[]>([]);
  const [monkeySide, setMonkeySide] = useState<string>('center');

  const reset = () => {
    setHitCount(0);
    setLetters([]);
    setMonkeySide('center');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        reset();
        return;
      }
      if (event.key.length !== 1 || event.repeat) return;

      const newLetter: FlyingLetter = {
        id: Date.now(),
        text: event.key === ' ' ? '␣' : event.key,
        x: 32 + Math.random() * 18,
        y: -32 - Math.random() * 22,
      };

      setLetters((oldLetters) => [...oldLetters, newLetter]);
      setHitCount((count) => Math.min(count + 1, MAX_HITS));
      setMonkeySide(newLetter.id % 2 === 0 ? 'left' : 'right');

      setTimeout(() => {
        setLetters((oldLetters) => oldLetters.filter((letter) => letter.id !== newLetter.id));
      }, 700);
      setTimeout(() => setMonkeySide('center'), 120);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const destroyed = hitCount >= MAX_HITS;

  return (
    <main className="stage">
      <Assignment hitCount={hitCount} destroyed={destroyed} />
      <Monkey side={monkeySide} />
      <FlyingLetters letters={letters} />
      <Guide hitCount={hitCount} maxHits={MAX_HITS} destroyed={destroyed} />
      <button onClick={reset}>다시 시작 ESC</button>
    </main>
  );
}

export default App;
