import { useState } from 'react';

export default function NewsDashboard({
  articles, loading, error, searchQuery, setSearchQuery,
  sortBy, setSortBy, activeCategory, setActiveCategory,
  categories, refreshNews,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (loading && articles.length === 0) {
    return (
      <div className="news-section">
        <h2>📰 Latest News</h2>
        <div className="spinner" />
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading news articles...</p>
      </div>
    );
  }

  return (
    <div className="news-section" id="news-section">
      <div className="news-header">
        <h2>📰 Latest News</h2>
        <div className="news-controls">
          <input
            className="search-input"
            type="text"
            placeholder="Search title, source, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="news-search"
          />
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="news-sort">
            <option value="date">Sort by Date</option>
            <option value="source">Sort by Source</option>
          </select>
          <button className="btn btn-primary" onClick={refreshNews} id="news-refresh">🔄 Refresh</button>
        </div>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            id={`cat-${cat}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-box">
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={refreshNews}>Retry</button>
        </div>
      )}

      <div className="news-list">
        {articles.length === 0 && !loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No articles found.</p>
        ) : (
          articles.map((article, idx) => {
            const isExpanded = expandedId === article.id;
            return (
              <div key={article.id || idx}>
                <div className="news-item" onClick={() => setExpandedId(isExpanded ? null : article.id)}>
                  <span className="news-item-number">{idx + 1}</span>
                  {article.urlToImage ? (
                    <img
                      className="news-item-img"
                      src={article.urlToImage}
                      alt=""
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="news-item-img skeleton" />
                  )}
                  <div className="news-item-content">
                    <div className="news-item-source">{article.source?.name || article.category}</div>
                    <div className="news-item-title">{article.title || 'Untitled'}</div>
                    <div className="news-item-meta">
                      {article.author && <span>{article.author} · </span>}
                      {article.publishedAt && new Date(article.publishedAt).toLocaleDateString('en-US', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                      {', '}
                      {article.publishedAt && new Date(article.publishedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <button className={`news-expand-toggle ${isExpanded ? 'open' : ''}`}>▼</button>
                </div>
                {isExpanded && (
                  <div className="news-item-expanded">
                    <p>{article.description || 'No description available.'}</p>
                    {article.content && <p>{article.content.replace(/\[\+\d+ chars\]/, '')}</p>}
                    {article.url && (
                      <a className="read-more-link" href={article.url} target="_blank" rel="noopener noreferrer">
                        Read More →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
