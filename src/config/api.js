/**
 * API 설정
 * 환경별 자동 전환
 */

// 환경 자동 감지
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// 프로덕션 API URL
const PRODUCTION_API_URL = 'https://mynewsback.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:3001/api';

// API URL 설정 (우선순위: 환경변수 > 자동 감지)
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (isLocalhost ? LOCAL_API_URL : PRODUCTION_API_URL);

// 데모 모드
export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// 현재 환경 정보 (디버깅용)
export const ENV_INFO = {
  isLocalhost,
  apiUrl: API_BASE_URL,
  mode: import.meta.env.MODE,
};

export default {
  API_BASE_URL,
  IS_DEMO_MODE,
  ENV_INFO,
};
