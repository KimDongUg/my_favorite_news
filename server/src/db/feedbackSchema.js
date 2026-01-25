/**
 * 게시판 데이터베이스 스키마 (PostgreSQL)
 */

import { query } from './database.js';

/**
 * 게시판 관련 테이블 생성
 */
export async function createFeedbackTables() {
  // posts 테이블 (게시글)
  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      author_email TEXT,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_resolved BOOLEAN DEFAULT FALSE,
      is_pinned BOOLEAN DEFAULT FALSE,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // comments 테이블 (댓글)
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      is_admin_reply BOOLEAN DEFAULT FALSE,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // post_likes 테이블 (좋아요 - 중복 방지)
  await query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    )
  `);

  // 인덱스 생성
  await query(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id)`);

  console.log('[DB] 게시판 테이블 생성 완료');
}

/**
 * 게시글 카테고리
 */
export const postCategories = [
  { id: 'suggestion', name: '기능 제안', icon: '💡', color: '#f59e0b' },
  { id: 'bug', name: '버그 신고', icon: '🐛', color: '#ef4444' },
  { id: 'question', name: '문의사항', icon: '❓', color: '#3b82f6' },
  { id: 'general', name: '자유게시판', icon: '💬', color: '#8b5cf6' },
  { id: 'praise', name: '칭찬해요', icon: '⭐', color: '#10b981' }
];

export default {
  createFeedbackTables,
  postCategories
};
