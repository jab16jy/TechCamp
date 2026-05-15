import React from 'react';

function HeatMap() {
  return (
    <svg viewBox="0 0 300 200" className="w-full h-full rounded-xl" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hot1" cx="35%" cy="40%" r="45%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#f97316" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="hot2" cx="70%" cy="65%" r="35%">
          <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <rect width="300" height="200" fill="#1e3a5f" />
      <ellipse cx="95" cy="85" rx="80" ry="60" fill="url(#hot1)" filter="url(#blur)" />
      <ellipse cx="210" cy="130" rx="65" ry="50" fill="url(#hot2)" filter="url(#blur)" />
      {/* Isolines */}
      <path d="M20,100 Q80,60 160,90 T280,80" className="isoline-path" />
      <path d="M10,130 Q90,90 170,115 T290,105" className="isoline-path" />
      <path d="M30,155 Q100,120 180,140 T270,135" className="isoline-path" />
      <path d="M50,175 Q110,145 190,160 T260,158" className="isoline-path isoline-faint" />
      {/* Legend bar */}
      <defs>
        <linearGradient id="legendGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <rect x="10" y="178" width="120" height="8" rx="4" fill="url(#legendGrad)" opacity="0.9" />
      <text x="10" y="196" fill="white" fontSize="7" opacity="0.8">Bajo</text>
      <text x="120" y="196" fill="white" fontSize="7" opacity="0.8" textAnchor="end">Alto</text>
    </svg>
  );
}

export default HeatMap;
