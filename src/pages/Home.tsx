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

      <footer>
        <p>© 2026 권재원</p>
        <p className="image-credit"><a href="https://science.nasa.gov/asset/hubble/the-carina-nebula-star-birth-in-the-extreme/" target="_blank" rel="noreferrer">Nebula Drift — Image credit</a><br />
          Hubble Image: NASA, ESA, N. Smith (University of California, Berkeley), and The Hubble Heritage Team (STScI/AURA); CTIO Image: N. Smith (University of California, Berkeley) and NOAO/AURA/NSF
        </p>
        <p className="image-credit"><a href="https://www.mauritshuis.nl/en/our-collection/artworks/670-girl-with-a-pearl-earring" target="_blank" rel="noreferrer">Blinds — Johannes Vermeer, Girl with a Pearl Earring</a><br />Mauritshuis, The Hague.</p>
      </footer>
    </main>
  );
}

export default Home;
