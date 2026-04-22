# Supabase Setup

1. Supabase 프로젝트를 생성합니다.
2. Supabase SQL Editor에서 [supabase-schema.sql](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase-schema.sql) 내용을 실행합니다.
3. Supabase Dashboard에서 `Project URL`과 `anon public key`를 확인합니다.
4. [supabase-config.local.example.js](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase-config.local.example.js)를 복사해 `supabase-config.local.js`를 만든 뒤 값을 입력합니다.

```js
window.WEB_INVADER_SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'sb_publishable_YOUR_PROJECT_PUBLISHABLE_KEY'
};
```

5. 게임을 배포하거나 브라우저에서 다시 열면 전역 Top 5와 방문자 수가 표시됩니다.

설정이 비어 있거나 Supabase 연결에 실패하면 게임은 기존처럼 로컬 캐시 랭킹으로 동작하고, 방문자 수는 마지막으로 캐시된 값 또는 `--`로 표시됩니다.

## 방문자 수 집계 방식

- 상단 점수 박스 오른쪽에 `오늘`과 `전체` 방문자 수가 표시됩니다.
- 브라우저별로 UUID를 하나 저장하고, 같은 브라우저가 같은 UTC 날짜에 다시 열려도 중복 집계되지 않도록 `site_visits` 테이블의 `(visit_date, visitor_id)` 기본키로 막습니다.
- 따라서 현재 숫자는 "하루에 한 번만 카운트되는 브라우저 기준 방문자 수"에 가깝습니다.

## Edge Function 배포

- 브라우저는 더 이상 테이블에 직접 `insert`하지 않고 `submit-score` Edge Function을 호출합니다.
- 함수 코드는 [supabase/functions/submit-score/index.ts](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase/functions/submit-score/index.ts)에 있습니다.
- Supabase Dashboard의 Edge Functions 편집기에서 같은 이름의 `submit-score` 함수를 만들고 파일 내용을 붙여넣어 배포하거나, Supabase CLI를 사용한다면 이 저장소 루트에서 배포합니다.
- 배포 전 [supabase/functions/.env.example](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase/functions/.env.example)를 참고해 `ALLOWED_ORIGINS`를 실제 배포 도메인으로 설정해야 합니다. 이 값에 없는 Origin에서는 점수 저장이 거부됩니다.

```bash
supabase functions deploy submit-score
```

- Supabase 공식 문서 기준으로 Edge Function은 기본적으로 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`를 환경변수로 제공받으므로, 이 함수는 추가 비밀키 파일 없이 동작하도록 작성했습니다.

## 운영 권장사항

- `sb_publishable` 또는 `anon` 키는 프런트엔드에서 사용하도록 설계된 키라서, 브라우저에 전달되는 순간 사용자에게 보입니다. 저장소에서만 숨겨도 런타임에서는 숨길 수 없습니다.
- 절대로 `service_role` 또는 `sb_secret` 키를 브라우저 코드, 공개 저장소, 정적 파일에 넣으면 안 됩니다. 이 키들은 RLS를 우회할 수 있습니다.
- 현재 구조는 브라우저가 Edge Function을 호출하고, 함수가 서버 측 `service_role` 키로 점수를 저장하는 방식입니다.
- 방문자 집계는 정적 사이트에서도 바로 동작하도록 `site_visits` 테이블에 브라우저가 직접 `insert`합니다. 중복은 기본키가 막지만, 악의적인 임의 요청까지 완전히 방지하지는 않습니다.
- 현재 함수는 허용된 Origin만 통과시키고, 과도한 요청을 줄이기 위해 인스턴스 단위의 간단한 rate limiting을 적용합니다.
- 이 변경으로 DB 직접 쓰기는 닫았지만, 게임 점수 자체는 여전히 클라이언트에서 만들어지므로 점수 위조를 완전히 막을 수는 없습니다.
- 실제 서비스로 운영할 경우 현재의 인메모리 제한 외에 Turnstile/CAPTCHA, 영속형 rate limiting, 더 강한 점수 검증 로직을 추가하는 것이 좋습니다.
- `score <= 6000` 제약은 현재 7 스테이지 누적 점수 기준으로 약간 여유를 둔 가드레일입니다. 스테이지 수나 점수 규칙이 바뀌면 함께 조정해야 합니다.

## GitHub Pages 배포

- 이 저장소에는 [deploy-pages.yml](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/.github/workflows/deploy-pages.yml:1) 워크플로가 포함되어 있어, `main` 브랜치에 push 하면 GitHub Pages로 정적 파일을 배포합니다.
- 워크플로는 배포 시점에만 `supabase-config.js`를 생성하므로, 저장소에는 실제 Supabase 브라우저 키를 커밋하지 않아도 됩니다.
- GitHub 저장소의 `Settings > Secrets and variables > Actions`에서 아래 시크릿을 추가합니다.

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PROJECT_PUBLISHABLE_KEY
```

- 이 시크릿이 비어 있으면 배포본은 전역 랭킹 없이 로컬 랭킹 모드로 동작합니다.
- GitHub Pages를 쓴다면 `ALLOWED_ORIGINS`에는 보통 `https://<github-username>.github.io`를 넣습니다. 프로젝트 페이지라면 Origin은 여전히 같은 값이고, 경로(`/WebInvader`)는 넣지 않습니다.

## Vercel 배포

- Vercel은 기본 정적 배포에서는 루트 파일을 그대로 서비스하므로, 빈 [supabase-config.js](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase-config.js:1)를 그대로 배포하면 전역 랭킹이 로컬 모드로 떨어집니다.
- 이 저장소에는 이를 막기 위해 [vercel.json](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/vercel.json:1), [package.json](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/package.json:1), [scripts/build-site.mjs](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/scripts/build-site.mjs:1)가 포함되어 있습니다.
- Vercel 프로젝트의 `Settings > Environment Variables`에 아래 값을 추가합니다.

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PROJECT_PUBLISHABLE_KEY
```

- 새 배포부터는 `npm run build`가 `dist/supabase-config.js`를 생성하므로, 배포본에 실제 브라우저용 키가 들어갑니다.
- `ALLOWED_ORIGINS`에는 실제 접속하는 Vercel Origin을 모두 넣어야 합니다. 끝의 `/`는 넣지 않습니다.

```text
https://web-invader.vercel.app,https://web-invader-cqtofi8fn-kimhsqq-7012s-projects.vercel.app
```

## 공개 저장소에 올린 뒤 점검할 것

- 이미 커밋된 값이 `sb_publishable` 또는 `anon` 키라면, 그것만으로 즉시 치명적인 비밀 유출은 아닐 가능성이 큽니다. 대신 RLS 정책과 공개 쓰기 권한을 먼저 점검해야 합니다.
- 이미 커밋된 값이 `service_role` 또는 `sb_secret` 키였다면 즉시 키를 폐기 또는 교체하고, 해당 키가 노출된 모든 커밋과 배포 산출물도 함께 정리해야 합니다.
- 예전 SQL을 이미 적용한 상태라면, 업데이트된 [supabase-schema.sql](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase-schema.sql)을 다시 실행해 최신 정책과 `site_visits` 테이블을 함께 반영해야 합니다.
