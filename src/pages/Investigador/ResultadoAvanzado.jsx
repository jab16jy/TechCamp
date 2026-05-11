import React, { useState, useEffect } from 'react';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import './ResultadoAvanzado.css';

// ── Data ──
const RADAR_DATA = [
  { label: 'N', actual: 0.78, objetivo: 0.85 },
  { label: 'P', actual: 0.62, objetivo: 0.80 },
  { label: 'K', actual: 0.91, objetivo: 0.75 },
  { label: 'pH', actual: 0.72, objetivo: 0.82 },
  { label: 'C.E.', actual: 0.55, objetivo: 0.65 },
  { label: 'M.O.', actual: 0.84, objetivo: 0.78 },
];

const PARAMS = [
  { key: 'N', label: 'Nitrógeno (N)', valor: 58, unit: 'mg/kg', pct: 77, status: 'ALTO', statusColor: 'text-amber-600 bg-amber-50 border-amber-200', barColor: 'from-amber-400 to-amber-600', icon: 'water_drop' },
  { key: 'P', label: 'Fósforo (P)', valor: 21, unit: 'mg/kg', pct: 52, status: 'ESTABLE', statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', barColor: 'from-emerald-400 to-emerald-600', icon: 'flare' },
  { key: 'K', label: 'Potasio (K)', valor: 195, unit: 'mg/kg', pct: 88, status: 'ÓPTIMO', statusColor: 'text-blue-600 bg-blue-50 border-blue-200', barColor: 'from-blue-400 to-blue-600', icon: 'bolt' },
];

const GAUGES = [
  { label: 'pH', valor: '6.2', sub: 'Acidez leve', icon: 'experiment', pct: 57, color: '#f59e0b' },
  { label: 'C.Eléctrica', valor: '1.8', unit: 'dS/m', sub: 'Salinidad óptima', icon: 'flash_on', pct: 45, color: '#3b82f6' },
  { label: 'Mat. Orgánica', valor: '3.5', unit: '%', sub: 'Excelente', icon: 'compost', pct: 70, color: '#10b981' },
];

const RECS = [
  { badge: 'HIDRO-ANALÍTICA', badgeClass: 'rec-badge-blue', iconBox: 'rec-icon-blue', icon: 'water_drop', title: 'Protocolo de Riego Diferenciado', desc: 'Optimizar balance hídrico (VPD 1.2 kPa). Incrementar flujo en zonas con alta conductividad eléctrica (>1.5 dS/m) para lixiviación controlada.', extra: '+12% biomasa', extraLabel: 'Eficacia estimada' },
  { badge: 'ALERTA PATÓGENA', badgeClass: 'rec-badge-red', iconBox: 'rec-icon-red', icon: 'pest_control', title: 'Intervención de Bio-Control', desc: 'Detección de estresores abióticos vinculados a H. hampei. Aplicar suspensión biológica (2.5L/ha) en sector noreste según mapa térmico.', alert: 'ACCIÓN REQUERIDA ANTES DE 48H' },
  { badge: 'AJUSTE QUÍMICO', badgeClass: 'rec-badge-green', iconBox: 'rec-icon-green', icon: 'science', title: 'Balance Nutricional NPK', desc: 'Aplicar fórmula NPK 15-15-15 quelatada. Reducción de urea en 5% para compensar pico de mineralización orgánica.', cta: 'Configurar Dosificación' },
];

// ── Radar SVG Helper ──
function polarToXY(angle, r, cx = 120, cy = 120, maxR = 100) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + maxR * r * Math.cos(rad), y: cy + maxR * r * Math.sin(rad) };
}

