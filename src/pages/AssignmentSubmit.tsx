import { useState } from "react";
import { Button } from "@chadcn/ui/button/dodge";
import { ArrowUpIcon } from "lucide-react";

function AssignmentSubmit() {
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    setSubmitted(true);
  };

  return (
    <main className="submit-page dark">
      <a className="back-link" href="#home">
        ← 권재원
      </a>

      <div className="submit-image-wrap">
        <img
          src="/submit-monkey.png"
          alt="컴퓨터 앞에서 과제를 제출하는 원숭이"
        />
      </div>

      <section className="submit-panel">
        <p className="submit-label">PROJECT 02</p>
        <h1>{submitted ? "제출 완료!" : "과제 제출"}</h1>
        <p>
          {submitted ? "과제를 무사히 제출했습니다." : "과제를 제출하세요."}
        </p>

        <div className="button-demo">
          <Button
            variant="outline"
            onClick={submit}
          >
            과제 제출
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="과제 제출"
            onClick={submit}
          >
            <ArrowUpIcon size={18} />
          </Button>
        </div>
      </section>
    </main>
  );
}

export default AssignmentSubmit;
