import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { headlines, categoryColors, categoryIcons } from '../data/headlines';
import { useAuth } from '../contexts/AuthContext';

const allCategories = Object.keys(headlines);

function CategorySettings() {
  const navigate = useNavigate();
  const { isAuthenticated, authFetch } = useAuth();
  const [saving, setSaving] = useState(false);

  // 선택된 카테고리 (클릭 순서대로 저장)
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('selectedCategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 유효한 카테고리만 필터링
      const validCategories = parsed.filter((cat) => allCategories.includes(cat));
      if (validCategories.length > 0) {
        return validCategories;
      }
    }
    // 기본값: 처음 5개 카테고리
    return allCategories.slice(0, 5);
  });

  // 카테고리 클릭 핸들러
  const handleClick = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        // 이미 선택됨 -> 해제 (최소 1개는 유지)
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== category);
      } else {
        // 선택 안됨 -> 추가 (최대 20개)
        if (prev.length >= 20) return prev;
        return [...prev, category];
      }
    });
  };

  // 저장
  const handleSave = async () => {
    setSaving(true);

    // localStorage에 저장 (비로그인 사용자도 사용)
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    window.dispatchEvent(new Event('categoriesUpdated'));

    // 로그인 사용자는 DB에도 저장
    if (isAuthenticated) {
      try {
        await authFetch('/auth/preferences', {
          method: 'PUT',
          body: JSON.stringify({
            preferredCategories: selectedCategories
          }),
        });
        console.log('[Settings] 사용자 설정이 서버에 저장되었습니다.');
      } catch (error) {
        console.error('[Settings] 서버 저장 실패:', error);
        // 실패해도 localStorage에는 저장되었으므로 계속 진행
      }
    }

    setSaving(false);
    navigate('/');
  };

  // 전체 선택/해제
  const handleSelectAll = () => setSelectedCategories([...allCategories]);
  const handleDeselectAll = () => setSelectedCategories([allCategories[0]]);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>아티클 카테고리 설정 하기</h1>
          <p>관심 있는 카테고리를 클릭하여 선택하세요 (클릭 순서대로 표시됩니다)</p>
        </header>

        <div className="settings-info">
          <span className="selected-count">
            선택됨: {selectedCategories.length} / {allCategories.length}
          </span>
          <div className="quick-actions">
            <button onClick={handleSelectAll} className="action-btn">
              전체 선택
            </button>
            <button onClick={handleDeselectAll} className="action-btn">
              전체 해제
            </button>
          </div>
        </div>

        <div className="category-grid">
          {allCategories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            const orderIndex = selectedCategories.indexOf(category);

            return (
              <div
                key={category}
                className={`category-card ${isSelected ? 'selected' : ''}`}
                style={{ '--cat-color': categoryColors[category] }}
                onClick={() => handleClick(category)}
              >
                {isSelected && (
                  <span className="order-badge">{orderIndex + 1}</span>
                )}
                <span className="category-icon">{categoryIcons[category]}</span>
                <span className="category-name">{category}</span>
                <span className="category-count">
                  {headlines[category].length}개 뉴스
                </span>
                {isSelected && <span className="check-mark">✓</span>}
              </div>
            );
          })}
        </div>

        <div className="settings-actions">
          <button onClick={() => navigate('/')} className="cancel-btn" disabled={saving}>
            취소
          </button>
          <button onClick={handleSave} className="save-btn" disabled={saving}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategorySettings;
