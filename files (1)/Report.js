import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { getExportUrl } from '../utils/api';
import StatusTracker from '../components/StatusTracker';
import CompanyCard from '../components/CompanyCard';

const SOURCE_FILTERS = ['all', 'g2_review', 'reddit', 'hackernews', 'github', 'capterra'];

export default function Report() {
  const { reportId } = useParams();
  const { status, report, error } = usePolling(reportId);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence' | 'name'

  if (error) {
    return (
      <div className="page">
        <div className="status-card">
          <div className="status-icon">❌</div>
          <h2>Analysis Failed</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{error}</p>
          <Link to="/" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!report || status !== 'done') {
    return (
      <div className="page">
        <StatusTracker 
          status={status} 
          competitorName={report?.competitorName || 'competitor'} 
        />
      </div>
    );
  }

  // Filter + sort companies
  const filtered = (report.companies || [])
    .filter(c => activeFilter === 'all' || c.source === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return a.name.localeCompare(b.name);
    });

  // Source counts for filter buttons
  const sourceCounts = {};
  (report.companies || []).forEach(c => {
    sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
  });

  const completedDate = report.completedAt 
    ? new Date(report.completedAt).toLocaleString() 
    : '';

  return (
    <div className="page">
      {/* Header */}
      <div className="report-header">
        <div className="report-header-top">
          <div>
            <div className="report-title">
              Companies using{' '}
              <span className="competitor-name">{report.competitorName}</span>
            </div>
            <div className="report-meta">
              {report.totalFound} companies found · {completedDate} · Report #{reportId.slice(-8)}
            </div>
          </div>
          <div className="report-actions">
            <a 
              href={getExportUrl(reportId)} 
              className="btn-secondary"
              download
            >
              ↓ Export CSV
            </a>
            <Link to="/" className="btn-secondary">← New Search</Link>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {report.aiSummary && (
        <div className="ai-summary">
          <div className="ai-summary-label">▲ Claude AI Summary</div>
          <div className="ai-summary-text">{report.aiSummary}</div>
          {report.aiInsights?.length > 0 && (
            <div className="insights-row">
              {report.aiInsights.map((insight, i) => (
                <div key={i} className="insight-item">{insight}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="results-section">
        <div className="results-header">
          <div className="results-title">Identified Companies</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="results-count">{filtered.length} shown</span>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', borderRadius: 6, padding: '4px 10px',
                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer'
              }}
            >
              <option value="confidence">Sort: Confidence</option>
              <option value="name">Sort: Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Source filters */}
        <div className="filter-bar">
          {SOURCE_FILTERS.map(f => {
            const count = f === 'all' ? report.companies?.length : sourceCounts[f] || 0;
            if (f !== 'all' && count === 0) return null;
            return (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f.replace('_', ' ')} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔎</div>
            <h3>No results for this filter</h3>
            <p>Try selecting a different source or search for a more popular competitor.</p>
          </div>
        ) : (
          <div className="companies-grid">
            {filtered.map((company, i) => (
              <CompanyCard key={i} company={company} />
            ))}
          </div>
        )}
      </div>

      {/* Raw signals count */}
      {report.rawSignals?.length > 0 && (
        <div style={{ 
          marginTop: 40, padding: 16, background: 'var(--bg-card)', 
          border: '1px solid var(--border)', borderRadius: 8,
          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)'
        }}>
          ℹ {report.rawSignals.length} raw signals scraped → {report.totalFound} companies extracted by AI
        </div>
      )}
    </div>
  );
}
