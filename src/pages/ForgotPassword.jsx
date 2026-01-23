/**
 * 비밀번호 찾기 페이지
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-content">
            <div className="success-animation">
              <div className="success-icon">📧</div>
            </div>

            <h1>이메일을 확인하세요</h1>

            <p className="sent-email">
              <strong>{email}</strong>
            </p>

            <p className="sent-description">
              비밀번호 재설정 링크를 보냈습니다.<br />
              이메일의 링크를 클릭하여 새 비밀번호를 설정하세요.
            </p>

            <div className="info-box">
              <span className="info-icon">⏰</span>
              <p>링크는 1시간 동안 유효합니다</p>
            </div>

            <Link to="/login" className="submit-btn secondary">
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">📰</span>
            <span className="logo-text">MyNews</span>
          </div>
          <h1>비밀번호 찾기</h1>
          <p>가입한 이메일 주소를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-email">이메일</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>전송 중...</span>
              </>
            ) : (
              '재설정 링크 보내기'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            비밀번호가 기억나셨나요?{' '}
            <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>

      <div className="auth-bg-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
}
