# 배포 전 보안 점검 (KESE-KIT 기준)

- 점검일: 2026-10-23
- 기준: KESE-KIT `kesekit-check-ko` — 시큐어코딩(JavaScript) 체크리스트 + CII 웹 서비스 하드닝 항목 중 정적 사이트 해당분
- 대상: 정적 사이트(HTML·CSS·JS), 서버 코드·DB·로그인·입력 폼 없음

## 결과 요약

전체 16항목 / 통과 13 / 해당 없음 0 / 위험 수용 3 → **배포 승인(조건부)**

| # | 항목 (KESE-KIT 코드) | 심각도 | 결과 | 근거 |
|---|---|---|---|---|
| 1 | XSS (CWE-79) | 긴급 | 통과 | innerHTML·document.write·eval 미사용, 사용자 입력 없음 |
| 2 | 코드 주입 (CWE-94/95) | 긴급 | 통과 | eval·new Function·문자열 setTimeout 없음 |
| 3 | 하드코딩 자격증명 (CWE-259/321) | 긴급 | 통과 | 키·토큰·비밀번호 문자열 없음 |
| 4 | 평문 전송 (CWE-319) | 높음 | 통과 | 모든 외부 링크 https, 페이지 전송은 Enforce HTTPS로 강제(16번) |
| 5 | Open Redirect (CWE-601) | 높음 | 통과 | 리다이렉트 로직 없음 |
| 6 | CSRF (CWE-352) | 높음 | 통과 | 폼·상태 변경 요청 없음, CSP `form-action 'none'` |
| 7 | 보안 헤더 — CSP | 높음 | 통과 | meta CSP: `script-src 'self'`, 실행 스크립트는 외부 파일만. 인라인은 실행되지 않는 데이터 블록(JSON-LD) 1개뿐, 핸들러·style 속성 0개 |
| 8 | 외부 링크 탭내빙(reverse tabnabbing) | 중간 | 통과 | `target="_blank"` 8개 모두 `rel="noopener noreferrer"` |
| 9 | 디버그 코드 (CWE-489) | 중간 | 통과 | console.log·debugger 없음 |
| 10 | 주석 내 민감정보 (CWE-615) | 중간 | 통과 | 주석은 구조 설명만 |
| 11 | 지속 쿠키 민감정보 (CWE-539) | 중간 | 통과 | 쿠키 없음. localStorage는 테마 값(light/dark)만, try/catch 처리 |
| 12 | 개인정보 노출 | 높음 | 통과 | 수강생 명단·연락처·출석코드 없음. 공개 연락처(강사 문의번호, 주차장 공개 문의처)만 게시 |
| 13 | 저장소 내 비공개 파일 | 높음 | 통과 | 배포 파일 10개만 커밋, 원본 PPT·명단 미포함 |
| 14 | 무결성 미검증 다운로드 (CWE-494) | 중간 | 위험 수용 | Google Fonts CSS는 동적 생성이라 SRI 불가. CSP로 출처를 fonts.googleapis.com·fonts.gstatic.com으로 제한 |
| 15 | 클릭재킹 헤더(X-Frame-Options/frame-ancestors) | 낮음 | 위험 수용 | GitHub Pages는 응답 헤더 설정 불가, meta로는 지정 불가. 로그인·결제 등 클릭 유도 대상 기능 없음 |
| 16 | HTTPS 강제(HSTS) | 높음 | 조건부 | 커스텀 도메인 인증서 발급 후 Pages 설정에서 Enforce HTTPS 켜기 |

## 해당 없음 메모

- 미들웨어/라우트 RBAC(역할 기반 접근 제어): 로그인·관리자 기능이 없는 공개 안내 페이지라 적용 대상 없음
- SQLi·SSRF·파일 업로드·인증·세션 항목: 서버 코드 없음

## 2026-10-23 추가 점검 (검색 노출용 태그 추가)

- 추가 파일: `robots.txt`(전체 허용), `sitemap.xml`, `llms.txt` — 공개 정보만 포함, 개인정보·비공개 경로 없음
- JSON-LD(Course 스키마): 실행 코드가 아닌 데이터 블록, 공개 일정·장소·강사 정보만 포함
- 결과: 기존 판정(조건부 승인) 유지
