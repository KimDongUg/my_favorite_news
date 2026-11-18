/**
 * 관리자 판별 (authRoutes의 관리자 API와 접속 통계 기록이 같은 기준을 사용)
 */

// 관리자 이메일 목록
export const ADMIN_EMAILS = ['kduaro124@naver.com'];

/**
 * 관리자 여부: 관리자 이메일 목록에 있거나 role이 admin인 사용자
 */
export function isAdminUser(user) {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email) || user.role === 'admin';
}
