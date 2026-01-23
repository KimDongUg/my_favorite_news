/**
 * JWT 토큰 서비스
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { jwtConfig } from '../config/auth.js';

let db = null;

/**
 * 데이터베이스 인스턴스 설정
 */
export function setDatabase(database) {
  db = database;
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
export function createSession(userId, req) {
  const sessionId = uuidv4();
  const token = generateRefreshToken({ id: userId });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7일

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    sessionId,
    userId,
    token,
    expiresAt,
    req?.ip || req?.connection?.remoteAddress || 'unknown',
    req?.headers?.['user-agent'] || 'unknown',
    new Date().toISOString()
  );

  return { sessionId, token, expiresAt };
}

/**
 * 세션 조회
 */
export function findSession(token) {
  const stmt = db.prepare(`
    SELECT * FROM sessions
    WHERE token = ? AND expires_at > datetime('now')
  `);
  return stmt.get(token);
}

/**
 * 세션 삭제 (로그아웃)
 */
export function deleteSession(token) {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * 사용자의 모든 세션 삭제
 */
export function deleteAllUserSessions(userId) {
  const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  stmt.run(userId);
}

/**
 * 사용자의 세션 목록
 */
export function getUserSessions(userId) {
  const stmt = db.prepare(`
    SELECT id, ip_address, user_agent, created_at, expires_at
    FROM sessions
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `);
  return stmt.all(userId);
}

/**
 * 만료된 세션 정리
 */
export function cleanupExpiredSessions() {
  const stmt = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')");
  const result = stmt.run();
  if (result.changes > 0) {
    console.log(`[Auth] ${result.changes}개의 만료된 세션 정리됨`);
  }
  return result.changes;
}

/**
 * 세션 개수 제한 체크 및 오래된 세션 삭제
 */
export function enforceSessionLimit(userId, maxSessions = 5) {
  const stmt = db.prepare(`
    SELECT id FROM sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  const sessions = stmt.all(userId);

  if (sessions.length >= maxSessions) {
    // 오래된 세션들 삭제
    const sessionsToDelete = sessions.slice(maxSessions - 1);
    const deleteStmt = db.prepare('DELETE FROM sessions WHERE id = ?');

    for (const session of sessionsToDelete) {
      deleteStmt.run(session.id);
    }
  }
}

// ============================================
// 매직 링크
// ============================================

/**
 * 매직 링크 토큰 생성
 */
export function createMagicLink(email) {
  const id = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15분

  const stmt = db.prepare(`
    INSERT INTO magic_links (id, email, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, email.toLowerCase(), token, expiresAt, new Date().toISOString());

  return { id, token, expiresAt };
}

/**
 * 매직 링크 검증
 */
export function verifyMagicLink(token) {
  const stmt = db.prepare(`
    SELECT * FROM magic_links
    WHERE token = ? AND expires_at > datetime('now') AND used = 0
  `);
  return stmt.get(token);
}

/**
 * 매직 링크 사용 처리
 */
export function useMagicLink(token) {
  const stmt = db.prepare('UPDATE magic_links SET used = 1 WHERE token = ?');
  stmt.run(token);
}

/**
 * 만료된 매직 링크 정리
 */
export function cleanupExpiredMagicLinks() {
  const stmt = db.prepare("DELETE FROM magic_links WHERE expires_at <= datetime('now') OR used = 1");
  stmt.run();
}

// ============================================
// 비밀번호 재설정
// ============================================

/**
 * 비밀번호 재설정 토큰 생성
 */
export function createPasswordResetToken(userId) {
  const id = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1시간

  const stmt = db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, token, expiresAt, new Date().toISOString());

  return { id, token, expiresAt };
}

/**
 * 비밀번호 재설정 토큰 검증
 */
export function verifyPasswordResetToken(token) {
  const stmt = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token = ? AND expires_at > datetime('now') AND used = 0
  `);
  return stmt.get(token);
}

/**
 * 비밀번호 재설정 토큰 사용 처리
 */
export function usePasswordResetToken(token) {
  const stmt = db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?');
  stmt.run(token);
}

// ============================================
// 이메일 인증
// ============================================

/**
 * 이메일 인증 토큰 생성
 */
export function createEmailVerificationToken(userId) {
  const id = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간

  const stmt = db.prepare(`
    INSERT INTO email_verifications (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, token, expiresAt, new Date().toISOString());

  return { id, token, expiresAt };
}

/**
 * 이메일 인증 토큰 검증
 */
export function verifyEmailVerificationToken(token) {
  const stmt = db.prepare(`
    SELECT * FROM email_verifications
    WHERE token = ? AND expires_at > datetime('now') AND used = 0
  `);
  return stmt.get(token);
}

/**
 * 이메일 인증 토큰 사용 처리
 */
export function useEmailVerificationToken(token) {
  const stmt = db.prepare('UPDATE email_verifications SET used = 1 WHERE token = ?');
  stmt.run(token);
}

/**
 * 만료된 이메일 인증 토큰 정리
 */
export function cleanupExpiredEmailVerifications() {
  const stmt = db.prepare("DELETE FROM email_verifications WHERE expires_at <= datetime('now') OR used = 1");
  stmt.run();
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
