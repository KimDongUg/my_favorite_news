import { query } from './database.js';
import { isBotUserAgent } from '../utils/botDetect.js';
import { ADMIN_EMAILS } from '../config/admin.js';

export async function createStatsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS page_views (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT,
      path TEXT NOT NULL,
      referrer TEXT,
      ip_address TEXT,
      user_agent TEXT,
      visited_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_pv_visited ON page_views(visited_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pv_session ON page_views(session_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pv_date ON page_views(DATE(visited_at))`);

  await migratePageViews();
}

/**
 * page_views에 visitor_id / is_bot / is_admin 추가 (여러 번 실행해도 안전)
 * 컬럼을 이번에 처음 추가한 경우에만 기존 데이터를 소급 표시한다.
 * (server/migrations/001_page_views_visitor_bot_admin.sql 과 같은 내용)
 */
export async function migratePageViews({ forceBackfill = false } = {}) {
  const existing = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'page_views' AND column_name IN ('is_bot', 'is_admin')`
  );
  const isFirstRun = existing.rows.length < 2;

  await query(`
    ALTER TABLE page_views
      ADD COLUMN IF NOT EXISTS visitor_id TEXT,
      ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_pv_visitor ON page_views(visitor_id)`);

  if (isFirstRun || forceBackfill) {
    await backfillPageViews();
  }
}

/**
 * 기존 데이터 소급: isbot()으로 봇 표시, 관리자 계정 접속 표시
 */
export async function backfillPageViews() {
  // 1) 봇: UA가 없거나 비어 있는 행
  const emptyUa = await query(
    `UPDATE page_views SET is_bot = true
     WHERE (user_agent IS NULL OR btrim(user_agent) = '') AND NOT is_bot`
  );

  // 2) 봇: 서로 다른 UA를 서버의 isbot()으로 판정
  const uaRows = await query(
    `SELECT DISTINCT user_agent FROM page_views
     WHERE user_agent IS NOT NULL AND btrim(user_agent) <> '' AND NOT is_bot`
  );
  const botUas = uaRows.rows.map(r => r.user_agent).filter(isBotUserAgent);
  let botUpdated = 0;
  for (let i = 0; i < botUas.length; i += 500) {
    const r = await query(
      `UPDATE page_views SET is_bot = true WHERE user_agent = ANY($1::text[]) AND NOT is_bot`,
      [botUas.slice(i, i + 500)]
    );
    botUpdated += r.rowCount || 0;
  }

  // 3) 관리자 계정의 접속
  const adminUpdated = await query(
    `UPDATE page_views pv SET is_admin = true
     FROM users u
     WHERE pv.user_id = u.id
       AND (u.role = 'admin' OR u.email = ANY($1::text[]))
       AND NOT pv.is_admin`,
    [ADMIN_EMAILS]
  );

  console.log(
    `[Stats] page_views 소급 완료: 봇 ${(emptyUa.rowCount || 0) + botUpdated}행 (UA ${botUas.length}종), 관리자 ${adminUpdated.rowCount || 0}행`
  );
}
