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
    console.log(`[TickerLayer ${category}] 애니메이션 시작:`, {
      isVisible,
      contentRef: !!contentRef.current,
      itemCount: duplicatedItems.length
    });

    if (!isVisible || !contentRef.current) {
      console.log(`[TickerLayer ${category}] 애니메이션 중단: visible=${isVisible}, ref=${!!contentRef.current}`);
      return;
    }

    const content = contentRef.current;
    // reduced motion이면 속도를 1/3로 줄임
    const adjustedSpeed = prefersReducedMotion ? speed * 3 : speed;
    const pixelsPerSecond = 100 / adjustedSpeed * 70; // 속도 증가 (50 → 70)
    let lastTime = performance.now();
    let frameCount = 0;

    console.log(`[TickerLayer ${category}] 애니메이션 설정:`, {
      speed,
      adjustedSpeed,
      pixelsPerSecond,
      contentWidth: content.scrollWidth
    });

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
      if (contentWidth > 0 && Math.abs(positionRef.current) >= contentWidth) {
        positionRef.current = 0;
      }

      // transform3d 사용하여 GPU 가속
      content.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

      // 첫 100프레임만 로그
      if (frameCount < 100 && frameCount % 30 === 0) {
        console.log(`[TickerLayer ${category}] 애니메이션 진행:`, {
          frame: frameCount,
          position: positionRef.current,
          contentWidth
        });
      }
      frameCount++;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      console.log(`[TickerLayer ${category}] 애니메이션 정리`);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, speed, isPaused, prefersReducedMotion, category, duplicatedItems.length]);

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
