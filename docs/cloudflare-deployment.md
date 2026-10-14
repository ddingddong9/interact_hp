# Cloudflare Pages 배포

- 도메인: `ddingddong9.store`
- 도메인 등록 업체: 카페24
- 저장소: `https://github.com/ddingddong9/interact_hp`
- 배포 브랜치: `main`
- 빌드 명령: `npm run build`
- 빌드 출력 디렉터리: `dist`
- 루트 디렉터리: 저장소 루트
- Node.js: `.node-version`에 지정한 24

현재 로컬 빌드는 통과했습니다. Cloudflare 프로젝트 생성, 최신 코드의 GitHub 반영, 사용자 지정 도메인 등록 및 DNS 연결은 아직 완료되지 않았습니다.

Cloudflare에 로그인한 뒤 Pages의 GitHub 연동으로 이 저장소를 선택합니다. 실제 프로젝트 URL을 확인한 뒤 사용자 지정 도메인에 `ddingddong9.store`를 추가합니다. Cloudflare에 도메인을 등록하면서 기존 DNS 레코드를 확인하고, 발급된 네임서버를 카페24 도메인 설정에 입력합니다. 기존 메일 등 다른 서비스가 있다면 그 DNS 레코드를 보존합니다.

Cloudflare가 활성화되고 HTTPS 인증서가 준비되면 홈과 Java 직접 링크(`#java-field-hiding` 등)를 확인합니다. 완료 전에는 연결되었다고 표시하지 않습니다.

공식 문서:
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/build-image/
