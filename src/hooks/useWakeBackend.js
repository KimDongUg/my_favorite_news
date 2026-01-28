/**
 * useWakeBackend - Render 백엔드 자동 깨우기 훅
 *
 * 사용자가 웹사이트 접속 시 백그라운드에서 Render 인스턴스를 깨웁니다.
 * - 세션당 1회만 실행 (sessionStorage로 중복 방지)
 * - 사용자 경험에 영향 없이 비동기 실행
 * - 에러 발생 시 조용히 실패 (콘솔 로그만)
 */

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

// 세션 스토리지 키
const WAKE_KEY = 'backend_wake_attempted';

// 백엔드 기본 URL (API 경로 제거)
const getBackendBaseUrl = () => {
  // API_BASE_URL이 '/api'로 끝나면 제거
  return API_BASE_URL.replace(/\/api\/?$/, '');
};

/**
 * 백엔드 상태 확인 및 깨우기
 * @returns {Promise<{success: boolean, latency?: number, error?: string}>}
 */
export const wakeBackend = async () => {
  const startTime = performance.now();
  const baseUrl = getBackendBaseUrl();

  try {
    // health 엔드포인트로 요청 (가장 가벼운 엔드포인트)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60초 타임아웃

    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      // CORS 및 캐시 설정
      mode: 'cors',
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - startTime);

    if (response.ok) {
      console.log(`[WakeBackend] ✅ 백엔드 활성화 완료 (${latency}ms)`);
      return { success: true, latency };
    } else {
      console.warn(`[WakeBackend] ⚠️ 백엔드 응답 오류: ${response.status}`);
      return { success: false, latency, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);

    if (error.name === 'AbortError') {
      console.warn(`[WakeBackend] ⏱️ 타임아웃 (${latency}ms) - 백엔드가 깨어나는 중일 수 있습니다`);
      return { success: false, latency, error: 'timeout' };
    }

    console.warn(`[WakeBackend] ❌ 요청 실패:`, error.message);
    return { success: false, latency, error: error.message };
  }
};

/**
 * useWakeBackend 훅
 * 컴포넌트 마운트 시 자동으로 백엔드를 깨웁니다.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - 활성화 여부 (기본: true)
 * @param {boolean} options.forceWake - 세션 체크 무시하고 강제 실행
 * @returns {{ isWaking: boolean, wakeResult: object | null }}
 */
export const useWakeBackend = (options = {}) => {
  const { enabled = true, forceWake = false } = options;
  const wakeAttempted = useRef(false);

  useEffect(() => {
    // 비활성화 상태면 실행 안 함
    if (!enabled) return;

    // 이미 이 컴포넌트 인스턴스에서 시도했으면 스킵
    if (wakeAttempted.current) return;

    // 세션에서 이미 시도했는지 확인 (forceWake가 아닐 때만)
    if (!forceWake) {
      try {
        const attempted = sessionStorage.getItem(WAKE_KEY);
        if (attempted) {
          console.log('[WakeBackend] 이미 이 세션에서 깨우기 시도함 - 스킵');
          return;
        }
      } catch {
        // sessionStorage 접근 실패 시 계속 진행
      }
    }

    // 중복 실행 방지
    wakeAttempted.current = true;

    // 세션 스토리지에 시도 기록
    try {
      sessionStorage.setItem(WAKE_KEY, Date.now().toString());
    } catch {
      // sessionStorage 저장 실패 시 무시
    }

    // 비동기로 백엔드 깨우기 (결과를 기다리지 않음)
    console.log('[WakeBackend] 🚀 백엔드 깨우기 시작...');
    wakeBackend();

  }, [enabled, forceWake]);
};

export default useWakeBackend;
