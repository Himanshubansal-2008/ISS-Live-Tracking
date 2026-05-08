import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'news_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const CATEGORIES = ['technology', 'science'];
const NEWS_API_BASE = 'https://newsapi.org/v2';
const isDev = import.meta.env.DEV;

function getCachedNews() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCachedNews(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // storage full, ignore
  }
}

export function useNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchNews = useCallback(async (force = false) => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;

    // Check cache first
    if (!force) {
      const cached = getCachedNews();
      if (cached) {
        setArticles(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const results = [];

      for (const category of CATEGORIES) {
        try {
          // In production, use serverless proxy; in dev, call NewsAPI directly
          const url = isDev
            ? `${NEWS_API_BASE}/top-headlines?category=${category}&language=en&pageSize=5&apiKey=${apiKey}`
            : `/api/news?category=${category}&endpoint=top-headlines`;
          const res = await fetch(url);

          if (!res.ok) {
            throw new Error(`NewsAPI returned ${res.status}`);
          }

          const data = await res.json();
          if (data.articles) {
            const mapped = data.articles.map((a) => ({
              ...a,
              category,
              id: `${category}-${a.title?.slice(0, 20)}`,
            }));
            results.push(...mapped);
          }
        } catch {
          // Try fallback for this category
          try {
            const fallbackUrl = isDev
              ? `${NEWS_API_BASE}/everything?q=${category}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`
              : `/api/news?category=${category}&endpoint=everything`;
            const res = await fetch(fallbackUrl);
            if (res.ok) {
              const data = await res.json();
              if (data.articles) {
                const mapped = data.articles.map((a) => ({
                  ...a,
                  category,
                  id: `${category}-${a.title?.slice(0, 20)}`,
                }));
                results.push(...mapped);
              }
            }
          } catch {
            // skip this category
          }
        }
      }

      if (results.length === 0) {
        throw new Error('No articles found. Check your API key.');
      }

      setArticles(results);
      setCachedNews(results);
      setLoading(false);
      
      if (force) {
        import('react-hot-toast').then(m => m.toast.success('News updated'));
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      if (force) {
        import('react-hot-toast').then(m => m.toast.error('Failed to refresh news'));
      }
      // Try loading from cache even if expired
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          setArticles(cached.data);
        } catch { /* ignore */ }
      }
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Filter & sort
  const filteredArticles = articles
    .filter((a) => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (a.title || '').toLowerCase().includes(q) ||
          (a.source?.name || '').toLowerCase().includes(q) ||
          (a.author || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      }
      if (sortBy === 'source') {
        return (a.source?.name || '').localeCompare(b.source?.name || '');
      }
      return 0;
    });

  return {
    articles: filteredArticles,
    allArticles: articles,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    activeCategory,
    setActiveCategory,
    categories: ['all', ...CATEGORIES],
    refreshNews: () => fetchNews(true),
  };
}
