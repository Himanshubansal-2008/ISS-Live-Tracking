export default async function handler(req, res) {
  try {
    const { category, endpoint } = req.query;
    const apiKey = process.env.VITE_NEWS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'News API key not configured' });
    }

    let url;
    if (endpoint === 'everything') {
      url = `https://newsapi.org/v2/everything?q=${category || 'technology'}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?category=${category || 'technology'}&language=en&pageSize=5&apiKey=${apiKey}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news', message: error.message });
  }
}
