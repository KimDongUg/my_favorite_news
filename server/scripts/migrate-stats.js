/**
 * page_views 마이그레이션 + 기존 데이터 소급 (isbot 판정)
 * 사용: npm run migrate:stats   (DATABASE_URL 필요, 여러 번 실행해도 안전)
 */
import 'dotenv/config';
import { initDatabase, getDatabase } from '../src/db/database.js';
import { createStatsTable, migratePageViews } from '../src/db/statsSchema.js';

try {
  await initDatabase();
  if (!getDatabase()) throw new Error('DATABASE_URL이 설정되지 않았습니다.');
  await createStatsTable();
  await migratePageViews({ forceBackfill: true });
  await getDatabase().end();
  console.log('[migrate:stats] 완료');
} catch (err) {
  console.error('[migrate:stats] 실패:', err.message);
  process.exit(1);
}
