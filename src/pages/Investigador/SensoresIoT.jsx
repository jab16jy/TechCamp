import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import './SensoresIoT.css';
// Note: SensoresIoT.module.css retained for legacy compatibility but not used here

// ── Static Data ──
const NODES = [
  { id: '01', sector: 'Sector Norte', rssi: -72, battery: 96, online: true,  hum: 42, temp: 26.1, ce: 1.4 },
  { id: '02', sector: 'Sector Norte', rssi: -88, battery: 12, online: true,  hum: 38, temp: 26.8, ce: 1.3 },
  { id: '03', sector: 'Sector Centro',rssi: -81, battery: 71, online: true,  hum: 51, temp: 27.2, ce: 1.1 },
  { id: '04', sector: 'Sector Sur',   rssi: -93, battery: 85, online: true,  hum: 24, temp: 28.0, ce: 1.2 },
  { id: '05', sector: 'Sector Este',  rssi: -78, battery: 63, online: true,  hum: 45, temp: 27.5, ce: 1.5 },
  { id: '06', sector: 'Sector Oeste', rssi: -99, battery: 34, online: false, hum: 0,  temp: 0,    ce: 0   },
];

const LOGS = [
  { icon: 'battery_alert',  type: 'error',   title: 'Nodo 02 · Batería Crítica (12%)', desc: 'Reemplazo sugerido. Sin acción → pérdida de datos.', time: 'hace 12 min' },
  { icon: 'sprinkler',      type: 'success',  title: 'Riego Sector Norte · Activado',   desc: 'Iniciado automáticamente por IA Predictiva.', time: 'hace 28 min' },
  { icon: 'sync_alt',       type: 'info',     title: 'Sincronización Completa',          desc: '12 nodos reportando sin pérdida de paquetes.', time: 'hace 1h' },
  { icon: 'satellite_alt',  type: 'info',     title: 'Sentinel-2 · Imagen Actualizada', desc: 'NDVI recalculado. Cobertura 100%.', time: 'hace 2h' },
];

