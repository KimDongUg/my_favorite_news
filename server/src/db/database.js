/**
 * SQLite 데이터베이스 관리
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터베이스 파일 경로
const DB_PATH = path.join(__dirname, '../../data/mynews.db');

let db = null;

/**
 * 데이터베이스 초기화
 */
export function initDatabase() {
  if (db) return db;

  db = new Database(DB_PATH);

  // WAL 모드 활성화 (성능 향상)
  db.pragma('journal_mode = WAL');

  // 테이블 생성
  createTables();

  console.log('[DB] SQLite 데이터베이스 초기화 완료');
  return db;
}

/**
 * 데이터베이스 인스턴스 반환
 */
export function getDatabase() {
  if (!db) {
    throw new Error('데이터베이스가 초기화되지 않았습니다. initDatabase()를 먼저 호출하세요.');
  }
  return db;
}

/**
 * 테이블 생성
 */
function createTables() {
  // 요약 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      ai_title TEXT NOT NULL,
      ai_summary TEXT NOT NULL,
      sources TEXT NOT NULL,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      validation_passed INTEGER DEFAULT 1,
      validation_details TEXT,
      is_fallback INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `);

  // 크롤링 아이템 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawled_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      original_title TEXT NOT NULL,
      original_url TEXT,
      source_name TEXT,
      published_date TEXT,
      snippet TEXT,
      raw_content TEXT,
      image_url TEXT,
      crawled_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 파이프라인 실행 로그 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      success INTEGER DEFAULT 0,
      duration_ms INTEGER,
      stats TEXT,
      error TEXT
    )
  `);

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_summaries_category ON summaries(category);
    CREATE INDEX IF NOT EXISTS idx_summaries_generated ON summaries(generated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_items_category ON crawled_items(category);
    CREATE INDEX IF NOT EXISTS idx_items_crawled ON crawled_items(crawled_at DESC);
  `);
}

/**
 * 요약 저장
 */
export function saveSummary(summary) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO summaries
    (id, category, ai_title, ai_summary, sources, generated_at, validation_passed, validation_details, is_fallback, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    summary.id,
    summary.category,
    summary.aiTitle,
    summary.aiSummary,
    JSON.stringify(summary.sources),
    summary.generatedAt,
    summary.validationPassed ? 1 : 0,
    JSON.stringify(summary.validationDetails || {}),
    summary.isFallback ? 1 : 0,
    1
  );
}

/**
 * 여러 요약 일괄 저장
 */
export function saveSummaries(summaries) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO summaries
    (id, category, ai_title, ai_summary, sources, generated_at, validation_passed, validation_details, is_fallback, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const summary of items) {
      insert.run(
        summary.id,
        summary.category,
        summary.aiTitle,
        summary.aiSummary,
        JSON.stringify(summary.sources),
        summary.generatedAt,
        summary.validationPassed ? 1 : 0,
        JSON.stringify(summary.validationDetails || {}),
        summary.isFallback ? 1 : 0,
        1
      );
    }
  });

  insertMany(summaries);
  console.log(`[DB] ${summaries.length}개 요약 저장 완료`);
}

/**
 * 모든 요약 조회
 */
export function getAllSummariesFromDB() {
  const stmt = db.prepare(`
    SELECT * FROM summaries
    WHERE is_active = 1
    ORDER BY generated_at DESC
  `);

  return stmt.all().map(row => ({
    id: row.id,
    category: row.category,
    aiTitle: row.ai_title,
    aiSummary: row.ai_summary,
    sources: JSON.parse(row.sources),
    generatedAt: row.generated_at,
    validationPassed: row.validation_passed === 1,
    validationDetails: JSON.parse(row.validation_details || '{}'),
    isFallback: row.is_fallback === 1
  }));
}

/**
 * 카테고리별 요약 조회
 */
export function getSummaryByCategory(category) {
  const stmt = db.prepare(`
    SELECT * FROM summaries
    WHERE category = ? AND is_active = 1
    ORDER BY generated_at DESC
    LIMIT 1
  `);

  const row = stmt.get(category);
  if (!row) return null;

  return {
    id: row.id,
    category: row.category,
    aiTitle: row.ai_title,
    aiSummary: row.ai_summary,
    sources: JSON.parse(row.sources),
    generatedAt: row.generated_at,
    validationPassed: row.validation_passed === 1,
    validationDetails: JSON.parse(row.validation_details || '{}'),
    isFallback: row.is_fallback === 1
  };
}

/**
 * 크롤링 아이템 저장
 */
export function saveCrawledItems(items) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO crawled_items
    (id, category, original_title, original_url, source_name, published_date, snippet, raw_content, image_url, crawled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((data) => {
    for (const item of data) {
      insert.run(
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
      );
    }
  });

  insertMany(items);
}

/**
 * 파이프라인 로그 저장
 */
export function logPipelineRun(result) {
  const stmt = db.prepare(`
    INSERT INTO pipeline_logs (start_time, end_time, success, duration_ms, stats, error)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    result.startTime,
    result.endTime,
    result.success ? 1 : 0,
    result.totalDuration,
    JSON.stringify(result.stats || {}),
    result.error || null
  );
}

/**
 * 파이프라인 로그 조회
 */
export function getPipelineLogs(limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM pipeline_logs
    ORDER BY start_time DESC
    LIMIT ?
  `);

  return stmt.all(limit).map(row => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    success: row.success === 1,
    durationMs: row.duration_ms,
    stats: JSON.parse(row.stats || '{}'),
    error: row.error
  }));
}

/**
 * 데이터베이스 통계
 */
export function getDBStats() {
  const summaryCount = db.prepare('SELECT COUNT(*) as count FROM summaries WHERE is_active = 1').get();
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM crawled_items').get();
  const logCount = db.prepare('SELECT COUNT(*) as count FROM pipeline_logs').get();

  const lastSummary = db.prepare('SELECT generated_at FROM summaries ORDER BY generated_at DESC LIMIT 1').get();
  const lastCrawl = db.prepare('SELECT crawled_at FROM crawled_items ORDER BY crawled_at DESC LIMIT 1').get();

  return {
    summaries: summaryCount.count,
    crawledItems: itemCount.count,
    pipelineLogs: logCount.count,
    lastSummaryAt: lastSummary?.generated_at || null,
    lastCrawlAt: lastCrawl?.crawled_at || null
  };
}

/**
 * 오래된 데이터 정리
 */
export function cleanupOldData(daysToKeep = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoff = cutoffDate.toISOString();

  const deletedItems = db.prepare('DELETE FROM crawled_items WHERE crawled_at < ?').run(cutoff);
  const deletedLogs = db.prepare('DELETE FROM pipeline_logs WHERE start_time < ?').run(cutoff);

  console.log(`[DB] 정리 완료: 크롤링 ${deletedItems.changes}개, 로그 ${deletedLogs.changes}개 삭제`);

  return {
    deletedItems: deletedItems.changes,
    deletedLogs: deletedLogs.changes
  };
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] 데이터베이스 연결 종료');
  }
}

export default {
  initDatabase,
  getDatabase,
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
