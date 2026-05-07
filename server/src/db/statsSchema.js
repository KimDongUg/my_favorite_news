import { query } from './database.js';

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
}
