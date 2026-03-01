import React from 'react';

const STEPS = [
  { key: 'pending',   label: 'Initializing search...' },
  { key: 'scraping',  label: 'Scraping G2, Reddit, HN, GitHub...' },
  { key: 'analyzing', label: 'Claude AI analyzing signals...' },
  { key: 'done',      label: 'Complete!' },
];

export default function StatusTracker({ status, competitorName }) {
  const currentIndex = STEPS.findIndex(s => s.key === status);

  return (
    <div className="status-card">
      <div className="status-icon">🔍</div>
      <h2>Searching for <em style={{ color: 'var(--accent)' }}>{competitorName}</em> users</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Scanning public sources and running AI analysis...
      </p>

      <div className="status-steps">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div 
              key={step.key} 
              className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
            >
              <div className="step-dot" />
              <span>
                {isDone ? '✓ ' : ''}{step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
