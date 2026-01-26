import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TickerItem = memo(function TickerItem({ item, color, onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    if (!isAuthenticated) {
      // 클릭한 기사 URL 저장 (로그인 후 열기 위해)
      const articleUrl = item.url || item.sources?.[0]?.url;
      if (articleUrl) {
        localStorage.setItem('pendingArticleUrl', articleUrl);
      }
      navigate('/login', { state: { from: location } });
      return;
    }
    onItemClick?.(item);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isAuthenticated) {
        // 클릭한 기사 URL 저장 (로그인 후 열기 위해)
        const articleUrl = item.url || item.sources?.[0]?.url;
        if (articleUrl) {
          localStorage.setItem('pendingArticleUrl', articleUrl);
        }
        navigate('/login', { state: { from: location } });
        return;
      }
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
