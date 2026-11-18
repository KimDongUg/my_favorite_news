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

  // 사람/봇 분석 상태
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await authFetch(`/auth/admin/stats/analytics?days=${analyticsDays}`);
        if (!cancelled) setAnalytics(res.data || null);
      } catch (e) {
        console.error('분석 통계 로드 실패:', e);
        if (!cancelled) setAnalytics(null);
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
    return () => { cancelled = true; };
  }, [isAdmin, authFetch, analyticsDays]);

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

  const num = (v) => Number(v || 0);
  const fmt = (v) => num(v).toLocaleString();

  // 'YYYY-MM-DD' → 'M/D' (시간대 변환 없이 표시)
  const shortDate = (s) => {
    if (!s) return '-';
    const [, m, d] = String(s).slice(0, 10).split('-');
    return `${Number(m)}/${Number(d)}`;
  };

  const trackingSince = statsSummary?.visitor_tracking_since || null;

  const renderSummaryCard = (label, className, prefix) => {
    const s = statsSummary || {};
    const allSessions = num(s[`${prefix}_all_sessions`] ?? s[`${prefix}_visitors`]);
    const allViews = num(s[`${prefix}_all_pageviews`] ?? s[`${prefix}_views`]);
    const botSessions = num(s[`${prefix}_bot_sessions`]);
    const botRate = allSessions > 0 ? ((botSessions / allSessions) * 100).toFixed(1) : '0.0';
    return (
      <div className={`stat-card ${className}`}>
        <h3>{label} 방문 세션(사람)</h3>
        <span className="stat-number">{fmt(s[`${prefix}_human_sessions`])}</span>
        <ul className="stat-lines">
          <li>
            <span>추정 방문자</span>
            <strong>{trackingSince ? fmt(s[`${prefix}_unique_visitors`]) : '–'}</strong>
          </li>
          <li>
            <span>페이지뷰(사람)</span>
            <strong>{fmt(s[`${prefix}_human_pageviews`])}</strong>
          </li>
          <li>
            <span>봇 세션</span>
            <strong>{fmt(botSessions)} ({botRate}%)</strong>
          </li>
        </ul>
        <small className="stat-note">
          추정 방문자: 배포일{trackingSince ? `(${trackingSince})` : ''} 이후 집계
        </small>
        <small className="stat-legacy">
          전체 기록(봇 포함): {allSessions.toLocaleString()} 세션 · {allViews.toLocaleString()} 페이지뷰
        </small>
      </div>
    );
  };

  const analyticsDaily = analytics?.daily || [];
  const maxAnalyticsVal = Math.max(1, ...analyticsDaily.map(d => Math.max(num(d.human_sessions), num(d.bot_sessions))));

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
                {/* 요약 카드 (사람/봇 구분, 한국 시간 기준) */}
                <div className="admin-stats stats-summary">
                  {renderSummaryCard('오늘', 'stat-today', 'today')}
                  {renderSummaryCard('이번달', 'stat-month', 'month')}
                  {renderSummaryCard('전체', 'stat-total', 'total')}
                </div>

                {/* 사람/봇 분석 */}
                <div className="chart-section">
                  <div className="chart-header">
                    <h2>방문 분석 (사람/봇)</h2>
                    <div className="range-buttons">
                      {[7, 30].map(d => (
                        <button
                          key={d}
                          className={`range-btn ${analyticsDays === d ? 'active' : ''}`}
                          onClick={() => setAnalyticsDays(d)}
                        >
                          {d}일
                        </button>
                      ))}
                    </div>
                  </div>

                  {analyticsLoading && !analytics ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>분석 로딩 중...</p>
                    </div>
                  ) : (
                    <div className={`analytics-body ${analyticsLoading ? 'is-loading' : ''}`}>
                      {/* 1. 일별 추이 */}
                      <div className="analytics-block">
                        <div className="analytics-block-header">
                          <h3>일별 추이</h3>
                          <div className="chart-legend">
                            <span><i className="legend-dot legend-human"></i>사람 세션</span>
                            <span><i className="legend-dot legend-bot"></i>봇 세션</span>
                          </div>
                        </div>
                        {analyticsDaily.length === 0 ? (
                          <p className="no-data">아직 데이터가 없습니다.</p>
                        ) : (
                          <div className="bar-chart bar-chart-pair">
                            {analyticsDaily.map((d) => (
                              <div key={d.date} className="bar-item">
                                <div className="bar-wrap bar-pair">
                                  <div
                                    className="bar bar-human"
                                    style={{ height: `${(num(d.human_sessions) / maxAnalyticsVal) * 100}%` }}
                                    title={`${d.date}: 사람 ${fmt(d.human_sessions)} 세션`}
                                  >
                                    {analyticsDays === 7 && <span className="bar-val">{num(d.human_sessions)}</span>}
                                  </div>
                                  <div
                                    className="bar bar-bot"
                                    style={{ height: `${(num(d.bot_sessions) / maxAnalyticsVal) * 100}%` }}
                                    title={`${d.date}: 봇 ${fmt(d.bot_sessions)} 세션`}
                                  >
                                    {analyticsDays === 7 && <span className="bar-val">{num(d.bot_sessions)}</span>}
                                  </div>
                                </div>
                                <span className="bar-label">{shortDate(d.date)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="analytics-grid">
                        {/* 2. 유입 경로 */}
                        <div className="analytics-block">
                          <h3>유입 경로 TOP 10</h3>
                          {(analytics?.referrers || []).length === 0 ? (
                            <p className="no-data">데이터가 없습니다.</p>
                          ) : (
                            <div className="users-table-container">
                              <table className="users-table analytics-table">
                                <thead><tr><th>유입 경로</th><th className="num">사람 세션</th></tr></thead>
                                <tbody>
                                  {analytics.referrers.map((r) => (
                                    <tr key={r.source}>
                                      <td className="td-text">{r.source}</td>
                                      <td className="num">{fmt(r.sessions)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* 3. 인기 페이지 */}
                        <div className="analytics-block">
                          <h3>인기 페이지 TOP 10</h3>
                          {(analytics?.top_pages || []).length === 0 ? (
                            <p className="no-data">데이터가 없습니다.</p>
                          ) : (
                            <div className="users-table-container">
                              <table className="users-table analytics-table">
                                <thead><tr><th>페이지</th><th className="num">사람 세션</th><th className="num">페이지뷰</th></tr></thead>
                                <tbody>
                                  {analytics.top_pages.map((p) => (
                                    <tr key={p.path}>
                                      <td className="td-text" title={p.path}>{p.path}</td>
                                      <td className="num">{fmt(p.sessions)}</td>
                                      <td className="num">{fmt(p.pageviews)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* 4. 봇 UA + 의심 IP */}
                        <div className="analytics-block">
                          <h3>봇 User-Agent TOP 10</h3>
                          {(analytics?.bots || []).length === 0 ? (
                            <p className="no-data">데이터가 없습니다.</p>
                          ) : (
                            <div className="users-table-container">
                              <table className="users-table analytics-table">
                                <thead><tr><th>User-Agent</th><th className="num">봇 세션</th></tr></thead>
                                <tbody>
                                  {analytics.bots.map((b) => (
                                    <tr key={b.user_agent}>
                                      <td className="td-text" title={b.user_agent}>{b.user_agent}</td>
                                      <td className="num">{fmt(b.sessions)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div className="analytics-block">
                          <h3>의심 IP <small className="block-note">하루 사람 세션 20개 초과 · 자동 제외하지 않음</small></h3>
                          {(analytics?.suspicious_ips || []).length === 0 ? (
                            <p className="no-data">의심 IP가 없습니다.</p>
                          ) : (
                            <div className="users-table-container">
                              <table className="users-table analytics-table">
                                <thead><tr><th>IP</th><th>날짜</th><th className="num">사람 세션</th><th></th></tr></thead>
                                <tbody>
                                  {analytics.suspicious_ips.map((r) => (
                                    <tr key={`${r.ip_address}-${r.date}`}>
                                      <td className="td-text">{r.ip_address}</td>
                                      <td>{r.date}</td>
                                      <td className="num">{fmt(r.sessions)}</td>
                                      <td><span className="badge-suspect">의심</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 일별 차트 */}
                <div className="chart-section">
                  <div className="chart-header">
                    <h2>일별 방문자 <small className="block-note">전체 기록(봇 포함)</small></h2>
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
                          <span className="bar-label">{shortDate(d.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 월별 차트 */}
                <div className="chart-section">
                  <div className="chart-header">
                    <h2>월별 방문자 <small className="block-note">전체 기록(봇 포함)</small></h2>
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
                            <th>구분</th>
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
                              <td className="td-flags">
                                {v.is_bot && <span className="badge-bot" title={v.user_agent || '(빈 UA)'}>봇</span>}
                                {v.is_admin && <span className="badge-admin">관리자</span>}
                                {!v.is_bot && !v.is_admin && <span className="badge-anon">사람</span>}
                              </td>
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
