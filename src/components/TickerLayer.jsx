import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // prefers-reduced-motion 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 무한 스크롤을 위해 아이템을 충분히 복제 (5배로 복제)
  const duplicatedItems = useMemo(
    () => [...items, ...items, ...items, ...items, ...items],
    [items]
  );

  // 그라데이션 색상 생성 (카테고리 색상 기반)
  const gradientStyle = useMemo(
    () => ({
      '--layer-color': color,
      '--layer-color-dark': `${color}33`,
      '--layer-color-light': `${color}11`,
    }),
    [color]
  );

  // CSS 애니메이션만 사용 - JavaScript 비활성화
  // useEffect는 hover 제어에만 사용
  useEffect(() => {
    if (!contentRef.current) return;
    
    const content = contentRef.current;
    
    // CSS 변수로 속도 조절
    const duration = prefersReducedMotion ? speed * 3 : speed;
    content.style.animationDuration = `${duration}s`;

    // hover 시 일시정지
    if (isPaused) {
      content.style.animationPlayState = 'paused';
    } else {
      content.style.animationPlayState = 'running';
    }
    
  }, [isVisible, speed, isPaused, prefersReducedMotion, category, duplicatedItems.length]);

  if (!isVisible) return null;

  const handleLabelClick = () => {
    // 전체 뉴스 페이지로 이동
    navigate(`/news?category=${encodeURIComponent(category)}`);
    onLayerClick?.(category);
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLabelClick();
    }
  };

  const handleLabelMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleLabelMouseLeave = () => {
    setShowTooltip(false);
  };

  // 마우스 호버만 일시정지 (터치는 제외)
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      className={`ticker-layer ticker-layer-${layerIndex}`}
      style={gradientStyle}
      role="region"
      aria-label={`${category} 뉴스 티커`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="ticker-label"
        onClick={handleLabelClick}
        onKeyDown={handleLabelKeyDown}
        onMouseEnter={handleLabelMouseEnter}
        onMouseLeave={handleLabelMouseLeave}
        tabIndex={0}
        role="button"
        aria-label={`${category} 전체 뉴스 보기`}
      >
        <span className="ticker-icon" aria-hidden="true">{icon}</span>
        <span className="ticker-category">{category}</span>
        {showTooltip && (
          <div className="ticker-tooltip">
            클릭하시면 전체 정보를 볼 수 있습니다
          </div>
        )}
      </div>
      <div
        className="ticker-track"
        aria-live="off"
      >
        <div
          className="ticker-content ticker-content-js"
          ref={contentRef}
        >
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
