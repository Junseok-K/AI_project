# Finflow Landing Template

토스 홈 화면의 큰 여백, 앱 목업, 기능별 섹션 흐름을 참고해 만든 금융 서비스 랜딩페이지 템플릿입니다.

## 파일

- `index.html`: 페이지 구조
- `styles.css`: 반응형 레이아웃과 시각 스타일
- `script.js`: 스크롤 시 헤더 상태 변경

## 사용

`landing_pages` 폴더에서 서버를 실행한 뒤 브라우저에서 확인합니다.

```bash
npm.cmd run dev
```

기본 주소:

- 템플릿 목록: `http://localhost:3002/`
- Toss 스타일 템플릿: `http://localhost:3002/toss-inspired-finance/`

다른 포트를 쓰려면 `PORT` 환경변수를 지정합니다.

```bash
$env:PORT=3003; npm.cmd run dev
```

브랜드명, CTA, 서비스 문구, 앱 화면 숫자는 실제 서비스에 맞게 교체해서 사용하세요.
