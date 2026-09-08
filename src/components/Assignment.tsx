type AssignmentProps = {
  hitCount: number;
  destroyed: boolean;
};

function Assignment({ hitCount, destroyed }: AssignmentProps) {
  return (
    <h1 key={hitCount} className={`assignment ${destroyed ? 'destroyed' : 'hit'}`}>
      과제
    </h1>
  );
}

export default Assignment;
