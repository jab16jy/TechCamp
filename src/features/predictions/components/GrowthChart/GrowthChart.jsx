import React from 'react';
import { TrendingUp } from 'lucide-react';

const MONTH_COLORS = ['#10b981', '#059669', '#047857'];

export default function GrowthChart({ prediction, riego, npk }) {
  const months = prediction?.meses || [];
  if (months.length === 0) return null;

  // Compute growth from NDVI + slider factors
  const npkFactor = 0.7 + 0.3 * Math.min(2.0, Math.max(0.5, npk / 120.0));
  const riegoFactor = 0.75 + 0.25 * Math.min(1.5, Math.max(0.5, riego / 75.0));

  const growthValues = months.map((m) => {
    const base = (m.ndvi_estimado || 0.42) * 100;
    return base * npkFactor * riegoFactor;
  });

  // Compute stress from temp deviation (>28°C) and low humidity (<50%)
  const stressValues = months.map((m) => {
    const tempStress = Math.max(0, (m.temperatura - 28) / 10) * 100;
    const humStress = Math.max(0, (50 - m.humedad) / 50) * 100;
    return Math.min(100, tempStress + humStress);
  });

  const maxG = Math.max(...growthValues, 1);
  const maxS = Math.max(...stressValues, 1);
  const stepX = months.length > 1 ? 800 / (months.length - 1) : 800;

  const growthPts = growthValues.map((v, i) => [
    i * stepX,
    200 - (v / maxG) * 180,
  ]);
  const stressPts = stressValues.map((v, i) => [
    i * stepX,
    200 - (v / maxS) * 180,
  ]);

  const toPath = (pts) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, y)}`).join(' ');
  const toArea = (pts, base = 210) =>
    toPath(pts) + ` L ${pts[pts.length - 1][0]} ${base} L 0 ${base} Z`;

  const monthLabels = months.map((m) => {
    const name = m.month || '';
    return name.length > 3 ? name.slice(0, 3) : name;
  });

  return (
    <div className="ia-card ia-chart-card">
      <div className="ia-card-header">
        <TrendingUp size={16} className="ia-card-icon" />
        <h2 className="ia-card-title">Curva de Biomasa vs Estrés</h2>
      </div>
      <svg viewBox="0 0 800 210" className="ia-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[50, 100, 150, 200].map((y) => (
          <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {/* Month markers */}
        {monthLabels.map((_, i) => (
          <line key={i} x1={i * stepX} y1="0" x2={i * stepX} y2="210" stroke="#f8fafc" strokeWidth="1" />
        ))}
        {/* Month labels */}
        {monthLabels.map((label, i) => (
          <text key={i} x={i * stepX} y="205" textAnchor="middle" fontSize="11" fill="#94a3b8">
            {label}
          </text>
        ))}
        {/* Area fills */}
        <path d={toArea(growthPts)} fill="url(#growthGrad)" />
        <path d={toArea(stressPts)} fill="url(#stressGrad)" />
        {/* Lines */}
        <path d={toPath(growthPts)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(stressPts)} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="6 4" strokeLinecap="round" />
        {/* Growth dots */}
        {growthPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={Math.max(10, y)} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="ia-chart-legend">
        <span className="ia-legend-item">
          <span className="ia-legend-dot" style={{ background: '#10b981' }} />
          Biomasa estimada
        </span>
        <span className="ia-legend-item">
          <span className="ia-legend-dot" style={{ background: '#ef4444' }} />
          Estrés hídrico/térmico
        </span>
      </div>
    </div>
  );
}
