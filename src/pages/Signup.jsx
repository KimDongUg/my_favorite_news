/**
 * 회원가입 페이지
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import '../styles/Auth.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('social'); // social, email
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || undefined,
      });

      if (result.emailVerificationSent) {
        navigate('/verify-email-sent', { state: { email: formData.email } });
      }
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">📰</span>
            <span className="logo-text">MyNews</span>
          </div>
          <h1>회원가입</h1>
          <p>나만의 맞춤 뉴스 대시보드를 만들어보세요</p>
        </div>

        {step === 'social' && (
          <div className="social-login-section">
            <SocialLoginButtons />

            <div className="auth-divider">
              <span>또는</span>
            </div>

            <button
              className="alt-login-btn email"
              onClick={() => setStep('email')}
            >
              <span className="btn-icon">📧</span>
              <span>이메일로 가입</span>
            </button>
          </div>
        )}

        {step === 'email' && (
          <div className="email-signup">
            <button className="back-btn" onClick={() => setStep('social')} type="button">
              <span className="back-icon">←</span>
              <span>뒤로</span>
            </button>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="displayName">이름 (선택)</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="홍길동"
                    value={formData.displayName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">이메일 *</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">비밀번호 *</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="input-hint">영문, 숫자 포함 8자 이상</p>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">비밀번호 확인 *</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 재입력"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
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
                    <span>가입 중...</span>
                  </>
                ) : (
                  '회원가입'
                )}
              </button>
            </form>
          </div>
        )}

        <div className="auth-footer">
          <p>
            이미 계정이 있으신가요?{' '}
            <Link to="/login">로그인</Link>
          </p>
        </div>

        <p className="terms-notice">
          가입 시 <Link to="/terms">이용약관</Link> 및{' '}
          <Link to="/privacy">개인정보처리방침</Link>에 동의하게 됩니다.
        </p>
      </div>

      <div className="auth-bg-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
}
