import React from 'react';

function SimChart({ rain, fert }) {
  const base = [20, 22, 25, 23, 27, 30, 35, 38, 42, 45, 48, 52];
  const pts = base.map((v, i) => ({
    x: 30 + i * 22,
    y: 160 - (v + rain * 0.3 + fert * 0.4) * 2.2
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${pts[pts.length-1].x} 165 L ${pts[0].x} 165 Z`;
  return (
    <svg viewBox="0 0 290 170" className="w-full h-full">
      <defs>
        <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[40,80,120,160].map(y => <line key={y} x1="25" y1={y} x2="280" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />)}
      {[40,80,120,160].map((y, i) => <text key={y} x="18" y={y+4} fontSize="7" fill="#94a3b8" textAnchor="end">{(4-i)*1.5}t</text>)}
      <path d={area} fill="url(#simGrad)" />
      <path d={path} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />)}
      {['E','F','M','A','M','J','J','A','S','O','N','D'].map((m, i) => (
        <text key={m} x={30 + i * 22} y="172" fontSize="6.5" fill="#94a3b8" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

const SimulationEngine = ({ rain, fert, onRainChange, onFertChange }) => {
  return (
    <section className="ra-sim-section">
      <div className="ra-sim-header">
        <span className="material-symbols-outlined ra-sim-icon">analytics</span>
        <div>
          <h3 className="ra-sim-title">Motor de Simulación Estocástica</h3>
          <p className="ra-sim-sub">Proyecte el rendimiento ajustando precipitación y plan de fertilización con el motor IA de AgroCaribe.</p>
        </div>
        <button className="ra-btn-sim">
          <span className="material-symbols-outlined text-sm">play_arrow</span> Iniciar Simulación
        </button>
      </div>
      <div className="ra-sim-body">
        <div className="ra-sim-chart">
          <SimChart rain={rain} fert={fert} />
        </div>
        <div className="ra-sim-controls">
          <div className="ra-slider-group">
            <label className="ra-slider-label">
              <span className="material-symbols-outlined text-blue-500 text-sm">water_drop</span>
              Precipitación variable
              <span className="ra-slider-val">{rain}%</span>
            </label>
            <input type="range" min="0" max="100" value={rain} onChange={onRainChange} className="ra-slider ra-slider-blue" />
          </div>
          <div className="ra-slider-group">
            <label className="ra-slider-label">
              <span className="material-symbols-outlined text-emerald-500 text-sm">science</span>
              Plan de fertilización
              <span className="ra-slider-val">{fert}%</span>
            </label>
            <input type="range" min="0" max="100" value={fert} onChange={onFertChange} className="ra-slider ra-slider-green" />
          </div>
          <div className="ra-sim-projection">
            <p className="ra-sim-proj-label">Proyección de Rendimiento</p>
            <p className="ra-sim-proj-val">{(3.2 + rain * 0.02 + fert * 0.025).toFixed(2)} <span>t/ha</span></p>
            <p className="ra-sim-proj-sub">Ciclo 2024–2025 · Maíz Híbrido</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimulationEngine;
