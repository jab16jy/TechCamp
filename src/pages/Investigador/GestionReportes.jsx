import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import './GestionReportes.css';

// ── Data ──
const NDVI_MONTHS = [
  { month: 'Mar', value: '0.62', delta: '+3%', trend: 'up',   color: '#a3be8c' },
  { month: 'Abr', value: '0.68', delta: '+5%', trend: 'up',   color: '#8fb97a' },
  { month: 'May', value: '0.74', delta: '+7%', trend: 'up',   color: '#6ea055' },
  { month: 'Jun', value: '0.81', delta: '+5%', trend: 'up',   color: '#4d8c3a' },
  { month: 'Jul', value: '0.85', delta: '↑ MÁX', trend: 'max', color: '#166534' },
  { month: 'Ago', value: '0.78', delta: '-8%', trend: 'down', color: '#ca8a04' },
];

const HYDRO = [
  { label: 'Ene', rain: 42, soil: 38 },
  { label: 'Feb', rain: 58, soil: 51 },
  { label: 'Mar', rain: 74, soil: 65 },
  { label: 'Abr', rain: 91, soil: 82 },
  { label: 'May', rain: 110, soil: 95 },
  { label: 'Jun', rain: 68, soil: 72 },
];
const RAIN_MAX = 120;

const TASKS = [
  {
    title: 'Ajuste de Riego Sector B',
    desc: 'Detección de saturación en suelo profundo. Reducir 15% el caudal.',
    priority: 'ALTA', priorityClass: 'gr-priority-high',
    icon: 'water_drop',
  },
  {
    title: 'Fertilización Nitrogenada',
    desc: 'Ventana de 48h basada en pronóstico de lluvia leve (NASA POWER).',
    priority: 'MEDIA', priorityClass: 'gr-priority-med',
    icon: 'science',
  },
  {
    title: 'Revisión de Drenaje',
    desc: 'Mantenimiento preventivo en canaleta principal sector sur.',
    priority: 'BAJA', priorityClass: 'gr-priority-low',
    icon: 'plumbing',
  },
];

// ── Gauge ──
function GaugeChart({ pct = 82 }) {
  const R = 72, CX = 90, CY = 90;
  const circumference = 2 * Math.PI * R;
  // Semi-circle gauge: arc from 210° to -30° (240° sweep)
  const sweep = 240;
  const arcLen = (sweep / 360) * circumference;
  const dash = (pct / 100) * arcLen;

  // SVG arc path for a 240° arc centered at bottom
  const toRad = d => (d * Math.PI) / 180;
  const startAngle = 150; // degrees
  const endAngle = startAngle + sweep;
  const x1 = CX + R * Math.cos(toRad(startAngle));
  const y1 = CY + R * Math.sin(toRad(startAngle));
  const x2 = CX + R * Math.cos(toRad(endAngle));
  const y2 = CY + R * Math.sin(toRad(endAngle));
  const largeArc = sweep > 180 ? 1 : 0;

  const trackD = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;

  // Value arc
  const valAngle = startAngle + (pct / 100) * sweep;
  const vx2 = CX + R * Math.cos(toRad(valAngle));
  const vy2 = CY + R * Math.sin(toRad(valAngle));
  const valLargeArc = (pct / 100) * sweep > 180 ? 1 : 0;
  const valueD = `M ${x1} ${y1} A ${R} ${R} 0 ${valLargeArc} 1 ${vx2} ${vy2}`;

  return (
    <svg viewBox="0 0 180 180" className="gr-gauge-svg">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={trackD} fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round" />
      {/* Value */}
      <path d={valueD} fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
        className="gr-gauge-value-path" />
      {/* Center text */}
      <text x={CX} y={CY - 4} textAnchor="middle" className="gr-gauge-num">82</text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="gr-gauge-pct">%</text>
      <text x={CX} y={CY + 34} textAnchor="middle" className="gr-gauge-sub">Índice OEE</text>
    </svg>
  );
}

// ── Micro NDVI Map SVG ──
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

// ── Hydro Combo Chart ──
function HydroChart() {
  const H = 120, W = 100;
  // Normalise
  const rainPts = HYDRO.map((d, i) => ({
    x: (i / (HYDRO.length - 1)) * W,
    y: H - (d.soil / RAIN_MAX) * H,
    rain: d.rain,
  }));
  const linePts = rainPts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="gr-hydro-chart-wrap">
      {/* Bars */}
      <div className="gr-bars">
        {HYDRO.map((d, i) => (
          <div key={i} className="gr-bar-col">
            <div className="gr-bar-inner">
              <div
                className="gr-bar-fill"
                style={{ height: `${(d.rain / RAIN_MAX) * 100}%` }}
              >
                <span className="gr-bar-tip">{d.rain}mm</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Line overlay */}
      <svg className="gr-hydro-line-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${linePts} ${W},${H}`}
          fill="url(#lineGrad)"
        />
        <polyline
          points={linePts}
          fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        {rainPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#10b981" stroke="white" strokeWidth="1" />
        ))}
      </svg>
    </div>
  );
}

