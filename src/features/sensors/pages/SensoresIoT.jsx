import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import NodeList from '@features/sensors/components/NodeList/NodeList';
import FarmMap from '@features/sensors/components/FarmMap/FarmMap';
import TelemetryPanel from '@features/sensors/components/TelemetryPanel/TelemetryPanel';
import EventLog from '@features/sensors/components/EventLog/EventLog';
import { useSensoresIoT } from '@features/sensors/hooks/useSensoresIoT';
import './SensoresIoT.css';
// Note: SensoresIoT.module.css retained for legacy compatibility but not used here

const SensoresIoT = () => {
  const {
    showNdvi,
    pulse,
    valveActive,
    selectedNode,
    NODES,
    LOGS,
    sel,
    handleShowNdviChange,
    handleValveToggle,
    setSelectedNode,
    navigate,
  } = useSensoresIoT();

  return (
    <ResearcherLayout activeTab="sensores">
      <div className="iot-root">

        {/* ── HEADER ── */}
        <header className="iot-header">
          <div className="iot-header-left">
            <div className="iot-nav-row">
              <button className="iot-back-btn" onClick={() => navigate('/investigador/dashboard')}>
                <span className="material-symbols-outlined">arrow_back</span>
                Volver al Dashboard
              </button>
              <nav className="iot-breadcrumb">
                <span>Reportes</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span className="iot-crumb-active">Sensores IoT</span>
              </nav>
            </div>
            <div className="iot-title-row">
              <h1 className="iot-title">Monitoreo de Red IoT <span className="iot-title-light">en Tiempo Real</span></h1>
              <div className="iot-meta-badges">
                <span className="iot-badge-mode">RED ACTIVA</span>
                <span className="iot-badge-ref">REF: #IOT-NET-2024</span>
                <span className="iot-badge-coords">
                  <span className="material-symbols-outlined" style={{fontSize:'0.75rem'}}>location_on</span>
                  Lote Norte · Turbaco
                </span>
              </div>
            </div>
          </div>
          <div className="iot-header-right">
            {/* Algo badge */}
            <div className="iot-algo-badge">
              <span className="iot-algo-score">94.2<small>%</small></span>
              <div>
                <p className="iot-algo-label">Precisión IA</p>
                <p className="iot-algo-ver">v4.2.0 · RF</p>
              </div>
            </div>
            {/* Sensor pulse */}
            <div className="iot-pulse-badge">
              <span className={`iot-pulse-dot ${pulse ? 'iot-pulse-on' : 'iot-pulse-dim'}`}></span>
              <div>
                <p className="iot-pulse-label">12 Nodos Activos</p>
                <p className="iot-pulse-sub">Bat. Promedio: 85%</p>
              </div>
            </div>
            <div className="iot-header-btns">
              <button className="iot-btn-ghost">
                <span className="material-symbols-outlined">download</span>
                CSV / JSON
              </button>
              <button className="iot-btn-primary">
                <span className="material-symbols-outlined">satellite_alt</span>
                Sentinel-2
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN 3-COLUMN GRID ── */}
        <div className="iot-main-grid">

          {/* ── COL 1: Node List ── */}
          <NodeList nodes={NODES} selectedNode={selectedNode} onSelectNode={setSelectedNode} />

          {/* ── COL 2: Map ── */}
          <div className="iot-map-col">
            <div className="iot-map-card">
              <div className="iot-map-topbar">
                <div>
                  <span className="iot-map-badge">MAPA DE DESPLIEGUE · ISOLÍNEAS NDVI</span>
                  <h2 className="iot-map-title">Mapa de Nodos y Capas Satelitales</h2>
                </div>
                <div className="iot-map-controls">
                  <label className="iot-layer-toggle">
                    <input type="checkbox" checked={showNdvi} onChange={handleShowNdviChange} />
                    <span className="iot-toggle-track">
                      <span className="iot-toggle-knob"></span>
                    </span>
                    <span>Sentinel-2 NDVI</span>
                  </label>
                  <button className="iot-map-btn"><span className="material-symbols-outlined">zoom_in</span></button>
                  <button className="iot-map-btn"><span className="material-symbols-outlined">zoom_out</span></button>
                </div>
              </div>
              <FarmMap showNdvi={showNdvi} />
            </div>

            {/* AI Recommendation Card */}
            <div className="iot-ai-card">
              <div className="iot-ai-header">
                <div className="iot-ai-icon-box">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div>
                  <span className="iot-ai-badge">RECOMENDACIÓN DEL ASISTENTE</span>
                  <h3 className="iot-ai-title">Estrés hídrico detectado en Sector Sur (Nodo 04)</h3>
                </div>
                <span className="iot-ai-confidence">65% riesgo</span>
              </div>
              <p className="iot-ai-desc">
                El modelo detecta descenso continuo de humedad en el <strong>Nodo 04</strong> (24%). Probabilidad de estrés hídrico severo en 48h según IA Predictiva. Se recomienda activar el sistema de riego de manera inmediata para compensar la evapotranspiración.
              </p>
              <div className="iot-ai-footer">
                <button
                  className={`iot-valve-btn ${valveActive ? 'iot-valve-active' : ''}`}
                  onClick={handleValveToggle}
                >
                  <span className="material-symbols-outlined">sprinkler</span>
                  {valveActive ? '✓ Válvula B-12 Activa' : 'Activar Válvula B-12 (Riego)'}
                </button>
                <button className="iot-ghost-sm">
                  Ver Sector Sur <span className="material-symbols-outlined" style={{fontSize:'0.8rem'}}>arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── COL 3: Telemetry + Logs ── */}
          <div className="iot-right-col">

            <TelemetryPanel selectedNode={sel} />

            <EventLog logs={LOGS} />

          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default SensoresIoT;
