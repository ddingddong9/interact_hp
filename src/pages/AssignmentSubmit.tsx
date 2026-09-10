import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import "../styles/project-feedback.css";

function AssignmentSubmit() {
  const stageRef = useRef<HTMLElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const moveField = (event: ReactPointerEvent<HTMLElement>) => {
    const stage = stageRef.current;
    if (!stage || submitted) return;
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    stage.style.setProperty("--pointer-x", x.toFixed(3));
    stage.style.setProperty("--pointer-y", y.toFixed(3));
  };

  const resetField = () => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--pointer-x", "0");
    stage.style.setProperty("--pointer-y", "0");
  };

  const retry = () => {
    setSubmitted(false);
    resetField();
  };

  return (
    <main
      ref={stageRef}
      className={`submit-feedback ${submitted ? "is-submitted" : ""}`}
      onPointerMove={moveField}
      onPointerLeave={resetField}
    >
      <a className="project-back" href="#home" aria-label="프로젝트 목록으로 돌아가기">
        KJW <span>↙</span>
      </a>

      <header className="experiment-meta">
        <span>02</span>
        <p>POINTER / MAGNETIC FIELD</p>
        <span>SINGLE ACTION</span>
      </header>

      <div className="submit-grid" aria-hidden="true" />
      {submitted ? <div className="submit-fill" aria-hidden="true" /> : null}

      <section className="submit-field" aria-label="포인터에 반응하는 제출 버튼">
        <div className="submit-orbits" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <button
          className="submit-core"
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={submitted}
          aria-label={submitted ? "신호 전송 완료" : "신호 전송"}
        >
          <span>{submitted ? "STATUS / 200" : "CLICK / ENTER"}</span>
          <strong>{submitted ? "RECEIVED" : "SUBMIT"}</strong>
          <span>{submitted ? "09.10.2026" : "SIGNAL 02"}</span>
        </button>

        {submitted ? (
          <div className="submit-result" role="status">
            <span>TRANSMISSION COMPLETE</span>
            <button type="button" onClick={retry}>SEND AGAIN ↗</button>
          </div>
        ) : null}
      </section>

      <footer className="experiment-footer">
        <p>{submitted ? "OBJECT RECEIVED" : "MOVE TO BEND THE FIELD"}</p>
        <span>{submitted ? "100%" : "READY"}</span>
      </footer>
    </main>
  );
}

export default AssignmentSubmit;
