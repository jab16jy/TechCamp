import React from 'react';

export default function GrowthChart({ riego, npk, proyeccion }) {
  const months = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
  let growthPts;
  let stressPts;

  if (proyeccion) {
    const maxC = Math.max(...proyeccion.crecimiento, 1);
    const maxS = Math.max(...proyeccion.estres, 1);
    growthPts = proyeccion.crecimiento.map((v, i) => [i * 160, 200 - (v / maxC) * 180]);
    stressPts = proyeccion.estres.map((v, i) => [i * 160, 200 - (v / maxS) * 180]);
  } else {
    const boost = riego * 0.3 + npk * 0.08;
    growthPts = [
      [0, 185], [160, 155], [320, 120], [480, 75 - boost * 0.3], [640, 45 - boost * 0.2], [800, 20 - boost * 0.1],
    ];
    stressPts = [
      [0, 195], [160, 197], [320, 188], [480, 192], [640, 170], [800, 175],
    ];
  }

  const toPath = (pts) => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, y)}`).join(' ');
  const toArea = (pts, base = 210) => toPath(pts) + ` L ${pts[pts.length - 1][0]} ${base} L 0 ${base} Z`;

  return (
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
      {months.map((_, i) => (
        <line key={i} x1={i * 160} y1="0" x2={i * 160} y2="210" stroke="#f8fafc" strokeWidth="1" />
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
  );
}
