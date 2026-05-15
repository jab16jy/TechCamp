import React from 'react';

function GaugeChart({ pct = 82 }) {
  const R = 72, CX = 90, CY = 90;
  const circumference = 2 * Math.PI * R;
  // Semi-circle gauge: arc from 210° to -30° (240° sweep)
  const sweep = 240;
  const arcLen = (sweep / 360) * circumference;
  const dash = (pct / 100) * arcLen;

  // SVG arc path for a 240° arc centered at bottom
  const toRad = d => (d * Math.PI) / 180;
  const startAngle = 150; // degrees
  const endAngle = startAngle + sweep;
  const x1 = CX + R * Math.cos(toRad(startAngle));
  const y1 = CY + R * Math.sin(toRad(startAngle));
  const x2 = CX + R * Math.cos(toRad(endAngle));
  const y2 = CY + R * Math.sin(toRad(endAngle));
  const largeArc = sweep > 180 ? 1 : 0;

  const trackD = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;

  // Value arc
  const valAngle = startAngle + (pct / 100) * sweep;
  const vx2 = CX + R * Math.cos(toRad(valAngle));
  const vy2 = CY + R * Math.sin(toRad(valAngle));
  const valLargeArc = (pct / 100) * sweep > 180 ? 1 : 0;
  const valueD = `M ${x1} ${y1} A ${R} ${R} 0 ${valLargeArc} 1 ${vx2} ${vy2}`;

  return (
    <svg viewBox="0 0 180 180" className="gr-gauge-svg">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={trackD} fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round" />
      {/* Value */}
      <path d={valueD} fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
        className="gr-gauge-value-path" />
      {/* Center text */}
      <text x={CX} y={CY - 4} textAnchor="middle" className="gr-gauge-num">82</text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="gr-gauge-pct">%</text>
      <text x={CX} y={CY + 34} textAnchor="middle" className="gr-gauge-sub">Índice OEE</text>
    </svg>
  );
}

export default GaugeChart;
