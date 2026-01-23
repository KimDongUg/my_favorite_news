import { memo } from 'react';

const TickerControls = memo(function TickerControls({
  categories,
  visibleCategories,
  onToggleCategory,
  speedMultiplier,
  onSpeedChange,
}) {
  return (
    <div className="ticker-controls" role="toolbar" aria-label="티커 제어">
      {/* 카테고리 토글 */}
      <div className="controls-section">
        <h3 className="controls-title">카테고리 표시</h3>
        <div className="category-toggles">
          {categories.map((cat) => (
            <label key={cat.name} className="toggle-label">
              <input
                type="checkbox"
                checked={visibleCategories[cat.name]}
                onChange={() => onToggleCategory(cat.name)}
                aria-label={`${cat.name} 카테고리 ${visibleCategories[cat.name] ? '숨기기' : '표시'}`}
              />
              <span
                className="toggle-indicator"
                style={{ '--toggle-color': cat.color }}
              >
                {cat.icon}
              </span>
              <span className="toggle-text">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 속도 조절 */}
      <div className="controls-section">
        <h3 className="controls-title">
          스크롤 속도: {speedMultiplier.toFixed(1)}x
        </h3>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speedMultiplier}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="speed-slider"
          aria-label="스크롤 속도 조절"
        />
        <div className="speed-labels">
          <span>느림</span>
          <span>보통</span>
          <span>빠름</span>
        </div>
      </div>
    </div>
  );
});

export default TickerControls;
