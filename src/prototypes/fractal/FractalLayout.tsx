import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import InteractiveMonogram from '../../components/InteractiveMonogram';
import { projects } from '../../data/projects';
import { chapterCardColor } from '../../data/chapterCardDesign';

// 4) 홈 전체를 황금 분할로 구성: 정사각형을 떼어내고 남은 직사각형에 같은 분할을 반복합니다.
const PHI = (1 + Math.sqrt(5)) / 2;
type Rect = { x: number; y: number; w: number; h: number };

// 첫 칸(모노그램)은 정사각형, 이후는 남은 칸 수에 맞춰 떼어낼 비율을 정해 끝 칸이 지나치게 작아지지 않게 합니다.
const shareAt = (i: number, count: number) => (i === 1 ? 0.42 : 1 / Math.sqrt(count - i + 0.5));

function goldenSpiral(count: number, rect: Rect): Rect[] {
  const out: Rect[] = [];
  let r = { ...rect };
  for (let i = 0; i < count; i++) {
    if (i === count - 1) { out.push(r); break; }
    const dir = i % 4; // 왼쪽 → 위 → 오른쪽 → 아래 순으로 떼어냄
    const side = i === 0 ? Math.min(r.w, r.h) : (dir % 2 === 0 ? r.w : r.h) * shareAt(i, count);
    if (dir === 0) { out.push({ x: r.x, y: r.y, w: side, h: r.h }); r = { x: r.x + side, y: r.y, w: r.w - side, h: r.h }; }
    else if (dir === 1) { out.push({ x: r.x, y: r.y, w: r.w, h: side }); r = { x: r.x, y: r.y + side, w: r.w, h: r.h - side }; }
    else if (dir === 2) { out.push({ x: r.x + r.w - side, y: r.y, w: side, h: r.h }); r = { x: r.x, y: r.y, w: r.w - side, h: r.h }; }
    else { out.push({ x: r.x, y: r.y + r.h - side, w: r.w, h: side }); r = { x: r.x, y: r.y, w: r.w, h: r.h - side }; }
  }
  return out;
}

export default function FractalLayout({ intro }: { intro: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientWidth / PHI }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tiles: Array<{ key: string; node: ReactNode; color?: string }> = [
    { key: 'mono', node: <InteractiveMonogram /> },
    { key: 'intro', node: intro },
    ...projects.map(p => ({
      key: p.title,
      color: chapterCardColor(p.title, 0, 2),
      node: <a href={p.chapters[0].href} className="fractal-layout__series"><strong>{p.title}</strong><span>{p.chapters.length}p</span></a>,
    })),
  ];
  const rects = size.w ? goldenSpiral(tiles.length, { x: 0, y: 0, w: size.w, h: size.h }) : [];

  return (
    <div ref={ref} className="fractal-layout" style={{ height: size.h || undefined }}>
      {rects.map((r, i) => (
        <div
          key={tiles[i].key}
          className={`fractal-layout__tile fractal-layout__tile--${tiles[i].key === 'mono' ? 'mono' : tiles[i].key === 'intro' ? 'intro' : 'series'}`}
          style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: tiles[i].color, fontSize: Math.max(9, Math.min(22, Math.min(r.w, r.h) / 9)) }}
        >
          {tiles[i].node}
        </div>
      ))}
    </div>
  );
}
