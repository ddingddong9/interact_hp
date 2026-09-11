import { useRef } from 'react';
import NebulaPanorama from '../components/NebulaPanorama';
import ExperimentControls from '../components/ExperimentControls';
import '../styles/nebula-panorama.css';

export default function AssignmentBreaker() {
  const stage = useRef<HTMLElement>(null);

  return <main ref={stage} className="nebula-stage" aria-label="Nebula Drift">
    <NebulaPanorama />
    <ExperimentControls stageRef={stage}
      sourceUrl="https://science.nasa.gov/asset/hubble/the-carina-nebula-star-birth-in-the-extreme/" />
  </main>;
}
