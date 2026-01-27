import { useState, useCallback, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import HeadlineRotator from './components/HeadlineRotator';
import MultiLayerTicker from './components/MultiLayerTicker';
import BannerAd from './components/BannerAd';
import FullscreenNews from './components/FullscreenNews';
import { useSummaries } from './hooks/useSummaries';
import { newsAPI } from './services/api';
import { headlines as fallbackHeadlines, categoryColors, categoryIcons } from './data/headlines';
import { useAuth } from './contexts/AuthContext';

function App() {
  // 인증 상태
  const { isAuthenticated } = useAuth();

  // API에서 요약 데이터 가져오기
  const {
    summaries,
    summariesByCategory,
    loading: summaryLoading,
    error: summaryError,
    isRefreshing,
    refresh,
    lastUpdated,
  } = useSummaries({ autoRefresh: true, refreshInterval: 5 * 60 * 1000 });

  // 뉴스 데이터 상태
  const [newsData, setNewsData] = useState({});
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // 뉴스 데이터 가져오기
  const fetchNews = useCallback(async () => {
    try {
      setNewsLoading(true);
      const response = await newsAPI.getAll();
      if (response.success) {
        // API 응답 구조: { success, data: { categories: { ... } } }
        setNewsData(response.data?.categories || {});
      }
    } catch (err) {
      console.error('[App] 뉴스 데이터 로드 실패:', err);
      setNewsError(err.message);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // 초기 뉴스 로드
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 통합 로딩/에러 상태
  const loading = summaryLoading || newsLoading;
  const error = summaryError || newsError;

  // 모든 카테고리 (fallback 포함)
  const allCategories = useMemo(() => {
    if (summaries.length > 0) {
      return summaries.map((s) => s.category);
    }
    return Object.keys(fallbackHeadlines);
  }, [summaries]);

  // 선택된 카테고리를 상태로 관리 (순서 포함)
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('selectedCategories');
    if (saved) {
      return JSON.parse(saved);
    }
    return allCategories.slice(0, 5);
  });

  // allCategories가 로드되면 selectedCategories 유효성 검사
  useEffect(() => {
    if (allCategories.length > 0) {
      setSelectedCategories((prev) => {
        const validCategories = prev.filter((cat) => allCategories.includes(cat));
        if (validCategories.length === 0) {
          return allCategories.slice(0, 5);
        }
        return validCategories;
      });
    }
  }, [allCategories]);

  // 카테고리 업데이트 이벤트 리스너
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      const saved = localStorage.getItem('selectedCategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedCategories(parsed.filter((cat) => allCategories.includes(cat)));
      }
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, [allCategories]);

  // 상태 관리
  const [speedMultiplier, setSpeedMultiplier] = useState(2.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 선택된 카테고리만 visible로 설정
  const visibleCategories = useMemo(
    () =>
      allCategories.reduce(
        (acc, cat) => ({
          ...acc,
          [cat]: selectedCategories.includes(cat),
        }),
        {}
      ),
    [allCategories, selectedCategories]
  );

  // 속도 변경
  const handleSpeedChange = useCallback((multiplier) => {
    setSpeedMultiplier(multiplier);
  }, []);

  // 전체화면 토글
  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const handleFullscreenClose = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // API 데이터를 기존 형식으로 변환 (요약 + 뉴스 결합)
  const headlines = useMemo(() => {
    // 뉴스 데이터도 없고 요약도 없으면 fallback 사용
    if (summaries.length === 0 && Object.keys(newsData).length === 0) {
      return fallbackHeadlines;
    }

    const apiHeadlines = {};

    // 모든 카테고리 수집 (요약과 뉴스 모두에서)
    const allCategories = new Set([
      ...summaries.map(s => s.category),
      ...Object.keys(newsData)
    ]);

    allCategories.forEach((category) => {
      const items = [];
      const summary = summaries.find(s => s.category === category);
      const categoryNews = newsData[category] || [];

      // AI 요약이 있으면 첫 번째 아이템으로 추가
      if (summary && summary.aiTitle) {
        items.push({
          id: summary.id || `${category}-main`,
          title: summary.aiTitle,
          description: summary.aiSummary,
          sources: summary.sources,
          generatedAt: summary.generatedAt,
          isAI: !summary.isFallback,
        });
      }

      // 뉴스 데이터 추가 (최대 20개)
      categoryNews.slice(0, 20).forEach((news, idx) => {
        items.push({
          id: `${category}-news-${idx}`,
          title: news.originalTitle || news.title,
          description: news.snippet || news.rawContent || news.description || '',
          url: news.originalUrl || news.link || news.url,
          publishedDate: news.publishedDate || news.pubDate,
          sourceName: news.sourceName || news.source || '',
        });
      });

      if (items.length > 0) {
        apiHeadlines[category] = items;
      }
    });

    return Object.keys(apiHeadlines).length > 0 ? apiHeadlines : fallbackHeadlines;
  }, [summaries, newsData]);

  return (
    <Layout
      categoryCount={selectedCategories.length}
      speedMultiplier={speedMultiplier}
      onSpeedChange={handleSpeedChange}
    >
      {/* 로딩/에러 상태 표시 */}
      {loading && !isRefreshing && (
        <div className="loading-bar">
          <div className="loading-spinner"></div>
          <span>데이터를 불러오는 중...</span>
        </div>
      )}

      {/* 에러 시 안내 배너 */}
      {error && (
        <div className="error-bar">
          <span>⚠️ 서버 연결 실패 - 오프라인 데이터 표시 중</span>
        </div>
      )}

      {/* 실시간 헤드라인 (네이버 스타일) */}
      <HeadlineRotator
        selectedCategories={selectedCategories}
        headlines={headlines}
        isLoading={loading}
        onFullscreen={handleFullscreenToggle}
      />

      {/* 멀티 레이어 티커 */}
      <MultiLayerTicker
        visibleCategories={visibleCategories}
        speedMultiplier={speedMultiplier}
        onSpeedChange={handleSpeedChange}
        headlines={headlines}
        isRefreshing={isRefreshing}
        categoryOrder={selectedCategories}
        isAuthenticated={isAuthenticated}
        allCategories={allCategories}
      />

      {/* 배너 광고 */}
      <BannerAd />

      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <div className="last-updated">
          마지막 업데이트: {new Date(lastUpdated).toLocaleString('ko-KR')}
          {isRefreshing && <span className="refreshing-indicator"> 🔄</span>}
        </div>
      )}

      {/* 전체화면 모드 */}
      {isFullscreen && (
        <FullscreenNews
          selectedCategories={selectedCategories}
          headlines={headlines}
          visibleCategories={visibleCategories}
          speedMultiplier={speedMultiplier}
          onSpeedChange={handleSpeedChange}
          isRefreshing={isRefreshing}
          onClose={handleFullscreenClose}
        />
      )}
    </Layout>
  );
}

export default App;
