import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import TickerLayer from './TickerLayer';
import DetailModal from './DetailModal';
import { headlines as fallbackHeadlines, categoryColors, categoryIcons } from '../data/headlines';

const MultiLayerTicker = memo(function MultiLayerTicker({
  visibleCategories,
  speedMultiplier = 1,
  onSpeedChange,
  headlines: propHeadlines,
  isRefreshing = false,
  categoryOrder = [],
  isAuthenticated = false,
  allCategories = [],
  visibleLayerCount = null, // 표시할 레이어 수 (null이면 자동 계산)
}) {
  // props로 받은 headlines 사용, 없으면 fallback
  const headlines = propHeadlines || fallbackHeadlines;

  // categoryOrder가 있으면 그 순서대로, 없으면 기본 순서
  const categories = useMemo(() => {
    const allCats = Object.keys(headlines);
    if (categoryOrder.length > 0) {
      // categoryOrder 순서대로 정렬하고, 나머지는 뒤에 추가
      const ordered = categoryOrder.filter((cat) => allCats.includes(cat));
      const remaining = allCats.filter((cat) => !categoryOrder.includes(cat));
      return [...ordered, ...remaining];
    }
    return allCats;
  }, [headlines, categoryOrder]);

  // 아이템 20개 기준 느린 속도 (숫자가 클수록 느림)
  const baseSpeeds = useMemo(() => [240, 220, 230, 250, 236, 244, 224, 256, 216, 260], []);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 비로그인 시 자동 스크롤을 위한 상태
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const containerRef = useRef(null);
  const defaultVisibleCount = 5; // 기본 표시 개수

  // 실제 표시할 레이어 수 계산 (항상 5개, 전체화면은 8개)
  const actualVisibleCount = useMemo(() => {
    if (visibleLayerCount !== null) {
      return visibleLayerCount;
    }
    // 로그인/비로그인 모두 기본 5개 표시
    return defaultVisibleCount;
  }, [visibleLayerCount]);

  // 스크롤 애니메이션 시간 (speedMultiplier에 따라 조절)
  const scrollDuration = useMemo(() => {
    // speedMultiplier가 클수록 빠르게, 작을수록 느리게
    return Math.max(0.8, 2.5 / speedMultiplier);
  }, [speedMultiplier]);

  // 비로그인 시: 모든 카테고리 사용
  // 로그인 시: 선택된 카테고리만 보여줌
  const baseCategories = useMemo(() => {
    if (!isAuthenticated) {
      return allCategories.length > 0 ? allCategories : categories;
    }
    return categories.filter(cat => visibleCategories[cat]);
  }, [isAuthenticated, allCategories, categories, visibleCategories]);

  // 무한 스크롤을 위해 카테고리 복제 (표시 개수만큼 끝에 추가)
  const displayCategories = useMemo(() => {
    // 카테고리가 표시 개수보다 많으면 무한 루프를 위해 복제
    if (baseCategories.length > actualVisibleCount) {
      return [...baseCategories, ...baseCategories.slice(0, actualVisibleCount)];
    }
    return baseCategories;
  }, [baseCategories, actualVisibleCount]);

  // 10초마다 자동 스크롤 (로그인/비로그인 모두 동작)
  useEffect(() => {
    const totalCategories = baseCategories.length;
    if (totalCategories <= actualVisibleCount) {
      setScrollOffset(0);
      return;
    }

    const interval = setInterval(() => {
      setScrollOffset((prev) => {
        const next = prev + 1;
        // 원본 카테고리 수에 도달하면 (복제본 시작점)
        if (next >= totalCategories) {
          // 트랜지션 완료 후 처음으로 순간이동
          setTimeout(() => {
            setIsTransitioning(false);
            setScrollOffset(0);
            // 다음 프레임에서 트랜지션 다시 활성화
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsTransitioning(true);
              });
            });
          }, scrollDuration * 1000);
        }
        return next;
      });
    }, 10000); // 10초

    return () => clearInterval(interval);
  }, [baseCategories.length, scrollDuration, actualVisibleCount]);

  const handleItemClick = useCallback((item, category) => {
    setSelectedItem(item);
    setSelectedCategory(category);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
    setSelectedCategory(null);
  }, []);

  // 레이어 높이 (PC 기준 150px)
  const layerHeight = 150;

  return (
    <div className="multi-layer-ticker">
      {isRefreshing && (
        <div className="refresh-indicator-bar">
          <span className="refresh-indicator">🔄 새로고침 중...</span>
        </div>
      )}
      <div
        className="ticker-container"
        ref={containerRef}
        role="feed"
        aria-label="실시간 뉴스 피드"
        style={{
          '--visible-layers': actualVisibleCount,
        }}
      >
        <div
          className="ticker-scroll-wrapper"
          style={{
            transform: `translateY(-${scrollOffset * layerHeight}px)`,
            transition: isTransitioning ? `transform ${scrollDuration}s ease-in-out` : 'none',
          }}
        >
          {displayCategories.map((category, index) => (
            <TickerLayer
              key={`${category}-${index}`}
              category={category}
              items={headlines[category] || []}
              color={categoryColors[category]}
              icon={categoryIcons[category]}
              speed={baseSpeeds[index % baseSpeeds.length] / speedMultiplier}
              layerIndex={index + 1}
              isVisible={true}
              onItemClick={(item) => handleItemClick(item, category)}
            />
          ))}
        </div>
      </div>

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          category={selectedCategory}
          color={categoryColors[selectedCategory]}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
});

export default MultiLayerTicker;
