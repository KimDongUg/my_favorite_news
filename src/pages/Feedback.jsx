import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPosts, getCategories } from '../services/feedbackApi';
import '../styles/Feedback.css';

const CATEGORIES = [
  { id: 'all', name: '전체', icon: '📋' },
  { id: 'suggestion', name: '기능 제안', icon: '💡' },
  { id: 'bug', name: '버그 신고', icon: '🐛' },
  { id: 'question', name: '문의사항', icon: '❓' },
  { id: 'general', name: '자유게시판', icon: '💬' },
  { id: 'praise', name: '칭찬해요', icon: '⭐' }
];

function Feedback() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // URL 파라미터에서 상태 읽기
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // 데이터 로드
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPosts({ category, search, sort, page, limit: 15 });

      if (result.success) {
        setPosts(result.posts);
        setPagination(result.pagination);
      } else {
        setError(result.error || '게시글을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 카테고리 변경
  const handleCategoryChange = (newCategory) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', newCategory);
    params.delete('page');
    setSearchParams(params);
  };

  // 정렬 변경
  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.delete('page');
    setSearchParams(params);
  };

  // 검색
  const [searchInput, setSearchInput] = useState(search);
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    setSearchParams(params);
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  // 날짜 포맷
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 카테고리 정보 가져오기
  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || { icon: '📄', name: categoryId };
  };

  return (
    <div className="feedback-page-container">
      <header className="feedback-header">
        <Link to="/" className="back-link">← 홈으로</Link>
        <h1>고객 의견 게시판</h1>
        <p className="header-desc">서비스 개선을 위한 소중한 의견을 남겨주세요</p>
        <div className="contact-info">
          <p>본 사이트에 대한 문의, 오류 신고, 제휴 문의, 콘텐츠 관련 요청은</p>
          <p>아래 게시판 또는 이메일을 통해 언제든지 연락 주세요.</p>
          <p className="operator-email">운영자 이메일: kduaro124@naver.com</p>
        </div>
      </header>

      <div className="feedback-content">
        {/* 카테고리 탭 */}
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${category === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <span className="tab-icon">{cat.icon}</span>
              <span className="tab-name">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 툴바 */}
        <div className="feedback-toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">검색</button>
          </form>

          <div className="toolbar-right">
            <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="comments">댓글순</option>
            </select>

            {isAuthenticated ? (
              <Link to="/feedback/write" className="write-btn">
                글쓰기
              </Link>
            ) : (
              <Link to="/login" className="write-btn login-required">
                로그인 후 글쓰기
              </Link>
            )}
          </div>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>게시글을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadPosts}>다시 시도</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>아직 게시글이 없습니다.</p>
            {isAuthenticated && (
              <Link to="/feedback/write" className="write-btn">첫 글을 작성해보세요!</Link>
            )}
          </div>
        ) : (
          <>
            <div className="post-list">
              {posts.map(post => {
                const catInfo = getCategoryInfo(post.category);
                return (
                  <Link to={`/feedback/${post.id}`} key={post.id} className="post-item">
                    {post.is_pinned && <span className="pin-badge">📌 고정</span>}
                    <div className="post-category">
                      <span className="cat-icon">{catInfo.icon}</span>
                      <span className="cat-name">{catInfo.name}</span>
                      {post.is_resolved && <span className="resolved-badge">해결됨</span>}
                    </div>
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="author">{post.author_name}</span>
                      <span className="date">{formatDate(post.created_at)}</span>
                      <span className="stats">
                        <span className="views">조회 {post.views}</span>
                        <span className="likes">좋아요 {post.likes}</span>
                        <span className="comments">댓글 {post.comment_count}</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  이전
                </button>
                <span className="page-info">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="feedback-footer">
        <div className="footer-links">
          <Link to="/copyright">저작권 정책</Link>
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
        </div>
        <p>&copy; 2026 무빙아티클(Moving Article). All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Feedback;
