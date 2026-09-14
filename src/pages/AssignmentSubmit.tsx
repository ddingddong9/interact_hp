import { useRef } from 'react';
import BlindsCanvas from '../components/BlindsCanvas';
import '../styles/blinds.css';
import ExperimentControls from '../components/ExperimentControls';

export default function AssignmentSubmit() {
  const stageRef = useRef<HTMLElement>(null);
  return <main ref={stageRef} className="blinds-stage" aria-label="Blinds">
    <BlindsCanvas />
    <ExperimentControls stageRef={stageRef} sourceUrl="https://www.mauritshuis.nl/en/our-collection/artworks/670-girl-with-a-pearl-earring" />
  </main>;
}
