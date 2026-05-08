import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useISS } from './hooks/useISS.js';
import { useNews } from './hooks/useNews.js';
import ISSMap from './components/ISSMap.jsx';
import SpeedChart from './components/SpeedChart.jsx';
import NewsDashboard from './components/NewsDashboard.jsx';
import NewsChart from './components/NewsChart.jsx';
import ChatBot from './components/ChatBot.jsx';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    toast.success(`Switched to ${next} mode`);
  };

  const iss = useISS();
  const news = useNews();

  const handleRefresh = () => {
    iss.refresh();
    toast.success('ISS position refreshed!');
  };

  const handleToggleAuto = () => {
    iss.toggleAutoRefresh();
    toast(iss.autoRefresh ? 'Auto-refresh paused' : 'Auto-refresh resumed', { icon: '⏱️' });
  };

  return (
    <div className="app-container">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--toast-bg)', color: 'var(--toast-text)', fontFamily: 'Inter', fontSize: '0.85rem' },
        duration: 2500,
      }} />

      {/* HEADER */}
      <header className="header" id="header">
        <div className="header-left">
          <h2>Mission Control Dashboard</h2>
          <h1>Real-Time ISS and News Intelligence</h1>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} id="theme-toggle">
          Switch to {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>

      {/* ISS SECTION */}
      <section className="iss-section" id="iss-section">
        <div className="iss-main">
          <div className="iss-main-header">
            <h2>ISS Live Tracking</h2>
            <div className="iss-controls">
              <button className="btn btn-primary" onClick={handleRefresh} id="iss-refresh">Refresh Now</button>
              <button
                className={`btn ${iss.autoRefresh ? 'btn-on' : 'btn-off'}`}
                onClick={handleToggleAuto}
                id="iss-auto-toggle"
              >
                Auto-Refresh: {iss.autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {iss.error && (
            <div className="error-box">
              <p>⚠️ {iss.error}</p>
              <button className="btn btn-primary" onClick={handleRefresh}>Retry</button>
            </div>
          )}

          {iss.loading ? (
            <>
              <div className="stat-cards">
                {[1, 2, 3, 4].map((i) => (
                  <div className="stat-card" key={i}><div className="skeleton" style={{ height: 50 }} /></div>
                ))}
              </div>
              <div className="map-container"><div className="skeleton" style={{ height: '100%' }} /></div>
            </>
          ) : (
            <>
              <div className="stat-cards">
                <div className="stat-card">
                  <label>Latitude / Longitude</label>
                  <div className="stat-value">
                    {iss.position ? `${iss.position.latitude.toFixed(3)}, ${iss.position.longitude.toFixed(3)}` : '—'}
                  </div>
                </div>
                <div className="stat-card">
                  <label>Speed</label>
                  <div className="stat-value">{iss.speed ? `${iss.speed.toFixed(2)} km/h` : 'Calculating...'}</div>
                </div>
                <div className="stat-card">
                  <label>Nearest Place</label>
                  <div className="stat-value">{iss.nearestPlace}</div>
                </div>
                <div className="stat-card">
                  <label>Tracked Positions</label>
                  <div className="stat-value">{iss.positions.length}</div>
                </div>
              </div>

              <div className="map-container" id="iss-map">
                <ISSMap position={iss.position} positions={iss.positions} />
              </div>
            </>
          )}
        </div>

        {/* Speed Chart */}
        <div className="speed-chart-panel" id="speed-chart">
          <h2>ISS Speed Trend</h2>
          {iss.speeds.length < 2 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p>Collecting speed data... ({iss.speeds.length}/2 points)</p>
            </div>
          ) : (
            <SpeedChart speeds={iss.speeds} />
          )}
        </div>
      </section>

      {/* ASTRONAUTS */}
      <section className="astronauts-section" id="astronauts-section">
        <h2>🧑‍🚀 People in Space Right Now</h2>
        <div className="astronaut-count">{iss.astronauts.number} astronauts</div>
        <div className="astronaut-list">
          {iss.astronauts.people.map((p, i) => (
            <span className="astronaut-tag" key={i}>
              {p.name}
              <span className="astronaut-craft">({p.craft})</span>
            </span>
          ))}
        </div>
      </section>

      {/* NEWS */}
      <NewsDashboard
        articles={news.articles}
        loading={news.loading}
        error={news.error}
        searchQuery={news.searchQuery}
        setSearchQuery={news.setSearchQuery}
        sortBy={news.sortBy}
        setSortBy={news.setSortBy}
        activeCategory={news.activeCategory}
        setActiveCategory={news.setActiveCategory}
        categories={news.categories}
        refreshNews={news.refreshNews}
      />

      {/* CHARTS */}
      <section className="charts-section" id="charts-section">
        <div className="chart-card">
          <h3>📊 News Distribution by Category</h3>
          <NewsChart
            articles={news.allArticles}
            onCategoryClick={(cat) => news.setActiveCategory(cat)}
          />
        </div>
        <div className="chart-card">
          <h3>📈 ISS Speed History</h3>
          {iss.speeds.length < 2 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              Collecting speed data...
            </p>
          ) : (
            <SpeedChart speeds={iss.speeds} />
          )}
        </div>
      </section>

      {/* CHATBOT */}
      <ChatBot
        issData={{
          position: iss.position,
          speed: iss.speed,
          nearestPlace: iss.nearestPlace,
          positions: iss.positions,
          astronauts: iss.astronauts,
        }}
        newsData={{ allArticles: news.allArticles }}
      />
    </div>
  );
}

export default App;
