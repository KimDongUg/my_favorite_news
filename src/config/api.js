/**
 * API 설정
 * 환경변수로 API URL 관리
 */

// Vite 환경변수 사용 (VITE_ 접두사 필요)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export default {
  API_BASE_URL,
  IS_DEMO_MODE,
};
