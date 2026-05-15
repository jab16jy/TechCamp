import React from 'react';

function Gauge({ valor, pct, color, label, unit, sub, icon }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = circ * pct / 100;
  return (
    <div className="gauge-card">
      <div className="gauge-svg-wrap">
        <svg viewBox="0 0 70 70" className="w-16 h-16">
          <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 35 35)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className="material-symbols-outlined gauge-icon" style={{ color }}>{icon}</span>
      </div>
      <p className="gauge-value">{valor}<span className="gauge-unit">{unit}</span></p>
      <p className="gauge-label">{label}</p>
      <p className="gauge-sub">{sub}</p>
    </div>
  );
}

const SoilParameters = ({ params, gauges }) => {
  return (
    <div className="ra-card">
      <div className="ra-card-header">
        <span className="material-symbols-outlined ra-card-icon">biotech</span>
        <h2 className="ra-card-title">Parámetros Químicos de Laboratorio</h2>
        <span className="ra-calibration">Calibración: 24/05/2024 08:30</span>
      </div>
      <div className="ra-params-list">
        {params.map(p => (
          <div key={p.key} className="ra-param-row">
            <div className="ra-param-info">
              <span className={`material-symbols-outlined ra-param-icon ${p.statusColor.split(' ')[0]}`}>{p.icon}</span>
              <div>
                <p className="ra-param-label">{p.label}</p>
                <p className="ra-param-val">{p.valor} <span className="ra-param-unit">{p.unit}</span></p>
              </div>
            </div>
            <div className="ra-param-bar-wrap">
              <div className="ra-param-bar">
                <div className={`ra-param-fill bg-gradient-to-r ${p.barColor}`} style={{ width: `${p.pct}%` }}></div>
              </div>
              <span className={`ra-status-badge border ${p.statusColor}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="ra-gauges-row">
        {gauges.map(g => <Gauge key={g.label} {...g} />)}
      </div>
    </div>
  );
};

export default SoilParameters;
