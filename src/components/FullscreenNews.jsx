import { memo, useEffect, useCallback } from 'react';
import HeadlineRotator from './HeadlineRotator';
import MultiLayerTicker from './MultiLayerTicker';
import '../styles/FullscreenNews.css';

const FullscreenNews = memo(function FullscreenNews({
  selectedCategories,
  headlines,
  visibleCategories,
  speedMultiplier,
  onSpeedChange,
  isRefreshing,
  onClose,
}) {
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

  // 실제 브라우저 전체화면 토글
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
        {/* 상단 헤더 */}
        <div className="fullscreen-header">
          <h1 className="fullscreen-title">
            <span className="title-icon">📰</span>
            내가 좋아하는 세상 정보
          </h1>
          <div className="fullscreen-controls">
            <button
              className="fullscreen-btn browser-fullscreen-btn"
              onClick={toggleBrowserFullscreen}
              title="브라우저 전체화면 (F11)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
            <button
              className="fullscreen-btn close-btn"
              onClick={onClose}
              title="닫기 (ESC)"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 실시간 헤드라인 */}
        <div className="fullscreen-headline-section">
          <HeadlineRotator
            selectedCategories={selectedCategories}
            headlines={headlines}
            isLoading={false}
          />
        </div>

        {/* 세상정보 티커 */}
        <div className="fullscreen-ticker-section">
          <MultiLayerTicker
            visibleCategories={visibleCategories}
            speedMultiplier={speedMultiplier}
            onSpeedChange={onSpeedChange}
            headlines={headlines}
            isRefreshing={isRefreshing}
            categoryOrder={selectedCategories}
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
