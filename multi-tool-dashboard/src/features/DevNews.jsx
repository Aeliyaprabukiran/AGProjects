import React, { useState, useCallback, useRef } from 'react';
import { Newspaper, ExternalLink, Clock, Search, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

// ─── 10 Developer Topics ───
const TOPICS = [
  { id: 'technology', label: 'Technology', query: 'technology latest news' },
  { id: 'programming', label: 'Programming', query: 'programming coding software development' },
  { id: 'ai', label: 'Artificial Intelligence', query: 'artificial intelligence machine learning AI' },
  { id: 'startups', label: 'Startups', query: 'startup funding tech companies' },
  { id: 'cybersecurity', label: 'Cybersecurity', query: 'cybersecurity hacking data breach' },
  { id: 'webdev', label: 'Web Development', query: 'web development javascript frontend' },
  { id: 'mobiledev', label: 'Mobile Development', query: 'mobile development android ios apps' },
  { id: 'cloud', label: 'Cloud Computing', query: 'cloud computing AWS Azure Google Cloud' },
  { id: 'devops', label: 'DevOps', query: 'devops CI CD kubernetes docker' },
  { id: 'blockchain', label: 'Blockchain', query: 'blockchain crypto web3 decentralized' },
];

// ─── In-memory cache ───
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Format relative time ───
const timeAgo = (dateStr) => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

// ─── Extract clean source name from HTML title ───
const extractSource = (title) => {
  if (!title) return 'Unknown';
  const match = title.match(/-\s*([^-]+)$/);
  return match ? match[1].trim() : 'News';
};

const DevNews = () => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetchedTopic, setLastFetchedTopic] = useState('');
  const abortRef = useRef(null);

  // ─── Fetch news via Google News RSS → rss2json.com (free, no API key) ───
  const fetchNews = useCallback(async (topicId) => {
    if (!topicId) return;

    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return;

    // Check cache
    const cached = cache[topicId];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setArticles(cached.data);
      setLastFetchedTopic(topicId);
      setError('');
      return;
    }

    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    setArticles([]);

    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic.query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`;

      const res = await fetch(apiUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.status !== 'ok' || !data.items?.length) {
        throw new Error('No articles found for this topic.');
      }

      const processed = data.items.slice(0, 10).map((item, idx) => ({
        id: `${topicId}-${idx}`,
        title: item.title?.replace(/ - [^-]+$/, '').trim() || 'Untitled',
        description: item.description
          ? item.description.replace(/<[^>]*>/g, '').substring(0, 160).trim() + '…'
          : 'No description available.',
        source: extractSource(item.title),
        publishedAt: item.pubDate,
        url: item.link,
        thumbnail: item.thumbnail || item.enclosure?.link || null,
      }));

      // Save to cache
      cache[topicId] = { data: processed, timestamp: Date.now() };

      setArticles(processed);
      setLastFetchedTopic(topicId);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to fetch news.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Topic change handler ───
  const handleTopicChange = (e) => {
    const topicId = e.target.value;
    setSelectedTopic(topicId);
    if (topicId) fetchNews(topicId);
  };

  // ─── Refresh ───
  const handleRefresh = () => {
    if (selectedTopic) {
      delete cache[selectedTopic]; // bust cache
      fetchNews(selectedTopic);
    }
  };

  const currentTopic = TOPICS.find(t => t.id === selectedTopic);

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Developer News</h1>
        <p>Stay updated with the latest developer and tech news — pick a topic below.</p>
      </div>

      {/* ── Controls ── */}
      <div className="news-controls glass-panel">
        <div className="news-select-wrapper">
          <Search size={18} className="news-select-icon" />
          <select
            className="news-select"
            value={selectedTopic}
            onChange={handleTopicChange}
          >
            <option value="">— Select a topic —</option>
            {TOPICS.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {selectedTopic && (
          <button className="news-refresh-btn" onClick={handleRefresh} disabled={loading} title="Refresh results">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="news-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="news-loading">
          <Loader2 size={32} className="spin" />
          <p>Fetching latest {currentTopic?.label} news…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && !selectedTopic && (
        <div className="news-empty">
          <Newspaper size={48} />
          <h3>Pick a Topic</h3>
          <p>Select a developer topic from the dropdown above to see the latest news.</p>
          <div className="news-topics-grid">
            {TOPICS.map(t => (
              <button key={t.id} className="news-topic-chip" onClick={() => { setSelectedTopic(t.id); fetchNews(t.id); }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── No results ── */}
      {!loading && !error && selectedTopic && articles.length === 0 && lastFetchedTopic === selectedTopic && (
        <div className="news-empty">
          <AlertCircle size={40} />
          <h3>No Results</h3>
          <p>No articles found for "{currentTopic?.label}". Try another topic.</p>
        </div>
      )}

      {/* ── Articles grid ── */}
      {!loading && articles.length > 0 && (
        <div className="news-grid">
          {articles.map((article, idx) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card glass-panel"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Colored accent bar */}
              <div className="news-card-accent"></div>

              <div className="news-card-body">
                <div className="news-card-meta">
                  <span className="news-source">{article.source}</span>
                  <span className="news-time">
                    <Clock size={12} /> {timeAgo(article.publishedAt)}
                  </span>
                </div>
                <h3 className="news-card-title">{article.title}</h3>
                <p className="news-card-desc">{article.description}</p>
                <div className="news-card-footer">
                  <span className="news-read-more">
                    Read full article <ExternalLink size={13} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevNews;
