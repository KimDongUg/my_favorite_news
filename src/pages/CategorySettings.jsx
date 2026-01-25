import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { headlines, categoryColors, categoryIcons } from '../data/headlines';

const allCategories = Object.keys(headlines);

function CategorySettings() {
  const navigate = useNavigate();

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
        // 선택 안됨 -> 추가 (최대 10개)
        if (prev.length >= 10) return prev;
        return [...prev, category];
      }
    });
  };

  // 저장
  const handleSave = () => {
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    window.dispatchEvent(new Event('categoriesUpdated'));
    navigate('/');
  };

  // 전체 선택/해제
  const handleSelectAll = () => setSelectedCategories([...allCategories]);
  const handleDeselectAll = () => setSelectedCategories([allCategories[0]]);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>좋아하는 정보 설정하기</h1>
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
          <button onClick={() => navigate('/')} className="cancel-btn">
            취소
          </button>
          <button onClick={handleSave} className="save-btn">
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategorySettings;
