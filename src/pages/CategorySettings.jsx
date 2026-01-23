import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { headlines, categoryColors, categoryIcons } from '../data/headlines';

const allCategories = Object.keys(headlines);

function CategorySettings() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('selectedCategories');
    if (saved) {
      return JSON.parse(saved);
    }
    // 기본값: 처음 5개 카테고리
    return allCategories.slice(0, 5);
  });

  const handleToggle = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        // 최소 1개는 선택되어야 함
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== category);
      } else {
        // 최대 10개까지 선택 가능
        if (prev.length >= 10) return prev;
        return [...prev, category];
      }
    });
  };

  const handleSave = () => {
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    navigate('/');
  };

  const handleSelectAll = () => {
    setSelectedCategories(allCategories);
  };

  const handleDeselectAll = () => {
    setSelectedCategories([allCategories[0]]); // 최소 1개 유지
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>카테고리 설정</h1>
          <p>관심 있는 카테고리를 선택하세요 (최대 10개)</p>
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
            return (
              <button
                key={category}
                className={`category-card ${isSelected ? 'selected' : ''}`}
                style={{ '--cat-color': categoryColors[category] }}
                onClick={() => handleToggle(category)}
              >
                <span className="category-icon">{categoryIcons[category]}</span>
                <span className="category-name">{category}</span>
                <span className="category-count">
                  {headlines[category].length}개 뉴스
                </span>
                {isSelected && <span className="check-mark">✓</span>}
              </button>
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
