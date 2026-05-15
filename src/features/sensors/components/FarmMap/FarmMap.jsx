import React from 'react';

function FarmMap({ showNdvi }) {
  return (
    <svg viewBox="0 0 500 320" className="iot-map-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="ndvi1" cx="40%" cy="35%" r="40%">
          <stop offset="0%" stopColor="#166534" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#4ade80" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id="ndvi2" cx="72%" cy="62%" r="32%">
          <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#fde68a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <filter id="mapBlur"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>

      {/* Farm background */}
      <rect width="500" height="320" fill="#2d4a1e" />
      <ellipse cx="250" cy="160" rx="220" ry="140" fill="#3a5c26" />
      {/* Grid lines (field rows) */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={i} x1="30" y1={40 + i * 35} x2="470" y2={40 + i * 35} stroke="rgba(255,255,255,.04)" strokeWidth="1" />
      ))}
      {/* Parcel border */}
      <rect x="30" y="30" width="440" height="260" rx="8" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" strokeDasharray="6 4" />

      {/* NDVI heatmap overlay */}
      {showNdvi && (
        <>
          <ellipse cx="200" cy="110" rx="160" ry="100" fill="url(#ndvi1)" filter="url(#mapBlur)" />
          <ellipse cx="360" cy="200" rx="120" ry="90"  fill="url(#ndvi2)" filter="url(#mapBlur)" />
        </>
      )}

      {/* Node markers */}
      {[
        { id:'01', x:100, y:80,  online:true,  warn:false },
        { id:'02', x:200, y:70,  online:true,  warn:true  },
        { id:'03', x:260, y:165, online:true,  warn:false },
        { id:'04', x:170, y:235, online:true,  warn:true  },
        { id:'05', x:380, y:110, online:true,  warn:false },
        { id:'06', x:410, y:240, online:false, warn:false },
      ].map(n => (
        <g key={n.id}>
          {n.online && !n.warn && (
            <circle cx={n.x} cy={n.y} r="14" fill="rgba(16,185,129,.15)" />
          )}
          {n.warn && (
            <circle cx={n.x} cy={n.y} r="14" fill="rgba(245,158,11,.2)" />
          )}
          <circle cx={n.x} cy={n.y} r="9"
            fill={n.online ? (n.warn ? '#f59e0b' : '#10b981') : '#6b7280'}
            stroke="white" strokeWidth="1.5" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fill="white"
            fontSize="6.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace">{n.id}</text>
          <text x={n.x} y={n.y + 20} textAnchor="middle"
            fill="rgba(255,255,255,.6)" fontSize="6" fontFamily="sans-serif">N{n.id}</text>
        </g>
      ))}

      {/* Scale bar */}
      <line x1="40" y1="298" x2="100" y2="298" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" />
      <text x="70" y="312" textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="7" fontFamily="sans-serif">50m</text>

      {/* NDVI Legend */}
      {showNdvi && (
        <>
          <defs>
            <linearGradient id="ndviLeg" x1="0" x2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
          </defs>
          <rect x="350" y="290" width="110" height="7" rx="3.5" fill="url(#ndviLeg)" opacity="0.9" />
          <text x="350" y="308" fill="rgba(255,255,255,.55)" fontSize="6.5" fontFamily="sans-serif">Bajo NDVI</text>
          <text x="460" y="308" textAnchor="end" fill="rgba(255,255,255,.55)" fontSize="6.5" fontFamily="sans-serif">Alto NDVI</text>
        </>
      )}
    </svg>
  );
}

export default FarmMap;
