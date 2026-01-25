import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPost, getPost, updatePost } from '../services/feedbackApi';
import '../styles/Feedback.css';

const CATEGORIES = [
  { id: 'suggestion', name: '기능 제안', icon: '💡', desc: '새로운 기능 아이디어를 제안해주세요' },
  { id: 'bug', name: '버그 신고', icon: '🐛', desc: '오류나 문제점을 알려주세요' },
  { id: 'question', name: '문의사항', icon: '❓', desc: '궁금한 점을 질문해주세요' },
  { id: 'general', name: '자유게시판', icon: '💬', desc: '자유로운 의견을 나눠주세요' },
  { id: 'praise', name: '칭찬해요', icon: '⭐', desc: '좋았던 점을 알려주세요' }
];

function FeedbackWrite() {
  const { id } = useParams(); // 수정 모드일 때 게시글 ID
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    category: 'general',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 수정 모드: 기존 게시글 로드
  useEffect(() => {
    if (isEditMode) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    const result = await getPost(id);
    setLoading(false);

    if (result.success) {
      // 본인 게시글인지 확인
      if (result.post.author_id !== user?.id && user?.role !== 'admin') {
        alert('수정 권한이 없습니다.');
        navigate('/feedback');
        return;
      }
      setFormData({
        category: result.post.category,
        title: result.post.title,
        content: result.post.content
      });
    } else {
      setError('게시글을 불러올 수 없습니다.');
    }
  };

  // 로그인 체크
  useEffect(() => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (formData.title.length > 100) {
      setError('제목은 100자 이내로 입력해주세요.');
      return;
    }
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    if (formData.content.length > 5000) {
      setError('내용은 5000자 이내로 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (isEditMode) {
        result = await updatePost(id, formData);
      } else {
        result = await createPost(formData);
      }

      if (result.success) {
        alert(isEditMode ? '수정되었습니다.' : '게시글이 등록되었습니다.');
        navigate(isEditMode ? `/feedback/${id}` : `/feedback/${result.postId}`);
      } else {
        setError(result.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 임시저장 (localStorage)
  useEffect(() => {
    if (!isEditMode) {
      const saved = localStorage.getItem('feedbackDraft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (window.confirm('임시 저장된 글이 있습니다. 불러오시겠습니까?')) {
            setFormData(draft);
          } else {
            localStorage.removeItem('feedbackDraft');
          }
        } catch (e) {
          localStorage.removeItem('feedbackDraft');
        }
      }
    }
  }, [isEditMode]);

  // 자동 임시저장
  useEffect(() => {
    if (!isEditMode && (formData.title || formData.content)) {
      const timer = setTimeout(() => {
        localStorage.setItem('feedbackDraft', JSON.stringify(formData));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formData, isEditMode]);

  // 작성 완료 후 임시저장 삭제
  const clearDraft = () => {
    localStorage.removeItem('feedbackDraft');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="feedback-page-container">
      <header className="feedback-header">
        <Link to="/feedback" className="back-link">← 목록으로</Link>
        <h1>{isEditMode ? '게시글 수정' : '새 글 작성'}</h1>
      </header>

      <div className="feedback-content write-content">
        <form className="write-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {/* 카테고리 선택 */}
          <div className="form-group">
            <label>카테고리</label>
            <div className="category-select">
              {CATEGORIES.map(cat => (
                <label
                  key={cat.id}
                  className={`category-option ${formData.category === cat.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={formData.category === cat.id}
                    onChange={handleChange}
                  />
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-info">
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-desc">{cat.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요 (100자 이내)"
              maxLength={100}
            />
            <span className="char-count">{formData.title.length}/100</span>
          </div>

          {/* 내용 */}
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="내용을 입력하세요 (5000자 이내)"
              maxLength={5000}
              rows={15}
            />
            <span className="char-count">{formData.content.length}/5000</span>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <Link to="/feedback" className="cancel-btn">취소</Link>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              onClick={clearDraft}
            >
              {loading ? '저장 중...' : (isEditMode ? '수정하기' : '등록하기')}
            </button>
          </div>
        </form>
      </div>

      <footer className="feedback-footer">
        <div className="footer-links">
          <Link to="/copyright">저작권 정책</Link>
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
        </div>
        <p>&copy; 2026 내가 좋아하는 세상 정보. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default FeedbackWrite;
