import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllReports, deleteReport } from '../utils/api';

function getBadgeClass(status) {
  if (status === 'done') return 'badge-done';
  if (status === 'error') return 'badge-error';
  return 'badge-pending';
}

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteReport(id);
    setReports(r => r.filter(rep => rep._id !== id));
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Search History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            All your past competitor intelligence reports
          </p>
        </div>
        <Link to="/" className="btn-primary">+ New Search</Link>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>No reports yet</h3>
          <p>Start by searching for a competitor on the home page.</p>
        </div>
      ) : (
        <div className="history-list">
          {reports.map(report => (
            <Link 
              to={`/report/${report._id}`} 
              key={report._id}
              className="history-item"
            >
              <div>
                <div className="history-item-name">{report.competitorName}</div>
                <div className="history-item-meta">
                  {new Date(report.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                  {report.aiSummary && (
                    <div style={{ marginTop: 4, color: 'var(--text-dim)', fontSize: 12, maxWidth: 600 }}>
                      {report.aiSummary.substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>

              <div className="history-item-right">
                {report.totalFound > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>
                    {report.totalFound} companies
                  </span>
                )}
                <span className={`status-badge ${getBadgeClass(report.status)}`}>
                  {report.status}
                </span>
                <button
                  onClick={(e) => handleDelete(e, report._id)}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-dim)', fontSize: 16, padding: '4px 8px',
                    borderRadius: 4
                  }}
                  title="Delete report"
                >
                  ✕
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
