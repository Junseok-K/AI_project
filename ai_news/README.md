# AI News Kakao Briefing Batch

Spring Boot 3, Java 21 기반 카카오톡 나에게 보내기 뉴스 요약 배치 MVP입니다.

## 기능

- Asia/Seoul 기준 매일 08:00, 12:30, 21:00 실행
- 네이버 뉴스 검색 API로 카테고리별 기사 수집
- URL 해시 또는 정규화 제목 해시 기반 중복 제거
- Jsoup 본문 추출, 실패 시 네이버 description 사용
- OpenAI API로 카카오톡용 짧은 브리핑 생성
- Kakao Talk Message API 나에게 보내기 발송
- access token 만료 시 refresh token 자동 갱신
- `MessageSender` 인터페이스 기반 발송 구조
- 발송 성공/실패와 재시도 가능 상태를 `DeliveryLog`에 저장

## 설정

환경변수로 민감정보를 주입합니다.

```bash
export NAVER_CLIENT_ID=...
export NAVER_CLIENT_SECRET=...
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4o-mini
export KAKAO_CLIENT_ID=...
export KAKAO_REDIRECT_URI=http://localhost:8080/oauth/kakao/callback
```

뉴스 키워드는 [application.yml](src/main/resources/application.yml) 의 `news.categories`에서 관리합니다.

## 카카오 개발자 앱 설정

1. Kakao Developers에서 애플리케이션을 생성합니다.
2. 제품 설정에서 카카오 로그인과 메시지 API를 활성화합니다.
3. Redirect URI를 `KAKAO_REDIRECT_URI` 값과 동일하게 등록합니다.
4. 동의항목에서 카카오톡 메시지 전송 권한을 설정합니다.
5. OAuth authorize URL로 최초 동의를 받고 authorization code를 발급받습니다.
6. 토큰 API로 access token, refresh token을 발급받아 `kakao_tokens` 테이블에 `owner_key = 'me'`로 저장합니다.

최초 토큰 발급 예시:

```bash
curl -X POST https://kauth.kakao.com/oauth/token \
  -d grant_type=authorization_code \
  -d client_id=$KAKAO_CLIENT_ID \
  -d redirect_uri=$KAKAO_REDIRECT_URI \
  -d code=AUTHORIZATION_CODE
```

토큰 저장 예시:

```sql
insert into kakao_tokens(owner_key, access_token, refresh_token, access_token_expires_at)
values ('me', 'ACCESS_TOKEN', 'REFRESH_TOKEN', now() + interval '5 hours');
```

## 네이버 API 키 설정

Naver Developers에서 애플리케이션을 만들고 Search API 사용 권한을 활성화한 뒤 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 설정합니다.

## OpenAI API 키 설정

OpenAI API key를 발급받아 `OPENAI_API_KEY`로 설정합니다. 모델은 `OPENAI_MODEL` 또는 `application.yml`의 `openai.model`로 바꿀 수 있습니다.

## 로컬 실행

PostgreSQL만 Docker로 띄우고 앱은 로컬에서 실행:

```bash
docker compose up -d postgres redis
gradle bootRun
```

전체 Docker Compose 실행:

```bash
docker compose up --build
```

테스트:

```bash
gradle test
```

## 스케줄

- `0 0 8 * * *`: 모닝 브리핑, 지난 12시간 주요 뉴스
- `0 30 12 * * *`: 점심 브리핑, 08:00 이후 오전 주요 뉴스
- `0 0 21 * * *`: 데일리 마감, 당일 전체 마감 요약

모든 스케줄은 `Asia/Seoul` 기준입니다.

## 확장 포인트

현재는 `KakaoMemoSender`가 `MessageSender`를 구현합니다. 추후 수신동의 유저 대상 발송은 `Subscriber`를 조회하고 `KakaoBizMessageSender` 같은 구현체를 추가하면 됩니다. 코드에는 `TODO 수신동의 유저 대상 발송 확장 포인트`를 표시해 두었습니다.
