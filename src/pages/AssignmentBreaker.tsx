import { ArrowLeft, ArrowRight } from 'lucide-react';
import PointCanvas from '../components/PointCanvas';
import '../styles/mouse-playground.css';
import '../styles/point-playground.css';

function AssignmentBreaker() {
  return (
    <main className="mouse-playground point-playground" aria-label="남겨진 점">
      <PointCanvas />

      <nav className="mouse-nav" aria-label="프로젝트 이동">
        <a href="#home" aria-label="홈으로" title="홈으로">
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </a>
        <a href="#assignment-submit" aria-label="끌림의 좌표로 이동" title="다음 실험">
          <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </nav>
    </main>
  );
}

export default AssignmentBreaker;
