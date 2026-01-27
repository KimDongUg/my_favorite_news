import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getPost,
  deletePost,
  toggleLike,
  toggleResolve,
  togglePin,
  getComments,
  createComment,
  deleteComment
} from '../services/feedbackApi';
import '../styles/Feedback.css';

const CATEGORIES = {
  suggestion: { name: '기능 제안', icon: '💡' },
  bug: { name: '버그 신고', icon: '🐛' },
  question: { name: '문의사항', icon: '❓' },
  general: { name: '자유게시판', icon: '💬' },
  praise: { name: '칭찬해요', icon: '⭐' }
};

function FeedbackPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAuthor = user && post && post.author_id === user.id;
  const isAdmin = user && user.role === 'admin';

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [postResult, commentsResult] = await Promise.all([
        getPost(id),
        getComments(id)
      ]);

      if (postResult.success) {
        setPost(postResult.post);
      } else {
        setError(postResult.error || '게시글을 찾을 수 없습니다.');
      }

      if (commentsResult.success) {
        setComments(commentsResult.comments);
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 좋아요
  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    const result = await toggleLike(id);
    if (result.success) {
      setPost(prev => ({
        ...prev,
        likes: result.likes,
        userLiked: result.liked
      }));
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    const result = await deletePost(id);
    if (result.success) {
      alert('삭제되었습니다.');
      navigate('/feedback');
    } else {
      alert(result.error || '삭제에 실패했습니다.');
    }
  };

  // 해결 상태 토글 (관리자)
  const handleResolve = async () => {
    const result = await toggleResolve(id);
    if (result.success) {
      setPost(prev => ({ ...prev, is_resolved: result.isResolved }));
    }
  };

  // 고정 상태 토글 (관리자)
  const handlePin = async () => {
    const result = await togglePin(id);
    if (result.success) {
      setPost(prev => ({ ...prev, is_pinned: result.isPinned }));
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmitting(true);
    const result = await createComment(id, commentContent);
    setSubmitting(false);

    if (result.success) {
      setCommentContent('');
      // 댓글 목록 다시 로드
      const commentsResult = await getComments(id);
      if (commentsResult.success) {
        setComments(commentsResult.comments);
        setPost(prev => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }));
      }
    } else {
      alert(result.error || '댓글 작성에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPost(prev => ({ ...prev, comment_count: Math.max(0, (prev.comment_count || 1) - 1) }));
    } else {
      alert(result.error || '삭제에 실패했습니다.');
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="feedback-page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="feedback-page-container">
        <div className="error-state">
          <p>{error || '게시글을 찾을 수 없습니다.'}</p>
          <Link to="/feedback" className="back-btn">목록으로</Link>
        </div>
      </div>
    );
  }

  const catInfo = CATEGORIES[post.category] || { name: post.category, icon: '📄' };

  return (
    <div className="feedback-page-container">
      <header className="feedback-header">
        <Link to="/feedback" className="back-link">← 목록으로</Link>
        <h1>고객 의견 게시판</h1>
      </header>

      <div className="feedback-content post-detail">
        {/* 게시글 */}
        <article className="post-article">
          <div className="post-header">
            <div className="post-badges">
              {post.is_pinned && <span className="pin-badge">📌 고정</span>}
              {post.is_resolved && <span className="resolved-badge">✓ 해결됨</span>}
              <span className="category-badge">
                {catInfo.icon} {catInfo.name}
              </span>
            </div>
            <h2 className="post-title">{post.title}</h2>
            <div className="post-info">
              <span className="author">
                {post.author_name}
                {post.author_role === 'admin' && <span className="admin-badge">관리자</span>}
              </span>
              <span className="date">{formatDate(post.created_at)}</span>
              <span className="views">조회 {post.views}</span>
            </div>
          </div>

          <div className="post-body">
            <div className="post-content">{post.content}</div>
          </div>

          <div className="post-actions">
            <button
              className={`like-btn ${post.userLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {post.userLiked ? '❤️' : '🤍'} 좋아요 {post.likes}
            </button>

            {(isAuthor || isAdmin) && (
              <div className="author-actions">
                {isAuthor && (
                  <Link to={`/feedback/edit/${id}`} className="edit-btn">수정</Link>
                )}
                <button onClick={handleDelete} className="delete-btn">삭제</button>
              </div>
            )}

            {isAdmin && (
              <div className="admin-actions">
                <button onClick={handleResolve} className="admin-btn">
                  {post.is_resolved ? '미해결 처리' : '해결 처리'}
                </button>
                <button onClick={handlePin} className="admin-btn">
                  {post.is_pinned ? '고정 해제' : '상단 고정'}
                </button>
              </div>
            )}
          </div>
        </article>

        {/* 댓글 섹션 */}
        <section className="comments-section">
          <h3>댓글 ({comments.length})</h3>

          {/* 댓글 작성 폼 */}
          {isAuthenticated ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 작성하세요 (500자 이내)"
                maxLength={500}
                rows={3}
              />
              <div className="comment-form-footer">
                <span className="char-count">{commentContent.length}/500</span>
                <button type="submit" disabled={submitting || !commentContent.trim()}>
                  {submitting ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </form>
          ) : (
            <div className="login-prompt">
              <Link to="/login">로그인</Link> 후 댓글을 작성할 수 있습니다.
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="comment-list">
            {comments.length === 0 ? (
              <p className="no-comments">아직 댓글이 없습니다.</p>
            ) : (
              comments.map(comment => {
                const isCommentAuthor = user && comment.author_id === user.id;
                return (
                  <div
                    key={comment.id}
                    className={`comment-item ${comment.is_admin_reply ? 'admin-reply' : ''}`}
                  >
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.author_name}
                        {comment.is_admin_reply && <span className="admin-badge">관리자</span>}
                      </span>
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                    {(isCommentAuthor || isAdmin) && (
                      <button
                        className="comment-delete"
                        onClick={() => handleCommentDelete(comment.id)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
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

export default FeedbackPost;
