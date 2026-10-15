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
          자료구조와 시스템의 동작, Java·C·Python의 실행 과정을 시각화합니다.
          <br />
          코드를 한 줄씩 따라가며 변수와 메모리의 변화를 확인할 수 있습니다.
        </p>
      </section>
      <ProjectList chapterCards />
      <footer><p>© 2026 권재원</p></footer>
    </main>
  );
}
