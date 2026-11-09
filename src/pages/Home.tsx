import Header from '../components/Header';
import InteractiveMonogram from '../components/InteractiveMonogram';
import ProjectList from '../components/ProjectList';
import FractalTree from '../prototypes/fractal/FractalTree';
import FractalMonogram from '../prototypes/fractal/FractalMonogram';
import FractalShelf from '../prototypes/fractal/FractalShelf';
import FractalLayout from '../prototypes/fractal/FractalLayout';
import '../prototypes/fractal/fractal.css';

// 프로토타입 전환: ?fractal=1(트리) 2(모노그램) 3(카드 안의 카드) 4(황금 분할)
const fractal = new URLSearchParams(window.location.search).get('fractal');

const introText = (
  <p>
    자료구조와 시스템의 동작, Java·C·Python의 실행 과정을 시각화합니다.
    <br />
    코드를 한 줄씩 따라가며 변수와 메모리의 변화를 확인할 수 있습니다.
  </p>
);

export default function Home() {
  if (fractal === '4') {
    return (
      <main className="home fractal-proto" data-page-scroll>
        <Header />
        <FractalLayout intro={introText} />
        <footer><p>© 2026 권재원</p></footer>
      </main>
    );
  }
  return (
    <main className={`home${fractal ? ' fractal-proto' : ''}`} data-page-scroll>
      {fractal === '1' && <FractalTree />}
      <Header />
      <section className="intro">
        {fractal === '2' ? <FractalMonogram /> : <InteractiveMonogram />}
        {introText}
      </section>
      {fractal === '3' ? <FractalShelf /> : <ProjectList chapterCards />}
      <footer><p>© 2026 권재원</p></footer>
    </main>
  );
}
