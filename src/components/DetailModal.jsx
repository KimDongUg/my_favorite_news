import { memo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DetailModal = memo(function DetailModal({ item, category, color, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // 링크 클릭 시 로그인 체크
  const handleLinkClick = (e, url) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // 클릭한 기사 URL 저장 (로그인 후 열기 위해)
      if (url) {
        localStorage.setItem('pendingArticleUrl', url);
      }
      onClose();
      navigate('/login', { state: { from: location } });
      return;
    }
    // 로그인된 경우 새 탭에서 열기
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    // 모달 열릴 때 닫기 버튼에 포커스
    closeButtonRef.current?.focus();

    // ESC 키로 모달 닫기
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // 배경 스크롤 방지
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 배경 클릭 시 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!item) return null;

  // URL이 있으면 해당 URL로, 없으면 sources 첫 번째 URL 사용
  const detailUrl = item.url || item.sources?.[0]?.url;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-content"
        ref={modalRef}
        style={{ '--modal-color': color }}
      >
        <button
          ref={closeButtonRef}
          className="modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="modal-header">
          <div className="modal-badges">
            <span className="modal-category" style={{ background: color }}>
              {category}
            </span>
            {item.isAI && (
              <span className="modal-ai-badge">AI 요약</span>
            )}
          </div>
          <h2 id="modal-title" className="modal-title">{item.title}</h2>
        </div>

        <div className="modal-body">
          <p className="modal-description">{item.description}</p>

          {/* 출처 정보 (저작권 안전장치) */}
          {item.sources && item.sources.length > 0 && (
            <div className="modal-sources">
              <h4>출처</h4>
              <ul className="source-list">
                {item.sources.map((source, idx) => (
                  <li key={idx} className="source-item">
                    <a
                      href={source.url}
                      onClick={(e) => handleLinkClick(e, source.url)}
                      className="source-link"
                    >
                      <span className="source-name">{source.name}</span>
                      <span className="source-title">{source.originalTitle}</span>
                    </a>
                    {source.publishedDate && (
                      <span className="source-date">
                        {new Date(source.publishedDate).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-meta">
            {item.generatedAt && (
              <span className="modal-date">
                생성: {new Date(item.generatedAt).toLocaleString('ko-KR')}
              </span>
            )}
            {!item.generatedAt && (
              <span className="modal-date">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {detailUrl ? (
            <a
              href={detailUrl}
              onClick={(e) => handleLinkClick(e, detailUrl)}
              className="modal-btn modal-btn-primary"
              style={{ background: color }}
            >
              원문 보기 ↗
            </a>
          ) : (
            <button className="modal-btn modal-btn-primary" style={{ background: color }}>
              자세히 보기
            </button>
          )}
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
});

export default DetailModal;
