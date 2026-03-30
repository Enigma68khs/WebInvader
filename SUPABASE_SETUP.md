# Supabase Setup

1. Supabase 프로젝트를 생성합니다.
2. Supabase SQL Editor에서 [supabase-schema.sql](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase-schema.sql) 내용을 실행합니다.
3. Supabase Dashboard에서 `Project URL`과 `anon public key`를 확인합니다.
4. [supabase-config.js](/Users/enigma68/MyPrograming/CodeStudy/WebInvader/supabase-config.js)에 값을 입력합니다.

```js
window.WEB_INVADER_SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

5. 게임을 배포하거나 브라우저에서 다시 열면 전역 Top 5가 표시됩니다.

설정이 비어 있거나 Supabase 연결에 실패하면 게임은 기존처럼 로컬 캐시 랭킹으로 동작합니다.

## 운영 권장사항

- 현재 구조는 브라우저에서 Supabase에 직접 기록을 넣는 방식입니다. 편의성은 높지만, 운영 환경에서는 점수 위조를 완전히 막을 수 없습니다.
- 실제 서비스로 운영할 경우 `anon` 직접 `insert` 대신 Edge Function 또는 별도 서버 API에서 점수 유효성 검증, rate limiting, abuse 차단을 수행한 뒤 저장하는 방식으로 바꾸는 것이 좋습니다.
- `score <= 2500` 제약은 현재 5 스테이지 기준 최대 점수에 맞춘 최소 가드레일입니다. 스테이지 수나 점수 규칙이 바뀌면 함께 조정해야 합니다.
