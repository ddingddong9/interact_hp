import type { CSSProperties } from 'react';

type Props = {
  href: string;
  title: string;
  color: string;
  ink: string;
  height: number;
  width: number;
  number: number;
};

function ProjectBook({ href, title, color, ink, height, width, number }: Props) {
  return (
    <a className="project-book" href={href} aria-label={`${title} 열기`} data-book-title={title} data-book-number={number}
      style={{ '--book-color': color, '--book-ink': ink, '--book-height': `${height}px`, '--book-width': `${width}px` } as CSSProperties}>
      <span className="project-book__spine" aria-hidden="true">
        <span className="project-book__number">{String(number).padStart(2, '0')}</span>
        <span className="project-book__title">{title}</span>
        <span className="project-book__rule" />
      </span>
    </a>
  );
}

export default ProjectBook;
