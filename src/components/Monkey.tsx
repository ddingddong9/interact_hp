type MonkeyProps = {
  side: string;
};

function Monkey({ side }: MonkeyProps) {
  return (
    <img
      className={`monkey ${side}`}
      src="/keyboard-monkey.png"
      alt="키보드 앞에 앉아 있는 원숭이"
      draggable={false}
    />
  );
}

export default Monkey;
