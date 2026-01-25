import { Link } from "react-router-dom";
import UserMenu from "./auth/UserMenu";
import { useAuth } from "../contexts/AuthContext";

function Layout({ children, categoryCount = 5 }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-overlay"></div>
        <div className="header-content">
          <div className="header-top">
            <div className="logo">
              <div className="logo-icon">
                <span className="logo-globe">🌏</span>
                <span className="logo-heart">💜</span>
              </div>
              <div>
                <h1 style={{ color: "white" }}>내가 좋아하는 세상 정보</h1>
                <p style={{ color: "#d1d5db" }}>
                  실시간으로 만나는 맞춤형 뉴스
                </p>
              </div>
              <div className="header-login">
                <UserMenu />
              </div>
            </div>
          </div>
          <div className="header-actions-row">
            <Link to={isAuthenticated ? "/settings" : "/login"} className="header-btn settings-btn">
              <span className="btn-icon">⚙️</span>
              <span className="btn-text">좋아하는 정보 설정하기 ({categoryCount})</span>
            </Link>
            <Link to="/feedback" className="header-btn feedback-btn">
              <span className="btn-icon">💬</span>
              <span className="btn-text">고객 의견 게시판</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-links">
          <Link to="/copyright">저작권 정책</Link>
          <span className="footer-divider">|</span>
          <Link to="/terms">이용약관</Link>
          <span className="footer-divider">|</span>
          <Link to="/privacy">개인정보처리방침</Link>
        </div>
        <p className="footer-copyright">
          &copy; 2026 내가 좋아하는 세상 정보. All rights reserved.
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
