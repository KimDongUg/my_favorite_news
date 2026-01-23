/**
 * User 모델
 * 사용자 데이터 CRUD 작업 (PostgreSQL)
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { passwordPolicy, defaultUserPreferences } from '../config/auth.js';
import { query } from '../db/database.js';

/**
 * 데이터베이스 인스턴스 설정 (호환성 유지)
 */
export function setDatabase(database) {
  // PostgreSQL은 database.js의 query 함수를 사용하므로 별도 설정 불필요
}

/**
 * 사용자 생성
 */
export async function createUser(userData) {
  const id = uuidv4();
  const now = new Date().toISOString();

  await query(`
    INSERT INTO users (id, email, password_hash, username, display_name, avatar_url, email_verified, created_at, updated_at, role)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    id,
    userData.email.toLowerCase(),
    userData.passwordHash || null,
    userData.username || null,
    userData.displayName || userData.email.split('@')[0],
    userData.avatarUrl || null,
    userData.emailVerified || false,
    now,
    now,
    userData.role || 'user'
  ]);

  // 기본 설정 생성
  await createUserPreferences(id);

  return await findUserById(id);
}

/**
 * 이메일로 사용자 찾기
 */
export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email.toLowerCase()]);
  const user = result.rows[0];
  return user ? formatUser(user) : null;
}

/**
 * ID로 사용자 찾기
 */
export async function findUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1 AND is_active = TRUE', [id]);
  const user = result.rows[0];
  return user ? formatUser(user) : null;
}

/**
 * 사용자명으로 찾기
 */
export async function findUserByUsername(username) {
  const result = await query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);
  const user = result.rows[0];
  return user ? formatUser(user) : null;
}

/**
 * 사용자 정보 업데이트
 */
export async function updateUser(id, updates) {
  const allowedFields = ['username', 'display_name', 'avatar_url', 'email_verified', 'last_login_at', 'role'];
  const updateParts = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
    if (allowedFields.includes(dbKey)) {
      updateParts.push(`${dbKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updateParts.length === 0) return null;

  updateParts.push(`updated_at = $${paramIndex}`);
  values.push(new Date().toISOString());
  paramIndex++;
  values.push(id);

  await query(`UPDATE users SET ${updateParts.join(', ')} WHERE id = $${paramIndex}`, values);

  return await findUserById(id);
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, passwordPolicy.saltRounds);
  await query('UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3', [hash, new Date().toISOString(), id]);
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
export async function updateLastLogin(id) {
  await query('UPDATE users SET last_login_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
}

/**
 * 사용자 비활성화
 */
export async function deactivateUser(id) {
  await query('UPDATE users SET is_active = FALSE, updated_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
}

/**
 * 사용자 삭제 (영구)
 */
export async function deleteUser(id) {
  await query('DELETE FROM users WHERE id = $1', [id]);
}

// ============================================
// Auth Provider 관련 함수
// ============================================

/**
 * 소셜 로그인 프로바이더 연결
 */
export async function linkAuthProvider(userId, provider, providerData) {
  const now = new Date().toISOString();

  await query(`
    INSERT INTO auth_providers
    (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (provider, provider_user_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      updated_at = EXCLUDED.updated_at
  `, [
    userId,
    provider,
    providerData.providerUserId,
    providerData.accessToken || null,
    providerData.refreshToken || null,
    providerData.tokenExpiresAt || null,
    now,
    now
  ]);
}

/**
 * 프로바이더로 사용자 찾기
 */
export async function findUserByProvider(provider, providerUserId) {
  const result = await query(`
    SELECT u.* FROM users u
    JOIN auth_providers ap ON u.id = ap.user_id
    WHERE ap.provider = $1 AND ap.provider_user_id = $2 AND u.is_active = TRUE
  `, [provider, providerUserId]);
  const user = result.rows[0];
  return user ? formatUser(user) : null;
}

/**
 * 사용자의 연결된 프로바이더 목록
 */
export async function getUserProviders(userId) {
  const result = await query('SELECT provider, created_at FROM auth_providers WHERE user_id = $1', [userId]);
  return result.rows;
}

/**
 * 프로바이더 연결 해제
 */
export async function unlinkAuthProvider(userId, provider) {
  await query('DELETE FROM auth_providers WHERE user_id = $1 AND provider = $2', [userId, provider]);
}

// ============================================
// User Preferences 관련 함수
// ============================================

/**
 * 사용자 설정 생성
 */
export async function createUserPreferences(userId) {
  const now = new Date().toISOString();

  await query(`
    INSERT INTO user_preferences
    (user_id, preferred_categories, theme, language, notification_enabled, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id) DO NOTHING
  `, [
    userId,
    JSON.stringify(defaultUserPreferences.preferred_categories),
    defaultUserPreferences.theme,
    defaultUserPreferences.language,
    defaultUserPreferences.notification_enabled,
    now,
    now
  ]);
}

/**
 * 사용자 설정 조회
 */
export async function getUserPreferences(userId) {
  const result = await query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
  const prefs = result.rows[0];

  if (!prefs) return null;

  return {
    userId: prefs.user_id,
    preferredCategories: prefs.preferred_categories || [],
    theme: prefs.theme,
    language: prefs.language,
    notificationEnabled: prefs.notification_enabled
  };
}

/**
 * 사용자 설정 업데이트
 */
export async function updateUserPreferences(userId, updates) {
  const parts = [];
  const values = [];
  let paramIndex = 1;

  if (updates.preferredCategories !== undefined) {
    parts.push(`preferred_categories = $${paramIndex}`);
    values.push(JSON.stringify(updates.preferredCategories));
    paramIndex++;
  }
  if (updates.theme !== undefined) {
    parts.push(`theme = $${paramIndex}`);
    values.push(updates.theme);
    paramIndex++;
  }
  if (updates.language !== undefined) {
    parts.push(`language = $${paramIndex}`);
    values.push(updates.language);
    paramIndex++;
  }
  if (updates.notificationEnabled !== undefined) {
    parts.push(`notification_enabled = $${paramIndex}`);
    values.push(updates.notificationEnabled);
    paramIndex++;
  }

  if (parts.length === 0) return null;

  parts.push(`updated_at = $${paramIndex}`);
  values.push(new Date().toISOString());
  paramIndex++;
  values.push(userId);

  await query(`UPDATE user_preferences SET ${parts.join(', ')} WHERE user_id = $${paramIndex}`, values);

  return await getUserPreferences(userId);
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
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    isActive: row.is_active,
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
