import { memo, useMemo } from 'react';
import TickerItem from './TickerItem';

const TickerLayer = memo(function TickerLayer({
  category,
  items,
  color,
  icon,
  speed = 30,
  layerIndex = 1,
  isVisible = true,
  onItemClick,
  onLayerClick,
}) {
  // 무한 스크롤을 위해 아이템을 복제 (3배로 복제)
  const duplicatedItems = useMemo(
    () => [...items, ...items, ...items],
    [items]
  );

  // 그라데이션 색상 생성 (카테고리 색상 기반)
  const gradientStyle = useMemo(
    () => ({
      '--layer-color': color,
      '--layer-color-dark': `${color}33`,
      '--layer-color-light': `${color}11`,
      '--animation-duration': `${speed}s`,
    }),
    [color, speed]
  );

  if (!isVisible) return null;

  const handleLabelClick = () => {
    onLayerClick?.(category);
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLayerClick?.(category);
    }
  };

  return (
    <div
      className={`ticker-layer ticker-layer-${layerIndex}`}
      style={gradientStyle}
      role="region"
      aria-label={`${category} 뉴스 티커`}
    >
      <div
        className="ticker-label"
        onClick={handleLabelClick}
        onKeyDown={handleLabelKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${category} 카테고리로 이동`}
      >
        <span className="ticker-icon" aria-hidden="true">{icon}</span>
        <span className="ticker-category">{category}</span>
      </div>
      <div className="ticker-track" aria-live="off">
        <div className="ticker-content">
          {duplicatedItems.map((item, index) => (
            <TickerItem
              key={`${item.id}-${index}`}
              item={item}
              color={color}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default TickerLayer;
