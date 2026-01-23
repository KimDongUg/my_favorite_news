/**
 * 인증 리다이렉트 훅
 * 로그인 상태에 따른 자동 리다이렉트
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 로그인 사용자를 다른 페이지로 리다이렉트
 * @param {string} redirectTo - 리다이렉트 경로 (기본: /)
 */
export function useAuthRedirect(redirectTo = '/') {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // 원래 가려던 페이지가 있으면 그곳으로, 아니면 기본 경로로
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location.state, redirectTo]);
}

/**
 * 비로그인 사용자를 로그인 페이지로 리다이렉트
 * @param {string} loginPath - 로그인 페이지 경로 (기본: /login)
 */
export function useRequireAuth(loginPath = '/login') {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // 현재 경로를 저장하여 로그인 후 돌아올 수 있도록 함
      navigate(loginPath, {
        replace: true,
        state: { from: location }
      });
    }
  }, [isAuthenticated, loading, navigate, location, loginPath]);

  return { isAuthenticated, loading };
}

/**
 * 이메일 인증 필요 여부 확인
 */
export function useRequireEmailVerified() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated && user && !user.emailVerified) {
      navigate('/verify-email-required', { replace: true });
    }
  }, [user, isAuthenticated, loading, navigate]);

  return { emailVerified: user?.emailVerified, loading };
}

export default {
  useAuthRedirect,
  useRequireAuth,
  useRequireEmailVerified,
};
