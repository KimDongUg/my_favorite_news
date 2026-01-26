import { useState, useEffect, memo, useMemo } from 'react';
import { headlines as fallbackHeadlines, categoryColors, categoryIcons } from '../data/headlines';

const HeadlineRotator = memo(function HeadlineRotator({
  selectedCategories,
  headlines: propHeadlines,
  isLoading = false,
  onFullscreen,
  showFullscreenButton = true,
}) {

  // props로 받은 headlines 사용, 없으면 fallback
  const headlines = propHeadlines || fallbackHeadlines;

  // 선택된 카테고리에서 조회수가 높은 헤드라인 가져오기
  const topHeadlines = useMemo(() => {
    const categories = selectedCategories || Object.keys(headlines);
    return categories
      .filter((category) => headlines[category] && headlines[category].length > 0)
      .map((category) => {
        const firstItem = headlines[category][0];
        return {
          category,
          color: categoryColors[category],
          icon: categoryIcons[category],
          headline: {
            title: firstItem.title || firstItem.aiTitle || '제목 없음',
            description: firstItem.description || firstItem.aiSummary || '',
          },
          isAI: firstItem.isAI || false,
          sources: firstItem.sources || [],
        };
      });
  }, [selectedCategories, headlines]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 헤드라인 클릭 핸들러
  const handleHeadlineClick = (e) => {
    e.preventDefault();
    const current = topHeadlines[currentIndex];
    const articleUrl = current.sources?.[0]?.url;

    if (articleUrl) {
      window.open(articleUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (topHeadlines.length === 0) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % topHeadlines.length);
        setIsAnimating(false);
      }, 300);
    }, 3000); // 3초마다 변경

    return () => clearInterval(interval);
  }, [topHeadlines.length]);

  // 인덱스가 범위를 벗어나면 리셋
  useEffect(() => {
    if (currentIndex >= topHeadlines.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, topHeadlines.length]);

  if (topHeadlines.length === 0) {
    return null;
  }

  const current = topHeadlines[currentIndex];

  return (
    <div className="headline-rotator-inline">
      <div className="rotator-current-category" style={{ '--cat-color': current.color }}>
        <span className="current-cat-icon">{current.icon}</span>
        <span className="current-cat-name">{current.category}</span>
        {current.isAI && <span className="ai-badge" title="AI 생성 요약">AI</span>}
      </div>
      <div
        className={`rotator-content-inline ${isAnimating ? 'fade-out' : 'fade-in'}`}
        onClick={handleHeadlineClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleHeadlineClick(e)}
        style={{ cursor: 'pointer' }}
      >
        <span className="rotator-title-text">{current.headline.title}</span>
        <span className="rotator-desc-text">{current.headline.description}</span>
      </div>

      {/* 출처 링크 (저작권 안전장치) */}
      {current.sources && current.sources.length > 0 && (
        <div className="rotator-sources">
          {current.sources.slice(0, 2).map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
              title={source.originalTitle}
            >
              {source.name}
            </a>
          ))}
        </div>
      )}

      <div className="rotator-indicators">
        {topHeadlines.map((item, index) => (
          <button
            key={item.category}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            style={{ '--indicator-color': item.color }}
            onClick={() => setCurrentIndex(index)}
            aria-label={`${item.category} 헤드라인으로 이동`}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* 전체화면 버튼 */}
      {showFullscreenButton && onFullscreen && (
        <button
          className="fullscreen-toggle-btn"
          onClick={onFullscreen}
          title="전체화면으로 보기"
          aria-label="전체화면으로 보기"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>
      )}

      {isLoading && (
        <div className="rotator-loading">
          <span className="loading-dot"></span>
        </div>
      )}
    </div>
  );
});

export default HeadlineRotator;
