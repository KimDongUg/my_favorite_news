import { memo } from 'react';

const TickerItem = memo(function TickerItem({ item, color, onItemClick }) {
  const handleClick = () => {
    onItemClick?.(item);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onItemClick?.(item);
    }
  };

  return (
    <article
      className="ticker-item"
      style={{ '--item-color': color }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.title}: ${item.description}`}
    >
      <h4 className="ticker-item-title">{item.title}</h4>
      <p className="ticker-item-description">{item.description}</p>
    </article>
  );
});

export default TickerItem;
