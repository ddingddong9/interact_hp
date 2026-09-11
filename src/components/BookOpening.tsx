import { useLayoutEffect, useRef, type CSSProperties, type Ref } from 'react';
import '../styles/book-opening.css';

export type SelectedBook = {
  href: string;
  title: string;
  number: string;
  color: string;
  ink: string;
  left: number;
  top: number;
  width: number;
  height: number;
  source: HTMLElement | null;
  artwork: HTMLElement;
  layoutWidth: number;
  layoutHeight: number;
};

export type TransitionDirection = 'enter' | 'exit';

type Props = {
  book: SelectedBook;
  direction: TransitionDirection;
  layerRef: Ref<HTMLDivElement>;
};

function BookOpening({ book, direction, layerRef }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    frame.current?.replaceChildren(book.artwork.cloneNode(true));
  }, [book]);
  return (
    <div
      className={`book-opening is-${direction}`}
      ref={layerRef}
      aria-hidden="true"
      style={{ '--book-color': book.color, '--book-ink': book.ink } as CSSProperties}
    >
      <div className="book-opening__veil" />
      <div
        className="book-opening__frame"
        ref={frame}
        style={{ width: book.layoutWidth, height: book.layoutHeight }}
      />
    </div>
  );
}

export default BookOpening;
