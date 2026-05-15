import React from 'react';

const HYDRO = [
  { label: 'Ene', rain: 42, soil: 38 },
  { label: 'Feb', rain: 58, soil: 51 },
  { label: 'Mar', rain: 74, soil: 65 },
  { label: 'Abr', rain: 91, soil: 82 },
  { label: 'May', rain: 110, soil: 95 },
  { label: 'Jun', rain: 68, soil: 72 },
];

function HydroChart() {
  const W = 600, H = 200, PAD = { top: 20, bottom: 30, left: 40, right: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...HYDRO.map(d => Math.max(d.rain, d.soil)));
  const scale = chartH / maxVal;

  const barW = chartW / HYDRO.length * 0.55;
  const gap = chartW / HYDRO.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="gr-hydro-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = PAD.top + chartH * (1 - r);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af" fontFamily="Manrope, sans-serif">
              {Math.round(maxVal * r)}
            </text>
          </g>
        );
      })}

      {/* Bars (precipitation) */}
      {HYDRO.map((d, i) => {
        const x = PAD.left + i * gap + (gap - barW) / 2;
        const barH = d.rain * scale;
        return (
          <g key={`bar-${i}`}>
            <rect x={x} y={PAD.top + chartH - barH} width={barW} height={barH} rx="3" fill="url(#rainGrad)" />
            <text x={x + barW / 2} y={PAD.top + chartH - barH - 5} textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="Manrope, sans-serif" fontWeight="600">
              {d.rain}
            </text>
          </g>
        );
      })}

      {/* Soil moisture line + area */}
      <path
        d={
          HYDRO.map((d, i) => {
            const x = PAD.left + i * gap + gap / 2;
            const y = PAD.top + chartH - d.soil * scale;
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ') +
          ` L${PAD.left + (HYDRO.length - 1) * gap + gap / 2},${PAD.top + chartH} L${PAD.left + gap / 2},${PAD.top + chartH} Z`
        }
        fill="url(#soilGrad)"
      />
      <path
        d={HYDRO.map((d, i) => {
          const x = PAD.left + i * gap + gap / 2;
          const y = PAD.top + chartH - d.soil * scale;
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ')}
        fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Soil dots */}
      {HYDRO.map((d, i) => {
        const x = PAD.left + i * gap + gap / 2;
        const y = PAD.top + chartH - d.soil * scale;
        return <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="#10b981" stroke="white" strokeWidth="1.5" />;
      })}

      {/* X-axis labels */}
      {HYDRO.map((d, i) => (
        <text key={`label-${i}`} x={PAD.left + i * gap + gap / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="Manrope, sans-serif" fontWeight="600">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

export default HydroChart;
