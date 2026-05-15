import React from 'react';
import { Clock, ChevronRight, BatteryWarning, Droplets, RefreshCw, Satellite } from 'lucide-react';

const iconMap = {
  battery_alert: BatteryWarning,
  sprinkler: Droplets,
  sync_alt: RefreshCw,
  satellite_alt: Satellite,
};

function EventLog({ logs }) {
  return (
    <div className="iot-log-card">
      <div className="iot-log-header">
        <Clock size={16} className="iot-col-icon" />
        <h2 className="iot-col-title">Log de Eventos</h2>
      </div>
      <div className="iot-log-list">
        {logs.map((l, i) => {
          const IconComponent = iconMap[l.icon] || Clock;
          return (
            <div key={i} className={`iot-log-item iot-log-${l.type}`}>
              <IconComponent size={16} className={`iot-log-icon iot-log-icon-${l.type}`} />
              <div className="iot-log-body">
                <p className="iot-log-title">{l.title}</p>
                <p className="iot-log-desc">{l.desc}</p>
                <span className="iot-log-time">{l.time}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="iot-log-more">
        Ver historial completo <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default EventLog;
