import { useState, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import HeadlineRotator from './components/HeadlineRotator';
import MultiLayerTicker from './components/MultiLayerTicker';
import BannerAd from './components/BannerAd';
import { useSummaries } from './hooks/useSummaries';
import { headlines as fallbackHeadlines, categoryColors, categoryIcons } from './data/headlines';

function App() {
  // API에서 요약 데이터 가져오기
  const {
    summaries,
    summariesByCategory,
    loading,
    error,
    isRefreshing,
    refresh,
    lastUpdated,
  } = useSummaries({ autoRefresh: true, refreshInterval: 5 * 60 * 1000 });

  // 모든 카테고리 (fallback 포함)
  const allCategories = useMemo(() => {
    if (summaries.length > 0) {
      return summaries.map((s) => s.category);
    }
    return Object.keys(fallbackHeadlines);
  }, [summaries]);

  // localStorage에서 선택된 카테고리 로드
  const selectedCategories = useMemo(() => {
    const saved = localStorage.getItem('selectedCategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      // API 카테고리와 일치하는 것만 필터링
      return parsed.filter((cat) => allCategories.includes(cat));
    }
    // 기본값: 처음 5개 카테고리
    return allCategories.slice(0, 5);
  }, [allCategories]);

  // 상태 관리
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

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

  // API 데이터를 기존 형식으로 변환
  const headlines = useMemo(() => {
    if (summaries.length === 0) {
      return fallbackHeadlines;
    }

    // 각 카테고리별로 요약 데이터를 headlines 형식으로 변환
    const apiHeadlines = {};

    summaries.forEach((summary) => {
      const category = summary.category;

      // 메인 요약을 첫 번째 아이템으로
      const mainItem = {
        id: summary.id || `${category}-main`,
        title: summary.aiTitle,
        description: summary.aiSummary,
        sources: summary.sources,
        generatedAt: summary.generatedAt,
        isAI: !summary.isFallback,
      };

      // 소스들을 추가 아이템으로
      const sourceItems = (summary.sources || []).map((source, idx) => ({
        id: `${category}-source-${idx}`,
        title: source.originalTitle,
        description: `출처: ${source.name}`,
        url: source.url,
        publishedDate: source.publishedDate,
      }));

      apiHeadlines[category] = [mainItem, ...sourceItems];
    });

    return apiHeadlines;
  }, [summaries]);

  return (
    <Layout categoryCount={selectedCategories.length}>
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
      />

      {/* 멀티 레이어 티커 */}
      <MultiLayerTicker
        visibleCategories={visibleCategories}
        speedMultiplier={speedMultiplier}
        onSpeedChange={handleSpeedChange}
        headlines={headlines}
        isRefreshing={isRefreshing}
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
    </Layout>
  );
}

export default App;
