import { memo, useState, useCallback, useMemo } from 'react';
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

  const handleItemClick = useCallback((item, category) => {
    setSelectedItem(item);
    setSelectedCategory(category);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
    setSelectedCategory(null);
  }, []);

  const visibleCount = useMemo(
    () => Object.values(visibleCategories).filter(Boolean).length,
    [visibleCategories]
  );

  return (
    <div className="multi-layer-ticker">
      <div className="mini-speed-control ticker-speed">
        {isRefreshing && <span className="refresh-indicator">🔄</span>}
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.1"
          value={speedMultiplier}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="mini-speed-slider"
          aria-label="스크롤 속도"
        />
        <span className="mini-speed-label">{speedMultiplier.toFixed(1)}x</span>
      </div>
      <div
        className="ticker-container"
        role="feed"
        aria-label="실시간 뉴스 피드"
        style={{ '--visible-layers': visibleCount }}
      >
        {categories.map((category, index) => (
          <TickerLayer
            key={category}
            category={category}
            items={headlines[category] || []}
            color={categoryColors[category]}
            icon={categoryIcons[category]}
            speed={baseSpeeds[index % baseSpeeds.length] / speedMultiplier}
            layerIndex={index + 1}
            isVisible={visibleCategories[category]}
            onItemClick={(item) => handleItemClick(item, category)}
          />
        ))}
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
