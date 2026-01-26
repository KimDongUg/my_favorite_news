import { memo, useEffect, useMemo, useCallback } from 'react';
import HeadlineRotator from './HeadlineRotator';
import MultiLayerTicker from './MultiLayerTicker';
import '../styles/FullscreenNews.css';

// 카테고리 우선순위 (headlines.js 순서 기반)
const CATEGORY_PRIORITY = [
  '속보', '정치', '경제·금융', '범죄·법', '국내', '국제', '건강',
  '연예·문화', '스포츠', 'IT·기술', '라이프', '교육', '환경',
  '칼럼·사설', '여행', '음식', '휴먼스토리', '과학', '취업·직장', '재테크'
];

const FULLSCREEN_CATEGORY_COUNT = 8;

const FullscreenNews = memo(function FullscreenNews({
  selectedCategories,
  headlines,
  visibleCategories,
  speedMultiplier,
  onSpeedChange,
  isRefreshing,
  onClose,
}) {
  // 전체화면용 카테고리 계산 (항상 8개)
  const fullscreenCategories = useMemo(() => {
    // 사용자가 선택한 카테고리
    const userSelected = selectedCategories || [];

    // 8개 이상이면 8개까지만 자르기
    if (userSelected.length >= FULLSCREEN_CATEGORY_COUNT) {
      return userSelected.slice(0, FULLSCREEN_CATEGORY_COUNT);
    }

    // 8개 미만이면 우선순위가 높은 미선택 카테고리로 채우기
    const result = [...userSelected];
    const availableCategories = Object.keys(headlines);

    // 우선순위 순서대로 미선택 카테고리 추가
    for (const category of CATEGORY_PRIORITY) {
      if (result.length >= FULLSCREEN_CATEGORY_COUNT) break;
      if (!result.includes(category) && availableCategories.includes(category)) {
        result.push(category);
      }
    }

    // 그래도 부족하면 headlines에 있는 나머지 카테고리 추가
    for (const category of availableCategories) {
      if (result.length >= FULLSCREEN_CATEGORY_COUNT) break;
      if (!result.includes(category)) {
        result.push(category);
      }
    }

    return result;
  }, [selectedCategories, headlines]);

  // 전체화면용 visibleCategories 계산
  const fullscreenVisibleCategories = useMemo(() => {
    const visible = {};
    fullscreenCategories.forEach(cat => {
      visible[cat] = true;
    });
    return visible;
  }, [fullscreenCategories]);

  // 전체화면용 headlines 필터링 (8개 카테고리만)
  const fullscreenHeadlines = useMemo(() => {
    const filtered = {};
    fullscreenCategories.forEach(cat => {
      if (headlines[cat]) {
        filtered[cat] = headlines[cat];
      }
    });
    return filtered;
  }, [fullscreenCategories, headlines]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // 브라우저 전체화면 토글
  const toggleBrowserFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  return (
    <div className="fullscreen-news-overlay">
      <div className="fullscreen-news-container">
        {/* 상단 컨트롤 버튼들 */}
        <div className="fullscreen-controls">
          <button
            className="fullscreen-ctrl-btn expand-btn"
            onClick={toggleBrowserFullscreen}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            <span className="tooltip">전체보기 (F11)</span>
          </button>
          <button
            className="fullscreen-ctrl-btn close-btn"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span className="tooltip">닫기 (ESC)</span>
          </button>
        </div>

        {/* 실시간 헤드라인 */}
        <div className="fullscreen-headline-section">
          <HeadlineRotator
            selectedCategories={fullscreenCategories}
            headlines={fullscreenHeadlines}
            isLoading={false}
            showFullscreenButton={false}
          />
        </div>

        {/* 세상정보 티커 */}
        <div className="fullscreen-ticker-section">
          <MultiLayerTicker
            visibleCategories={fullscreenVisibleCategories}
            speedMultiplier={speedMultiplier}
            onSpeedChange={onSpeedChange}
            headlines={fullscreenHeadlines}
            isRefreshing={isRefreshing}
            categoryOrder={fullscreenCategories}
          />
        </div>

        {/* 하단 정보 */}
        <div className="fullscreen-footer">
          <span className="footer-hint">ESC를 눌러 닫기</span>
          {isRefreshing && <span className="refreshing-badge">🔄 업데이트 중...</span>}
        </div>
      </div>
    </div>
  );
});

export default FullscreenNews;
