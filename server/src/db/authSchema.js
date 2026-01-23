/**
 * 인증 시스템 데이터베이스 스키마 (PostgreSQL)
 */

import { query } from './database.js';

/**
 * 인증 관련 테이블 생성
 */
export async function createAuthTables() {
  // users 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      username TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_login_at TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      role TEXT DEFAULT 'user'
    )
  `);

  // auth_providers 테이블 (소셜 로그인)
  await query(`
    CREATE TABLE IF NOT EXISTS auth_providers (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_user_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, provider_user_id)
    )
  `);

  // sessions 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // user_preferences 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferred_categories JSONB DEFAULT '[]',
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'ko',
      notification_enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // magic_links 테이블 (매직 링크 로그인)
  await query(`
    CREATE TABLE IF NOT EXISTS magic_links (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // password_reset_tokens 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // email_verifications 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 인덱스 생성
  await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_providers_user ON auth_providers(user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_providers_provider ON auth_providers(provider, provider_user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id)`);

  console.log('[DB] 인증 테이블 생성 완료');
}

/**
 * 인증 프로바이더 설정
 */
export const authProviders = {
  social: [
    {
      id: 'google',
      name: 'Google',
      icon: '🔵',
      color: '#4285F4',
      enabled: true,
      priority: 1
    },
    {
      id: 'kakao',
      name: 'Kakao',
      icon: '💬',
      color: '#FEE500',
      enabled: true,
      priority: 2
    },
    {
      id: 'naver',
      name: 'Naver',
      icon: '🟢',
      color: '#03C75A',
      enabled: true,
      priority: 3
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: '🍎',
      color: '#000000',
      enabled: false,
      priority: 4
    }
  ],
  traditional: {
    email: true,
    phone: false
  },
  passwordless: {
    magicLink: true,
    otp: false
  }
};

/**
 * 사용자 역할
 */
export const userRoles = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin'
};

/**
 * 세션 설정
 */
export const sessionConfig = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  magicLinkExpiry: '15m',
  passwordResetExpiry: '1h',
  maxSessionsPerUser: 5
};

export default {
  createAuthTables,
  authProviders,
  userRoles,
  sessionConfig
};
