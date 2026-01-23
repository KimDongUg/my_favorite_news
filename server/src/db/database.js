/**
 * PostgreSQL 데이터베이스 관리
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;

/**
 * 데이터베이스 초기화
 */
export async function initDatabase() {
  if (pool) return pool;

  // DATABASE_URL 환경변수 사용 (Render에서 자동 제공)
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('[DB] DATABASE_URL이 설정되지 않았습니다. 메모리 모드로 실행합니다.');
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // 연결 테스트
  try {
    const client = await pool.connect();
    client.release();
    console.log('[DB] PostgreSQL 연결 성공');
  } catch (err) {
    console.error('[DB] PostgreSQL 연결 실패:', err.message);
    throw err;
  }

  // 테이블 생성
  await createTables();

  console.log('[DB] PostgreSQL 데이터베이스 초기화 완료');
  return pool;
}

/**
 * 데이터베이스 인스턴스 반환
 */
export function getDatabase() {
  return pool;
}

/**
 * 쿼리 실행 헬퍼
 */
export async function query(text, params) {
  if (!pool) {
    console.warn('[DB] 데이터베이스가 초기화되지 않았습니다.');
    return { rows: [] };
  }
  const result = await pool.query(text, params);
  return result;
}

/**
 * 테이블 생성
 */
async function createTables() {
  // 요약 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      ai_title TEXT NOT NULL,
      ai_summary TEXT NOT NULL,
      sources JSONB NOT NULL DEFAULT '[]',
      generated_at TIMESTAMP DEFAULT NOW(),
      validation_passed BOOLEAN DEFAULT TRUE,
      validation_details JSONB DEFAULT '{}',
      is_fallback BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  // 크롤링 아이템 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS crawled_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      original_title TEXT NOT NULL,
      original_url TEXT,
      source_name TEXT,
      published_date TIMESTAMP,
      snippet TEXT,
      raw_content TEXT,
      image_url TEXT,
      crawled_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 파이프라인 실행 로그 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS pipeline_logs (
      id SERIAL PRIMARY KEY,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      success BOOLEAN DEFAULT FALSE,
      duration_ms INTEGER,
      stats JSONB DEFAULT '{}',
      error TEXT
    )
  `);

  // 인덱스 생성
  await query(`CREATE INDEX IF NOT EXISTS idx_summaries_category ON summaries(category)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_summaries_generated ON summaries(generated_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_items_category ON crawled_items(category)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_items_crawled ON crawled_items(crawled_at DESC)`);
}

/**
 * 요약 저장
 */
export async function saveSummary(summary) {
  await query(`
    INSERT INTO summaries (id, category, ai_title, ai_summary, sources, generated_at, validation_passed, validation_details, is_fallback, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      category = EXCLUDED.category,
      ai_title = EXCLUDED.ai_title,
      ai_summary = EXCLUDED.ai_summary,
      sources = EXCLUDED.sources,
      generated_at = EXCLUDED.generated_at,
      validation_passed = EXCLUDED.validation_passed,
      validation_details = EXCLUDED.validation_details,
      is_fallback = EXCLUDED.is_fallback,
      is_active = EXCLUDED.is_active
  `, [
    summary.id,
    summary.category,
    summary.aiTitle,
    summary.aiSummary,
    JSON.stringify(summary.sources),
    summary.generatedAt,
    summary.validationPassed ?? true,
    JSON.stringify(summary.validationDetails || {}),
    summary.isFallback ?? false,
    true
  ]);
}

/**
 * 여러 요약 일괄 저장
 */
export async function saveSummaries(summaries) {
  for (const summary of summaries) {
    await saveSummary(summary);
  }
  console.log(`[DB] ${summaries.length}개 요약 저장 완료`);
}

/**
 * 모든 요약 조회
 */
export async function getAllSummariesFromDB() {
  const result = await query(`
    SELECT * FROM summaries
    WHERE is_active = TRUE
    ORDER BY generated_at DESC
  `);

  return result.rows.map(row => ({
    id: row.id,
    category: row.category,
    aiTitle: row.ai_title,
    aiSummary: row.ai_summary,
    sources: row.sources,
    generatedAt: row.generated_at,
    validationPassed: row.validation_passed,
    validationDetails: row.validation_details || {},
    isFallback: row.is_fallback
  }));
}

/**
 * 카테고리별 요약 조회
 */
export async function getSummaryByCategory(category) {
  const result = await query(`
    SELECT * FROM summaries
    WHERE category = $1 AND is_active = TRUE
    ORDER BY generated_at DESC
    LIMIT 1
  `, [category]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    category: row.category,
    aiTitle: row.ai_title,
    aiSummary: row.ai_summary,
    sources: row.sources,
    generatedAt: row.generated_at,
    validationPassed: row.validation_passed,
    validationDetails: row.validation_details || {},
    isFallback: row.is_fallback
  };
}

/**
 * 크롤링 아이템 저장
 */
export async function saveCrawledItems(items) {
  for (const item of items) {
    await query(`
      INSERT INTO crawled_items (id, category, original_title, original_url, source_name, published_date, snippet, raw_content, image_url, crawled_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        original_title = EXCLUDED.original_title,
        original_url = EXCLUDED.original_url,
        source_name = EXCLUDED.source_name,
        published_date = EXCLUDED.published_date,
        snippet = EXCLUDED.snippet,
        raw_content = EXCLUDED.raw_content,
        image_url = EXCLUDED.image_url,
        crawled_at = EXCLUDED.crawled_at
    `, [
      item.id,
      item.category,
      item.originalTitle,
      item.originalUrl,
      item.sourceName,
      item.publishedDate,
      item.snippet,
      item.rawContent,
      item.imageUrl,
      item.crawledAt
    ]);
  }
}

/**
 * 파이프라인 로그 저장
 */
export async function logPipelineRun(result) {
  await query(`
    INSERT INTO pipeline_logs (start_time, end_time, success, duration_ms, stats, error)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    result.startTime,
    result.endTime,
    result.success ?? false,
    result.totalDuration,
    JSON.stringify(result.stats || {}),
    result.error || null
  ]);
}

/**
 * 파이프라인 로그 조회
 */
export async function getPipelineLogs(limit = 20) {
  const result = await query(`
    SELECT * FROM pipeline_logs
    ORDER BY start_time DESC
    LIMIT $1
  `, [limit]);

  return result.rows.map(row => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    success: row.success,
    durationMs: row.duration_ms,
    stats: row.stats || {},
    error: row.error
  }));
}

