'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Particle = { x: number; y: number; vx: number; vy: number; size: number; loose: boolean; alpha: number };
type Shot = { char: string; x: number; y: number; vx: number; vy: number; angle: number; spin: number };

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: Record<string, unknown>;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const TARGET = '과제';
const HIT_RADIUS = 54;

function createParticles(width: number, height: number) {
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const context = mask.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  const compact = width < 700;
  const fontSize = Math.min(compact ? width * 0.43 : width * 0.31, height * 0.54);
  context.fillStyle = '#fff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `900 ${fontSize}px Arial, "Apple SD Gothic Neo", sans-serif`;
  context.fillText(TARGET, compact ? width * 0.57 : width * 0.65, height * 0.43);
  const pixels = context.getImageData(0, 0, width, height).data;
  const gap = compact ? 7 : 8;
  const particles: Particle[] = [];
  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      if (pixels[(y * width + x) * 4 + 3] > 100) {
        particles.push({ x, y, vx: 0, vy: 0, size: gap + 0.5, loose: false, alpha: 1 });
      }
    }
  }
  return particles;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shotsRef = useRef<Shot[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const shotCountRef = useRef(0);
  const monkeyTimeoutRef = useRef<number | null>(null);
  const [shots, setShots] = useState(0);
  const [destroyed, setDestroyed] = useState(false);
  const [started, setStarted] = useState(false);
  const [monkeyTilt, setMonkeyTilt] = useState<'left' | 'right' | 'center'>('center');

  const reset = useCallback(() => {
    const { width, height } = dimensionsRef.current;
    particlesRef.current = createParticles(width, height);
    shotsRef.current = [];
    shotCountRef.current = 0;
    setShots(0);
    setDestroyed(false);
    setStarted(false);
    setMonkeyTilt('center');
  }, []);

  const fire = useCallback((char: string) => {
    if (!char || char.length > 2) return;
    const { width, height } = dimensionsRef.current;
    if (!width || !height) return;
    const compact = width < 700;
    const startX = compact ? width * 0.22 : width * 0.19;
    const startY = compact ? height * 0.79 : height * 0.69;
    const targetX = compact ? width * (0.44 + Math.random() * 0.28) : width * (0.5 + Math.random() * 0.3);
    const targetY = height * (0.25 + Math.random() * 0.34);
    const distance = Math.hypot(targetX - startX, targetY - startY);
    const speed = Math.max(13, distance / 28);
    shotsRef.current.push({
      char,
      x: startX,
      y: startY,
      vx: ((targetX - startX) / distance) * speed,
      vy: ((targetY - startY) / distance) * speed,
      angle: 0,
      spin: (Math.random() - 0.5) * 0.24,
    });
    shotCountRef.current += 1;
    setShots(shotCountRef.current);
    setStarted(true);
    setMonkeyTilt(shotCountRef.current % 2 ? 'left' : 'right');
    if (monkeyTimeoutRef.current !== null) window.clearTimeout(monkeyTimeoutRef.current);
    monkeyTimeoutRef.current = window.setTimeout(() => setMonkeyTilt('center'), 130);
  }, []);

  useEffect(() => {
    return () => {
      if (monkeyTimeoutRef.current !== null) window.clearTimeout(monkeyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.key === 'Escape') {
        reset();
        return;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        fire(event.key === ' ' ? '␣' : event.key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fire, reset]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportError = (error: unknown) => console.warn('WebMCP tool registration failed', error);

    void Promise.resolve(
      context.registerTool(
        {
          name: 'fire_characters',
          title: '문자 발사',
          description: '한 글자 이상의 문자를 차례대로 발사해 과제 글자를 무너뜨립니다.',
          inputSchema: {
            type: 'object',
            properties: { text: { type: 'string', minLength: 1, maxLength: 24 } },
            required: ['text'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const text = (input as { text?: unknown })?.text;
            if (typeof text !== 'string' || text.length < 1 || text.length > 24) {
              throw new Error('text must contain 1 to 24 characters');
            }
            Array.from(text).forEach((char, index) => window.setTimeout(() => fire(char), index * 80));
            return { fired: Array.from(text).length };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(reportError);

    void Promise.resolve(
      context.registerTool(
        {
          name: 'reset_assignment',
          title: '과제 다시 세우기',
          description: '무너진 과제 글자와 타격 수를 처음 상태로 되돌립니다.',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute() {
            reset();
            return { reset: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(reportError);

    return () => lifecycle.abort();
  }, [fire, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dimensionsRef.current = { width: rect.width, height: rect.height };
      particlesRef.current = createParticles(rect.width, rect.height);
      shotsRef.current = [];
      shotCountRef.current = 0;
      setShots(0);
      setDestroyed(false);
      setStarted(false);
    };

    const impact = (x: number, y: number) => {
      for (const particle of particlesRef.current) {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const distance = Math.hypot(dx, dy);
        if (!particle.loose && distance < HIT_RADIUS) {
          const force = (HIT_RADIUS - distance) / HIT_RADIUS;
          particle.loose = true;
          particle.vx = (dx / Math.max(distance, 1)) * (4 + force * 10) + (Math.random() - 0.5) * 3;
          particle.vy = (dy / Math.max(distance, 1)) * (4 + force * 8) - Math.random() * 5;
        }
      }
      if (shotCountRef.current >= 9) {
        const collapseChance = Math.min(0.5, (shotCountRef.current - 8) * 0.045);
        for (const particle of particlesRef.current) {
          if (!particle.loose && Math.random() < collapseChance) {
            particle.loose = true;
            particle.vx = (Math.random() - 0.5) * 4;
            particle.vy = Math.random() * -2;
          }
        }
      }
      const standing = particlesRef.current.filter((particle) => !particle.loose).length;
      if (standing < particlesRef.current.length * 0.13 || shotCountRef.current > 22) {
        setDestroyed(true);
        for (const particle of particlesRef.current) {
          if (!particle.loose) {
            particle.loose = true;
            particle.vx = (Math.random() - 0.5) * 3;
            particle.vy = Math.random() * -3;
          }
        }
      }
    };

    const render = () => {
      const { width, height } = dimensionsRef.current;
      context.clearRect(0, 0, width, height);
      for (const particle of particlesRef.current) {
        if (particle.loose) {
          particle.vy += 0.34;
          particle.vx *= 0.995;
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.y > height + 20) particle.alpha = Math.max(0, particle.alpha - 0.05);
        }
        if (particle.alpha > 0) {
          context.globalAlpha = particle.alpha;
          context.fillStyle = particle.loose ? '#f4f4f5' : '#ffffff';
          context.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
      }
      context.globalAlpha = 1;
      const nextShots: Shot[] = [];
      for (const shot of shotsRef.current) {
        shot.x += shot.vx;
        shot.y += shot.vy;
        shot.angle += shot.spin;
        context.save();
        context.translate(shot.x, shot.y);
        context.rotate(shot.angle);
        context.font = '900 28px Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = '#ff2d20';
        context.shadowBlur = 18;
        context.fillStyle = '#ff3b30';
        context.fillText(shot.char, 0, 0);
        context.restore();
        const possibleHit = particlesRef.current.some(
          (particle) => !particle.loose && Math.hypot(particle.x - shot.x, particle.y - shot.y) < 22,
        );
        if (possibleHit) impact(shot.x, shot.y);
        else if (shot.x < width + 50 && shot.y > -50 && shot.y < height + 50) nextShots.push(shot);
      }
      shotsRef.current = nextShots;
      animationFrame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <main className="stage" onPointerDown={() => fire('●')}>
      <canvas ref={canvasRef} className="physics-canvas" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <img
        className={`monkey monkey-${monkeyTilt}`}
        src="/keyboard-monkey.png"
        alt="키보드 앞에 앉아 있는 원숭이"
        draggable={false}
      />
      <section className="instructions" aria-live="polite">
        <p className="eyebrow">TYPE TO DESTROY</p>
        <p className="hint">
          {destroyed ? '과제 끝. ESC를 눌러 다시 시작' : started ? `${shots} HIT${shots === 1 ? '' : 'S'} — 계속 타이핑!` : '아무 키나 눌러 과제를 부숴버리세요'}
        </p>
      </section>
      <button className="reset" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={reset}>
        다시 시작 <kbd>ESC</kbd>
      </button>
      <p className="sr-only">키보드의 아무 문자 키를 누르면 해당 문자가 과제라는 글자를 향해 날아가며 글자가 무너집니다.</p>
    </main>
  );
}
