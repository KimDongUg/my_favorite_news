/**
 * User 모델
 * 사용자 데이터 CRUD 작업
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { passwordPolicy, defaultUserPreferences } from '../config/auth.js';

let db = null;

/**
 * 데이터베이스 인스턴스 설정
 */
export function setDatabase(database) {
  db = database;
}

/**
 * 사용자 생성
 */
export function createUser(userData) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, username, display_name, avatar_url, email_verified, created_at, updated_at, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userData.email.toLowerCase(),
    userData.passwordHash || null,
    userData.username || null,
    userData.displayName || userData.email.split('@')[0],
    userData.avatarUrl || null,
    userData.emailVerified ? 1 : 0,
    now,
    now,
    userData.role || 'user'
  );

  // 기본 설정 생성
  createUserPreferences(id);

  return findUserById(id);
}

/**
 * 이메일로 사용자 찾기
 */
export function findUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
  const user = stmt.get(email.toLowerCase());
  return user ? formatUser(user) : null;
}

/**
 * ID로 사용자 찾기
 */
export function findUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
  const user = stmt.get(id);
  return user ? formatUser(user) : null;
}

/**
 * 사용자명으로 찾기
 */
export function findUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
  const user = stmt.get(username);
  return user ? formatUser(user) : null;
}

/**
 * 사용자 정보 업데이트
 */
export function updateUser(id, updates) {
  const allowedFields = ['username', 'display_name', 'avatar_url', 'email_verified', 'last_login_at', 'role'];
  const updateParts = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
    if (allowedFields.includes(dbKey)) {
      updateParts.push(`${dbKey} = ?`);
      values.push(value);
    }
  }

  if (updateParts.length === 0) return null;

  updateParts.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE users SET ${updateParts.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return findUserById(id);
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, passwordPolicy.saltRounds);
  const stmt = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?');
  stmt.run(hash, new Date().toISOString(), id);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(user, password) {
  if (!user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * 마지막 로그인 시간 업데이트
 */
export function updateLastLogin(id) {
  const stmt = db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), id);
}

/**
 * 사용자 비활성화
 */
export function deactivateUser(id) {
  const stmt = db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), id);
}

/**
 * 사용자 삭제 (영구)
 */
export function deleteUser(id) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);
}

// ============================================
// Auth Provider 관련 함수
// ============================================

/**
 * 소셜 로그인 프로바이더 연결
 */
export function linkAuthProvider(userId, provider, providerData) {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO auth_providers
    (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    userId,
    provider,
    providerData.providerUserId,
    providerData.accessToken || null,
    providerData.refreshToken || null,
    providerData.tokenExpiresAt || null,
    now,
    now
  );
}

/**
 * 프로바이더로 사용자 찾기
 */
export function findUserByProvider(provider, providerUserId) {
  const stmt = db.prepare(`
    SELECT u.* FROM users u
    JOIN auth_providers ap ON u.id = ap.user_id
    WHERE ap.provider = ? AND ap.provider_user_id = ? AND u.is_active = 1
  `);
  const user = stmt.get(provider, providerUserId);
  return user ? formatUser(user) : null;
}

/**
 * 사용자의 연결된 프로바이더 목록
 */
export function getUserProviders(userId) {
  const stmt = db.prepare('SELECT provider, created_at FROM auth_providers WHERE user_id = ?');
  return stmt.all(userId);
}

/**
 * 프로바이더 연결 해제
 */
export function unlinkAuthProvider(userId, provider) {
  const stmt = db.prepare('DELETE FROM auth_providers WHERE user_id = ? AND provider = ?');
  stmt.run(userId, provider);
}

// ============================================
// User Preferences 관련 함수
// ============================================

/**
 * 사용자 설정 생성
 */
export function createUserPreferences(userId) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO user_preferences
    (user_id, preferred_categories, theme, language, notification_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    userId,
    JSON.stringify(defaultUserPreferences.preferred_categories),
    defaultUserPreferences.theme,
    defaultUserPreferences.language,
    defaultUserPreferences.notification_enabled ? 1 : 0,
    now,
    now
  );
}

/**
 * 사용자 설정 조회
 */
export function getUserPreferences(userId) {
  const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
  const prefs = stmt.get(userId);

  if (!prefs) return null;

  return {
    userId: prefs.user_id,
    preferredCategories: JSON.parse(prefs.preferred_categories || '[]'),
    theme: prefs.theme,
    language: prefs.language,
    notificationEnabled: prefs.notification_enabled === 1
  };
}

/**
 * 사용자 설정 업데이트
 */
export function updateUserPreferences(userId, updates) {
  const parts = [];
  const values = [];

  if (updates.preferredCategories !== undefined) {
    parts.push('preferred_categories = ?');
    values.push(JSON.stringify(updates.preferredCategories));
  }
  if (updates.theme !== undefined) {
    parts.push('theme = ?');
    values.push(updates.theme);
  }
  if (updates.language !== undefined) {
    parts.push('language = ?');
    values.push(updates.language);
  }
  if (updates.notificationEnabled !== undefined) {
    parts.push('notification_enabled = ?');
    values.push(updates.notificationEnabled ? 1 : 0);
  }

  if (parts.length === 0) return null;

  parts.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(userId);

  const stmt = db.prepare(`UPDATE user_preferences SET ${parts.join(', ')} WHERE user_id = ?`);
  stmt.run(...values);

  return getUserPreferences(userId);
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * DB 결과를 사용자 객체로 변환
 */
function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    emailVerified: row.email_verified === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    isActive: row.is_active === 1,
    role: row.role
  };
}

/**
 * 공개 가능한 사용자 정보만 반환
 */
export function getPublicProfile(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt
  };
}

export default {
  setDatabase,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  updateUser,
  updatePassword,
  verifyPassword,
  updateLastLogin,
  deactivateUser,
  deleteUser,
  linkAuthProvider,
  findUserByProvider,
  getUserProviders,
  unlinkAuthProvider,
  createUserPreferences,
  getUserPreferences,
  updateUserPreferences,
  getPublicProfile
};
