/**
 * JWT 토큰 서비스 (PostgreSQL)
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { jwtConfig } from '../config/auth.js';
import { query } from '../db/database.js';

/**
 * 데이터베이스 인스턴스 설정 (호환성 유지)
 */
export function setDatabase(database) {
  // PostgreSQL은 database.js의 query 함수를 사용하므로 별도 설정 불필요
}

/**
 * Access Token 생성
 */
export function generateAccessToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expiresIn
  });
}

/**
 * Refresh Token 생성
 */
export function generateRefreshToken(user) {
  const payload = {
    sub: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, jwtConfig.refreshToken.secret, {
    expiresIn: jwtConfig.refreshToken.expiresIn
  });
}

/**
 * Access Token 검증
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh Token 검증
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshToken.secret);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 토큰 쌍 생성
 */
export function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
}

// ============================================
// 세션 관리
// ============================================

/**
 * 세션 생성
 */
export async function createSession(userId, req) {
  const sessionId = uuidv4();
  const token = generateRefreshToken({ id: userId });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7일

  await query(`
    INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    sessionId,
    userId,
    token,
    expiresAt,
    req?.ip || req?.connection?.remoteAddress || 'unknown',
    req?.headers?.['user-agent'] || 'unknown',
    new Date().toISOString()
  ]);

  return { sessionId, token, expiresAt };
}

/**
 * 세션 조회
 */
export async function findSession(token) {
  const result = await query(`
    SELECT * FROM sessions
    WHERE token = $1 AND expires_at > NOW()
  `, [token]);
  return result.rows[0];
}

/**
 * 세션 삭제 (로그아웃)
 */
export async function deleteSession(token) {
  await query('DELETE FROM sessions WHERE token = $1', [token]);
}

/**
 * 사용자의 모든 세션 삭제
 */
export async function deleteAllUserSessions(userId) {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * 사용자의 세션 목록
 */
export async function getUserSessions(userId) {
  const result = await query(`
    SELECT id, ip_address, user_agent, created_at, expires_at
    FROM sessions
    WHERE user_id = $1 AND expires_at > NOW()
    ORDER BY created_at DESC
  `, [userId]);
  return result.rows;
}

/**
 * 만료된 세션 정리
 */
export async function cleanupExpiredSessions() {
  const result = await query("DELETE FROM sessions WHERE expires_at <= NOW()");
  if (result.rowCount > 0) {
    console.log(`[Auth] ${result.rowCount}개의 만료된 세션 정리됨`);
  }
  return result.rowCount;
}

/**
 * 세션 개수 제한 체크 및 오래된 세션 삭제
 */
export async function enforceSessionLimit(userId, maxSessions = 5) {
  const result = await query(`
    SELECT id FROM sessions
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
  const sessions = result.rows;

  if (sessions.length >= maxSessions) {
    // 오래된 세션들 삭제
    const sessionsToDelete = sessions.slice(maxSessions - 1);

    for (const session of sessionsToDelete) {
      await query('DELETE FROM sessions WHERE id = $1', [session.id]);
    }
  }
}

// ============================================
// 매직 링크
// ============================================

/**
 * 매직 링크 토큰 생성
 */
export async function createMagicLink(email) {
  const id = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15분

  await query(`
    INSERT INTO magic_links (id, email, token, expires_at, created_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, email.toLowerCase(), token, expiresAt, new Date().toISOString()]);

  return { id, token, expiresAt };
}

/**
 * 매직 링크 검증
 */
export async function verifyMagicLink(token) {
  const result = await query(`
    SELECT * FROM magic_links
    WHERE token = $1 AND expires_at > NOW() AND used = FALSE
  `, [token]);
  return result.rows[0];
}

/**
 * 매직 링크 사용 처리
 */
export async function useMagicLink(token) {
  await query('UPDATE magic_links SET used = TRUE WHERE token = $1', [token]);
}

/**
 * 만료된 매직 링크 정리
 */
export async function cleanupExpiredMagicLinks() {
  await query("DELETE FROM magic_links WHERE expires_at <= NOW() OR used = TRUE");
}

// ============================================
// 비밀번호 재설정
// ============================================

/**
 * 비밀번호 재설정 토큰 생성
 */
export async function createPasswordResetToken(userId) {
  const id = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1시간

  await query(`
    INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, userId, token, expiresAt, new Date().toISOString()]);

  return { id, token, expiresAt };
}

/**
 * 비밀번호 재설정 토큰 검증
 */
export async function verifyPasswordResetToken(token) {
  const result = await query(`
    SELECT * FROM password_reset_tokens
    WHERE token = $1 AND expires_at > NOW() AND used = FALSE
  `, [token]);
  return result.rows[0];
}

/**
 * 비밀번호 재설정 토큰 사용 처리
 */
export async function usePasswordResetToken(token) {
  await query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);
}

// ============================================
// 이메일 인증
// ============================================

/**
 * 이메일 인증 토큰 생성
 */
export async function createEmailVerificationToken(userId) {
  const id = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간

  await query(`
    INSERT INTO email_verifications (id, user_id, token, expires_at, created_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, userId, token, expiresAt, new Date().toISOString()]);

  return { id, token, expiresAt };
}

/**
 * 이메일 인증 토큰 검증
 */
export async function verifyEmailVerificationToken(token) {
  const result = await query(`
    SELECT * FROM email_verifications
    WHERE token = $1 AND expires_at > NOW() AND used = FALSE
  `, [token]);
  return result.rows[0];
}

/**
 * 이메일 인증 토큰 사용 처리
 */
export async function useEmailVerificationToken(token) {
  await query('UPDATE email_verifications SET used = TRUE WHERE token = $1', [token]);
}

/**
 * 만료된 이메일 인증 토큰 정리
 */
export async function cleanupExpiredEmailVerifications() {
  await query("DELETE FROM email_verifications WHERE expires_at <= NOW() OR used = TRUE");
}

export default {
  setDatabase,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  createSession,
  findSession,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
  cleanupExpiredSessions,
  enforceSessionLimit,
  createMagicLink,
  verifyMagicLink,
  useMagicLink,
  cleanupExpiredMagicLinks,
  createPasswordResetToken,
  verifyPasswordResetToken,
  usePasswordResetToken,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  useEmailVerificationToken,
  cleanupExpiredEmailVerifications
};
