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
}) {
  // props로 받은 headlines 사용, 없으면 fallback
  const headlines = propHeadlines || fallbackHeadlines;
  const categories = useMemo(() => Object.keys(headlines), [headlines]);
  const baseSpeeds = useMemo(() => [40, 35, 38, 42, 37, 39, 36, 41, 34, 43], []);

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
          min="0.5"
          max="2"
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
