import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import ExperimentControls from '../components/ExperimentControls';
import MouseCanvas from '../components/MouseCanvas';
import { palettes } from '../components/mouseShapes';
import type { SceneMode } from '../components/mouseShapes';
import '../styles/mouse-playground.css';

function MousePlayground({ mode }: { mode: SceneMode }) {
  const stageRef = useRef<HTMLElement>(null);
  const [palette, setPalette] = useState(0);
  const isOrbit = mode === 'orbit';

  const interact = useCallback(() => {
    if (mode === 'orbit') setPalette((previous) => (previous + 1) % palettes.length);
  }, [mode]);

  return (
    <main ref={stageRef} className={`mouse-playground mouse-playground--${mode}`} aria-label={isOrbit ? 'Soft Orbit' : 'Type Drift'}
      style={isOrbit ? { '--play-bg': palettes[palette].background, '--play-ink': palettes[palette].ink } as CSSProperties : undefined}>
      <MouseCanvas mode={mode} palette={palette} onInteract={interact} />

      <ExperimentControls stageRef={stageRef} />
    </main>
  );
}

export default MousePlayground;
