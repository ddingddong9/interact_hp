export async function playChapterMotion(surface: HTMLElement, changePage: () => void, signal: AbortSignal, direction: 'next' | 'previous') {
  const animations: Animation[] = [];
  const sign = direction === 'next' ? -1 : 1;
  const cancel = () => animations.forEach(animation => animation.cancel());
  const play = (frames: Keyframe[], duration: number) => {
    if (signal.aborted) throw new DOMException('Transition cancelled', 'AbortError');
    const animation = surface.animate(frames, { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
    animations.push(animation);
    return animation.finished;
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    await play([
      { opacity: 1, transform: 'translateX(0) rotateY(0deg)', transformOrigin: direction === 'next' ? 'left center' : 'right center' },
      { opacity: 0, transform: `translateX(${sign * 10}%) rotateY(${sign * 8}deg)`, transformOrigin: direction === 'next' ? 'left center' : 'right center' },
    ], 260);
    if (signal.aborted) throw new DOMException('Transition cancelled', 'AbortError');
    changePage();
    // Keep the incoming page separate from the outgoing content; labels cannot overlap.
    await play([
      { opacity: 0, transform: `translateX(${-sign * 10}%) rotateY(${-sign * 8}deg)`, transformOrigin: direction === 'next' ? 'right center' : 'left center' },
      { opacity: 1, transform: 'translateX(0) rotateY(0deg)', transformOrigin: direction === 'next' ? 'right center' : 'left center' },
    ], 340);
  } finally {
    signal.removeEventListener('abort', cancel);
    cancel();
  }
}
