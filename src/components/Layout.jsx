import { Link } from "react-router-dom";
import UserMenu from "./auth/UserMenu";

function Layout({ children, categoryCount = 5 }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-overlay"></div>
        <div className="header-content">
          <div className="header-nav">
            <div className="logo">
              <div className="logo-icon">
                <span className="logo-globe">🌏</span>
                <span className="logo-heart">💜</span>
              </div>
              <div>
                <h1 style={{ color: "white" }}>내가 좋아하는 세상 정보</h1>
                <p style={{ color: "#d1d5db" }}>
                  실시간으로 만나는 맞춤형 뉴스(Beta)
                </p>
              </div>
            </div>
            <div className="header-actions">
              <UserMenu />
              <Link to="/settings" className="header-btn settings-btn">
                <span className="btn-icon">⚙️</span>
                <span className="btn-text">카테고리 ({categoryCount})</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-links">
          <Link to="/monitoring">저작권 모니터링</Link>
          <span className="footer-divider">|</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("이용약관 페이지");
            }}
          >
            이용약관
          </a>
          <span className="footer-divider">|</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("개인정보처리방침");
            }}
          >
            개인정보처리방침
          </a>
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
