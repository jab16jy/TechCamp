import React from 'react';

const DEFAULT_FEATURES = [
  { label: 'Precipitacion', pct: 91, color: '#2563eb' },
  { label: 'Nitrogeno (N)', pct: 78, color: '#10b981' },
  { label: 'Temperatura Max.', pct: 62, color: '#f59e0b' },
  { label: 'Humedad del Suelo', pct: 54, color: '#3b82f6' },
  { label: 'Fosforo (P)', pct: 41, color: '#6ee7b7' },
  { label: 'Radiacion Solar', pct: 33, color: '#fcd34d' },
  { label: 'Potasio (K)', pct: 27, color: '#86efac' },
];

const FACTOR_COLOR_MAP = {
  'Temperatura': '#f59e0b',
  'Humedad': '#3b82f6',
  'Precipitacion': '#2563eb',
  'pH del Suelo': '#8b5cf6',
  'Materia Organica': '#10b981',
  'Tipo de Suelo': '#d97706',
  'NDVI': '#059669',
};

function mapFactorWeightsToFeatures(factorWeights) {
  if (!factorWeights || factorWeights.length === 0) return DEFAULT_FEATURES;

  return factorWeights.map((fw) => ({
    label: fw.factor,
    pct: Math.round(fw.porcentaje_impacto || 0),
    color: FACTOR_COLOR_MAP[fw.factor] || '#6b7280',
  }));
}

export default function FeatureChart({ features }) {
  const mapped = mapFactorWeightsToFeatures(features);

  return (
    <div className="ia-feature-list">
      {mapped.map((f, i) => (
        <div key={f.label} className="ia-feature-row">
          <span className="ia-feature-label">{f.label}</span>
          <div className="ia-feature-track">
            <div
              className="ia-feature-fill"
              style={{
                width: `${Math.min(100, Math.max(0, f.pct))}%`,
                background: f.color,
                animationDelay: `${i * 0.07}s`,
              }}
            />
          </div>
          <span className="ia-feature-pct">{f.pct}%</span>
        </div>
      ))}
    </div>
  );
}
