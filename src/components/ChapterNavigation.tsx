import { bilingualChapterName } from '../data/chapterNames';
import { projects } from '../data/projects';
import '../styles/chapter-navigation.css';
export function chapterLocation(href: string) {
  for (const book of projects) {
    const index = book.chapters.findIndex(chapter => chapter.href === href);
    if (index >= 0) return { book, index };
  }
  return null;
}
export function chapterDirection(from: string, to: string): 'next' | 'previous' | undefined {
  const a = chapterLocation(from), b = chapterLocation(to);
  return a && b && a.book === b.book && a.index !== b.index ? b.index > a.index ? 'next' : 'previous' : undefined;
}
export default function ChapterNavigation({ page }: { page: string }) {
  const location = chapterLocation(page);
  if (!location) return null;
  const { book, index } = location;
  const previous = book.chapters[index - 1], next = book.chapters[index + 1];
  return <nav className="chapter-navigation" aria-label={`${book.title} 챕터 이동`}>
    {previous && <a className="chapter-arrow chapter-arrow--previous" href={previous.href} rel="prev" aria-label={`이전 챕터: ${bilingualChapterName(previous.title)}`} title={bilingualChapterName(previous.title)}><span aria-hidden="true">←</span></a>}
    {next && <a className="chapter-arrow chapter-arrow--next" href={next.href} rel="next" aria-label={`다음 챕터: ${bilingualChapterName(next.title)}`} title={bilingualChapterName(next.title)}><span aria-hidden="true">→</span></a>}
  </nav>;
}
