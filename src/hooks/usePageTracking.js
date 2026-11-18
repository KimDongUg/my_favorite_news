import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

// crypto.randomUUID가 없는 구형 브라우저용 폴백 (서버가 UUID 형식만 받으므로 v4 형식으로 생성)
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 탭 단위 세션 식별자 (탭을 닫으면 사라짐)
function getSessionId() {
  let id = sessionStorage.getItem('_track_sid');
  if (!id || !UUID_RE.test(id)) {
    id = generateId();
    sessionStorage.setItem('_track_sid', id);
  }
  return id;
}

// 브라우저 단위 장기 방문자 식별자. localStorage를 쓸 수 없으면 null
function getVisitorId() {
  try {
    let id = localStorage.getItem('_track_vid');
    if (!id || !UUID_RE.test(id)) {
      id = generateId();
      localStorage.setItem('_track_vid', id);
    }
    return id;
  } catch {
    return null;
  }
}

function getAccessToken() {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const prevPath = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === prevPath.current) return;
    prevPath.current = path;

    try {
      const headers = { 'Content-Type': 'application/json' };
      // 로그인 상태면 토큰을 함께 보내 서버가 관리자 접속을 구분하게 함
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      fetch(`${API_BASE_URL}/stats/pageview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: getSessionId(),
          visitor_id: getVisitorId(),
          path: path.slice(0, 500),
          referrer: document.referrer || null,
          user_id: user?.id || null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // 기록 실패는 사용자 화면에 영향을 주지 않음
    }
  }, [location.pathname, user?.id]);
}
