import { koreanChapterNames, bilingualChapterName } from '../data/chapterNames';
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
  const scrollable = true;
  return <article className={`project-poster series-book ${scrollable ? 'has-scrollable-chapters' : ''} ${preview !== null ? 'has-preview' : ''}`} aria-label={title}
    data-poster-title={title} data-poster-number={String(number).padStart(2, '0')}
    style={{ '--poster-hue': spectrumHues[(number - 1) % spectrumHues.length], '--book-min-height': `${Math.min(chapters.length, 7) * 44 + 110}px` } as CSSProperties}
    onMouseLeave={() => setPreview(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null); }}>
    <div className="series-leaf" aria-hidden="true"><span className="series-leaf__number">{(preview ?? 0) + 1}p</span><strong>{selected.title}</strong><small className="series-leaf__korean">{koreanChapterNames[selected.title]}</small><div className="series-leaf__lines"><i /><i /><i /><i /></div></div>
    <div className="series-cover"><h2>{title}</h2><ol className="series-chapters" aria-label={`${title} 챕터 목록`} tabIndex={scrollable ? 0 : undefined} onWheel={scrollable ? event => event.stopPropagation() : undefined} onKeyDown={scrollable ? event => event.stopPropagation() : undefined}>{chapters.map((chapter, i) => <li key={chapter.href}><a href={chapter.href} className="series-chapter" data-chapter="true" data-poster-title={chapter.title} data-poster-korean={koreanChapterNames[chapter.title]} data-poster-number={`${i + 1}p`} data-transition-href={chapter.href}
      onMouseEnter={() => setPreview(i)} onFocus={() => setPreview(i)} aria-label={`${i + 1}p ${bilingualChapterName(chapter.title)} 열기`} draggable={false}><span>{i + 1}p</span><strong>{chapter.title}<small className="series-chapter__korean">{koreanChapterNames[chapter.title]}</small></strong><span className="series-chapter__arrow" aria-hidden="true">↗</span></a></li>)}</ol></div>
  </article>;
}
