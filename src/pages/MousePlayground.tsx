import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import MouseCanvas from '../components/MouseCanvas';
import { palettes } from '../components/mouseShapes';
import type { SceneMode } from '../components/mouseShapes';
import '../styles/mouse-playground.css';

function MousePlayground({ mode }: { mode: SceneMode }) {
  const [palette, setPalette] = useState(0);
  const isOrbit = mode === 'orbit';

  const interact = useCallback(() => {
    if (mode === 'orbit') setPalette((previous) => (previous + 1) % palettes.length);
  }, [mode]);

  return (
    <main className={`mouse-playground mouse-playground--${mode}`} aria-label={isOrbit ? '말랑한 궤도' : '흩어지는 글자'}
      style={isOrbit ? { '--play-bg': palettes[palette].background, '--play-ink': palettes[palette].ink } as CSSProperties : undefined}>
      <MouseCanvas mode={mode} palette={palette} onInteract={interact} />

      <nav className="mouse-nav" aria-label="프로젝트 이동">
        <a href="#home" aria-label="홈으로" title="홈으로">
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </a>
        <a href={isOrbit ? '#type-playground' : '#orbit-playground'} aria-label={isOrbit ? '흩어지는 글자로 이동' : '말랑한 궤도로 이동'} title="다음 실험">
          <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </nav>
    </main>
  );
}

export default MousePlayground;
