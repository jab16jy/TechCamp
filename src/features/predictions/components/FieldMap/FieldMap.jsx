import React from 'react';

export default function FieldMap({ timeIdx }) {
  const opacity = 0.4 + timeIdx * 0.12;
  return (
    <svg viewBox="0 0 500 220" className="ia-map-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="yield1" cx="40%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#166534" stopOpacity={opacity + 0.1} />
          <stop offset="50%" stopColor="#4ade80" stopOpacity={opacity - 0.05} />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id="yield2" cx="72%" cy="60%" r="32%">
          <stop offset="0%" stopColor="#ca8a04" stopOpacity={opacity} />
          <stop offset="70%" stopColor="#fde68a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="fm-blur"><feGaussianBlur stdDeviation="10" /></filter>
        <linearGradient id="mapLegGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <rect width="500" height="220" fill="#1a3a0f" />
      <ellipse cx="250" cy="110" rx="220" ry="105" fill="#2a5218" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="20" y1={30 + i * 32} x2="480" y2={30 + i * 32} stroke="rgba(255,255,255,.04)" strokeWidth="1" />
      ))}
      <rect x="20" y="15" width="460" height="190" rx="6" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" strokeDasharray="5 4" />
      <ellipse cx="195" cy="95" rx="150" ry="95" fill="url(#yield1)" filter="url(#fm-blur)" />
      <ellipse cx="355" cy="145" rx="110" ry="80" fill="url(#yield2)" filter="url(#fm-blur)" />
      {/* Legend */}
      <rect x="15" y="198" width="100" height="6" rx="3" fill="url(#mapLegGrad)" opacity="0.9" />
      <text x="15" y="213" fill="rgba(255,255,255,.5)" fontSize="6.5" fontFamily="sans-serif">Baja Productividad</text>
      <text x="115" y="213" textAnchor="end" fill="rgba(255,255,255,.5)" fontSize="6.5" fontFamily="sans-serif">Alta</text>
    </svg>
  );
}
