import type { SelectedBook, TransitionDirection } from './BookOpening';

type PosterMotion = {
  layer: HTMLElement;
  book: SelectedBook;
  direction: TransitionDirection;
  findTarget?: () => HTMLElement | null;
};

export async function playPageMotion(surface: HTMLElement, changePage: () => void, signal: AbortSignal, poster?: PosterMotion) {
  const animations: Animation[] = [];
  const originalOpacity = surface.style.opacity;
  const cancel = () => animations.forEach(animation => animation.cancel());
  const play = (element: Element, frames: Keyframe[], duration: number, easing = 'cubic-bezier(.4,0,.2,1)') => {
    if (signal.aborted) throw new DOMException('Transition cancelled', 'AbortError');
    const animation = element.animate(frames, { duration, easing, fill: 'both' });
    animations.push(animation);
    return animation.finished;
  };
  const check = () => { if (signal.aborted) throw new DOMException('Transition cancelled', 'AbortError'); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (!poster) {
      await play(surface, [{ opacity: 1 }, { opacity: 0 }], 350);
      check();
      changePage();
      await play(surface, [{ opacity: 0 }, { opacity: 1 }], 450);
      return;
    }
    const { book, layer } = poster;
    const frame = layer.querySelector<HTMLElement>('.book-opening__frame')!;
    const veil = layer.querySelector<HTMLElement>('.book-opening__veil')!;
    // Fixed artwork layout: only uniform transforms change, so type never reflows.
    const centralScale = Math.min(1.3, (window.innerWidth - 48) / book.layoutWidth, (window.innerHeight - 100) / book.layoutHeight);
    const centered = `translate(${(window.innerWidth - book.layoutWidth * centralScale) / 2}px, ${(window.innerHeight - book.layoutHeight * centralScale) / 2}px) scale(${centralScale})`;
    const at = (bounds: { left: number; top: number; width: number }) => `translate(${bounds.left}px, ${bounds.top}px) scale(${bounds.width / book.layoutWidth})`;
    frame.style.transform = poster.direction === 'enter' ? at(book) : centered;
    if (poster.direction === 'enter') {
      veil.style.opacity = '0';
      await Promise.all([
        play(frame, [{ transform: at(book) }, { transform: centered }], 650),
        play(veil, [{ opacity: 0 }, { opacity: 1 }], 650),
      ]);
      await play(frame, [{ transform: centered }, { transform: centered }], 300);
      check();
      // Mount the full-size project behind the opaque poster stage.
      changePage();
      await Promise.all([
        play(layer, [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], 950),
        play(surface, [{ transform: 'translateX(100%)', opacity: 1 }, { transform: 'translateX(0)', opacity: 1 }], 950),
      ]);
      return;
    }
    // Live project slides away intact; the central poster stage enters from the left.
    layer.style.transform = 'translateX(-100%)';
    await Promise.all([
      play(layer, [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }], 950),
      play(surface, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], 950),
    ]);
    check();
    // Remove the outgoing transform before measuring the restored home layout.
    surface.style.opacity = '0';
    animations.filter(animation => (animation.effect as KeyframeEffect | null)?.target === surface).forEach(animation => animation.cancel());
    changePage();
    await play(frame, [{ transform: centered }, { transform: centered }], 300);
    check();
    const target = poster.findTarget?.();
    const bounds = target?.getBoundingClientRect();
    if (!target || !bounds || bounds.width <= 0 || bounds.height <= 0) {
      surface.style.opacity = originalOpacity;
      await play(layer, [{ opacity: 1 }, { opacity: 0 }], 400);
      return;
    }
    const visibility = target.style.visibility;
    target.style.visibility = 'hidden';
    surface.style.opacity = originalOpacity;
    try {
      await Promise.all([
        play(frame, [{ transform: centered }, { transform: at(bounds) }], 700),
        play(veil, [{ opacity: 1 }, { opacity: 0 }], 700),
      ]);
      target.style.visibility = visibility;
      await play(frame, [{ opacity: 1 }, { opacity: 0 }], 120);
    } finally {
      target.style.visibility = visibility;
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    cancel();
    surface.style.opacity = originalOpacity;
  }
}
