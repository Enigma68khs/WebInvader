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

5. 게임을 배포하거나 브라우저에서 다시 열면 전역 Top 5가 표시됩니다.

설정이 비어 있거나 Supabase 연결에 실패하면 게임은 기존처럼 로컬 캐시 랭킹으로 동작합니다.

## 운영 권장사항

- `sb_publishable` 또는 `anon` 키는 프런트엔드에서 사용하도록 설계된 키라서, 브라우저에 전달되는 순간 사용자에게 보입니다. 저장소에서만 숨겨도 런타임에서는 숨길 수 없습니다.
- 절대로 `service_role` 또는 `sb_secret` 키를 브라우저 코드, 공개 저장소, 정적 파일에 넣으면 안 됩니다. 이 키들은 RLS를 우회할 수 있습니다.
- 현재 구조는 브라우저에서 Supabase에 직접 기록을 넣는 방식입니다. 편의성은 높지만, 운영 환경에서는 점수 위조와 스팸 등록을 완전히 막을 수 없습니다.
- 실제 서비스로 운영할 경우 `anon` 직접 `insert` 대신 Edge Function 또는 별도 서버 API에서 점수 유효성 검증, rate limiting, abuse 차단을 수행한 뒤 저장하는 방식으로 바꾸는 것이 좋습니다.
- `score <= 2500` 제약은 현재 5 스테이지 기준 최대 점수에 맞춘 최소 가드레일입니다. 스테이지 수나 점수 규칙이 바뀌면 함께 조정해야 합니다.

## 공개 저장소에 올린 뒤 점검할 것

- 이미 커밋된 값이 `sb_publishable` 또는 `anon` 키라면, 그것만으로 즉시 치명적인 비밀 유출은 아닐 가능성이 큽니다. 대신 RLS 정책과 공개 쓰기 권한을 먼저 점검해야 합니다.
- 이미 커밋된 값이 `service_role` 또는 `sb_secret` 키였다면 즉시 키를 폐기 또는 교체하고, 해당 키가 노출된 모든 커밋과 배포 산출물도 함께 정리해야 합니다.
- 현재처럼 `anon`에 `insert`가 열려 있으면 누구나 직접 API를 호출해 점수를 넣을 수 있습니다. 민감한 데이터나 비용이 드는 작업에는 같은 패턴을 재사용하면 안 됩니다.
