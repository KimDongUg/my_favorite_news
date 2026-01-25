import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSummaries } from '../hooks/useSummaries';
import { categoryColors, categoryIcons } from '../data/headlines';
import '../styles/AllNews.css';

function AllNews() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const { summaries, loading, error, refresh, lastUpdated } = useSummaries({
    autoRefresh: false
  });

  // 모든 카테고리 목록
  const categories = useMemo(() => {
    return ['all', ...summaries.map(s => s.category)];
  }, [summaries]);

  // 필터링된 뉴스 아이템
  const filteredItems = useMemo(() => {
    let items = [];

    summaries.forEach(summary => {
      // 카테고리 필터
      if (selectedCategory !== 'all' && summary.category !== selectedCategory) {
        return;
      }

      // 메인 요약
      const mainItem = {
        id: `${summary.category}-main`,
        category: summary.category,
        title: summary.aiTitle,
        description: summary.aiSummary,
        sources: summary.sources,
        isMain: true,
        isAI: !summary.isFallback,
        generatedAt: summary.generatedAt
      };
      items.push(mainItem);

      // 소스 뉴스들
      (summary.sources || []).forEach((source, idx) => {
        items.push({
          id: `${summary.category}-source-${idx}`,
          category: summary.category,
          title: source.originalTitle,
          description: `출처: ${source.name}`,
          url: source.url,
          publishedDate: source.publishedDate,
          sourceName: source.name,
          isMain: false
        });
      });
    });

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [summaries, selectedCategory, searchQuery]);

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="all-news-page">
      <header className="all-news-header">
        <Link to="/" className="back-link">← 홈으로</Link>
        <h1>전체 뉴스 보기</h1>
        <p className="header-desc">크롤링된 모든 뉴스를 확인하세요</p>
      </header>

      <div className="all-news-content">
        {/* 필터 영역 */}
        <div className="news-filters">
          <div className="category-filter">
            <label>카테고리</label>
            <div className="category-buttons">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    '--cat-color': cat === 'all' ? '#667eea' : (categoryColors[cat] || '#667eea')
                  }}
                >
                  <span className="cat-icon">
                    {cat === 'all' ? '📋' : (categoryIcons[cat] || '📄')}
                  </span>
                  <span className="cat-name">{cat === 'all' ? '전체' : cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="search-filter">
            <input
              type="text"
              placeholder="뉴스 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <button className="refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? '로딩 중...' : '🔄 새로고침'}
          </button>
        </div>

        {/* 통계 */}
        <div className="news-stats">
          <span className="stat-item">
            총 <strong>{filteredItems.length}</strong>개의 뉴스
          </span>
          {lastUpdated && (
            <span className="stat-item">
              마지막 업데이트: {formatDate(lastUpdated)}
            </span>
          )}
        </div>

        {/* 로딩/에러 상태 */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>뉴스를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>데이터를 불러올 수 없습니다.</p>
            <button onClick={refresh}>다시 시도</button>
          </div>
        )}

        {/* 뉴스 목록 */}
        {!loading && !error && (
          <div className="news-list">
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                <p>표시할 뉴스가 없습니다.</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <article
                  key={item.id}
                  className={`news-card ${item.isMain ? 'main-card' : 'source-card'}`}
                  style={{ '--card-color': categoryColors[item.category] || '#667eea' }}
                >
                  <div className="card-header">
                    <span className="card-category">
                      <span className="cat-icon">{categoryIcons[item.category] || '📄'}</span>
                      {item.category}
                    </span>
                    {item.isMain && item.isAI && (
                      <span className="ai-badge">AI 요약</span>
                    )}
                    {item.isMain && !item.isAI && (
                      <span className="fallback-badge">기본 요약</span>
                    )}
                  </div>

                  <h3 className="card-title">{item.title}</h3>

                  <p className="card-description">{item.description}</p>

                  <div className="card-footer">
                    {item.publishedDate && (
                      <span className="card-date">{formatDate(item.publishedDate)}</span>
                    )}
                    {item.generatedAt && (
                      <span className="card-date">생성: {formatDate(item.generatedAt)}</span>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-link"
                      >
                        원문 보기 →
                      </a>
                    )}
                  </div>

                  {/* 소스 목록 (메인 카드에만) */}
                  {item.isMain && item.sources && item.sources.length > 0 && (
                    <div className="card-sources">
                      <h4>출처 ({item.sources.length}개)</h4>
                      <ul>
                        {item.sources.map((source, idx) => (
                          <li key={idx}>
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              <span className="source-name">{source.name}</span>
                              <span className="source-title">{source.originalTitle}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}
      </div>

      <footer className="all-news-footer">
        <p>&copy; 2026 내가 좋아하는 세상 정보. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AllNews;
