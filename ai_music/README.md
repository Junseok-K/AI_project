# Suno Prompt Generator

Suno AI 음악 생성용 프롬프트를 빠르게 작성할 수 있는 Vite + React 웹페이지입니다.

## 실행 방법

Node.js 18 이상이 설치되어 있어야 합니다.

```bash
cd ai_music
npm install
npm run dev
```

터미널에 표시되는 로컬 주소(기본값: `http://localhost:5173`)를 브라우저에서 엽니다.

YouTube 영상 조회 API까지 로컬에서 함께 테스트하려면 Vercel 서버리스 함수를 같이
실행해야 합니다.

```bash
cd ai_music
npx vercel dev
```

## 프로덕션 빌드

```bash
npm run build
```

## 자동 번역

한국어가 포함된 입력은 결과 프롬프트에서 영어로 자동 번역됩니다. 번역을 위해
브라우저에서 Google Translate 엔드포인트로 입력 내용을 전송합니다.

## YouTube 업로드 정보

입력한 음악 설정을 기반으로 SEO 키워드를 반영한 한국어 중심의 YouTube 영상
제목, 영상 본문, 태그를 실시간으로 생성합니다. 각 항목을 따로 복사하거나
`Copy All` 버튼으로 한 번에 복사할 수 있습니다.

## YouTube 영상 조회

`IMAGE` 탭에서 검색어, 정렬 기준, 최대 조회 개수를 입력해 YouTube 영상을
조회할 수 있습니다. 프론트엔드는 `/api/youtube` 백엔드 API만 호출하고,
YouTube Data API v3 호출과 API Key 로딩은 서버리스 함수에서 처리합니다.

### API Key 설정

API Key는 소스코드에 하드코딩하지 않습니다. 로컬에서는 `.env.local` 파일을
만들어 다음 값을 등록합니다.

```bash
YOUTUBE_API_KEY=your_youtube_data_api_key_here
```

Vercel 배포 환경에서는 Project Settings > Environment Variables에서
`YOUTUBE_API_KEY`를 등록합니다. `.env*` 파일은 Git에 커밋되지 않도록
`.gitignore`에 등록되어 있으며, `.env.example`에는 예시 값만 남깁니다.
