import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Monitoring.css';

const API_BASE = 'http://localhost:3001/api';

function ComplianceMonitoring() {
  const [stats, setStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [regenerating, setRegenerating] = useState(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, violationsRes, checklistRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/compliance/stats`),
        fetch(`${API_BASE}/compliance/violations`),
        fetch(`${API_BASE}/compliance/checklist`),
        fetch(`${API_BASE}/compliance/audit/history`)
      ]);

      const statsData = await statsRes.json();
      const violationsData = await violationsRes.json();
      const checklistData = await checklistRes.json();
      const historyData = await historyRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (violationsData.success) setViolations(violationsData.failedSummaries || []);
      if (checklistData.success) setChecklist(checklistData);
      if (historyData.success) setAuditHistory(historyData.history || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 전체 감사 실행
  const runAudit = async () => {
    try {
      setAuditing(true);
      const res = await fetch(`${API_BASE}/compliance/audit`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        alert(`감사 완료: ${data.result.passed}/${data.result.total} 통과`);
        loadData();
      }
    } catch (error) {
      alert('감사 실행 실패');
    } finally {
      setAuditing(false);
    }
  };

  // 위반 요약 재생성
  const regenerate = async (category) => {
    try {
      setRegenerating(category);
      const res = await fetch(
        `${API_BASE}/compliance/regenerate/${encodeURIComponent(category)}`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (data.success) {
        alert(`${category} 재생성 완료`);
        loadData();
      } else {
        alert(`재생성 실패: ${data.error}`);
      }
    } catch (error) {
      alert('재생성 실패');
    } finally {
      setRegenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="monitoring-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-page">
      <header className="monitoring-header">
        <div className="header-left">
          <Link to="/" className="back-link">← 대시보드로 돌아가기</Link>
          <h1>저작권 컴플라이언스 모니터링</h1>
        </div>
        <button
          className="audit-btn"
          onClick={runAudit}
          disabled={auditing}
        >
          {auditing ? '감사 중...' : '전체 감사 실행'}
        </button>
      </header>

      {/* 통계 카드 */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>전체 요약</h3>
          <p className="stat-number">{stats?.totalSummaries || 0}</p>
        </div>
        <div className="stat-card success">
          <h3>검증 통과</h3>
          <p className="stat-number">{stats?.passedValidation || 0}</p>
        </div>
        <div className="stat-card warning">
          <h3>검증 실패</h3>
          <p className="stat-number">{stats?.failedValidation || 0}</p>
        </div>
        <div className="stat-card info">
          <h3>통과율</h3>
          <p className="stat-number">{stats?.passRate || 'N/A'}</p>
        </div>
      </section>

      {/* 체크리스트 상태 */}
      {checklist && (
        <section className="checklist-section">
          <h2>
            컴플라이언스 체크리스트
            <span className={`status-badge ${checklist.allPassed ? 'passed' : 'failed'}`}>
              {checklist.allPassed ? '✓ 전체 통과' : '⚠ 점검 필요'}
            </span>
          </h2>

          <div className="checklist-grid">
            {Object.entries(checklist.status).map(([category, items]) => (
              <div key={category} className="checklist-category">
                <h4>{getCategoryLabel(category)}</h4>
                <ul>
                  {Object.entries(items).map(([item, passed]) => (
                    <li key={item} className={passed ? 'passed' : 'failed'}>
                      <span className="check-icon">{passed ? '✓' : '✗'}</span>
                      <span>{checklist.checklist[category]?.[item] || item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 위반 목록 */}
      <section className="violations-section">
        <h2>검증 실패 요약 ({violations.length})</h2>

        {violations.length === 0 ? (
          <div className="empty-state">
            <p>검증 실패한 요약이 없습니다.</p>
          </div>
        ) : (
          <div className="violations-list">
            {violations.map((v) => (
              <div key={v.id} className="violation-item">
                <div className="violation-header">
                  <span className="category-badge">{v.category}</span>
                  <h4>{v.aiTitle}</h4>
                </div>
                <div className="violation-details">
                  {v.validationDetails && (
                    <ul className="detail-list">
                      {v.validationDetails.hasLongQuote && (
                        <li className="detail-item warning">15단어 이상 직접 인용 감지</li>
                      )}
                      {v.validationDetails.similarityScore >= 0.6 && (
                        <li className="detail-item warning">
                          유사도 높음 ({(v.validationDetails.similarityScore * 100).toFixed(1)}%)
                        </li>
                      )}
                      {v.validationDetails.transformationRatio <= 0.5 && (
                        <li className="detail-item warning">
                          변형도 부족 ({(v.validationDetails.transformationRatio * 100).toFixed(1)}%)
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="violation-actions">
                  <button
                    className="regenerate-btn"
                    onClick={() => regenerate(v.category)}
                    disabled={regenerating === v.category}
                  >
                    {regenerating === v.category ? '재생성 중...' : '재생성'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 감사 이력 */}
      <section className="history-section">
        <h2>감사 이력</h2>

        {auditHistory.length === 0 ? (
          <div className="empty-state">
            <p>감사 이력이 없습니다.</p>
          </div>
        ) : (
          <div className="history-list">
            {auditHistory.map((audit, idx) => (
              <div key={idx} className="history-item">
                <div className="history-date">
                  {new Date(audit.auditedAt).toLocaleString('ko-KR')}
                </div>
                <div className="history-stats">
                  <span className="passed">{audit.passed} 통과</span>
                  <span className="separator">/</span>
                  <span className="failed">{audit.failed} 실패</span>
                  <span className="separator">/</span>
                  <span className="total">{audit.total} 전체</span>
                </div>
                {audit.violations?.length > 0 && (
                  <div className="history-violations">
                    위반: {audit.violations.map(v => v.category).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 법적 고지 */}
      <section className="legal-section">
        <h2>법적 정책</h2>
        <div className="legal-links">
          <a href="/legal/about" target="_blank" rel="noopener noreferrer">서비스 소개</a>
          <a href="/legal/copyright" target="_blank" rel="noopener noreferrer">저작권 정책</a>
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a>
          <a href="/legal/dmca" target="_blank" rel="noopener noreferrer">DMCA 정책</a>
        </div>
      </section>
    </div>
  );
}

// 카테고리 라벨 변환
function getCategoryLabel(category) {
  const labels = {
    content: '콘텐츠 안전',
    technical: '기술적 검증',
    legal: '법적 요구사항',
    operational: '운영 정책'
  };
  return labels[category] || category;
}

export default ComplianceMonitoring;
