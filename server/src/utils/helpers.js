import crypto from 'crypto';

/**
 * 유니크 ID 생성
 */
export function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 딜레이 함수
 * @param {number} ms - 밀리초
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 텍스트 정리 (HTML 태그 제거, 공백 정리)
 * @param {string} text - 원본 텍스트
 * @returns {string} 정리된 텍스트
 */
export function cleanText(text) {
  if (!text) return '';

  return text
    // HTML 태그 제거
    .replace(/<[^>]*>/g, '')
    // HTML 엔티티 디코딩
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    // CDATA 제거
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    // 여러 공백을 하나로
    .replace(/\s+/g, ' ')
    // 앞뒤 공백 제거
    .trim();
}

/**
 * URL에서 도메인 추출
 * @param {string} url - URL
 * @returns {string} 도메인
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 날짜 포맷팅
 * @param {string|Date} date - 날짜
 * @returns {string} 포맷된 날짜
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString();
}

/**
 * 텍스트 요약 (앞부분 추출)
 * @param {string} text - 원본 텍스트
 * @param {number} maxLength - 최대 길이
 * @returns {string} 요약된 텍스트
 */
export function truncateText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
