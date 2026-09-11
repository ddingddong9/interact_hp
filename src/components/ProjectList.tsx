import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import ProjectPoster from './ProjectPoster';
import { projects } from '../data/projects';
import '../styles/project-shelf.css';



const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
let rememberedProjectIndex = 0;

function ProjectList() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const posterRefs = useRef<Array<HTMLLIElement | null>>([]);
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const activeIndexRef = useRef(rememberedProjectIndex);
  const initializedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const boundsRef = useRef({ min: 0, max: 0 });
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
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
      const center = poster.offsetLeft + poster.offsetWidth / 2 + positionRef.current;
      const delta = center - viewportCenter;
      const unit = Math.max(260, poster.offsetWidth * 1.08);
      const turn = clamp(delta / unit, -1.35, 1.35);
      const distance = Math.min(Math.abs(turn), 1);

      poster.style.setProperty('--poster-y', `${distance * 30}px`);
      poster.style.setProperty('--poster-z', `${distance * -130}px`);
      poster.style.setProperty('--poster-rotate', `${turn * -19}deg`);
      poster.style.setProperty('--poster-scale', `${1 - distance * 0.075}`);
      poster.style.setProperty('--poster-opacity', `${1 - distance * 0.24}`);

      if (Math.abs(delta) < closestDistance) {
        closestDistance = Math.abs(delta);
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndexRef.current) {
      posterRefs.current[activeIndexRef.current]?.classList.remove('is-active');
      activeIndexRef.current = closestIndex;
      rememberedProjectIndex = closestIndex;
      posterRefs.current[closestIndex]?.classList.add('is-active');
      setActiveIndex(closestIndex);
    }
  }, []);

  const getTargetPosition = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const poster = posterRefs.current[index];
    if (!viewport || !poster) return positionRef.current;
    return clamp(
      viewport.clientWidth / 2 - (poster.offsetLeft + poster.offsetWidth / 2),
      boundsRef.current.min,
      boundsRef.current.max,
    );
  }, []);

  const snapTo = useCallback((index: number) => {
    const targetIndex = clamp(index, 0, projects.length - 1);
    const target = getTargetPosition(targetIndex);
    cancelAnimation();
    const start = positionRef.current;
    const distance = Math.abs(target - start);

    if (reducedMotionRef.current || distance < 0.5) {
      positionRef.current = target;
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
        positionRef.current = target;
        velocityRef.current = 0;
        paint();
        animationRef.current = null;
        return;
      }
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
  }, [cancelAnimation, getTargetPosition, paint]);

  const startInertia = useCallback(() => {
    cancelAnimation();
    const step = () => {
      const bounds = boundsRef.current;
      velocityRef.current *= 0.93;
      positionRef.current += velocityRef.current;

      if (positionRef.current < bounds.min || positionRef.current > bounds.max) {
        const edge = clamp(positionRef.current, bounds.min, bounds.max);
        velocityRef.current += (edge - positionRef.current) * 0.13;
        velocityRef.current *= 0.72;
      }

      paint();
      const inside = positionRef.current >= bounds.min - 0.5 && positionRef.current <= bounds.max + 0.5;
      if (Math.abs(velocityRef.current) < 0.32 && inside) {
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
      const center = viewport.clientWidth / 2;
      boundsRef.current = {
        max: center - (posters[0].offsetLeft + posters[0].offsetWidth / 2),
        min: center - (posters.at(-1)!.offsetLeft + posters.at(-1)!.offsetWidth / 2),
      };

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
    const now = performance.now();
    const delta = event.clientX - drag.lastX;
    const elapsed = Math.max(8, now - drag.lastTime);
    const bounds = boundsRef.current;
    let nextPosition = positionRef.current + delta;

    const distance = Math.max(drag.distance, Math.abs(event.clientX - drag.startX));

    if (drag.distance <= 3 && distance > 3) {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('is-dragging');
    }

    if (nextPosition > bounds.max) nextPosition = bounds.max + (nextPosition - bounds.max) * 0.2;
    if (nextPosition < bounds.min) nextPosition = bounds.min + (nextPosition - bounds.min) * 0.2;

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
    positionRef.current = clamp(
      positionRef.current - delta,
      boundsRef.current.min - 45,
      boundsRef.current.max + 45,
    );
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
    <section className="project-section" aria-labelledby="project-heading">
      <div className="project-track__heading">
        <p className="section-kicker">SELECTED WORKS — 2026</p>
      </div>
      <h2 className="project-track__sr-only" id="project-heading">프로젝트</h2>

      <div
        className="project-track__viewport"
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="프로젝트 포스터 트랙"
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
          {projects.map((project, index) => (
            <li
              key={project.href}
              ref={(node) => { posterRefs.current[index] = node; }}
              data-poster-index={index}
              aria-label={`${index + 1} / ${projects.length}`}
            >
              <ProjectPoster {...project} number={index + 1} />
            </li>
          ))}
        </ul>
      </div>

      <div className="project-track__controls">
        <button type="button" onClick={() => snapTo(activeIndexRef.current - 1)} disabled={activeIndex === 0} aria-label="이전 프로젝트">
          ←
        </button>
        <p aria-live="polite">
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="project-track__divider">/</span>
          <strong>{projects[activeIndex].title}</strong>
        </p>
        <button type="button" onClick={() => snapTo(activeIndexRef.current + 1)} disabled={activeIndex === projects.length - 1} aria-label="다음 프로젝트">
          →
        </button>
      </div>
    </section>
  );
}

export default ProjectList;
