import React from 'react';

const RecommendationsList = ({ recommendations }) => {
  return (
    <div className="ra-recs-grid">
      {recommendations.map(r => (
        <div key={r.badge} className={`ra-rec-card ra-rec-${r.badgeClass}`}>
          <div className="ra-rec-top">
            <div className={`ra-rec-icon-box ${r.iconBox}`}>
              <span className="material-symbols-outlined">{r.icon}</span>
            </div>
            <span className={`ra-rec-badge ${r.badgeClass}`}>{r.badge}</span>
          </div>
          <h4 className="ra-rec-title">{r.title}</h4>
          <p className="ra-rec-desc">{r.desc}</p>
          {r.alert && (
            <div className="ra-rec-alert">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>{r.alert}</span>
            </div>
          )}
          {r.extra && (
            <div className="ra-rec-extra">
              <span className="ra-rec-extra-label">{r.extraLabel}</span>
              <span className="ra-rec-extra-val">{r.extra}</span>
            </div>
          )}
          {r.cta && (
            <button className="ra-rec-cta">
              {r.cta} <span className="material-symbols-outlined text-sm">tune</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecommendationsList;
