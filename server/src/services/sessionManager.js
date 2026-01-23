/**
 * 세션 관리 서비스 (PostgreSQL)
 * 사용자 세션 관리, 디바이스 추적, 보안 기능
 */

import { query } from '../db/database.js';

/**
 * 데이터베이스 인스턴스 설정 (호환성 유지)
 */
export function setDatabase(database) {
  // PostgreSQL은 database.js의 query 함수를 사용하므로 별도 설정 불필요
}

/**
 * 사용자의 활성 세션 목록 조회
 */
export async function getActiveSessions(userId) {
  const result = await query(`
    SELECT
      id,
      ip_address,
      user_agent,
      created_at,
      expires_at,
      CASE WHEN expires_at > NOW() THEN TRUE ELSE FALSE END as is_active
    FROM sessions
    WHERE user_id = $1 AND expires_at > NOW()
    ORDER BY created_at DESC
  `, [userId]);

  return result.rows.map(session => ({
    id: session.id,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    device: parseUserAgent(session.user_agent),
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    isActive: session.is_active,
  }));
}

/**
 * 특정 세션 삭제 (다른 기기 로그아웃)
 */
export async function revokeSession(userId, sessionId) {
  const result = await query(`
    DELETE FROM sessions
    WHERE id = $1 AND user_id = $2
  `, [sessionId, userId]);

  return result.rowCount > 0;
}

/**
 * 현재 세션을 제외한 모든 세션 삭제
 */
export async function revokeOtherSessions(userId, currentSessionId) {
  const result = await query(`
    DELETE FROM sessions
    WHERE user_id = $1 AND id != $2
  `, [userId, currentSessionId]);

  console.log(`[Session] ${userId}의 다른 세션 ${result.rowCount}개 삭제됨`);
  return result.rowCount;
}

/**
 * 모든 세션 삭제 (비밀번호 변경 등)
 */
export async function revokeAllSessions(userId) {
  const result = await query(`
    DELETE FROM sessions
    WHERE user_id = $1
  `, [userId]);

  console.log(`[Session] ${userId}의 모든 세션 ${result.rowCount}개 삭제됨`);
  return result.rowCount;
}

/**
 * 만료된 세션 정리
 */
export async function cleanupExpiredSessions() {
  const result = await query(`
    DELETE FROM sessions
    WHERE expires_at <= NOW()
  `);

  if (result.rowCount > 0) {
    console.log(`[Session] 만료된 세션 ${result.rowCount}개 정리됨`);
  }

  return result.rowCount;
}

/**
 * 세션 통계 조회
 */
export async function getSessionStats() {
  const statsResult = await query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active,
      COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired
    FROM sessions
  `);

  const userCountResult = await query(`
    SELECT COUNT(DISTINCT user_id) as unique_users
    FROM sessions
    WHERE expires_at > NOW()
  `);

  const stats = statsResult.rows[0];
  const userCount = userCountResult.rows[0];

  return {
    totalSessions: parseInt(stats.total) || 0,
    activeSessions: parseInt(stats.active) || 0,
    expiredSessions: parseInt(stats.expired) || 0,
    uniqueUsers: parseInt(userCount.unique_users) || 0,
  };
}

/**
 * 사용자별 세션 수 확인
 */
export async function getUserSessionCount(userId) {
  const result = await query(`
    SELECT COUNT(*) as count
    FROM sessions
    WHERE user_id = $1 AND expires_at > NOW()
  `, [userId]);

  return parseInt(result.rows[0]?.count) || 0;
}

/**
 * 의심스러운 세션 활동 감지
 */
export async function detectSuspiciousActivity(userId) {
  // 최근 1시간 내 다른 IP에서의 접속 확인
  const result = await query(`
    SELECT DISTINCT ip_address
    FROM sessions
    WHERE user_id = $1
      AND created_at > NOW() - INTERVAL '1 hour'
      AND expires_at > NOW()
  `, [userId]);

  const ips = result.rows;

  if (ips.length > 3) {
    console.warn(`[Security] 의심스러운 활동 감지: ${userId} - ${ips.length}개의 다른 IP에서 접속`);
    return {
      suspicious: true,
      reason: 'multiple_ips',
      ipCount: ips.length,
    };
  }

  return { suspicious: false };
}

/**
 * 세션 연장
 */
export async function extendSession(sessionId, daysToExtend = 7) {
  const result = await query(`
    UPDATE sessions
    SET expires_at = expires_at + INTERVAL '${daysToExtend} days'
    WHERE id = $1 AND expires_at > NOW()
  `, [sessionId]);

  return result.rowCount > 0;
}

/**
 * User-Agent 파싱하여 디바이스 정보 추출
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { type: 'unknown', os: 'unknown', browser: 'unknown' };
  }

  const ua = userAgent.toLowerCase();

  // 디바이스 타입
  let type = 'desktop';
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    type = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    type = 'tablet';
  }

  // OS
  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  // 브라우저
  let browser = 'unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  return { type, os, browser };
}

/**
 * 세션에 메타데이터 추가
 */
export function addSessionMetadata(sessionId, metadata) {
  // 향후 확장을 위한 메타데이터 저장 로직
  // 현재는 로깅만 수행
  console.log(`[Session] 메타데이터 추가: ${sessionId}`, metadata);
}

/**
 * 마지막 활동 시간 업데이트
 */
export function updateLastActivity(sessionId) {
  // sessions 테이블에 last_activity_at 컬럼이 있다면 업데이트
  // 현재 스키마에는 없으므로 향후 마이그레이션 시 추가
  console.log(`[Session] 활동 시간 업데이트: ${sessionId}`);
}

export default {
  setDatabase,
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllSessions,
  cleanupExpiredSessions,
  getSessionStats,
  getUserSessionCount,
  detectSuspiciousActivity,
  extendSession,
  addSessionMetadata,
  updateLastActivity,
};
