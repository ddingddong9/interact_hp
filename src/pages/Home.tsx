import Header from '../components/Header';
import InteractiveMonogram from '../components/InteractiveMonogram';
import ProjectList from '../components/ProjectList';

export default function Home() {
  return (
    <main className="home" data-page-scroll>
      <Header />
      <section className="intro">
        <InteractiveMonogram />
        <p>
          자료구조와 시스템의 동작을 직접 눈으로 확인하며 배웁니다.
          <br />
          React와 TypeScript로 개념을 조작해 볼 수 있는 시뮬레이터를 만듭니다.
        </p>
      </section>
      <ProjectList />
      <footer><p>© 2026 권재원</p></footer>
    </main>
  );
}