// ── Main ──
const GestionReportes = () => {
  const navigate = useNavigate();
  const [activeMonth, setActiveMonth] = useState('Jul');
  const [tasks, setTasks] = useState(TASKS.map(() => false));

  const toggleTask = i => setTasks(t => t.map((v, j) => j === i ? !v : v));

  return (
    <ResearcherLayout activeTab="reportes">
      <div className="gr-root">

        {/* ── HEADER ── */}
        <header className="gr-header">
          <div className="gr-header-left">
            <div className="gr-nav-row">
              <button className="gr-back-btn" onClick={() => navigate('/investigador/dashboard')}>
                <span className="material-symbols-outlined">arrow_back</span>
                Volver al Dashboard
              </button>
              <nav className="gr-breadcrumb">
                <span>Reportes</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span className="gr-crumb-active">Gestión y Reportes</span>
              </nav>
            </div>
            <div className="gr-title-row">
              <h1 className="gr-title">Gestión <span className="gr-title-amp">&</span> Reportes</h1>
              <div className="gr-meta-badges">
                <span className="gr-badge-mode">ANÁLISIS CONSOLIDADO</span>
                <span className="gr-badge-ref">
                  <span className="material-symbols-outlined" style={{fontSize:'0.75rem'}}>location_on</span>
                  Sector Norte · Parcela 4
                </span>
                <span className="gr-badge-ref">
                  <span className="material-symbols-outlined" style={{fontSize:'0.75rem'}}>calendar_today</span>
                  Agosto 2024
                </span>
              </div>
            </div>
          </div>
          <div className="gr-header-right">
            <button className="gr-btn-ghost">
              <span className="material-symbols-outlined">print</span>
            </button>
            <button className="gr-btn-ghost">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button className="gr-btn-primary">
              <span className="material-symbols-outlined">download</span>
              Exportar
            </button>
          </div>
        </header>

        {/* ── ROW 1: Gauge + NDVI Grid ── */}
        <div className="gr-row-top">

          {/* Gauge */}
          <div className="gr-card gr-gauge-card">
            <div className="gr-card-header">
              <span className="material-symbols-outlined gr-card-icon">donut_large</span>
              <h2 className="gr-card-title">Eficiencia de Parcela</h2>
            </div>
            <div className="gr-gauge-wrap">
              <GaugeChart pct={82} />
            </div>
            <div className="gr-optimal-pill">
              <span className="material-symbols-outlined" style={{fontSize:'0.75rem'}}>stars</span>
              Rendimiento Óptimo
            </div>
            <div className="gr-gauge-stats">
              <div className="gr-gauge-stat">
                <span className="gr-gauge-stat-val" style={{color:'#10b981'}}>↑ 6%</span>
                <span className="gr-gauge-stat-label">vs mes ant.</span>
              </div>
              <div className="gr-gauge-stat-divider"></div>
              <div className="gr-gauge-stat">
                <span className="gr-gauge-stat-val" style={{color:'#2563eb'}}>4.5 t/ha</span>
                <span className="gr-gauge-stat-label">Rendimiento</span>
              </div>
              <div className="gr-gauge-stat-divider"></div>
              <div className="gr-gauge-stat">
                <span className="gr-gauge-stat-val" style={{color:'#f59e0b'}}>12 ha</span>
                <span className="gr-gauge-stat-label">Área total</span>
              </div>
            </div>
          </div>

          {/* NDVI Grid */}
          <div className="gr-card gr-ndvi-card">
            <div className="gr-card-header">
              <span className="material-symbols-outlined gr-card-icon">satellite_alt</span>
              <h2 className="gr-card-title">Evolución del Vigor NDVI</h2>
              <span className="gr-badge-semester">Semestre I · 2024</span>
            </div>
            <div className="gr-ndvi-grid">
              {NDVI_MONTHS.map((m, i) => (
                <button
                  key={i}
                  className={`gr-ndvi-cell ${activeMonth === m.month ? 'gr-ndvi-active' : ''}`}
                  onClick={() => setActiveMonth(m.month)}
                >
                  <NdviMiniMap color={m.color} selected={activeMonth === m.month} />
                  <div className="gr-ndvi-info">
                    <span className="gr-ndvi-month">{m.month}</span>
                    <span className="gr-ndvi-val">{m.value}</span>
                    <span className={`gr-ndvi-delta ${m.trend === 'down' ? 'gr-delta-down' : m.trend === 'max' ? 'gr-delta-max' : 'gr-delta-up'}`}>
                      {m.trend === 'up' && '↑'}{m.trend === 'down' && '↓'} {m.delta}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Tasks + Hydro ── */}
        <div className="gr-row-mid">

          {/* AI Task Manager */}
          <div className="gr-card gr-tasks-card">
            <div className="gr-card-header">
              <span className="material-symbols-outlined gr-card-icon">psychology</span>
              <h2 className="gr-card-title">Acciones Recomendadas por IA</h2>
              <span className="gr-task-count">{tasks.filter(Boolean).length}/{TASKS.length} completadas</span>
            </div>
            <div className="gr-task-list">
              {TASKS.map((t, i) => (
                <div key={i} className={`gr-task-item ${tasks[i] ? 'gr-task-done' : ''}`}>
                  <label className="gr-task-check-wrap">
                    <input
                      type="checkbox"
                      checked={tasks[i]}
                      onChange={() => toggleTask(i)}
                      className="gr-checkbox-hidden"
                    />
                    <span className={`gr-checkbox-custom ${tasks[i] ? 'gr-checkbox-checked' : ''}`}>
                      {tasks[i] && <span className="material-symbols-outlined" style={{fontSize:'0.8rem',color:'white'}}>check</span>}
                    </span>
                  </label>
                  <div className="gr-task-icon-box">
                    <span className="material-symbols-outlined">{t.icon}</span>
                  </div>
                  <div className="gr-task-body">
                    <div className="gr-task-top">
                      <p className={`gr-task-title ${tasks[i] ? 'gr-task-title-done' : ''}`}>{t.title}</p>
                      <span className={`gr-priority-badge ${t.priorityClass}`}>{t.priority}</span>
                    </div>
                    <p className="gr-task-desc">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="gr-task-footer">
              <div className="gr-task-progress-track">
                <div className="gr-task-progress-fill" style={{width:`${(tasks.filter(Boolean).length / TASKS.length) * 100}%`}}></div>
              </div>
            </div>
          </div>

          {/* Hydrological Chart */}
          <div className="gr-card gr-hydro-card">
            <div className="gr-card-header">
              <span className="material-symbols-outlined gr-card-icon">water</span>
              <h2 className="gr-card-title">Análisis Hidrológico Cruzado</h2>
              <div className="gr-hydro-legend">
                <span className="gr-leg-bar"></span><span className="gr-leg-label">Precipitación NASA POWER</span>
                <span className="gr-leg-line"></span><span className="gr-leg-label">Humedad Suelo NDWI</span>
              </div>
            </div>
            <HydroChart />
            <div className="gr-hydro-x-axis">
              {HYDRO.map(d => <span key={d.label} className="gr-axis-label">{d.label}</span>)}
            </div>
          </div>
        </div>

        {/* ── EXPORT CARD ── */}
        <div className="gr-export-card">
          <div className="gr-export-bg-pattern">
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
              <circle cx="320" cy="60" r="90" fill="rgba(255,255,255,.04)" />
              <circle cx="360" cy="20" r="55" fill="rgba(255,255,255,.03)" />
              <circle cx="50"  cy="100" r="70" fill="rgba(255,255,255,.03)" />
            </svg>
          </div>
          <div className="gr-export-icon-box">
            <span className="material-symbols-outlined" style={{fontSize:'1.6rem',color:'#10b981'}}>description</span>
          </div>
          <div className="gr-export-text">
            <span className="gr-export-eyebrow">REPORTE TÉCNICO MENSUAL</span>
            <h3 className="gr-export-title">Informe Consolidado de Parcela · Agosto 2024</h3>
            <p className="gr-export-desc">
              Genera un PDF con mapas NDVI de alta resolución, métricas de laboratorio y recomendaciones de IA
              para auditoría crediticia y cumplimiento RSPO.
            </p>
          </div>
          <div className="gr-export-actions">
            <button className="gr-export-btn">
              <span className="material-symbols-outlined">download</span>
              Descargar PDF
            </button>
            <button className="gr-export-btn-ghost">
              <span className="material-symbols-outlined">share</span>
              Compartir
            </button>
            <span className="gr-export-meta">Generado con AgroCaribe IA · v4.2</span>
          </div>
        </div>

      </div>
    </ResearcherLayout>
  );
};

export default GestionReportes;
