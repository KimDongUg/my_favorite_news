/**
 * 인증 시스템 데이터베이스 스키마
 */

/**
 * 인증 관련 테이블 생성
 * @param {Database} db - better-sqlite3 인스턴스
 */
export function createAuthTables(db) {
  // users 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      username TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      email_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT,
      is_active INTEGER DEFAULT 1,
      role TEXT DEFAULT 'user'
    )
  `);

  // auth_providers 테이블 (소셜 로그인)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_user_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_user_id)
    )
  `);

  // sessions 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // user_preferences 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferred_categories TEXT DEFAULT '[]',
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'ko',
      notification_enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // magic_links 테이블 (매직 링크 로그인)
  db.exec(`
    CREATE TABLE IF NOT EXISTS magic_links (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // password_reset_tokens 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // email_verifications 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_auth_providers_user ON auth_providers(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_providers_provider ON auth_providers(provider, provider_user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
    CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
    CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
    CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
  `);

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
      enabled: false, // Phase 2
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
  accessTokenExpiry: '15m',      // 15분
  refreshTokenExpiry: '7d',       // 7일
  magicLinkExpiry: '15m',         // 15분
  passwordResetExpiry: '1h',      // 1시간
  maxSessionsPerUser: 5           // 최대 동시 세션 수
};

export default {
  createAuthTables,
  authProviders,
  userRoles,
  sessionConfig
};
