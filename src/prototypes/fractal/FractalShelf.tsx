import { projects } from '../../data/projects';
import { chapterCardColor } from '../../data/chapterCardDesign';

// 3) 카드 안의 카드: 각 시리즈 표지 안에서 챕터들이 "남은 공간을 다시 나누는" 같은 규칙으로 배치됩니다.
type Rect = { x: number; y: number; w: number; h: number };

/** 첫 칸이 남은 공간의 일정 비율을 가져가고, 나머지는 방향을 바꿔 같은 규칙을 반복합니다. */
export function recursiveSplit(count: number, rect: Rect, ratio = 0.56, vertical = true): Rect[] {
  if (count <= 0) return [];
  if (count === 1) return [rect];
  const first: Rect = vertical ? { ...rect, w: rect.w * ratio } : { ...rect, h: rect.h * ratio };
  const rest: Rect = vertical
    ? { x: rect.x + first.w, y: rect.y, w: rect.w - first.w, h: rect.h }
    : { x: rect.x, y: rect.y + first.h, w: rect.w, h: rect.h - first.h };
  return [first, ...recursiveSplit(count - 1, rest, ratio, !vertical)];
}

export default function FractalShelf() {
  return (
    <section className="fractal-shelf" aria-label="시리즈">
      {projects.map(project => {
        const cells = recursiveSplit(project.chapters.length, { x: 0, y: 0, w: 100, h: 100 });
        return (
          <article key={project.title} className="fractal-shelf__cover" style={{ background: chapterCardColor(project.title, 0, 2) }}>
            <h2>{project.title}</h2>
            <div className="fractal-shelf__field">
              {project.chapters.map((chapter, index) => {
                const r = cells[index];
                const small = r.w * r.h < 220;
                return (
                  <a
                    key={chapter.href}
                    href={chapter.href}
                    className={`fractal-shelf__leaf${small ? ' is-small' : ''}`}
                    style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`, background: chapterCardColor(project.title, index, project.chapters.length) }}
                    aria-label={`${index + 1}p ${chapter.title}`}
                    title={chapter.title}
                  >
                    <span>{index + 1}p</span>
                    {!small && <strong>{chapter.title}</strong>}
                  </a>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
