/**
 * 매직 링크 검증 페이지
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

export default function MagicLinkVerify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState(null);
  const { verifyMagicLink } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('유효하지 않은 링크입니다.');
        setStatus('error');
        return;
      }

      try {
        await verifyMagicLink(token);
        setStatus('success');
        // 성공 시 AuthContext에서 리다이렉트 처리
      } catch (err) {
        setError(err.message || '링크가 만료되었거나 이미 사용되었습니다.');
        setStatus('error');
      }
    };

    verify();
  }, [searchParams, verifyMagicLink]);

  if (status === 'verifying') {
    return (
      <div className="auth-container">
        <div className="auth-card callback-card">
          <div className="processing-content">
            <div className="processing-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-icon">✨</div>
            </div>
            <h2>매직 링크 확인 중...</h2>
            <p>잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-container">
        <div className="auth-card callback-card">
          <div className="error-content">
            <div className="error-icon-large">⚠️</div>
            <h2>링크 오류</h2>
            <p className="error-description">{error}</p>
            <div className="error-actions">
              <Link to="/login" className="submit-btn primary">
                다시 로그인하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // success 상태는 AuthContext에서 리다이렉트 처리됨
  return null;
}
