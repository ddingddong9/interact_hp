import type { CSSProperties } from 'react';

export type FlyingLetter = {
  id: number;
  text: string;
  x: number;
  y: number;
};

type FlyingLettersProps = {
  letters: FlyingLetter[];
};

function FlyingLetters({ letters }: FlyingLettersProps) {
  return (
    <>
      {letters.map((letter) => (
        <span
          className="flying-letter"
          key={letter.id}
          style={{ '--x': `${letter.x}vw`, '--y': `${letter.y}vh` } as CSSProperties}
        >
          {letter.text}
        </span>
      ))}
    </>
  );
}

export default FlyingLetters;
