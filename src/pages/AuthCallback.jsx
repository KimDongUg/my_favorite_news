/**
 * OAuth 콜백 처리 페이지
 * 소셜 로그인 후 토큰을 받아 처리
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        setProcessing(false);
        return;
      }

      if (!token) {
        setError('인증 토큰이 없습니다.');
        setProcessing(false);
        return;
      }

      try {
        await handleOAuthCallback(token, refreshToken);
      } catch (err) {
        setError(err.message || '로그인 처리 중 오류가 발생했습니다.');
        setProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback]);

  if (processing && !error) {
    return (
      <div className="auth-container">
        <div className="auth-card callback-card">
          <div className="processing-content">
            <div className="processing-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-icon">🔐</div>
            </div>
            <h2>로그인 처리 중...</h2>
            <p>잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card callback-card">
          <div className="error-content">
            <div className="error-icon-large">❌</div>
            <h2>로그인 실패</h2>
            <p className="error-description">{error}</p>
            <button
              className="submit-btn primary"
              onClick={() => navigate('/login')}
            >
              다시 시도하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
