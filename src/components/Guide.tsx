type GuideProps = {
  hitCount: number;
  maxHits: number;
  destroyed: boolean;
};

function Guide({ hitCount, maxHits, destroyed }: GuideProps) {
  return (
    <div className="guide">
      <strong>TYPE TO DESTROY</strong>
      <div
        className="assignment-health"
        role="progressbar"
        aria-label="과제의 남은 체력"
        aria-valuemin={0}
        aria-valuemax={maxHits}
        aria-valuenow={maxHits - hitCount}
      >
        {Array.from({ length: maxHits }, (_, index) => (
          <span key={index} className={index < hitCount ? 'is-broken' : ''} />
        ))}
      </div>
      <p>{destroyed ? '과제 끝! ESC를 눌러 다시 시작' : `문자 키를 눌러보세요 · ${hitCount}/${maxHits}`}</p>
    </div>
  );
}

export default Guide;
