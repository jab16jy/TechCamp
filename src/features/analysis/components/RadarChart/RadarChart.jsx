import React from 'react';

function polarToXY(angle, r, cx = 120, cy = 120, maxR = 100) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + maxR * r * Math.cos(rad), y: cy + maxR * r * Math.sin(rad) };
}

function radarPoints(data, key, cx = 120, cy = 120) {
  const n = data.length;
  return data.map((d, i) => {
    const pt = polarToXY(360 / n * i, d[key], cx, cy);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

function RadarChart({ data }) {
  const cx = 120, cy = 120, n = data.length;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      {/* Grid rings */}
      {rings.map(r => (
        <polygon key={r} className="radar-grid"
          points={data.map((_, i) => { const p = polarToXY(360/n*i, r, cx, cy); return `${p.x},${p.y}`; }).join(' ')} />
      ))}
      {/* Axes */}
      {data.map((_, i) => { const p = polarToXY(360/n*i, 1, cx, cy); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="radar-axis" />; })}
      {/* Target area */}
      <polygon points={radarPoints(data, 'objetivo', cx, cy)} className="radar-target" />
      {/* Actual area */}
      <polygon points={radarPoints(data, 'actual', cx, cy)} className="radar-actual" />
      {/* Dots */}
      {data.map((d, i) => { const p = polarToXY(360/n*i, d.actual, cx, cy); return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1A4D3A" />; })}
      {/* Labels */}
      {data.map((d, i) => { const p = polarToXY(360/n*i, 1.22, cx, cy); return <text key={i} x={p.x} y={p.y} className="radar-label" textAnchor="middle" dominantBaseline="middle">{d.label}</text>; })}
    </svg>
  );
}

export default RadarChart;
