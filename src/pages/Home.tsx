import Header from '../components/Header';
import InteractiveMonogram from '../components/InteractiveMonogram';
import ProjectList from '../components/ProjectList';

function Home() {
  return (
    <main className="home" data-page-scroll>
      <Header />

      <section className="intro">
        <InteractiveMonogram />
        <p>
          웹 개발을 배우며, 누르면 반응하고 움직이는 작은 화면을 만듭니다.
          <br />
          React와 TypeScript로 재미있는 경험을 실험하고 있습니다.
        </p>
      </section>

      <ProjectList />

      <footer>© 2026 권재원</footer>
    </main>
  );
}

export default Home;
