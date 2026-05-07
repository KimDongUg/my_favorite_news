import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

function getSessionId() {
  let id = sessionStorage.getItem('_track_sid');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_track_sid', id);
  }
  return id;
}

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const prevPath = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === prevPath.current) return;
    prevPath.current = path;

    fetch(`${API_BASE_URL}/stats/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: getSessionId(),
        path,
        referrer: document.referrer || null,
        user_id: user?.id || null,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [location.pathname, user?.id]);
}