// ── Mini Sparkline ──
function Spark({ vals, color }) {
  const h = 28, w = 60;
  const max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── RSSI bar ──
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

// ── Heatmap map overlay SVG ──
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

// ── Main Component ──
const SensoresIoT = () => {
  const navigate = useNavigate();
  const [showNdvi, setShowNdvi] = useState(false);
  const [pulse, setPulse]       = useState(true);
  const [valveActive, setValveActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState('04');

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(id);
  }, []);

  const sel = NODES.find(n => n.id === selectedNode) || NODES[3];
  const humSpark = [38, 35, 32, 30, 27, 25, 24, 24];
  const tempSpark = [26.5, 27, 27.3, 27.8, 28, 28.1, 28, 28];
  const ceSpark = [1.1, 1.1, 1.2, 1.2, 1.2, 1.3, 1.2, 1.2];

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
          <aside className="iot-node-col">
            <div className="iot-node-col-header">
              <span className="material-symbols-outlined iot-col-icon">hub</span>
              <h2 className="iot-col-title">Estado de Nodos</h2>
            </div>
            <div className="iot-node-list">
              {NODES.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n.id)}
                  className={`iot-node-item ${selectedNode === n.id ? 'iot-node-selected' : ''} ${!n.online ? 'iot-node-offline' : ''}`}
                >
                  <div className="iot-node-top">
                    <div className="iot-node-id-wrap">
                      <span className={`iot-node-status-dot ${n.online ? (n.battery < 20 ? 'dot-warn' : 'dot-ok') : 'dot-off'}`}></span>
                      <span className="iot-node-id">Nodo {n.id}</span>
                    </div>
                    <span className="iot-node-sector">{n.sector}</span>
                  </div>
                  <RssiBar rssi={n.rssi} />
                  <div className="iot-node-stats">
                    <span className="iot-node-stat">
                      <span className="material-symbols-outlined" style={{fontSize:'0.75rem',color:'#64748b'}}>battery_std</span>
                      {n.online ? `${n.battery}%` : '–'}
                    </span>
                    <span className={`iot-node-tag ${n.online ? (n.battery < 20 ? 'tag-warn' : 'tag-ok') : 'tag-off'}`}>
                      {n.online ? (n.battery < 20 ? 'BATERÍA BAJA' : 'ONLINE') : 'OFFLINE'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

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
                    <input type="checkbox" checked={showNdvi} onChange={e => setShowNdvi(e.target.checked)} />
                    <span className="iot-toggle-track">
                      <span className="iot-toggle-knob"></span>
                    </span>
                    <span>Sentinel-2 NDVI</span>
                  </label>
                  <button className="iot-map-btn"><span className="material-symbols-outlined">zoom_in</span></button>
                  <button className="iot-map-btn"><span className="material-symbols-outlined">zoom_out</span></button>
                </div>
              </div>
              <div className="iot-map-body">
                <FarmMap showNdvi={showNdvi} />
              </div>
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
                  onClick={() => setValveActive(v => !v)}
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

            {/* Gauge Cards */}
            <div className="iot-gauge-card">
              <div className="iot-gauge-row">
                <div className="iot-gauge-icon-box blue">
                  <span className="material-symbols-outlined">water_drop</span>
                </div>
                <div className="iot-gauge-info">
                  <p className="iot-gauge-label">Humedad del Suelo</p>
                  <div className="iot-gauge-val-row">
                    <span className="iot-gauge-val blue">{sel.hum}%</span>
                    <span className="iot-gauge-trend down">↓</span>
                    <span className="iot-gauge-compare">vs NASA Hist.</span>
                  </div>
                </div>
                <Spark vals={humSpark} color="#3b82f6" />
              </div>
              <div className="iot-mini-bar">
                <div className="iot-mini-fill blue" style={{width:`${sel.hum}%`}}></div>
              </div>
            </div>

            <div className="iot-gauge-card">
              <div className="iot-gauge-row">
                <div className="iot-gauge-icon-box amber">
                  <span className="material-symbols-outlined">thermostat</span>
                </div>
                <div className="iot-gauge-info">
                  <p className="iot-gauge-label">Temperatura Ambiente</p>
                  <div className="iot-gauge-val-row">
                    <span className="iot-gauge-val amber">{sel.temp}°C</span>
                    <span className="iot-gauge-trend up">↑</span>
                    <span className="iot-gauge-compare">vs 27.2°C NASA</span>
                  </div>
                </div>
                <Spark vals={tempSpark} color="#f59e0b" />
              </div>
              <div className="iot-mini-bar">
                <div className="iot-mini-fill amber" style={{width:`${(sel.temp/40)*100}%`}}></div>
              </div>
            </div>

            <div className="iot-gauge-card">
              <div className="iot-gauge-row">
                <div className="iot-gauge-icon-box green">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div className="iot-gauge-info">
                  <p className="iot-gauge-label">Conductividad Eléctrica</p>
                  <div className="iot-gauge-val-row">
                    <span className="iot-gauge-val green">{sel.ce} dS/m</span>
                    <span className="iot-tag-optimal">ÓPTIMO</span>
                  </div>
                </div>
                <Spark vals={ceSpark} color="#10b981" />
              </div>
              <div className="iot-mini-bar">
                <div className="iot-mini-fill green" style={{width:`${(sel.ce/3)*100}%`}}></div>
              </div>
            </div>

            {/* Event Log */}
            <div className="iot-log-card">
              <div className="iot-log-header">
                <span className="material-symbols-outlined iot-col-icon">history</span>
                <h2 className="iot-col-title">Log de Eventos</h2>
              </div>
              <div className="iot-log-list">
                {LOGS.map((l, i) => (
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

          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default SensoresIoT;
