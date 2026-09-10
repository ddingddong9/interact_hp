import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import BookOpening from './BookOpening';
import type { SelectedBook } from './BookOpening';
import { playPageMotion } from './pageMotion';

type Props = { getPage: () => string; children: (page: string) => ReactNode };

function PageTransition({ getPage, children }: Props) {
  const [page, setPage] = useState(getPage);
  const [book, setBook] = useState<SelectedBook | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const currentPage = useRef(page);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let navigation = 0;
    let controller: AbortController | null = null;
    let pendingBook: SelectedBook | null = null;
    let hiddenBook: { element: HTMLElement; visibility: string } | null = null;
    const scrollPositions = new Map<string, { top: number; shelf: number }>();

    function restoreBook() {
      if (hiddenBook) hiddenBook.element.style.visibility = hiddenBook.visibility;
      hiddenBook = null;
    }

    // 클릭한 책의 자리와 색을 기억해 그 자리에서 펼칩니다.
    function selectBook(event: MouseEvent) {
      pendingBook = null;
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a.project-book') : null;
      if (!link || (link.target && link.target !== '_self')) return;
      const bounds = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      pendingBook = {
        href: link.hash, title: link.dataset.bookTitle ?? '', number: (link.dataset.bookNumber ?? '').padStart(2, '0'),
        color: style.getPropertyValue('--book-color'), ink: style.getPropertyValue('--book-ink'),
        left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, source: link,
      };
    }

    async function changePage() {
      const nextPage = getPage();
      const selectedBook = pendingBook?.href === nextPage ? pendingBook : null;
      pendingBook = null;
      const request = ++navigation;
      controller?.abort();
      restoreBook();
      setBook(null);
      if (nextPage === currentPage.current) {
        surface!.inert = false;
        return;
      }

      const previousScroll = surface!.querySelector<HTMLElement>('[data-page-scroll]');
      const previousShelf = surface!.querySelector<HTMLElement>('[data-shelf-scroll]');
      scrollPositions.set(currentPage.current, { top: previousScroll?.scrollTop ?? 0, shelf: previousShelf?.scrollLeft ?? 0 });
      const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof surface!.animate === 'function';
      const transition = new AbortController();
      controller = transition;
      surface!.inert = true;

      function commitPage() {
        if (request !== navigation || transition.signal.aborted) return;
        currentPage.current = nextPage;
        flushSync(() => setPage(nextPage));
        const saved = scrollPositions.get(nextPage);
        const nextScroll = surface!.querySelector<HTMLElement>('[data-page-scroll]');
        const nextShelf = surface!.querySelector<HTMLElement>('[data-shelf-scroll]');
        if (nextScroll) nextScroll.scrollTop = saved?.top ?? 0;
        if (nextShelf) nextShelf.scrollLeft = saved?.shelf ?? 0;
      }

      try {
        if (!motion) {
          commitPage();
        } else if (selectedBook && selectedBook.width > 0 && selectedBook.height > 0) {
          flushSync(() => setBook(selectedBook));
          hiddenBook = { element: selectedBook.source, visibility: selectedBook.source.style.visibility };
          selectedBook.source.style.visibility = 'hidden';
          await playPageMotion(surface!, commitPage, transition.signal, { layer: openingRef.current!, book: selectedBook });
        } else {
          await playPageMotion(surface!, commitPage, transition.signal);
        }
      } catch {
        if (request === navigation && !transition.signal.aborted) commitPage();
      } finally {
        if (request === navigation) {
          restoreBook();
          // 책 연출을 정리한 뒤 화면 조작을 다시 허용합니다.
          flushSync(() => setBook(null));
          surface!.inert = false;
          surface!.focus({ preventScroll: true });
        }
      }
    }

    surface.addEventListener('click', selectBook);
    window.addEventListener('hashchange', changePage);
    return () => {
      ++navigation;
      controller?.abort();
      restoreBook();
      surface.inert = false;
      surface.removeEventListener('click', selectBook);
      window.removeEventListener('hashchange', changePage);
    };
  }, [getPage]);

  return (
    <>
      <div ref={surfaceRef} className="page-view" tabIndex={-1}>{children(page)}</div>
      {book ? <BookOpening book={book} layerRef={openingRef} /> : null}
    </>
  );
}

export default PageTransition;
