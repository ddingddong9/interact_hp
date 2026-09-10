import type { CSSProperties, Ref } from 'react';
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
  source: HTMLElement;
};

type Props = { book: SelectedBook; layerRef: Ref<HTMLDivElement> };

function BookOpening({ book, layerRef }: Props) {
  return (
    <div className="book-opening" ref={layerRef} aria-hidden="true"
      style={{ '--book-color': book.color, '--book-ink': book.ink, '--book-depth': `${book.width}px` } as CSSProperties}>
      <div className="book-opening__veil" />
      <div className="book-opening__stage" style={{ left: book.left + book.width / 2, top: book.top, width: 164, height: book.height }}>
        <div className="book-opening__object">
          <div className="book-opening__spine">
            <span className="project-book__number">{book.number}</span>
            <span className="project-book__title">{book.title}</span>
            <span className="project-book__rule" />
          </div>
          <div className="book-opening__back" />
          <div className="book-opening__pages" />
          <div className="book-opening__sheet" />
          <div className="book-opening__cover">
            <div className="book-opening__outside">
              <span>{book.number}</span>
              <strong>{book.title}</strong>
              <i />
            </div>
            <div className="book-opening__inside" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookOpening;
