import React from 'react';

function getConfClass(conf) {
  if (conf >= 70) return 'conf-high';
  if (conf >= 50) return 'conf-mid';
  return 'conf-low';
}

export default function CompanyCard({ company }) {
  const { name, source, evidence, confidence, useCase } = company;

  return (
    <div className="company-card">
      <div className="company-card-header">
        <div className="company-name">{name}</div>
        <div className={`company-confidence ${getConfClass(confidence)}`}>
          {confidence}%
        </div>
      </div>

      <div className="company-source">
        <span className={`source-dot ${source}`} />
        {source?.replace('_', ' ')}
      </div>

      {evidence && (
        <div className="company-evidence">{evidence}</div>
      )}

      {useCase && useCase !== 'Could not analyze' && (
        <div className="company-usecase">💡 {useCase}</div>
      )}
    </div>
  );
}
