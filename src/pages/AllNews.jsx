import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { newsAPI } from '../services/api';
import { headlines as fallbackHeadlines, categoryColors, categoryIcons } from '../data/headlines';
import '../styles/AllNews.css';

function AllNews() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 뉴스 데이터 가져오기
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsAPI.getAll();
      if (response.success) {
        setNewsData(response.data);
      } else {
        throw new Error('데이터를 가져올 수 없습니다');
      }
    } catch (err) {
      console.error('[AllNews] 뉴스 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 모든 카테고리 목록
  const allCategoryNames = Object.keys(fallbackHeadlines);
  const categories = useMemo(() => {
    if (newsData?.categories) {
      const apiCategories = Object.keys(newsData.categories);
      return ['all', ...apiCategories];
    }
    return ['all', ...allCategoryNames];
  }, [newsData, allCategoryNames]);

  // 필터링된 뉴스 아이템 (카테고리별 최대 20개)
  const filteredItems = useMemo(() => {
    let items = [];

    if (newsData?.categories) {
      Object.entries(newsData.categories).forEach(([category, newsItems]) => {
        // 카테고리 필터
        if (selectedCategory !== 'all' && category !== selectedCategory) {
          return;
        }

        // 카테고리별 최대 20개
        const limitedItems = newsItems.slice(0, 20);

        limitedItems.forEach((news, idx) => {
          items.push({
            id: `${category}-${idx}`,
            category: category,
            title: news.originalTitle || news.title,
            description: news.snippet || news.rawContent || news.description || '',
            url: news.originalUrl || news.link || news.url,
            publishedDate: news.publishedDate || news.pubDate,
            sourceName: news.sourceName || news.source || '',
            isMain: idx === 0
          });
        });
      });
    } else {
      // Fallback 데이터 사용
      Object.entries(fallbackHeadlines).forEach(([category, headlineItems]) => {
        if (selectedCategory !== 'all' && category !== selectedCategory) {
          return;
        }

        headlineItems.forEach((item, idx) => {
          items.push({
            id: `${category}-fallback-${idx}`,
            category: category,
            title: item.title,
            description: item.description,
            isMain: idx === 0,
            isFallback: true
          });
        });
      });
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [newsData, selectedCategory, searchQuery]);

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
    <Layout>
    <div className="all-news-page">
      <div className="all-news-page-title">
        <h1>전체 정보 보기</h1>
        <p className="header-desc">카테고리별 최대 20개의 정보를 확인하세요</p>
      </div>

      {/* 편집 의도 설명 */}
      <section className="editorial-intent">
        <p>
          이 페이지는 카테고리별로 엄선된 뉴스를 모아 보여드립니다.
          각 기사는 신뢰할 수 있는 언론사 원문을 기반으로 선별되었으며,
          독자의 빠른 이해를 돕기 위해 AI 요약을 함께 제공합니다.
        </p>
        <p>
          단순 기사 나열이 아닌, 각 분야의 핵심 흐름을 파악할 수 있도록
          최신순·중요도 기준으로 편집하고 있습니다.
          원문 보기 링크를 통해 언제든 전체 기사를 확인하실 수 있습니다.
        </p>
      </section>

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

          <div className="news-filters-row">
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

            {selectedCategory !== 'all' && (
              <button className="view-all-btn" onClick={() => setSelectedCategory('all')}>
                📋 전체 보기
              </button>
            )}
            <button className="refresh-btn" onClick={fetchNews} disabled={loading}>
              {loading ? '로딩 중...' : '🔄 새로고침'}
            </button>
          </div>
        </div>

        {/* 통계 */}
        <div className="news-stats">
          <span className="stat-item">
            {selectedCategory === 'all' ? (
              <>총 <strong>{filteredItems.length}</strong>개의 정보 (카테고리별 최대 20개)</>
            ) : (
              <><strong>{selectedCategory}</strong>: {filteredItems.length}개</>
            )}
          </span>
          {newsData?.lastCrawled && (
            <span className="stat-item">
              마지막 업데이트: {formatDate(newsData.lastCrawled)}
            </span>
          )}
          {!newsData && !loading && (
            <span className="stat-item offline-notice">
              ⚠️ 서버 연결 대기 중 - 기본 정보 표시
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
            <button onClick={fetchNews}>다시 시도</button>
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
                  className={`news-card ${item.isMain ? 'main-card' : ''}`}
                  style={{ '--card-color': categoryColors[item.category] || '#667eea' }}
                >
                  <div className="card-header">
                    <span className="card-category">
                      <span className="cat-icon">{categoryIcons[item.category] || '📄'}</span>
                      {item.category}
                    </span>
                    {item.isFallback && (
                      <span className="offline-badge">오프라인</span>
                    )}
                  </div>

                  <h3 className="card-title">{item.title}</h3>

                  {item.description && (
                    <p className="card-description">{item.description}</p>
                  )}

                  <div className="card-footer">
                    {item.publishedDate && (
                      <span className="card-date">{formatDate(item.publishedDate)}</span>
                    )}
                    {item.sourceName && (
                      <span className="card-source">{item.sourceName}</span>
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
                </article>
              ))
            )}
          </div>
        )}

        {/* 운영자 코멘트 */}
        {!loading && !error && filteredItems.length > 0 && (
          <aside className="editor-comment">
            <p>
              위 뉴스는 편집팀이 주요 언론사 보도를 바탕으로 선별·정리한 것입니다.
              뉴스의 정확한 내용은 각 기사의 '원문 보기' 링크를 통해 확인해 주세요.
              제공되는 AI 요약은 참고용이며, 원문의 맥락과 다를 수 있습니다.
            </p>
          </aside>
        )}
      </div>

    </div>
    </Layout>
  );
}

export default AllNews;
