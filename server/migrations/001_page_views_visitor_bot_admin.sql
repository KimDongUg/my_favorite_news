-- 무빙아티클 방문자 통계 개선 (R1)
-- 서버 시작 시 src/db/statsSchema.js 의 migratePageViews()가 같은 작업을 자동 실행한다.
-- 봇 소급은 isbot()을 쓰는 `npm run migrate:stats` 를 우선 사용하고,
-- Node 실행이 불가능할 때만 이 파일을 직접 실행한다. 여러 번 실행해도 안전하다.
--
-- page_views.visited_at 은 TIMESTAMP(시간대 없음, UTC 저장)이다.
-- 한국 날짜 변환: (visited_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date

ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS visitor_id TEXT,
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 이 테이블의 생성 시각 컬럼은 created_at 이 아니라 visited_at 이다 (idx_pv_visited 가 이미 있음)
CREATE INDEX IF NOT EXISTS idx_pv_visited ON page_views (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_visitor ON page_views (visitor_id);

-- 기존 데이터 소급: 봇 (정규식 대체 방식)
UPDATE page_views SET is_bot = true
WHERE NOT is_bot
  AND (user_agent IS NULL OR btrim(user_agent) = ''
       OR user_agent ~* '(bot|crawl|spider|slurp|headless|lighthouse|preview|python|curl|wget)');

-- 기존 데이터 소급: 관리자 계정 (관리자 판별: src/config/admin.js 의 ADMIN_EMAILS 또는 role = 'admin')
UPDATE page_views pv SET is_admin = true
FROM users u
WHERE pv.user_id = u.id
  AND (u.role = 'admin' OR u.email IN ('kduaro124@naver.com'))
  AND NOT pv.is_admin;
