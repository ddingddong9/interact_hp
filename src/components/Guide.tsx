type GuideProps = {
  hitCount: number;
  maxHits: number;
  destroyed: boolean;
};

function Guide({ hitCount, maxHits, destroyed }: GuideProps) {
  return (
    <div className="guide">
      <strong>TYPE TO DESTROY</strong>
      <p>{destroyed ? '과제 끝! ESC를 눌러 다시 시작' : `아무 키나 누르세요 · ${hitCount}/${maxHits}`}</p>
    </div>
  );
}

export default Guide;
