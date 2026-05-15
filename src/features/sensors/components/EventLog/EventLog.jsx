import React from 'react';

function EventLog({ logs }) {
  return (
    <div className="iot-log-card">
      <div className="iot-log-header">
        <span className="material-symbols-outlined iot-col-icon">history</span>
        <h2 className="iot-col-title">Log de Eventos</h2>
      </div>
      <div className="iot-log-list">
        {logs.map((l, i) => (
          <div key={i} className={`iot-log-item iot-log-${l.type}`}>
            <span className={`material-symbols-outlined iot-log-icon iot-log-icon-${l.type}`}>{l.icon}</span>
            <div className="iot-log-body">
              <p className="iot-log-title">{l.title}</p>
              <p className="iot-log-desc">{l.desc}</p>
              <span className="iot-log-time">{l.time}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="iot-log-more">
        Ver historial completo <span className="material-symbols-outlined" style={{fontSize:'0.8rem'}}>chevron_right</span>
      </button>
    </div>
  );
}

export default EventLog;
