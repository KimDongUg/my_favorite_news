/**
 * 사용자 메뉴 컴포넌트
 * 로그인 상태에 따라 사용자 정보 또는 로그인 버튼 표시
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './UserMenu.css';

export default function UserMenu() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="user-menu-loading">
        <span className="loading-dot"></span>
      </div>
    );
  }

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <div className="user-menu-guest">
        <Link to="/login" className="login-link">
          로그인
        </Link>
      </div>
    );
  }

  // 로그인 상태
  const displayName = user?.displayName || user?.email?.split('@')[0] || '사용자';

  return (
    <div className="user-menu-logged-in">
      <span className="user-greeting">
        <strong>{displayName}</strong>님
      </span>
      <span className="menu-divider">|</span>
      <a href="#" className="logout-link" onClick={handleLogout}>
        로그아웃
      </a>
    </div>
  );
}
