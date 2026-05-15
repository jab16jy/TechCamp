import React from 'react';

function RssiBar({ rssi }) {
  const pct = Math.max(0, Math.min(100, (rssi + 110) / 40 * 100));
  const color = pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="iot-rssi-wrap">
      <div className="iot-rssi-track">
        <div className="iot-rssi-fill" style={{ width: `${pct}%`, background: color }}></div>
      </div>
      <span className="iot-rssi-val">{rssi} dBm</span>
    </div>
  );
}

export default RssiBar;
