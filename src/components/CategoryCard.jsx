function CategoryCard({ item, color }) {
  return (
    <article className="category-card" style={{ borderLeftColor: color }}>
      <h3 className="card-title">{item.title}</h3>
      <p className="card-summary">{item.summary}</p>
    </article>
  );
}

export default CategoryCard;
