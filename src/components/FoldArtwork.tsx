import { useEffect, useRef, useState } from 'react';

const front = '/images/fold/orchid-front.jpg';
const reverse = '/images/fold/orchid-reverse.jpg';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function FoldArtwork() {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches;
    let height = 1;
    let split = .53;
    let angle = 0;
    let targetAngle = 0;
    let velocity = 0;
    let raf = 0;
    let last = performance.now();
    let pull: { id: number; startY: number; startX: number; wasFolded: boolean; moved: boolean } | null = null;
    let pointerX = .5, pointerY = .5;
    let tiltX = 0, tiltY = 0;

    function paint() {
      sheet!.style.setProperty('--fold-split', `${(split * 100).toFixed(3)}%`);
      sheet!.style.setProperty('--fold-split-px', `${(split * height).toFixed(2)}px`);
      sheet!.style.setProperty('--fold-height', `${height.toFixed(2)}px`);
      sheet!.style.setProperty('--fold-angle', `${-angle.toFixed(2)}deg`);
      sheet!.style.setProperty('--fold-depth', String(clamp(angle / 145, 0, 1)));
      sheet!.style.setProperty('--fold-tilt-x', `${tiltX.toFixed(2)}deg`);
      sheet!.style.setProperty('--fold-tilt-y', `${tiltY.toFixed(2)}deg`);
      sheet!.dataset.folded = angle > 75 ? 'true' : 'false';
    }
    function tick(now: number) {
      raf = 0;
      const dt = Math.min(.04, Math.max(0, (now - last) / 1000));
      last = now;
      if (reduced) { angle = targetAngle; velocity = 0; }
      else {
        const stiffness = pull ? 170 : 78;
        const damping = pull ? 25 : 16;
        velocity += ((targetAngle - angle) * stiffness - velocity * damping) * dt;
        angle = clamp(angle + velocity * dt, 0, 157);
      }
      const desiredX = reduced || pull ? 0 : (pointerY - .5) * -2.7;
      const desiredY = reduced || pull ? 0 : (pointerX - .5) * 3.7;
      const blend = 1 - Math.exp(-dt * 7);
      tiltX += (desiredX - tiltX) * blend;
      tiltY += (desiredY - tiltY) * blend;
      paint();
      if (Math.abs(angle - targetAngle) > .025 || Math.abs(velocity) > .08 ||
          Math.abs(tiltX - desiredX) > .01 || Math.abs(tiltY - desiredY) > .01) requestFrame();
    }
    function requestFrame() {
      if (raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function measure() {
      height = Math.max(1, sheet!.getBoundingClientRect().height);
      paint();
    }
    function at(event: PointerEvent) {
      const bounds = sheet!.getBoundingClientRect();
      return {
        x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
        y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
      };
    }
    function down(event: PointerEvent) {
      if (event.button !== 0 || pull) return;
      const point = at(event);
      pull = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
        wasFolded: targetAngle > 70, moved: false };
      if (!pull.wasFolded) split = clamp(point.y, .34, .67);
      sheet!.dataset.pointerFocus = 'true';
      sheet!.focus({ preventScroll: true });
      sheet!.setPointerCapture(event.pointerId);
      sheet!.classList.add('is-pulling');
      pointerX = point.x; pointerY = point.y;
      requestFrame();
    }
    function move(event: PointerEvent) {
      if (pull && event.pointerId !== pull.id) return;
      const point = at(event);
      pointerX = point.x; pointerY = point.y;
      if (pull) {
        const distance = event.clientY - pull.startY;
        if (Math.hypot(event.clientX - pull.startX, distance) > 8) pull.moved = true;
        // Drag distance controls the fold continuously, with a little resistance near its limit.
        if (pull.moved) targetAngle = clamp(distance * .64, 0, 148);
      }
      requestFrame();
    }
    function release(event: PointerEvent) {
      if (!pull || event.pointerId !== pull.id) return;
      if (pull.moved) targetAngle = Math.max(angle, targetAngle) > 65 ? 145 : 0;
      else if (pull.wasFolded) targetAngle = 0;
      else targetAngle = 0;
      pull = null;
      sheet!.classList.remove('is-pulling');
      if (sheet!.hasPointerCapture(event.pointerId)) sheet!.releasePointerCapture(event.pointerId);
      requestFrame();
    }
    function cancel() {
      if (!pull) return;
      pull = null; targetAngle = 0;
      sheet!.classList.remove('is-pulling');
      requestFrame();
    }
    function leave() { pointerX = .5; pointerY = .5; requestFrame(); }
    function key(event: KeyboardEvent) {
      if (!['Enter', ' ', 'Escape', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); delete sheet!.dataset.pointerFocus;
      if (event.key === 'Enter' || event.key === ' ') targetAngle = targetAngle > 70 ? 0 : 145;
      if (event.key === 'Escape') targetAngle = 0;
      if (event.key === 'ArrowDown') targetAngle = clamp(targetAngle + 18, 0, 145);
      if (event.key === 'ArrowUp') targetAngle = clamp(targetAngle - 18, 0, 145);
      requestFrame();
    }
    function motion() { reduced = media.matches; requestFrame(); }
    function visibility() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else requestFrame(); }
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    sheet.addEventListener('pointerdown', down);
    sheet.addEventListener('pointermove', move);
    sheet.addEventListener('pointerup', release);
    sheet.addEventListener('pointercancel', cancel);
    sheet.addEventListener('lostpointercapture', cancel);
    sheet.addEventListener('pointerleave', leave);
    sheet.addEventListener('keydown', key);
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    measure();
    return () => {
      observer.disconnect(); cancelAnimationFrame(raf);
      sheet.removeEventListener('pointerdown', down);
      sheet.removeEventListener('pointermove', move);
      sheet.removeEventListener('pointerup', release);
      sheet.removeEventListener('pointercancel', cancel);
      sheet.removeEventListener('lostpointercapture', cancel);
      sheet.removeEventListener('pointerleave', leave);
      sheet.removeEventListener('keydown', key);
      media.removeEventListener('change', motion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return <div className="fold-artwork" ref={sheetRef} tabIndex={0} role="button"
    aria-label="Orchid Study. Press and drag down to fold the print. Tap a folded print to unfold it. Use Enter to fold or unfold and Up and Down arrows to adjust the fold."
    data-loaded={loaded ? 'true' : 'false'}>
    <div className="fold-artwork__substrate" aria-hidden="true" />
    <div className="fold-artwork__lower" aria-hidden="true">
      <img src={front} alt="" draggable={false} />
      <div className="fold-artwork__cast-shadow" />
    </div>
    <div className="fold-artwork__flap" aria-hidden="true">
      <div className="fold-artwork__face fold-artwork__face--front"><img src={front} alt="" draggable={false} onLoad={() => setLoaded(true)} /></div>
      <div className="fold-artwork__face fold-artwork__face--reverse"><img src={reverse} alt="" draggable={false} /></div>
      <div className="fold-artwork__rim" />
    </div>
  </div>;
}
