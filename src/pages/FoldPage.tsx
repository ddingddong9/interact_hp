import { useRef } from 'react';
import FoldArtwork from '../components/FoldArtwork';
import ExperimentControls from '../components/ExperimentControls';
import '../styles/fold.css';

export default function FoldPage() {
  const stageRef = useRef<HTMLElement>(null);
  return <main className="fold-stage" ref={stageRef} aria-label="FOLD — Orchid Study">
    <FoldArtwork />
    <ExperimentControls stageRef={stageRef} />
  </main>;
}
