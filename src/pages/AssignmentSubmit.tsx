import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpIcon } from 'lucide-react';
import { Button } from '../components/ui/button/dodge';

function AssignmentSubmit() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [submitted, setSubmitted] = useState(false);

  const dodge = () => {
    setPosition({
      x: Math.round(Math.random() * 180 - 90),
      y: Math.round(Math.random() * 120 - 60),
    });
  };

  const submit = () => {
    setPosition({ x: 0, y: 0 });
    setSubmitted(true);
  };

  return (
    <main className="submit-page">
      <a className="back-link" href="#home">← 권재원</a>

      <div className="submit-image-wrap">
        <img src="/submit-monkey.png" alt="컴퓨터 앞에서 과제를 제출하는 원숭이" />
      </div>

      <section className="submit-panel">
        <p className="submit-label">PROJECT 02</p>
        <h1>{submitted ? '제출 완료!' : '과제 제출'}</h1>
        <p>{submitted ? '이번 과제도 무사히 제출했습니다.' : '버튼이 도망가기 전에 과제를 제출하세요.'}</p>

        <div className="button-demo">
          <Button
            variant="outline"
            onMouseEnter={dodge}
            onFocus={dodge}
            onClick={submit}
            style={{ '--dodge-x': `${position.x}px`, '--dodge-y': `${position.y}px` } as CSSProperties}
          >
            과제 제출
          </Button>
          <Button variant="outline" size="icon" aria-label="과제 제출" onClick={submit}>
            <ArrowUpIcon size={18} />
          </Button>
        </div>
      </section>
    </main>
  );
}

export default AssignmentSubmit;
