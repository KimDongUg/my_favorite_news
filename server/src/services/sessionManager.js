/**
 * 세션 관리 서비스
 * 사용자 세션 관리, 디바이스 추적, 보안 기능
 */

let db = null;

/**
 * 데이터베이스 인스턴스 설정
 */
export function setDatabase(database) {
  db = database;
}

/**
 * 사용자의 활성 세션 목록 조회
 */
export function getActiveSessions(userId) {
  const stmt = db.prepare(`
    SELECT
      id,
      ip_address,
      user_agent,
      created_at,
      expires_at,
      CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END as is_active
    FROM sessions
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `);

  const sessions = stmt.all(userId);

  return sessions.map(session => ({
    id: session.id,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    device: parseUserAgent(session.user_agent),
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    isActive: !!session.is_active,
  }));
}

/**
 * 특정 세션 삭제 (다른 기기 로그아웃)
 */
export function revokeSession(userId, sessionId) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(sessionId, userId);
  return result.changes > 0;
}

/**
 * 현재 세션을 제외한 모든 세션 삭제
 */
export function revokeOtherSessions(userId, currentSessionId) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE user_id = ? AND id != ?
  `);

  const result = stmt.run(userId, currentSessionId);
  console.log(`[Session] ${userId}의 다른 세션 ${result.changes}개 삭제됨`);
  return result.changes;
}

/**
 * 모든 세션 삭제 (비밀번호 변경 등)
 */
export function revokeAllSessions(userId) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE user_id = ?
  `);

  const result = stmt.run(userId);
  console.log(`[Session] ${userId}의 모든 세션 ${result.changes}개 삭제됨`);
  return result.changes;
}

/**
 * 만료된 세션 정리
 */
export function cleanupExpiredSessions() {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE expires_at <= datetime('now')
  `);

  const result = stmt.run();

  if (result.changes > 0) {
    console.log(`[Session] 만료된 세션 ${result.changes}개 정리됨`);
  }

  return result.changes;
}

/**
 * 세션 통계 조회
 */
export function getSessionStats() {
  const statsStmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN expires_at > datetime('now') THEN 1 END) as active,
      COUNT(CASE WHEN expires_at <= datetime('now') THEN 1 END) as expired
    FROM sessions
  `);

  const userCountStmt = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as unique_users
    FROM sessions
    WHERE expires_at > datetime('now')
  `);

  const stats = statsStmt.get();
  const userCount = userCountStmt.get();

  return {
    totalSessions: stats.total,
    activeSessions: stats.active,
    expiredSessions: stats.expired,
    uniqueUsers: userCount.unique_users,
  };
}

/**
 * 사용자별 세션 수 확인
 */
export function getUserSessionCount(userId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM sessions
    WHERE user_id = ? AND expires_at > datetime('now')
  `);

  return stmt.get(userId)?.count || 0;
}

/**
 * 의심스러운 세션 활동 감지
 */
export function detectSuspiciousActivity(userId) {
  // 최근 1시간 내 다른 IP에서의 접속 확인
  const stmt = db.prepare(`
    SELECT DISTINCT ip_address
    FROM sessions
    WHERE user_id = ?
      AND created_at > datetime('now', '-1 hour')
      AND expires_at > datetime('now')
  `);

  const ips = stmt.all(userId);

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
export function extendSession(sessionId, daysToExtend = 7) {
  const stmt = db.prepare(`
    UPDATE sessions
    SET expires_at = datetime(expires_at, '+${daysToExtend} days')
    WHERE id = ? AND expires_at > datetime('now')
  `);

  const result = stmt.run(sessionId);
  return result.changes > 0;
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
