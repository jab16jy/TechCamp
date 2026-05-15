import React from 'react';

const AdvancedResultHeader = ({ title, subtitle, algoScore, pulse, onExportCSV, onExportPDF }) => {
  return (
    <header className="ra-header">
      <div className="ra-header-left">
        <nav className="ra-breadcrumb">
          <span>Reportes</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="ra-breadcrumb-active">Análisis Avanzado</span>
        </nav>
        <div className="ra-badges-row">
          <span className="ra-badge-mode">MODO AVANZADO</span>
          <span className="ra-ref">REF: #SOIL-ADV-2024-X1</span>
          <span className="ra-coords">
            <span className="material-symbols-outlined text-xs">location_on</span>
            Lat: 10.42°N &nbsp;|&nbsp; Long: -75.54°W
          </span>
        </div>
        <h1 className="ra-title">{title} <span className="ra-title-sub">— {subtitle}</span></h1>
      </div>
      <div className="ra-header-right">
        <div className="ra-algo-badge">
          <div className="ra-algo-score">{algoScore}<span>%</span></div>
          <div>
            <p className="ra-algo-label">Precisión Algorítmica</p>
            <p className="ra-algo-ver">v4.2.0 • Random Forest</p>
          </div>
        </div>
        <div className="ra-sensor-status">
          <span className={`ra-pulse-dot ${pulse ? 'ra-pulse-on' : 'ra-pulse-off'}`}></span>
          <div>
            <p className="ra-sensor-label">Red de Sensores</p>
            <p className="ra-sensor-sub">12 nodos activos</p>
          </div>
        </div>
        <div className="ra-header-btns">
          <button className="ra-btn-secondary" onClick={onExportCSV}>
            <span className="material-symbols-outlined text-sm">download</span> Exportar CSV
          </button>
          <button className="ra-btn-primary" onClick={onExportPDF}>
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Informe Técnico
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdvancedResultHeader;
