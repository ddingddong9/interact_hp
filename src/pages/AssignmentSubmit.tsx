import { useRef } from 'react';
import LongcatCanvas from '../components/LongcatCanvas';
import '../styles/longcat.css';
import ExperimentControls from '../components/ExperimentControls';

export default function AssignmentSubmit() {
  const stageRef = useRef<HTMLElement>(null);
  return <main ref={stageRef} className="longcat-stage" aria-label="Longcat">
    <LongcatCanvas />
    <ExperimentControls stageRef={stageRef} />
  </main>;
}