function radarPoints(data, key, cx = 120, cy = 120) {
  const n = data.length;
  return data.map((d, i) => {
    const pt = polarToXY(360 / n * i, d[key], cx, cy);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

function RadarChart({ data }) {
  const cx = 120, cy = 120, n = data.length;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      {/* Grid rings */}
      {rings.map(r => (
        <polygon key={r} className="radar-grid"
          points={data.map((_, i) => { const p = polarToXY(360/n*i, r, cx, cy); return `${p.x},${p.y}`; }).join(' ')} />
      ))}
      {/* Axes */}
      {data.map((_, i) => { const p = polarToXY(360/n*i, 1, cx, cy); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="radar-axis" />; })}
      {/* Target area */}
      <polygon points={radarPoints(data, 'objetivo', cx, cy)} className="radar-target" />
      {/* Actual area */}
      <polygon points={radarPoints(data, 'actual', cx, cy)} className="radar-actual" />
      {/* Dots */}
      {data.map((d, i) => { const p = polarToXY(360/n*i, d.actual, cx, cy); return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1A4D3A" />; })}
      {/* Labels */}
      {data.map((d, i) => { const p = polarToXY(360/n*i, 1.22, cx, cy); return <text key={i} x={p.x} y={p.y} className="radar-label" textAnchor="middle" dominantBaseline="middle">{d.label}</text>; })}
    </svg>
  );
}

// ── Heatmap SVG ──
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

// ── Gauge ──
function Gauge({ valor, pct, color, label, unit, sub, icon }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = circ * pct / 100;
  return (
    <div className="gauge-card">
      <div className="gauge-svg-wrap">
        <svg viewBox="0 0 70 70" className="w-16 h-16">
          <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 35 35)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className="material-symbols-outlined gauge-icon" style={{ color }}>{icon}</span>
      </div>
      <p className="gauge-value">{valor}<span className="gauge-unit">{unit}</span></p>
      <p className="gauge-label">{label}</p>
      <p className="gauge-sub">{sub}</p>
    </div>
  );
}

// ── Simulation Chart ──
function SimChart({ rain, fert }) {
  const base = [20, 22, 25, 23, 27, 30, 35, 38, 42, 45, 48, 52];
  const pts = base.map((v, i) => ({
    x: 30 + i * 22,
    y: 160 - (v + rain * 0.3 + fert * 0.4) * 2.2
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${pts[pts.length-1].x} 165 L ${pts[0].x} 165 Z`;
  return (
    <svg viewBox="0 0 290 170" className="w-full h-full">
      <defs>
        <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[40,80,120,160].map(y => <line key={y} x1="25" y1={y} x2="280" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />)}
      {/* Y labels */}
      {[40,80,120,160].map((y, i) => <text key={y} x="18" y={y+4} fontSize="7" fill="#94a3b8" textAnchor="end">{(4-i)*1.5}t</text>)}
      {/* Area fill */}
      <path d={area} fill="url(#simGrad)" />
      {/* Line */}
      <path d={path} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />)}
      {/* X labels */}
      {['E','F','M','A','M','J','J','A','S','O','N','D'].map((m, i) => (
        <text key={m} x={30 + i * 22} y="172" fontSize="6.5" fill="#94a3b8" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

// ── Main Component ──
const ResultadoAvanzado = () => {
  const [rain, setRain] = useState(50);
  const [fert, setFert] = useState(50);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <ResearcherLayout activeTab="analisis">
      <div className="ra-root">

        {/* ── TOP HEADER ── */}
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
            <h1 className="ra-title">Calidad del Suelo <span className="ra-title-sub">— Hacienda El Sol, Lote Norte</span></h1>
          </div>
          <div className="ra-header-right">
            {/* Algorithm Health Badge */}
            <div className="ra-algo-badge">
              <div className="ra-algo-score">94.2<span>%</span></div>
              <div>
                <p className="ra-algo-label">Precisión Algorítmica</p>
                <p className="ra-algo-ver">v4.2.0 • Random Forest</p>
              </div>
            </div>
            {/* Sensor status */}
            <div className="ra-sensor-status">
              <span className={`ra-pulse-dot ${pulse ? 'ra-pulse-on' : 'ra-pulse-off'}`}></span>
              <div>
                <p className="ra-sensor-label">Red de Sensores</p>
                <p className="ra-sensor-sub">12 nodos activos</p>
              </div>
            </div>
            <div className="ra-header-btns">
              <button className="ra-btn-secondary">
                <span className="material-symbols-outlined text-sm">download</span> Exportar CSV
              </button>
              <button className="ra-btn-primary">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Informe Técnico
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN GRID ── */}
        <div className="ra-main-grid">

          {/* LEFT: Radar + Parameters */}
          <div className="ra-left-col">

            {/* Spider Chart */}
            <div className="ra-card ra-radar-card">
              <div className="ra-card-header">
                <span className="material-symbols-outlined ra-card-icon">radar</span>
                <h2 className="ra-card-title">Radar Nutricional</h2>
                <div className="ra-legend">
                  <span className="ra-legend-dot ra-legend-actual"></span><span>Actual</span>
                  <span className="ra-legend-dot ra-legend-objetivo"></span><span>Objetivo Maíz</span>
                </div>
              </div>
              <div className="ra-radar-wrap">
                <RadarChart data={RADAR_DATA} />
              </div>
            </div>

            {/* Lab Parameters */}
            <div className="ra-card">
              <div className="ra-card-header">
                <span className="material-symbols-outlined ra-card-icon">biotech</span>
                <h2 className="ra-card-title">Parámetros Químicos de Laboratorio</h2>
                <span className="ra-calibration">Calibración: 24/05/2024 08:30</span>
              </div>
              <div className="ra-params-list">
                {PARAMS.map(p => (
                  <div key={p.key} className="ra-param-row">
                    <div className="ra-param-info">
                      <span className={`material-symbols-outlined ra-param-icon ${p.statusColor.split(' ')[0]}`}>{p.icon}</span>
                      <div>
                        <p className="ra-param-label">{p.label}</p>
                        <p className="ra-param-val">{p.valor} <span className="ra-param-unit">{p.unit}</span></p>
                      </div>
                    </div>
                    <div className="ra-param-bar-wrap">
                      <div className="ra-param-bar">
                        <div className={`ra-param-fill bg-gradient-to-r ${p.barColor}`} style={{ width: `${p.pct}%` }}></div>
                      </div>
                      <span className={`ra-status-badge border ${p.statusColor}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Gauges */}
              <div className="ra-gauges-row">
                {GAUGES.map(g => <Gauge key={g.label} {...g} />)}
              </div>
            </div>
          </div>

          {/* RIGHT: Heatmap + Recommendations */}
          <div className="ra-right-col">

            {/* Isoline Heatmap */}
            <div className="ra-card ra-heatmap-card">
              <div className="ra-heatmap-overlay-header">
                <div>
                  <span className="ra-glass-badge">CAPA TÉCNICA: ISOLÍNEAS N-TOTAL</span>
                  <h2 className="ra-heatmap-title">Mapa de Calor de Nutrientes</h2>
                  <p className="ra-heatmap-sub">Distribución espacial · Parcela Lote Norte · Turbaco</p>
                </div>
                <button className="ra-btn-glass">
                  <span className="material-symbols-outlined text-sm">open_in_full</span> Interactivo
                </button>
              </div>
              <div className="ra-heatmap-body">
                <HeatMap />
              </div>
            </div>

            {/* Recommendations */}
            <div className="ra-card">
              <div className="ra-card-header">
                <span className="material-symbols-outlined ra-card-icon">psychology</span>
                <h2 className="ra-card-title">Recomendaciones Especializadas del Laboratorio</h2>
              </div>
              <div className="ra-recs-grid">
                {RECS.map(r => (
                  <div key={r.badge} className={`ra-rec-card ra-rec-${r.badgeClass}`}>
                    <div className="ra-rec-top">
                      <div className={`ra-rec-icon-box ${r.iconBox}`}>
                        <span className="material-symbols-outlined">{r.icon}</span>
                      </div>
                      <span className={`ra-rec-badge ${r.badgeClass}`}>{r.badge}</span>
                    </div>
                    <h4 className="ra-rec-title">{r.title}</h4>
                    <p className="ra-rec-desc">{r.desc}</p>
                    {r.alert && (
                      <div className="ra-rec-alert">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        <span>{r.alert}</span>
                      </div>
                    )}
                    {r.extra && (
                      <div className="ra-rec-extra">
                        <span className="ra-rec-extra-label">{r.extraLabel}</span>
                        <span className="ra-rec-extra-val">{r.extra}</span>
                      </div>
                    )}
                    {r.cta && (
                      <button className="ra-rec-cta">
                        {r.cta} <span className="material-symbols-outlined text-sm">tune</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SIMULATION ENGINE ── */}
        <section className="ra-sim-section">
          <div className="ra-sim-header">
            <span className="material-symbols-outlined ra-sim-icon">analytics</span>
            <div>
              <h3 className="ra-sim-title">Motor de Simulación Estocástica</h3>
              <p className="ra-sim-sub">Proyecte el rendimiento ajustando precipitación y plan de fertilización con el motor IA de AgroCaribe.</p>
            </div>
            <button className="ra-btn-sim">
              <span className="material-symbols-outlined text-sm">play_arrow</span> Iniciar Simulación
            </button>
          </div>
          <div className="ra-sim-body">
            <div className="ra-sim-chart">
              <SimChart rain={rain} fert={fert} />
            </div>
            <div className="ra-sim-controls">
              <div className="ra-slider-group">
                <label className="ra-slider-label">
                  <span className="material-symbols-outlined text-blue-500 text-sm">water_drop</span>
                  Precipitación variable
                  <span className="ra-slider-val">{rain}%</span>
                </label>
                <input type="range" min="0" max="100" value={rain} onChange={e => setRain(+e.target.value)} className="ra-slider ra-slider-blue" />
              </div>
              <div className="ra-slider-group">
                <label className="ra-slider-label">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">science</span>
                  Plan de fertilización
                  <span className="ra-slider-val">{fert}%</span>
                </label>
                <input type="range" min="0" max="100" value={fert} onChange={e => setFert(+e.target.value)} className="ra-slider ra-slider-green" />
              </div>
              <div className="ra-sim-projection">
                <p className="ra-sim-proj-label">Proyección de Rendimiento</p>
                <p className="ra-sim-proj-val">{(3.2 + rain * 0.02 + fert * 0.025).toFixed(2)} <span>t/ha</span></p>
                <p className="ra-sim-proj-sub">Ciclo 2024–2025 · Maíz Híbrido</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </ResearcherLayout>
  );
};

export default ResultadoAvanzado;
