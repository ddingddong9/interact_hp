import { useEffect, useState, type RefObject } from 'react';
import { X } from 'lucide-react';
import '../styles/experiment-controls.css';

type Props = {
  stageRef: RefObject<HTMLElement | null>;
  sourceUrl?: string;
};

export default function ExperimentControls({ stageRef, sourceUrl }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const update = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [stageRef]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch {
      setCanFullscreen(false);
    }
  }

  return <div className="experiment-controls"
    onPointerMove={event => event.stopPropagation()}
    onPointerDown={event => event.stopPropagation()}
    onPointerUp={event => event.stopPropagation()}>
    <a className="experiment-close" href="#home" aria-label="Close project">
      <X size={21} strokeWidth={1.6} aria-hidden="true" />
    </a>
    {(sourceUrl || canFullscreen) && <div className="experiment-utilities" role="group" aria-label="View controls">
      {sourceUrl && <a className="experiment-text-control" href={sourceUrl} target="_blank" rel="noreferrer" aria-label="Image source and credits">info</a>}
      {sourceUrl && canFullscreen && <span className="experiment-utility-separator" aria-hidden="true">·</span>}
      {canFullscreen && <button type="button" className="experiment-text-control" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} aria-pressed={fullscreen}>
        {fullscreen ? 'exit fullscreen' : 'fullscreen'}
      </button>}
    </div>}
  </div>;
}
