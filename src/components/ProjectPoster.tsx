import type { CSSProperties } from 'react';

export type ProjectPosterData = {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
};

type Props = ProjectPosterData & { number: number };

const spectrumHues = [28, 58, 92, 136, 172, 208, 244, 278, 316, 350];

function ProjectPoster({ href, title, eyebrow, description, number }: Props) {
  const formattedNumber = String(number).padStart(2, '0');
  const hue = spectrumHues[(number - 1) % spectrumHues.length];

  return (
    <a
      className="project-poster"
      href={href}
      aria-label={`${title} 프로젝트 열기`}
      data-poster-title={title}
      data-poster-number={formattedNumber}
      data-transition-href={href}
      draggable={false}
      style={{
        '--poster-hue': hue,
      } as CSSProperties}
    >
      <span className="project-poster__meta" aria-hidden="true">
        <span>NO. {formattedNumber}</span>
        <span>SELECTED WORK</span>
      </span>

      <span className="project-poster__index" aria-hidden="true">{formattedNumber}</span>

      <span className="project-poster__copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>

      <span className="project-poster__footer" aria-hidden="true">
        <span>{eyebrow}</span>
        <span>KJW / 2026</span>
      </span>
    </a>
  );
}

export default ProjectPoster;
