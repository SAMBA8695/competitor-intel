import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSearch } from '../utils/api';

const EXAMPLES = ['Gong', 'Salesforce', 'HubSpot', 'Outreach', 'Apollo.io'];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await startSearch(query.trim());
      navigate(`/report/${result.reportId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start search. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-badge">Competitor Intelligence</div>
        <h1>
          Find who uses<br />
          your <span className="highlight">competitors</span>
        </h1>
        <p className="hero-desc">
          Enter any competitor's name. We'll scan G2, Reddit, HackerNews, 
          and GitHub — then use Claude AI to extract the companies using their product.
        </p>

        <div className="search-box">
          <form onSubmit={handleSearch}>
            <div className="search-input-row">
              <input
                type="text"
                placeholder="e.g. Gong, Salesforce, HubSpot..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || !query.trim()}
              >
                {loading ? 'Starting...' : 'Run Intel →'}
              </button>
            </div>
          </form>

          {error && (
            <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 13, marginTop: 12 }}>
              ⚠ {error}
            </p>
          )}

          <div className="search-hint">
            Try: {EXAMPLES.map((ex, i) => (
              <React.Fragment key={ex}>
                <span 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setQuery(ex)}
                >
                  {ex}
                </span>
                {i < EXAMPLES.length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">5+</span>
            <div className="stat-label">Data Sources</div>
          </div>
          <div className="stat-item">
            <span className="stat-value">AI</span>
            <div className="stat-label">Claude Analysis</div>
          </div>
          <div className="stat-item">
            <span className="stat-value">CSV</span>
            <div className="stat-label">Export Ready</div>
          </div>
          <div className="stat-item">
            <span className="stat-value">Free</span>
            <div className="stat-label">No Cost</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 80 }}>
        <h2 style={{ 
          fontFamily: 'var(--sans)', fontSize: 24, fontWeight: 800, 
          marginBottom: 24, letterSpacing: -0.5 
        }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { step: '01', title: 'Enter Competitor', desc: 'Type any SaaS competitor name you want intel on.' },
            { step: '02', title: 'We Scrape', desc: 'System hits G2, Reddit, HackerNews, GitHub, Capterra simultaneously.' },
            { step: '03', title: 'Claude Analyzes', desc: 'AI extracts company names, confidence scores, and use cases from raw signals.' },
            { step: '04', title: 'Export & Win', desc: 'Download CSV with leads — companies you can now target.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--border)', 
              borderRadius: 8, padding: 24 
            }}>
              <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 11, marginBottom: 12 }}>
                {step}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
