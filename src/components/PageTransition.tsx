import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import BookOpening from './BookOpening';
import type { SelectedBook, TransitionDirection } from './BookOpening';
import { playPageMotion } from './pageMotion';

type Props = { getPage: () => string; children: (page: string) => ReactNode };

function PageTransition({ getPage, children }: Props) {
  const [page, setPage] = useState(getPage);
  const [transitionPoster, setTransitionPoster] = useState<{ book: SelectedBook; direction: TransitionDirection } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const currentPage = useRef(page);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let navigation = 0;
    let controller: AbortController | null = null;
    let pendingBook: SelectedBook | null = null;
    let lastProject: SelectedBook | null = null;
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
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a.project-poster') : null;
      if (!link || (link.target && link.target !== '_self')) return;
      const bounds = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      const artwork = link.cloneNode(true) as HTMLElement;
      const originals = [link, ...link.querySelectorAll<HTMLElement>('*')];
      const copies = [artwork, ...artwork.querySelectorAll<HTMLElement>('*')];
      originals.forEach((element, index) => {
        const computed = getComputedStyle(element);
        for (const name of Array.from(computed)) copies[index].style.setProperty(name, computed.getPropertyValue(name));
        copies[index].style.transition = 'none';
        copies[index].style.animation = 'none';
        copies[index].removeAttribute('id');
      });
      Object.assign(artwork.style, {
        position: 'relative', left: '0px', top: '0px', margin: '0px',
        width: `${link.offsetWidth}px`, height: `${link.offsetHeight}px`,
        transform: 'none', visibility: 'visible', pointerEvents: 'none',
      });
      artwork.removeAttribute('href');
      artwork.tabIndex = -1;
      pendingBook = {
        href: link.hash, title: link.dataset.posterTitle ?? '', number: link.dataset.posterNumber ?? '',
        color: style.backgroundColor, ink: style.color,
        left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, source: link,
        artwork, layoutWidth: link.offsetWidth, layoutHeight: link.offsetHeight,
      };
    }

    async function changePage() {
      const nextPage = getPage();
      const selectedBook = pendingBook?.href === nextPage ? pendingBook : null;
      const returningBook = nextPage === '#home' && currentPage.current !== '#home' ? lastProject : null;
      if (selectedBook) lastProject = selectedBook;
      pendingBook = null;
      const request = ++navigation;
      controller?.abort();
      restoreBook();
      setTransitionPoster(null);
      if (nextPage === currentPage.current) {
        surface!.inert = false;
        delete surface!.dataset.transitioning;
        surface!.dispatchEvent(new Event('project-ready', { bubbles: true }));
        return;
      }

      const previousScroll = surface!.querySelector<HTMLElement>('[data-page-scroll]');
      const previousShelf = surface!.querySelector<HTMLElement>('[data-shelf-scroll]');
      scrollPositions.set(currentPage.current, { top: previousScroll?.scrollTop ?? 0, shelf: previousShelf?.scrollLeft ?? 0 });
      const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof surface!.animate === 'function';
      const transition = new AbortController();
      controller = transition;
      surface!.inert = true;
      surface!.dataset.transitioning = 'true';

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
        } else if (selectedBook?.source && selectedBook.width > 0 && selectedBook.height > 0) {
          flushSync(() => setTransitionPoster({ book: selectedBook, direction: 'enter' }));
          hiddenBook = { element: selectedBook.source, visibility: selectedBook.source.style.visibility };
          selectedBook.source.style.visibility = 'hidden';
          await playPageMotion(surface!, commitPage, transition.signal, {
            layer: openingRef.current!, book: selectedBook, direction: 'enter',
          });
        } else if (returningBook) {
          flushSync(() => setTransitionPoster({ book: returningBook, direction: 'exit' }));
          await playPageMotion(surface!, commitPage, transition.signal, {
            layer: openingRef.current!, book: returningBook, direction: 'exit',
            findTarget: () => surface!.querySelector<HTMLElement>(`[data-transition-href="${returningBook.href}"]`),
          });
        } else {
          await playPageMotion(surface!, commitPage, transition.signal);
        }
      } catch {
        if (request === navigation && !transition.signal.aborted) commitPage();
      } finally {
        if (request === navigation) {
          restoreBook();
          // 책 연출을 정리한 뒤 화면 조작을 다시 허용합니다.
          flushSync(() => setTransitionPoster(null));
          surface!.inert = false;
          delete surface!.dataset.transitioning;
          surface!.dispatchEvent(new Event('project-ready', { bubbles: true }));
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
      delete surface.dataset.transitioning;
      surface.removeEventListener('click', selectBook);
      window.removeEventListener('hashchange', changePage);
    };
  }, [getPage]);

  return (
    <>
      <div ref={surfaceRef} className="page-view" tabIndex={-1}>{children(page)}</div>
      {transitionPoster ? <BookOpening book={transitionPoster.book} direction={transitionPoster.direction} layerRef={openingRef} /> : null}
    </>
  );
}

export default PageTransition;
