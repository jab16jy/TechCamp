import React from 'react';

export const DEFAULT_FEATURES = [
  { label: 'Precipitación', pct: 91, color: '#2563eb' },
  { label: 'Nitrógeno (N)', pct: 78, color: '#10b981' },
  { label: 'Temperatura Máx.', pct: 62, color: '#f59e0b' },
  { label: 'Humedad del Suelo', pct: 54, color: '#3b82f6' },
  { label: 'Fósforo (P)', pct: 41, color: '#6ee7b7' },
  { label: 'Radiación Solar', pct: 33, color: '#fcd34d' },
  { label: 'Potasio (K)', pct: 27, color: '#86efac' },
];

export default function FeatureChart({ features = DEFAULT_FEATURES }) {
  return (
    <div className="ia-feature-list">
      {features.map((f, i) => (
        <div key={f.label} className="ia-feature-row">
          <span className="ia-feature-label">{f.label}</span>
          <div className="ia-feature-track">
            <div
              className="ia-feature-fill"
              style={{ width: `${f.pct}%`, background: f.color, animationDelay: `${i * 0.07}s` }}
            ></div>
          </div>
          <span className="ia-feature-pct">{f.pct}%</span>
        </div>
      ))}
    </div>
  );
}
