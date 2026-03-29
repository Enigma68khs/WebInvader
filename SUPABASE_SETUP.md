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
