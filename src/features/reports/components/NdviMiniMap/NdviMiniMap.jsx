import React from 'react';

function NdviMiniMap({ color, selected }) {
  return (
    <svg viewBox="0 0 80 50" className="gr-mini-map-svg">
      <defs>
        <radialGradient id={`mg-${color.replace('#', '')}`} cx="40%" cy="45%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="70%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.15" />
        </radialGradient>
        <filter id="mm-blur"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <rect width="80" height="50" fill="#1a3a0f" rx="5" />
      <ellipse cx="38" cy="26" rx="32" ry="20" fill="#2a5218" />
      <ellipse cx="35" cy="24" rx="24" ry="15"
        fill={`url(#mg-${color.replace('#', '')})`} filter="url(#mm-blur)" />
      {selected && <rect width="80" height="50" fill="none" stroke="white" strokeWidth="1.5" rx="5" opacity="0.5" />}
    </svg>
  );
}

export default NdviMiniMap;
