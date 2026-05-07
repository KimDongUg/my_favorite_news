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
  const [activeTab, setActiveTab] = useState('stats');

  // 통계 상태
  const [statsSummary, setStatsSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dailyRange, setDailyRange] = useState(30);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated) { navigate('/login'); return; }
      try {
        const response = await authFetch('/auth/admin/check');
        if (response.data?.isAdmin) {
          setIsAdmin(true);
        } else {
          setError('관리자 권한이 없습니다.');
        }
      } catch {
        setError('관리자 권한이 없습니다.');
      }
    };
    if (!authLoading) checkAdmin();
  }, [isAuthenticated, authLoading, authFetch, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await authFetch('/auth/admin/users');
        setUsers(response.data?.users || []);
      } catch {
        setError('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isAdmin, authFetch]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [summaryRes, dailyRes, monthlyRes, visitorsRes] = await Promise.all([
          authFetch('/auth/admin/stats/summary'),
          authFetch(`/auth/admin/stats/daily?days=${dailyRange}`),
          authFetch('/auth/admin/stats/monthly?months=12'),
          authFetch('/auth/admin/stats/visitors?limit=200'),
        ]);
        setStatsSummary(summaryRes.data);
        setDailyStats(dailyRes.data || []);
        setMonthlyStats(monthlyRes.data || []);
        setVisitors(visitorsRes.data || []);
      } catch (e) {
        console.error('통계 로드 실패:', e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [isAdmin, authFetch, dailyRange]);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDateShort = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('ko-KR', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const parseUA = (ua = '') => {
    if (!ua) return '-';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Mobile') || ua.includes('Android')) return '모바일';
    return 'Other';
  };

  const maxDailyVal = Math.max(1, ...dailyStats.map(d => Number(d.unique_visitors)));
  const maxMonthlyVal = Math.max(1, ...monthlyStats.map(d => Number(d.unique_visitors)));

  if (authLoading) {
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
        </header>

        {/* 탭 */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            접속 통계
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            사용자 관리
          </button>
        </div>

        {/* ───── 접속 통계 탭 ───── */}
        {activeTab === 'stats' && (
          <div className="stats-tab">
            {statsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>통계 로딩 중...</p>
              </div>
            ) : (
              <>
                {/* 요약 카드 */}
                <div className="admin-stats stats-summary">
                  <div className="stat-card stat-today">
                    <h3>오늘 방문자</h3>
                    <span className="stat-number">{Number(statsSummary?.today_visitors || 0).toLocaleString()}</span>
                    <small>{Number(statsSummary?.today_views || 0).toLocaleString()} 페이지뷰</small>
                  </div>
                  <div className="stat-card stat-month">
                    <h3>이번달 방문자</h3>
                    <span className="stat-number">{Number(statsSummary?.month_visitors || 0).toLocaleString()}</span>
                    <small>{Number(statsSummary?.month_views || 0).toLocaleString()} 페이지뷰</small>
                  </div>
                  <div className="stat-card stat-total">
                    <h3>전체 방문자</h3>
                    <span className="stat-number">{Number(statsSummary?.total_visitors || 0).toLocaleString()}</span>
                    <small>{Number(statsSummary?.total_views || 0).toLocaleString()} 페이지뷰</small>
                  </div>
                </div>

                {/* 일별 차트 */}
                <div className="chart-section">
                  <div className="chart-header">
                    <h2>일별 방문자</h2>
                    <div className="range-buttons">
                      {[7, 14, 30].map(d => (
                        <button
                          key={d}
                          className={`range-btn ${dailyRange === d ? 'active' : ''}`}
                          onClick={() => setDailyRange(d)}
                        >
                          {d}일
                        </button>
                      ))}
                    </div>
                  </div>
                  {dailyStats.length === 0 ? (
                    <p className="no-data">아직 데이터가 없습니다.</p>
                  ) : (
                    <div className="bar-chart">
                      {dailyStats.map((d) => (
                        <div key={d.date} className="bar-item">
                          <div className="bar-wrap">
                            <div
                              className="bar"
                              style={{ height: `${(Number(d.unique_visitors) / maxDailyVal) * 100}%` }}
                              title={`${d.date}: 방문자 ${d.unique_visitors}명 / ${d.total_views} 뷰`}
                            >
                              <span className="bar-val">{d.unique_visitors}</span>
                            </div>
                          </div>
                          <span className="bar-label">
                            {new Date(d.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 월별 차트 */}
                <div className="chart-section">
                  <div className="chart-header">
                    <h2>월별 방문자</h2>
                  </div>
                  {monthlyStats.length === 0 ? (
                    <p className="no-data">아직 데이터가 없습니다.</p>
                  ) : (
                    <div className="bar-chart bar-chart-monthly">
                      {monthlyStats.map((d) => (
                        <div key={d.month} className="bar-item">
                          <div className="bar-wrap">
                            <div
                              className="bar bar-green"
                              style={{ height: `${(Number(d.unique_visitors) / maxMonthlyVal) * 100}%` }}
                              title={`${d.month}: 방문자 ${d.unique_visitors}명 / ${d.total_views} 뷰`}
                            >
                              <span className="bar-val">{d.unique_visitors}</span>
                            </div>
                          </div>
                          <span className="bar-label">{d.month.slice(5)}월</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 접속자 목록 */}
                <div className="chart-section">
                  <div className="chart-header">
                    <h2>최근 접속자 목록</h2>
                    <span className="visitor-count">{visitors.length}건</span>
                  </div>
                  {visitors.length === 0 ? (
                    <p className="no-data">접속 기록이 없습니다.</p>
                  ) : (
                    <div className="users-table-container">
                      <table className="users-table visitors-table">
                        <thead>
                          <tr>
                            <th>시간</th>
                            <th>페이지</th>
                            <th>IP</th>
                            <th>브라우저</th>
                            <th>로그인</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors.map((v) => (
                            <tr key={v.id}>
                              <td className="td-time">{formatDateShort(v.visited_at)}</td>
                              <td className="td-path">{v.path}</td>
                              <td className="td-ip">{v.ip_address || '-'}</td>
                              <td className="td-ua">{parseUA(v.user_agent)}</td>
                              <td>
                                {v.user_email
                                  ? <span className="badge-login">{v.user_name || v.user_email}</span>
                                  : <span className="badge-anon">비회원</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ───── 사용자 관리 탭 ───── */}
        {activeTab === 'users' && (
          <div>
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
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>로딩 중...</p>
                </div>
              ) : users.length === 0 ? (
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
                                <img src={item.user.avatarUrl} alt="" className="user-avatar" />
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
        )}
      </div>
    </div>
  );
}

export default Admin;
