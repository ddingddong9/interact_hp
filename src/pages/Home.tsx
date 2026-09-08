function Home() {
  return (
    <main className="home">
      <header className="home-header">
        <a href="/" className="name">
          권재원 <span>Kwon Jaewon</span>
        </a>
        <p className="role">AIaaS learner · interactive web</p>
      </header>

      <section className="intro">
        <div className="monogram" aria-hidden="true">
          <span>KJW</span>
        </div>
        <p>
          웹 개발을 배우며, 누르면 반응하고 움직이는 작은 화면을 만듭니다.
          <br />
          React와 TypeScript로 재미있는 경험을 실험하고 있습니다.
        </p>
      </section>

      <section className="project-section">
        <p className="section-label">프로젝트</p>
        <ul className="project-list">
          <li>
            <span className="project-marker" aria-hidden="true">• </span>
            <a href="#assignment-breaker">과제 부수기</a>
            <span> 과제를 무너뜨리는 인터랙티브 웹</span>
          </li>
          <li>
            <span className="project-marker" aria-hidden="true">• </span>
            <a href="#assignment-submit">과제 제출</a>
            <span> 과제를 제출하는 인터랙션</span>
          </li>
        </ul>
      </section>

      <footer>© 2026 권재원</footer>
    </main>
  );
}

export default Home;
