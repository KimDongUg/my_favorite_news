/**
 * API 설정
 * 환경변수로 API URL 관리
 */

// Vite 환경변수 사용 (VITE_ 접두사 필요)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 데모 모드 여부 (API 서버 없이 오프라인 데이터 사용)
export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL;

export default {
  API_BASE_URL,
  IS_DEMO_MODE,
};
