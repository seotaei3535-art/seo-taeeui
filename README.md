# 모아 — 생활의 바로가기

대학생활 · 취업 · 복지와 장학금 · 영어와 언어교환 · 워킹홀리데이 · 세계시간을 모은 홈페이지입니다.

## 실행
index.html을 브라우저에서 열면 됩니다. 설치나 빌드가 필요 없습니다.

## GitHub 업로드 및 공개
1. ZIP을 압축 해제합니다.
2. GitHub 저장소에서 Add file → Upload files를 선택합니다.
3. 압축 해제한 index.html, style.css, app.js, README.md, .nojekyll 파일을 저장소 최상위에 업로드합니다.
4. Settings → Pages → Build and deployment에서 Deploy from a branch를 선택합니다.
5. main 브랜치와 /(root)를 선택하고 Save를 누릅니다.
6. 배포가 끝나면 Pages에 표시되는 주소로 접속합니다.

ZIP 자체가 아니라 압축 해제한 파일을 업로드하세요.

## 수정
- index.html: 페이지 구조와 주요 바로가기
- style.css: 색상과 모바일 화면
- app.js: 분야별 링크, 워홀 정보와 세계시간

세계시간은 브라우저의 IANA 시간대 정보를 사용하며 서머타임을 반영합니다.
사이트 링크 확인일: 2026-10-08. 자격·신청 일정은 각 기관의 최신 공고에서 확인하세요.

디자인 참고: https://www.gov.uk/ · https://toss.im/\n세계시간 카드에 국기와 원화 기준 환율을 표시합니다. 환율은 ExchangeRate-API에서 페이지 접속 시 가져오며 24시간 동안 기기에서 재사용합니다. 기준 시점이 표시되고 실패하면 오류 안내를 표시합니다. 국기는 Flagpedia CDN을 사용합니다. 환율과 국기에는 인터넷 연결이 필요합니다. 듀오링고는 영어학습 항목에 포함됩니다.
