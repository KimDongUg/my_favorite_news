import { memo, useMemo, useRef, useEffect, useState } from 'react';
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
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const positionRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  // JavaScript 기반 애니메이션 (모바일 호환)
  useEffect(() => {
    if (!isVisible || !contentRef.current) return;

    const content = contentRef.current;
    // reduced motion이면 속도를 1/3로 줄임
    const adjustedSpeed = prefersReducedMotion ? speed * 3 : speed;
    const pixelsPerSecond = 100 / adjustedSpeed * 50; // 속도 조절
    let lastTime = performance.now();

    const animate = (currentTime) => {
      if (isPaused) {
        lastTime = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      positionRef.current -= pixelsPerSecond * deltaTime;

      // 컨텐츠 너비의 1/5 이동하면 리셋 (5배 복제했으므로)
      const contentWidth = content.scrollWidth / 5;
      if (Math.abs(positionRef.current) >= contentWidth) {
        positionRef.current = 0;
      }

      // transform3d 사용하여 GPU 가속
      content.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, speed, isPaused, prefersReducedMotion]);

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

  // 터치/마우스 이벤트로 일시정지
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);
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
        tabIndex={0}
        role="button"
        aria-label={`${category} 카테고리로 이동`}
      >
        <span className="ticker-icon" aria-hidden="true">{icon}</span>
        <span className="ticker-category">{category}</span>
      </div>
      <div
        className="ticker-track"
        aria-live="off"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="ticker-content ticker-content-js"
          ref={contentRef}
          style={{
            willChange: 'transform',
            transform: 'translate3d(0, 0, 0)',
          }}
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
