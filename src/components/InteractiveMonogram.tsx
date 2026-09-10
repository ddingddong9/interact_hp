import { useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import '../styles/interactive-monogram.css';

function InteractiveMonogram() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => setIsPlaying(false), 850);
    return () => window.clearTimeout(timer);
  }, [isPlaying]);

  // 마우스 위치에 따라 빛과 글자의 기울기를 바꿉니다.
  function movePointer(event: PointerEvent<HTMLButtonElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const button = event.currentTarget;
    const bounds = button.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    button.style.setProperty('--mono-x', `${x * 100}%`);
    button.style.setProperty('--mono-y', `${y * 100}%`);
    button.style.setProperty('--mono-rotate-x', `${(0.5 - y) * 16}deg`);
    button.style.setProperty('--mono-rotate-y', `${(x - 0.5) * 20}deg`);
  }

  function resetPointer(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty('--mono-rotate-x', '0deg');
    event.currentTarget.style.setProperty('--mono-rotate-y', '0deg');
  }

  return (
    <button
      type="button"
      className={`monogram interactive-monogram${isPlaying ? ' is-playing' : ''}`}
      aria-label="KJW 글자 움직이기"
      onPointerMove={movePointer}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
      onClick={() => setIsPlaying(true)}
    >
      <span className="interactive-monogram__word" aria-hidden="true">
        <i>K</i><i>J</i><i>W</i>
      </span>
      <small className="interactive-monogram__hint" aria-hidden="true">
        {isPlaying ? 'hello, world!' : '+ click'}
      </small>
    </button>
  );
}

export default InteractiveMonogram;
