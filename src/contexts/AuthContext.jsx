/**
 * 인증 상태 관리 Context
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // API 요청 헬퍼 (인증 토큰 포함)
  const authFetch = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || '요청 실패');
    }

    return data;
  }, []);

  // 토큰 저장
  const setTokens = useCallback((accessToken, refreshToken) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, []);

  // 토큰 갱신
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      setTokens(null, null);
      return false;
    }
  }, [setTokens]);

  // 유저 정보 가져오기
  const fetchUser = useCallback(async () => {
    try {
      const response = await authFetch('/auth/me');
      // API 응답: { success, data: { user, preferences } }
      setUser(response.data?.user || response.user || response);
      return true;
    } catch (err) {
      console.error('Failed to fetch user:', err);

      // 토큰 갱신 시도
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        try {
          const response = await authFetch('/auth/me');
          setUser(response.data?.user || response.user || response);
          return true;
        } catch {
          setTokens(null, null);
          setUser(null);
        }
      } else {
        setTokens(null, null);
        setUser(null);
      }
      return false;
    }
  }, [authFetch, refreshAccessToken, setTokens]);

  // 자동 로그인 (페이지 로드 시)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetchUser();
      }
      setLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  // 회원가입
  const register = useCallback(async ({ email, password, displayName, username }) => {
    setError(null);

    const response = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, username }),
    });

    // API 응답: { success, data: { user, accessToken, refreshToken } }
    if (response.data?.accessToken) {
      const { user, accessToken, refreshToken } = response.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
      navigate('/');
    }

    return response;
  }, [authFetch, navigate, setTokens]);

  // 로그인
  const login = useCallback(async ({ email, password }) => {
    setError(null);

    const response = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // API 응답: { success, data: { user, accessToken, refreshToken } }
    const { user, accessToken, refreshToken } = response.data;
    setTokens(accessToken, refreshToken);
    setUser(user);

    // 원래 가려던 페이지로 리다이렉트
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });

    return response;
  }, [authFetch, location.state, navigate, setTokens]);

  // 소셜 로그인 콜백 처리
  const handleOAuthCallback = useCallback(async (token, refreshToken) => {
    setTokens(token, refreshToken);
    await fetchUser();
    navigate('/');
  }, [fetchUser, navigate, setTokens]);

  // 매직 링크 요청
  const requestMagicLink = useCallback(async (email) => {
    setError(null);

    const data = await authFetch('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return data;
  }, [authFetch]);

  // 매직 링크 검증
  const verifyMagicLink = useCallback(async (token) => {
    setError(null);

    const response = await authFetch('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    // API 응답: { success, data: { user, accessToken, refreshToken } }
    const { user, accessToken, refreshToken } = response.data;
    setTokens(accessToken, refreshToken);
    setUser(user);
    navigate('/');

    return response;
  }, [authFetch, navigate, setTokens]);

  // 비밀번호 재설정 요청
  const requestPasswordReset = useCallback(async (email) => {
    const data = await authFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return data;
  }, [authFetch]);

  // 비밀번호 재설정
  const resetPassword = useCallback(async (token, newPassword) => {
    const data = await authFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    return data;
  }, [authFetch]);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setTokens(null, null);
      setUser(null);
      navigate('/');
    }
  }, [authFetch, navigate, setTokens]);

  // 모든 세션 로그아웃
  const logoutAll = useCallback(async () => {
    try {
      await authFetch('/auth/logout-all', { method: 'POST' });
    } catch (err) {
      console.error('Logout all error:', err);
    } finally {
      setTokens(null, null);
      setUser(null);
      navigate('/login');
    }
  }, [authFetch, navigate, setTokens]);

  // 사용 가능한 OAuth 프로바이더 가져오기
  const getAvailableProviders = useCallback(async () => {
    try {
      const data = await authFetch('/auth/providers/available');
      // API 응답 구조: { success: true, data: { providers: [...] } }
      return data.data?.providers || data.providers || [];
    } catch (err) {
      console.error('Failed to get providers:', err);
      return [];
    }
  }, [authFetch]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    logoutAll,
    handleOAuthCallback,
    requestMagicLink,
    verifyMagicLink,
    requestPasswordReset,
    resetPassword,
    getAvailableProviders,
    fetchUser,
    authFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
