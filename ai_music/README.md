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
