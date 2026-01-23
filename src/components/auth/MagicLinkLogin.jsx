/**
 * 매직 링크 로그인 컴포넌트
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function MagicLinkLogin({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestMagicLink } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      await requestMagicLink(email);
    } catch (err) {
      setError(err.message || '재발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="magic-link-sent">
        <div className="success-animation">
          <div className="success-icon">✉️</div>
          <div className="success-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>

        <h2>이메일을 확인하세요!</h2>

        <p className="sent-email">
          <strong>{email}</strong>
        </p>

        <p className="sent-description">
          로그인 링크를 보냈습니다.<br />
          이메일의 링크를 클릭하면 자동으로 로그인됩니다.
        </p>

        <div className="info-box">
          <span className="info-icon">💡</span>
          <p>링크는 15분 동안 유효합니다</p>
        </div>

        <div className="sent-actions">
          <button
            className="resend-btn"
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? '전송 중...' : '다시 보내기'}
          </button>

          <button className="back-btn secondary" onClick={onBack}>
            다른 방법으로 로그인
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="magic-link-login">
      <button className="back-btn" onClick={onBack} type="button">
        <span className="back-icon">←</span>
        <span>뒤로</span>
      </button>

      <div className="magic-header">
        <div className="magic-icon-wrapper">
          <span className="magic-icon">✨</span>
        </div>
        <h2>매직 링크 로그인</h2>
        <p>비밀번호 없이 이메일만으로 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="magic-email">이메일</label>
          <div className="input-wrapper">
            <span className="input-icon">📧</span>
            <input
              id="magic-email"
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
          className="submit-btn magic"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              <span>전송 중...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">✨</span>
              <span>매직 링크 받기</span>
            </>
          )}
        </button>
      </form>

      <div className="magic-info">
        <div className="info-item">
          <span className="info-icon">🔒</span>
          <span>비밀번호가 필요 없어 더 안전합니다</span>
        </div>
        <div className="info-item">
          <span className="info-icon">⚡</span>
          <span>처음 사용 시 자동으로 계정이 생성됩니다</span>
        </div>
      </div>
    </div>
  );
}
