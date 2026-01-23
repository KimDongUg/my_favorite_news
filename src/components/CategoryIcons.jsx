import { memo } from 'react';
import { categoryColors, categoryIcons } from '../data/headlines';

const categories = ['뉴스', '스포츠', '연예', '반려동물', 'IT'];

const CategoryIcons = memo(function CategoryIcons({ visibleCategories, onToggleCategory }) {
  return (
    <div className="category-icons">
      {categories.map((category) => (
        <button
          key={category}
          className={`category-icon-btn ${visibleCategories[category] ? 'active' : ''}`}
          style={{ '--cat-color': categoryColors[category] }}
          onClick={() => onToggleCategory(category)}
          aria-label={`${category} ${visibleCategories[category] ? '숨기기' : '표시'}`}
        >
          <span className="cat-icon">{categoryIcons[category]}</span>
          <span className="cat-name">{category}</span>
        </button>
      ))}
    </div>
  );
});

export default CategoryIcons;
