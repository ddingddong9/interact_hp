import { useState, type CSSProperties } from 'react';
export type ProjectPosterData = {
  href: string; title: string; eyebrow: string; description: string;
  chapters: { href: string; title: string }[];
};
type Props = ProjectPosterData & { number: number };
const spectrumHues = [28, 58, 92, 136, 172, 208, 244, 278, 316, 350];
export default function ProjectPoster({ title, chapters, number }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const selected = chapters[preview ?? 0];
  return <article className={`project-poster series-book ${preview !== null ? 'has-preview' : ''}`} aria-label={title}
    data-poster-title={title} data-poster-number={String(number).padStart(2, '0')}
    style={{ '--poster-hue': spectrumHues[(number - 1) % spectrumHues.length], '--book-min-height': `${chapters.length * 44 + 110}px` } as CSSProperties}
    onMouseLeave={() => setPreview(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null); }}>
    <div className="series-leaf" aria-hidden="true"><span className="series-leaf__number">{(preview ?? 0) + 1}p</span><strong>{selected.title}</strong><div className="series-leaf__lines"><i /><i /><i /><i /></div></div>
    <div className="series-cover"><h2>{title}</h2><ol className="series-chapters">{chapters.map((chapter, i) => <li key={chapter.href}><a href={chapter.href} className="series-chapter" data-chapter="true" data-poster-title={chapter.title} data-poster-number={`${i + 1}p`} data-transition-href={chapter.href}
      onMouseEnter={() => setPreview(i)} onFocus={() => setPreview(i)} aria-label={`${i + 1}p ${chapter.title} 열기`} draggable={false}><span>{i + 1}p</span><strong>{chapter.title}</strong><span className="series-chapter__arrow" aria-hidden="true">↗</span></a></li>)}</ol></div>
  </article>;
}