/**
 * 데이터베이스 통계
 */
export async function getDBStats() {
  if (!pool) {
    return {
      summaries: 0,
      crawledItems: 0,
      pipelineLogs: 0,
      lastSummaryAt: null,
      lastCrawlAt: null,
      connected: false
    };
  }

  const summaryCount = await query('SELECT COUNT(*) as count FROM summaries WHERE is_active = TRUE');
  const itemCount = await query('SELECT COUNT(*) as count FROM crawled_items');
  const logCount = await query('SELECT COUNT(*) as count FROM pipeline_logs');
  const lastSummary = await query('SELECT generated_at FROM summaries ORDER BY generated_at DESC LIMIT 1');
  const lastCrawl = await query('SELECT crawled_at FROM crawled_items ORDER BY crawled_at DESC LIMIT 1');

  return {
    summaries: parseInt(summaryCount.rows[0]?.count || 0),
    crawledItems: parseInt(itemCount.rows[0]?.count || 0),
    pipelineLogs: parseInt(logCount.rows[0]?.count || 0),
    lastSummaryAt: lastSummary.rows[0]?.generated_at || null,
    lastCrawlAt: lastCrawl.rows[0]?.crawled_at || null,
    connected: true
  };
}

/**
 * 오래된 데이터 정리
 */
export async function cleanupOldData(daysToKeep = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deletedItems = await query('DELETE FROM crawled_items WHERE crawled_at < $1', [cutoffDate]);
  const deletedLogs = await query('DELETE FROM pipeline_logs WHERE start_time < $1', [cutoffDate]);

  console.log(`[DB] 정리 완료: 크롤링 ${deletedItems.rowCount}개, 로그 ${deletedLogs.rowCount}개 삭제`);

  return {
    deletedItems: deletedItems.rowCount,
    deletedLogs: deletedLogs.rowCount
  };
}

/**
 * 데이터베이스 연결 종료
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] 데이터베이스 연결 종료');
  }
}

export default {
  initDatabase,
  getDatabase,
  query,
  saveSummary,
  saveSummaries,
  getAllSummariesFromDB,
  getSummaryByCategory,
  saveCrawledItems,
  logPipelineRun,
  getPipelineLogs,
  getDBStats,
  cleanupOldData,
  closeDatabase
};
