/**
 * 로그인 페이지
 * 소셜/이메일/매직링크 로그인 통합
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import EmailLogin from '../components/auth/EmailLogin';
import MagicLinkLogin from '../components/auth/MagicLinkLogin';
import '../styles/Auth.css';

export default function Login() {
  const [mode, setMode] = useState('social'); // social, email, magic

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <span className="logo-globe">💫</span>
              <span className="logo-heart">🌈</span>
            </div>
            <div className="auth-logo-text">무빙아티클(Moving Article)</div>
          </div>
          <h1>환영합니다</h1>
          <p>나만의 정보 대시보드에 로그인하세요</p>
        </div>

        {/* 소셜 로그인 (기본) */}
        {mode === 'social' && (
          <div className="social-login-section">
            <SocialLoginButtons />

            <div className="auth-divider">
              <span>또는</span>
            </div>

            <div className="alternative-logins">
              <button
                className="alt-login-btn email"
                onClick={() => setMode('email')}
              >
                <span className="btn-icon">📧</span>
                <span>이메일로 로그인</span>
              </button>

              <button
                className="alt-login-btn magic"
                onClick={() => setMode('magic')}
              >
                <span className="btn-icon">✨</span>
                <span>매직 링크로 로그인</span>
              </button>
            </div>
          </div>
        )}

        {/* 이메일 로그인 */}
        {mode === 'email' && (
          <EmailLogin onBack={() => setMode('social')} />
        )}

        {/* 매직 링크 로그인 */}
        {mode === 'magic' && (
          <MagicLinkLogin onBack={() => setMode('social')} />
        )}

        <div className="auth-footer">
          <p>
            계정이 없으신가요?{' '}
            <Link to="/signup">회원가입</Link>
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
