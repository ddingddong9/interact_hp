type AssignmentProps = {
  hitCount: number;
  destroyed: boolean;
};

function Assignment({ hitCount, destroyed }: AssignmentProps) {
  return (
    <h1
      key={hitCount}
      className={`assignment ${destroyed ? "destroyed" : hitCount > 0 ? "hit" : ""} ${hitCount >= 8 ? "assignment-critical" : ""}`}
    >
      과제
    </h1>
  );
}

export default Assignment;
