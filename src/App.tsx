import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

type FlyingLetter = {
  id: number;
  text: string;
  x: number;
  y: number;
};

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
      <h1 key={hitCount} className={`assignment ${destroyed ? 'destroyed' : 'hit'}`}>
        과제
      </h1>

      <img className={`monkey ${monkeySide}`} src="/keyboard-monkey.png" alt="키보드 앞에 앉아 있는 원숭이" />

      {letters.map((letter) => (
        <span
          className="flying-letter"
          key={letter.id}
          style={{ '--x': `${letter.x}vw`, '--y': `${letter.y}vh` } as CSSProperties}
        >
          {letter.text}
        </span>
      ))}

      <div className="guide">
        <strong>TYPE TO DESTROY</strong>
        <p>{destroyed ? '과제 끝! ESC를 눌러 다시 시작' : `아무 키나 누르세요 · ${hitCount}/${MAX_HITS}`}</p>
      </div>

      <button onClick={reset}>다시 시작 ESC</button>
    </main>
  );
}

export default App;
