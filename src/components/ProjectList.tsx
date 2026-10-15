import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import ProjectPoster from './ProjectPoster';
import { chapterNotations, chapterCardColor } from '../data/chapterCardDesign';
import { koreanChapterNames, bilingualChapterName } from '../data/chapterNames';
import { nearestBookShift, rebaseShelf, wrapIndex } from './shelfLoop';
import type { CSSProperties } from 'react';
import { projects } from '../data/projects';
import '../styles/project-shelf.css';
import '../styles/chapter-card-fonts.css';
import '../styles/chapter-card-tokens.css';



const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const bookShelf = [...projects.map(project => ({ ...project, project, category: project.title })), null, null, null];
const hues = [28, 58, 92, 136, 172, 208];
const chapterShelf = [...projects.flatMap((project, category) => project.chapters.map((chapter, index) => ({
  ...chapter, category: project.title, chapterIndex: index, chapterCount: project.chapters.length, hue: hues[category], project: null,
}))), null, null, null];
const rememberedProjectIndices = { books: 0, cards: chapterShelf.findIndex(item => item?.category === 'Java') };
export function focusChapterCard(href: string) {
  const index = chapterShelf.findIndex(item => item?.href === href);
  if (index >= 0) rememberedProjectIndices.cards = index;
}

function ProjectList({ chapterCards = false }: { chapterCards?: boolean }) {
  const mode = chapterCards ? 'cards' : 'books';
  const shelf = chapterCards ? chapterShelf : bookShelf;
  const rememberedProjectIndex = rememberedProjectIndices[mode];
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const posterRefs = useRef<Array<HTMLLIElement | null>>([]);
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const activeIndexRef = useRef(rememberedProjectIndex);
  const initializedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const periodRef = useRef(0);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    distance: 0,
    posterIndex: null as number | null,
    modified: false,
  });
  const reducedMotionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(rememberedProjectIndex);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }, []);

  const paint = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
    const viewportCenter = viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    posterRefs.current.forEach((poster, index) => {
      if (!poster) return;
      const baseCenter = poster.offsetLeft + poster.offsetWidth / 2;
      const shift = nearestBookShift(baseCenter, positionRef.current, viewportCenter, periodRef.current);
      poster.style.translate = `${shift}px 0`;
      const center = baseCenter + shift + positionRef.current;
      const delta = center - viewportCenter;
      if (chapterCards) {
        const radius = 1050;
        poster.style.setProperty('--poster-y', `${Math.min(delta * delta / (2 * radius), 1200)}px`);
        poster.style.setProperty('--poster-z', '0px');
        poster.style.setProperty('--poster-rotate', `${Math.atan(delta / radius) * 180 / Math.PI * .65}deg`);
        const offset = Math.abs(delta) / (poster.offsetWidth * .9);
        poster.style.setProperty('--poster-scale', `${1.08 - Math.min(offset, 4) * .045}`);
        poster.style.setProperty('--poster-opacity', '1');
        poster.style.zIndex = String(1000 - Math.round(Math.abs(delta)));
        poster.style.visibility = Math.abs(delta) < viewport.clientWidth / 2 + poster.offsetWidth * 1.8 ? 'visible' : 'hidden';
      } else {
      const unit = Math.max(260, poster.offsetWidth * 1.08);
      const turn = clamp(delta / unit, -1.35, 1.35);
      const distance = Math.min(Math.abs(turn), 1);

      poster.style.setProperty('--poster-y', `${distance * 30}px`);
      poster.style.setProperty('--poster-z', `${distance * -130}px`);
      poster.style.setProperty('--poster-rotate', `${turn * -19}deg`);
      poster.style.setProperty('--poster-scale', `${1 - distance * 0.075}`);
      poster.style.setProperty('--poster-opacity', `${1 - distance * 0.24}`);
      }

      if (Math.abs(delta) < closestDistance) {
        closestDistance = Math.abs(delta);
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndexRef.current) {
      posterRefs.current[activeIndexRef.current]?.classList.remove('is-active');
      activeIndexRef.current = closestIndex;
      rememberedProjectIndices[mode] = closestIndex;
      posterRefs.current[closestIndex]?.classList.add('is-active');
      setActiveIndex(closestIndex);
    }
  }, [chapterCards, mode]);

  const getTargetPosition = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const poster = posterRefs.current[index];
    if (!viewport || !poster) return positionRef.current;
    const center = viewport.clientWidth / 2;
    const baseCenter = poster.offsetLeft + poster.offsetWidth / 2;
    const shift = nearestBookShift(baseCenter, positionRef.current, center, periodRef.current);
    return center - baseCenter - shift;
  }, []);

  const snapTo = useCallback((index: number) => {
    const targetIndex = wrapIndex(index, shelf.length);
    const target = getTargetPosition(targetIndex);
    cancelAnimation();
    const start = positionRef.current;
    const distance = Math.abs(target - start);

    if (reducedMotionRef.current || distance < 0.5) {
      positionRef.current = rebaseShelf(target, periodRef.current);
      velocityRef.current = 0;
      paint();
      return;
    }

    const duration = 600;
    const startedAt = performance.now();
    velocityRef.current = 0;

    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      positionRef.current = start + (target - start) * eased;
      paint();

      if (progress >= 1) {
        positionRef.current = rebaseShelf(target, periodRef.current);
        velocityRef.current = 0;
        paint();
        animationRef.current = null;
        return;
      }
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
  }, [cancelAnimation, getTargetPosition, paint, shelf.length]);

  const startInertia = useCallback(() => {
    cancelAnimation();
    if (reducedMotionRef.current) {
      velocityRef.current = 0;
      snapTo(activeIndexRef.current);
      return;
    }
    const step = () => {
      velocityRef.current *= 0.93;
      positionRef.current += velocityRef.current;

      paint();
      if (Math.abs(velocityRef.current) < 0.32) {
        positionRef.current = rebaseShelf(positionRef.current, periodRef.current);
        animationRef.current = null;
        snapTo(activeIndexRef.current);
        return;
      }
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
  }, [cancelAnimation, paint, snapTo]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!viewport) return;
    reducedMotionRef.current = motionQuery.matches;

    const measure = () => {
      const posters = posterRefs.current.filter((poster): poster is HTMLLIElement => poster !== null);
      if (posters.length === 0) return;
      const gap = (parseFloat(getComputedStyle(trackRef.current!).columnGap) || 0) + (parseFloat(getComputedStyle(posters.at(-1)!).marginRight) || 0);
      periodRef.current = posters.at(-1)!.offsetLeft + posters.at(-1)!.offsetWidth + gap - posters[0].offsetLeft;

      if (!initializedRef.current) {
        positionRef.current = getTargetPosition(activeIndexRef.current);
        initializedRef.current = true;
        posters[activeIndexRef.current]?.classList.add('is-active');
      } else {
        positionRef.current = getTargetPosition(activeIndexRef.current);
      }
      paint();
    };

    const updateMotionPreference = () => { reducedMotionRef.current = motionQuery.matches; };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    posterRefs.current.forEach((poster) => { if (poster) observer.observe(poster); });
    motionQuery.addEventListener('change', updateMotionPreference);
    measure();

    return () => {
      cancelAnimation();
      observer.disconnect();
      motionQuery.removeEventListener('change', updateMotionPreference);
    };
  }, [cancelAnimation, getTargetPosition, paint]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const poster = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-poster-index]')
      : null;
    const posterIndex = poster ? Number(poster.dataset.posterIndex) : null;

    cancelAnimation();
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      distance: 0,
      posterIndex: Number.isInteger(posterIndex) ? posterIndex : null,
      modified: event.ctrlKey || event.metaKey || event.altKey || event.shiftKey,
    };
    velocityRef.current = 0;
    suppressClickRef.current = false;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientY - drag.startY) > Math.abs(event.clientX - drag.startX) && drag.distance <= 3) return;
    const now = performance.now();
    const delta = event.clientX - drag.lastX;
    const elapsed = Math.max(8, now - drag.lastTime);
    const nextPosition = positionRef.current + delta;

    const distance = Math.max(drag.distance, Math.abs(event.clientX - drag.startX));

    if (drag.distance <= 3 && distance > 3) {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('is-dragging');
    }

    positionRef.current = nextPosition;
    velocityRef.current = delta * (16 / elapsed);
    drag.lastX = event.clientX;
    drag.lastTime = now;
    drag.distance = distance;
    paint();
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const moved = drag.distance > 3;
    const clickedSidePoster = !moved
      && !drag.modified
      && drag.posterIndex !== null
      && drag.posterIndex !== activeIndexRef.current;

    drag.active = false;
    suppressClickRef.current = moved || clickedSidePoster;
    event.currentTarget.classList.remove('is-dragging');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (moved) {
      startInertia();
    } else if (clickedSidePoster) {
      snapTo(drag.posterIndex!);
    }
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && !event.shiftKey) return;
    event.preventDefault();
    cancelAnimation();
    const delta = event.shiftKey ? event.deltaY : event.deltaX;
    velocityRef.current = -delta * 0.22;
    positionRef.current -= delta;
    paint();
    startInertia();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    snapTo(activeIndexRef.current + (event.key === 'ArrowRight' ? 1 : -1));
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  return (
    <section className={`project-section ${chapterCards ? 'chapter-card-track' : ''}`} aria-labelledby="project-heading">
      <h2 className="project-track__sr-only" id="project-heading">프로젝트</h2>

      <div
        className="project-track__viewport"
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={chapterCards ? '챕터 카드 트랙' : '시리즈 책 트랙'}
        tabIndex={0}
        data-poster-track
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onClickCapture={handleClickCapture}
      >
        <ul className="project-track" ref={trackRef}>
          {shelf.map((project, index) => (
            <li
              key={project?.href ?? `empty-${index}`}
              ref={(node) => { posterRefs.current[index] = node; }}
              data-poster-index={index}
              aria-label={`${index + 1} / ${shelf.length}`}
            >
              {project?.project ? <ProjectPoster {...project.project} number={index + 1} /> : project && 'chapterIndex' in project ?
                <a className="project-poster chapter-card" href={project.href} data-transition-href={project.href} data-poster-title={project.title} data-poster-number={`${project.chapterIndex + 1}p`} aria-label={`${project.category} ${project.chapterIndex + 1}p ${bilingualChapterName(project.title)} 열기`}
                  style={{ '--poster-hue': project.hue, '--poster-color': chapterCardColor(project.category, project.chapterIndex, project.chapterCount) } as CSSProperties}>
                  <div className="series-cover"><span className="chapter-card__category">{project.category}</span>
                  <div className="chapter-card__content"><strong className="chapter-card__title">{project.title}</strong><span className="chapter-card__korean">{koreanChapterNames[project.title]}</span></div><div className="chapter-card__notation">{chapterNotations[project.title]}</div><div className="chapter-card__footer"><span className="chapter-card__number">{String(project.chapterIndex + 1).padStart(2, '0')}</span><span className="chapter-card__open" aria-hidden="true">↗</span></div></div>
                </a> : <article className={`project-poster series-book empty-book ${chapterCards ? 'chapter-card chapter-card--empty' : ''}`} aria-label={chapterCards ? '빈 카드' : '빈 책'} style={{ '--poster-hue': (chapterCards ? [244, 278, 316] : [208, 244, 278])[index - (shelf.length - 3)] } as CSSProperties}><div className="series-cover" /></article>}

            </li>
          ))}
        </ul>
      </div>

      <div className="project-track__controls">
        <button type="button" onClick={() => snapTo(activeIndexRef.current - 1)} aria-label="이전 시리즈">
          ←
        </button>
        <p aria-live="polite">
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          {shelf[activeIndex] && <><span className="project-track__divider">/</span><strong>{chapterCards ? shelf[activeIndex]!.category : shelf[activeIndex]!.title}</strong></>}
        </p>
        <button type="button" onClick={() => snapTo(activeIndexRef.current + 1)} aria-label="다음 시리즈">
          →
        </button>
      </div>
    </section>
  );
}

export default ProjectList;
