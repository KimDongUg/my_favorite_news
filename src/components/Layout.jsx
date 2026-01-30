import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserMenu from "./auth/UserMenu";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_EMAILS = ['kduaro124@naver.com'];

function Layout({ children, categoryCount = 5, speedMultiplier = 1, onSpeedChange }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = isAuthenticated && user?.email && ADMIN_EMAILS.includes(user.email);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // 로그인 필요한 페이지 클릭 핸들러
  const handleProtectedClick = (e, targetPath) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login', { state: { from: { pathname: targetPath } } });
    }
  };

  return (
    <div className="layout">
      <header className={`header-redesign${scrolled ? ' header-scrolled' : ''}`}>
        <div className="header-inner">
          {/* 왼쪽: 로고 */}
          <Link to="/" className="header-logo-link">
            <div className="header-logo">
              <div className="header-logo-icon">
                <span className="logo-emoji-main">💫</span>
                <span className="logo-emoji-sub">🌈</span>
              </div>
              <div className="header-logo-text">
                <h1>무빙아티클 <span className="logo-en">Moving Article</span></h1>
                <p>실시간 뉴스가 흐르는 곳</p>
              </div>
            </div>
          </Link>

          {/* 오른쪽: 데스크탑 액션들 */}
          <div className="header-actions-desktop">
            <Link to="/news" className="header-action-btn">
              <span>📋</span>
              <span>모든 아티클 보기</span>
            </Link>
            <Link
              to="/settings"
              className="header-action-btn"
              onClick={(e) => handleProtectedClick(e, '/settings')}
            >
              <span>❤️</span>
              <span>아티클 설정 ({categoryCount})</span>
            </Link>
            <Link
              to="/feedback"
              className="header-action-btn"
              onClick={(e) => handleProtectedClick(e, '/feedback')}
            >
              <span>💬</span>
              <span>고객 의견 게시판</span>
            </Link>
            {onSpeedChange && (
              <div className="header-speed">
                <span className="speed-emoji">🐢</span>
                <input
                  type="range"
                  min="0.3"
                  max="5"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="header-speed-slider"
                  aria-label="스크롤 속도 조절"
                />
                <span className="speed-emoji">🐰</span>
                <span className="speed-val">{speedMultiplier.toFixed(1)}x</span>
              </div>
            )}
            <div className="header-user-area">
              <UserMenu />
            </div>
          </div>

          {/* 모바일: 햄버거 버튼 */}
          <button
            className={`hamburger-btn${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        <div className={`mobile-menu${mobileMenuOpen ? ' mobile-menu-open' : ''}`}>
          {onSpeedChange && (
            <div className="mobile-speed">
              <span className="speed-emoji">🐢</span>
              <input
                type="range"
                min="0.3"
                max="5"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="header-speed-slider"
                aria-label="스크롤 속도 조절"
              />
              <span className="speed-emoji">🐰</span>
              <span className="speed-val">{speedMultiplier.toFixed(1)}x</span>
            </div>
          )}
          <Link to="/news" className="mobile-menu-item">
            <span>📋</span> 모든 아티클 보기
          </Link>
          <Link
            to="/settings"
            className="mobile-menu-item"
            onClick={(e) => handleProtectedClick(e, '/settings')}
          >
            <span>❤️</span> 아티클 설정 ({categoryCount})
          </Link>
          <Link
            to="/feedback"
            className="mobile-menu-item"
            onClick={(e) => handleProtectedClick(e, '/feedback')}
          >
            <span>💬</span> 고객 의견 게시판
          </Link>
          <div className="mobile-menu-item mobile-user-area">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-links">
          <a href="/copyright.html">저작권 정책</a>
          <span className="footer-divider">|</span>
          <a href="/terms.html">이용약관</a>
          <span className="footer-divider">|</span>
          <a href="/privacy.html">개인정보처리방침</a>
          <span className="footer-divider">|</span>
          <a href="/feedback.html">문의하기</a>
          {isAdmin && (
            <>
              <span className="footer-divider">|</span>
              <Link to="/admin" className="admin-link">관리자</Link>
            </>
          )}
        </div>
        <p className="footer-copyright">
          &copy; 2026 무빙아티클(Moving Article). All rights reserved.
        </p>
        <p className="footer-author">
          운영자(김동욱) 이메일: kduaro124@naver.com
        </p>
        <p className="footer-notice">
          본 서비스의 요약 콘텐츠는 AI가 생성한 것으로, 원본 기사 링크를 통해
          상세 내용을 확인하세요.
        </p>
      </footer>
    </div>
  );
}

export default Layout;
