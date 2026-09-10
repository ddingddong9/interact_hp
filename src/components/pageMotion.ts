import type { SelectedBook } from './BookOpening';

type Opening = { layer: HTMLElement; book: SelectedBook };

export async function playPageMotion(surface: HTMLElement, changePage: () => void, signal: AbortSignal, opening?: Opening) {
  const animations: Animation[] = [];
  const cancel = () => animations.forEach((animation) => animation.cancel());
  const play = (element: Element, frames: Keyframe[], duration: number, delay = 0) => {
    if (signal.aborted) throw new DOMException('전환 취소', 'AbortError');
    const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(.22,.65,.2,1)', fill: 'both' });
    animations.push(animation);
    return animation.finished;
  };
  signal.addEventListener('abort', cancel, { once: true });

  try {
    if (opening) {
      const { layer, book } = opening;
      const stage = layer.querySelector<HTMLElement>('.book-opening__stage')!;
      const object = layer.querySelector<HTMLElement>('.book-opening__object')!;
      const cover = layer.querySelector<HTMLElement>('.book-opening__cover')!;
      const sheet = layer.querySelector<HTMLElement>('.book-opening__sheet')!;
      const veil = layer.querySelector<HTMLElement>('.book-opening__veil')!;
      const scale = Math.min(1.65, window.innerHeight * 0.52 / book.height, window.innerWidth * 0.75 / 328);
      const x = window.innerWidth / 2 - (book.left + book.width / 2);
      const y = (window.innerHeight - book.height * scale) / 2 - book.top;
      const pulled = `translate(${x - 82 * scale}px, ${y}px) scale(${scale})`;
      const opened = `translate(${x}px, ${y}px) scale(${scale})`;

      // 책등이 있던 자리에서 책을 꺼내 정면으로 돌립니다.
      await Promise.all([
        play(stage, [{ transform: 'translate(0, 0) scale(1)' }, { transform: pulled }], 880),
        play(object, [{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(72deg)', offset: 0.28 }, { transform: 'rotateY(0deg)' }], 880),
        play(veil, [{ opacity: 0 }, { opacity: 0.96 }], 880),
      ]);

      // 표지를 열고 종이 한 장을 넘긴 다음 화면을 드러냅니다.
      const depth = book.width / 2;
      await Promise.all([
        play(stage, [{ transform: pulled }, { transform: opened }], 980),
        play(cover, [{ transform: `translateZ(${depth}px) rotateY(0deg)` }, { transform: `translateZ(${depth}px) rotateY(-168deg)` }], 980),
        play(sheet, [{ transform: `translateZ(${depth - 3}px) rotateY(0deg)` }, { transform: `translateZ(${depth - 3}px) rotateY(-153deg)` }], 860, 170),
      ]);

      if (signal.aborted) return;
      changePage();
      await Promise.all([
        play(surface, [{ opacity: 0 }, { opacity: 1 }], 720),
        play(layer, [{ opacity: 1 }, { opacity: 0 }], 720),
        play(stage, [{ transform: opened }, { transform: `translate(${x}px, ${y - 8}px) scale(${scale * 1.06})` }], 720),
      ]);
    } else {
      await play(surface, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }], 240);
      if (signal.aborted) return;
      changePage();
      await play(surface, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], 440);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    cancel();
  }
}
