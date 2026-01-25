/**
 * 관리자 페이지 - 사용자 설정 관리
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { categoryIcons } from '../data/headlines';
import '../styles/Admin.css';

function Admin() {
  const navigate = useNavigate();
  const { isAuthenticated, user, authFetch, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        const response = await authFetch('/auth/admin/check');
        if (response.data?.isAdmin) {
          setIsAdmin(true);
        } else {
          setError('관리자 권한이 없습니다.');
        }
      } catch (err) {
        console.error('[Admin] 권한 확인 실패:', err);
        setError('관리자 권한이 없습니다.');
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [isAuthenticated, authLoading, authFetch, navigate]);

  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        const response = await authFetch('/auth/admin/users');
        setUsers(response.data?.users || []);
      } catch (err) {
        console.error('[Admin] 사용자 목록 로드 실패:', err);
        setError('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, authFetch]);

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="error-state">
            <h2>접근 불가</h2>
            <p>{error}</p>
            <Link to="/" className="back-btn">홈으로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <Link to="/" className="back-link">← 홈으로</Link>
          <h1>관리자 페이지</h1>
          <p>사용자 설정 현황</p>
        </header>

        <div className="admin-stats">
          <div className="stat-card">
            <h3>전체 사용자</h3>
            <span className="stat-number">{users.length}</span>
          </div>
          <div className="stat-card">
            <h3>설정 완료</h3>
            <span className="stat-number">
              {users.filter(u => u.preferences?.preferredCategories?.length > 0).length}
            </span>
          </div>
        </div>

        <div className="users-section">
          <h2>사용자 목록</h2>

          {users.length === 0 ? (
            <div className="empty-state">
              <p>등록된 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>이메일</th>
                    <th>가입일</th>
                    <th>최근 로그인</th>
                    <th>설정 수정일</th>
                    <th>선호 카테고리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.user.id}>
                      <td>
                        <div className="user-info">
                          {item.user.avatarUrl ? (
                            <img
                              src={item.user.avatarUrl}
                              alt=""
                              className="user-avatar"
                            />
                          ) : (
                            <div className="user-avatar-placeholder">
                              {item.user.displayName?.[0] || item.user.email[0].toUpperCase()}
                            </div>
                          )}
                          <span className="user-name">
                            {item.user.displayName || item.user.username || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="email-cell">{item.user.email}</td>
                      <td>{formatDate(item.user.createdAt)}</td>
                      <td>{formatDate(item.user.lastLoginAt)}</td>
                      <td>{formatDate(item.preferences?.updatedAt)}</td>
                      <td>
                        <div className="categories-cell">
                          {item.preferences?.preferredCategories?.length > 0 ? (
                            <div className="category-tags">
                              {item.preferences.preferredCategories.map((cat, idx) => (
                                <span key={idx} className="category-tag">
                                  {categoryIcons[cat] || '📌'} {cat}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-settings">설정 없음</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
