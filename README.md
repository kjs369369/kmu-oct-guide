# 국민대 10월 앵콜 수강생 안내 (kmu.aiclab2020.com)

국민대&서울앵커사업 「AI 실무 완성 부트캠프」 10월 앵콜(2026-10-24·31) 수강생 사전 안내 페이지. 빌드 도구 없는 정적 사이트(HTML·CSS·JS) — GitHub Pages로 배포.

## 폴더 구조

| 경로 | 역할 | 수정할 때 |
|---|---|---|
| `index.html` | 본문 내용(강의장·일정·준비사항·동선·주차·FAQ)·OG 태그 | 문구·날짜·장소 변경 |
| `assets/css/style.css` | 디자인. 맨 위 `:root` 토큰(색)만 바꾸면 전체 색이 바뀜 | 색·간격 |
| `assets/js/main.js` | 밝게/어둡게 버튼, 헤더 메뉴 활성 표시, 동선 지도 버튼, 모두 펼치기 | 동작 |
| `assets/js/dot-hero.js` | 점으로 제목을 그리는 히어로(업로드된 DotField를 바닐라 JS로 이식) | 제목은 `index.html`의 `data-headline` |
| `assets/img/` | 지도 2장, OG 이미지(1200×630), 파비콘 | 이미지 교체 |
| `CNAME` | 커스텀 도메인 `kmu.aiclab2020.com` | 도메인 변경 시 |
| `.nojekyll` | GitHub Pages의 Jekyll 처리 끄기 | — |
| `robots.txt` · `sitemap.xml` | 검색엔진 수집 허용·사이트맵 | 페이지 추가 시 sitemap에 주소 추가 |
| `llms.txt` | AI 검색(GEO)용 요약 | 핵심 정보 변경 시 함께 수정 |

외부 의존성: Google Fonts(Inter, Noto Sans KR) 스타일시트 1개. npm 패키지 없음 → 의존성 충돌 없음.

## 자주 바꾸는 곳

- 히어로 제목: `index.html` → `<section class="dot-hero" data-headline="...">`
- 강조색(레드): `style.css` → `--red`, 히어로 빛 색은 `data-accent`
- 동선 화살표 좌표: `index.html`의 `<svg viewBox="0 0 1400 812">` 안 `d="M..."` 값 (지도 이미지 1400×812 기준)
- OG 이미지: `assets/img/og.png` 교체 후 카카오톡 공유 캐시는 https://developers.kakao.com/tool/debugger/sharing 에서 초기화

## 검색 키워드

- 검색 태그(GPT-6 Astra, 아스트라 등): `index.html`의 `<title>`, `meta description`, `meta keywords`, JSON-LD `keywords`, 히어로의 `<ul class="tags">`, FAQ 첫 항목

## 배포

`main` 브랜치에 푸시하면 GitHub Pages가 자동 배포. DNS: 클라우드플레어 `kmu` CNAME → `kjs369369.github.io` (DNS only).

보안 점검 결과: `SECURITY-CHECK.md`
