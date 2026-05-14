import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Download,
  Share2,
  SlidersHorizontal,
  Droplets,
  FlaskConical,
  Sparkles,
  BarChart3,
  TrendingUp,
  Map as MapIcon,
  Clock,
  Bell,
  Leaf,
  Brain,
  Satellite,
  Globe,
  Microscope,
  Info,
  Sprout,
  BadgeCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import useAppStore from '../../context/useAppStore';
import AnalysisService from '../../services/analysisService';
import './IAPredictiva.css';

// ── XAI Bar Chart ──
const DEFAULT_FEATURES = [
  { label: 'Precipitación', pct: 91, color: '#2563eb' },
  { label: 'Nitrógeno (N)', pct: 78, color: '#10b981' },
  { label: 'Temperatura Máx.', pct: 62, color: '#f59e0b' },
  { label: 'Humedad del Suelo', pct: 54, color: '#3b82f6' },
  { label: 'Fósforo (P)', pct: 41, color: '#6ee7b7' },
  { label: 'Radiación Solar', pct: 33, color: '#fcd34d' },
  { label: 'Potasio (K)', pct: 27, color: '#86efac' },
];

function FeatureChart({ features = DEFAULT_FEATURES }) {
  return (
    <div className="ia-feature-list">
      {features.map((f, i) => (
        <div key={f.label} className="ia-feature-row">
          <span className="ia-feature-label">{f.label}</span>
          <div className="ia-feature-track">
            <div
              className="ia-feature-fill"
              style={{ width: `${f.pct}%`, background: f.color, animationDelay: `${i * 0.07}s` }}
            ></div>
          </div>
          <span className="ia-feature-pct">{f.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Growth Chart SVG ──
function GrowthChart({ riego, npk, proyeccion }) {
  const months = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
  let growthPts;
  let stressPts;

  if (proyeccion) {
    const maxC = Math.max(...proyeccion.crecimiento, 1);
    const maxS = Math.max(...proyeccion.estres, 1);
    growthPts = proyeccion.crecimiento.map((v, i) => [i * 160, 200 - (v / maxC) * 180]);
    stressPts = proyeccion.estres.map((v, i) => [i * 160, 200 - (v / maxS) * 180]);
  } else {
    const boost = riego * 0.3 + npk * 0.08;
    growthPts = [
      [0, 185], [160, 155], [320, 120], [480, 75 - boost * 0.3], [640, 45 - boost * 0.2], [800, 20 - boost * 0.1],
    ];
    stressPts = [
      [0, 195], [160, 197], [320, 188], [480, 192], [640, 170], [800, 175],
    ];
  }

  const toPath = (pts) => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, y)}`).join(' ');
  const toArea = (pts, base = 210) => toPath(pts) + ` L ${pts[pts.length - 1][0]} ${base} L 0 ${base} Z`;

  return (
    <svg viewBox="0 0 800 210" className="ia-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {/* Month markers */}
      {months.map((_, i) => (
        <line key={i} x1={i * 160} y1="0" x2={i * 160} y2="210" stroke="#f8fafc" strokeWidth="1" />
      ))}
      {/* Area fills */}
      <path d={toArea(growthPts)} fill="url(#growthGrad)" />
      <path d={toArea(stressPts)} fill="url(#stressGrad)" />
      {/* Lines */}
      <path d={toPath(growthPts)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(stressPts)} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="6 4" strokeLinecap="round" />
      {/* Growth dots */}
      {growthPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={Math.max(10, y)} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ── Field Map ──
function FieldMap({ timeIdx }) {
  const opacity = 0.4 + timeIdx * 0.12;
  return (
    <svg viewBox="0 0 500 220" className="ia-map-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="yield1" cx="40%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#166534" stopOpacity={opacity + 0.1} />
          <stop offset="50%" stopColor="#4ade80" stopOpacity={opacity - 0.05} />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id="yield2" cx="72%" cy="60%" r="32%">
          <stop offset="0%" stopColor="#ca8a04" stopOpacity={opacity} />
          <stop offset="70%" stopColor="#fde68a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="fm-blur"><feGaussianBlur stdDeviation="10" /></filter>
        <linearGradient id="mapLegGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <rect width="500" height="220" fill="#1a3a0f" />
      <ellipse cx="250" cy="110" rx="220" ry="105" fill="#2a5218" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="20" y1={30 + i * 32} x2="480" y2={30 + i * 32} stroke="rgba(255,255,255,.04)" strokeWidth="1" />
      ))}
      <rect x="20" y="15" width="460" height="190" rx="6" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" strokeDasharray="5 4" />
      <ellipse cx="195" cy="95" rx="150" ry="95" fill="url(#yield1)" filter="url(#fm-blur)" />
      <ellipse cx="355" cy="145" rx="110" ry="80" fill="url(#yield2)" filter="url(#fm-blur)" />
      {/* Legend */}
      <rect x="15" y="198" width="100" height="6" rx="3" fill="url(#mapLegGrad)" opacity="0.9" />
      <text x="15" y="213" fill="rgba(255,255,255,.5)" fontSize="6.5" fontFamily="sans-serif">Baja Productividad</text>
      <text x="115" y="213" textAnchor="end" fill="rgba(255,255,255,.5)" fontSize="6.5" fontFamily="sans-serif">Alta</text>
    </svg>
  );
}

// ── Tooltip ──
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="ia-tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={14} className="ia-info-icon" />
      {show && <div className="ia-tooltip">{text}</div>}
    </span>
  );
}

// ── Main ──
const IAPredictiva = () => {
  const navigate = useNavigate();
  const { agregarToast } = useAppStore();

  const [riego, setRiego] = useState(75);
  const [npk, setNpk] = useState(120);
  const [compare, setCompare] = useState(false);
  const [timeIdx, setTimeIdx] = useState(2);
  const [fechaSiembra, setFechaSiembra] = useState('2023-10-24');
  const [variedad, setVariedad] = useState('Híbrido Premium Maíz A-21');
  const [simulando, setSimulando] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const rendimiento = simResult
    ? simResult.rendimiento.toFixed(1)
    : (3.8 + riego * 0.012 + npk * 0.004).toFixed(1);
  const prob = simResult
    ? simResult.prob
    : Math.min(98, Math.round(72 + riego * 0.18 + npk * 0.06));
  const riesgo = simResult
    ? simResult.riesgo
    : Math.max(4, Math.round(28 - riego * 0.1 - npk * 0.04));

  const MONTHS = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];

  const handleSimular = async () => {
    if (simulando) return;
    setSimulando(true);
    try {
      const resultado = await AnalysisService.runPrediction({
        riego,
        npk,
        fechaSiembra,
        variedad,
      });
      setSimResult(resultado);
      agregarToast('Simulación predictiva completada con éxito', 'success');
    } catch (e) {
      agregarToast('Error al ejecutar la simulación', 'error');
    } finally {
      setSimulando(false);
    }
  };

  const clearSim = () => setSimResult(null);

  const metrics = [
    {
      icon: Sprout,
      label: 'Rendimiento Estimado',
      val: `${rendimiento}`,
      unit: 't/ha',
      sub: simResult ? 'Simulado' : 'Proyectadas',
      color: '#10b981',
      tip: 'Calculado con NASA POWER + Sentinel-2 NDVI',
    },
    {
      icon: BadgeCheck,
      label: 'Probabilidad de Éxito',
      val: `${prob}`,
      unit: '%',
      sub: simResult ? 'Resultado del modelo' : 'Estado: Óptimo',
      color: '#2563eb',
      tip: 'Modelo Random Forest con 94.2% de precisión',
    },
    {
      icon: AlertTriangle,
      label: 'Riesgo Climático',
      val: `${riesgo}`,
      unit: '%',
      sub: simResult
        ? riesgo < 10
          ? 'Amenaza Muy Baja'
          : 'Amenaza Baja'
        : 'Amenaza Baja',
      color: '#f59e0b',
      tip: 'Basado en pronóstico ECMWF + alertas Sentinel-2',
    },
  ];

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        {/* ── HEADER ── */}
        <header className="ia-header">
          <div className="ia-header-left">
            <div className="ia-nav-row">
              <button
                className="ia-back-btn"
                onClick={() => navigate('/investigador/dashboard')}
              >
                <ArrowLeft size={14} />
                Volver al Dashboard
              </button>
              <nav className="ia-breadcrumb">
                <span>Módulos</span>
                <ChevronRight size={12} />
                <span className="ia-crumb-active">IA Predictiva</span>
              </nav>
            </div>
            <div className="ia-title-row">
              <h1 className="ia-title">
                IA Predictiva <span className="ia-title-light">· Proyección de Cosecha</span>
              </h1>
              <div className="ia-meta-badges">
                <span className="ia-badge-mode">MODELO ACTIVO</span>
                <span className="ia-badge-ref">
                  <Calendar size={10} />
                  Oct 24, 2023
                </span>
                <span className="ia-badge-ref">
                  <MapPin size={10} />
                  Zona Norte · Lote A4
                </span>
              </div>
            </div>
          </div>
          <div className="ia-header-right">
            <div className="ia-algo-badge">
              <span className="ia-algo-score">
                94.2<small>%</small>
              </span>
              <div>
                <p className="ia-algo-label">Precisión Algorítmica</p>
                <p className="ia-algo-ver">v4.2.0 · Random Forest</p>
              </div>
            </div>
            <div className="ia-header-btns">
              <button className="ia-btn-ghost">
                <Download size={14} />
                Exportar
              </button>
              <button className="ia-btn-primary">
                <Share2 size={14} />
                Informe
              </button>
            </div>
          </div>
        </header>

        {/* ── METRICS ROW ── */}
        <div className="ia-metrics-row">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`ia-metric-card ${simResult ? 'ia-metric-simulated' : ''}`}
              style={{ '--accent': m.color }}
            >
              <div className="ia-metric-left">
                <div
                  className="ia-metric-icon-box"
                  style={{ background: m.color + '18', color: m.color }}
                >
                  <m.icon size={18} />
                </div>
                <div>
                  <div className="ia-metric-label-row">
                    <p className="ia-metric-label">{m.label}</p>
                    <InfoTip text={m.tip} />
                  </div>
                  <p className="ia-metric-sub">{m.sub}</p>
                </div>
              </div>
              <div className="ia-metric-val" style={{ color: m.color }}>
                {m.val}
                <span className="ia-metric-unit">{m.unit}</span>
                {simResult && (
                  <span className="ia-simulated-badge">SIM</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="ia-main-grid">
          {/* ── LEFT: Simulator + XAI ── */}
          <div className="ia-left-col">
            {/* Simulator */}
            <div className="ia-card">
              <div className="ia-card-header">
                <SlidersHorizontal size={16} className="ia-card-icon" />
                <h2 className="ia-card-title">Simulador de Rendimiento</h2>
              </div>

              <div className="ia-form-group">
                <label className="ia-form-label">Fecha de Siembra</label>
                <input
                  type="date"
                  className="ia-input"
                  value={fechaSiembra}
                  onChange={(e) => {
                    setFechaSiembra(e.target.value);
                    setSimResult(null);
                  }}
                />
              </div>
              <div className="ia-form-group">
                <label className="ia-form-label">Variedad de Semilla</label>
                <select
                  className="ia-select"
                  value={variedad}
                  onChange={(e) => {
                    setVariedad(e.target.value);
                    setSimResult(null);
                  }}
                >
                  <option>Híbrido Premium Maíz A-21</option>
                  <option>Bio-Resistente Soja G-90</option>
                  <option>Variedad Tradicional</option>
                </select>
              </div>

              <div className="ia-slider-group">
                <label className="ia-slider-label">
                  <Droplets size={14} style={{ color: '#3b82f6' }} />
                  Ajuste de Riego
                  <span className="ia-slider-val">{riego}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riego}
                  onChange={(e) => {
                    setRiego(+e.target.value);
                    setSimResult(null);
                  }}
                  className="ia-slider ia-slider-blue"
                />
              </div>

              <div className="ia-slider-group">
                <label className="ia-slider-label">
                  <FlaskConical size={14} style={{ color: '#10b981' }} />
                  Fertilización NPK
                  <span className="ia-slider-val">{npk} kg/ha</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="250"
                  value={npk}
                  onChange={(e) => {
                    setNpk(+e.target.value);
                    setSimResult(null);
                  }}
                  className="ia-slider ia-slider-green"
                />
              </div>

              <button
                className="ia-btn-execute"
                onClick={handleSimular}
                disabled={simulando}
              >
                {simulando ? (
                  <Loader2 size={16} className="ia-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {simulando ? 'Procesando modelo…' : 'Ejecutar Simulación Predictiva'}
              </button>

              {simResult && (
                <button
                  className="ia-btn-ghost"
                  onClick={clearSim}
                  style={{ marginTop: 4, justifyContent: 'center' }}
                >
                  Restablecer valores en vivo
                </button>
              )}

              <div className="ia-compare-row">
                <label className="ia-compare-label">
                  <span>Comparar Escenarios</span>
                  <button
                    className={`ia-toggle ${compare ? 'ia-toggle-on' : ''}`}
                    onClick={() => setCompare((c) => !c)}
                    aria-pressed={compare}
                  >
                    <span className="ia-toggle-knob"></span>
                  </button>
                </label>
                {compare && (
                  <span className="ia-compare-hint">Escenario A vs B activo</span>
                )}
              </div>
            </div>

            {/* XAI Feature Importance */}
            <div className="ia-card">
              <div className="ia-card-header">
                <BarChart3 size={16} className="ia-card-icon" />
                <h2 className="ia-card-title">Factores de Influencia (Random Forest)</h2>
              </div>
              <p className="ia-xai-sub">
                Importancia relativa de variables en la predicción actual
              </p>
              <FeatureChart
                features={simResult ? simResult.factores : DEFAULT_FEATURES}
              />
            </div>
          </div>

          {/* ── CENTER: Charts ── */}
          <div className="ia-center-col">
            {/* Growth Projection */}
            <div className="ia-card ia-chart-card">
              <div className="ia-card-header">
                <TrendingUp size={16} className="ia-card-icon" />
                <h2 className="ia-card-title">Proyección de Crecimiento (6 meses)</h2>
                <div className="ia-chart-legend">
                  <span
                    className="ia-leg-dot"
                    style={{ background: '#10b981' }}
                  ></span>
                  <span>Crecimiento</span>
                  <span
                    className="ia-leg-dot"
                    style={{ background: '#ef4444' }}
                  ></span>
                  <span>Estrés Climático</span>
                </div>
              </div>
              <div className="ia-chart-wrap">
                <GrowthChart
                  riego={riego}
                  npk={npk}
                  proyeccion={simResult?.proyeccion}
                />
              </div>
              <div className="ia-chart-x-axis">
                {MONTHS.map((m) => (
                  <span key={m} className="ia-axis-label">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Productivity Map */}
            <div className="ia-card ia-map-card">
              <div className="ia-card-header">
                <MapIcon size={16} className="ia-card-icon" />
                <h2 className="ia-card-title">Capa de Productividad Futura</h2>
                <div className="ia-map-legend">
                  <span className="ia-map-leg-label">Baja</span>
                  <div className="ia-map-grad-bar"></div>
                  <span className="ia-map-leg-label">Alta</span>
                </div>
              </div>
              <div className="ia-map-body">
                <FieldMap timeIdx={timeIdx} />
              </div>
              {/* Time Slider */}
              <div className="ia-time-slider-wrap">
                <Clock size={14} style={{ color: '#64748b' }} />
                <span className="ia-time-label">
                  Mes: <strong>{MONTHS[timeIdx]}</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={timeIdx}
                  onChange={(e) => setTimeIdx(+e.target.value)}
                  className="ia-slider ia-slider-emerald ia-time-range"
                />
                <div className="ia-time-ticks">
                  {MONTHS.map((m, i) => (
                    <span
                      key={m}
                      className={`ia-tick ${i === timeIdx ? 'ia-tick-active' : ''}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Alerts ── */}
          <div className="ia-right-col">
            <div className="ia-card-header" style={{ marginBottom: 8 }}>
              <Bell size={16} className="ia-card-icon" />
              <h2 className="ia-card-title">Alertas de IA</h2>
            </div>

            <div className="ia-alert-card ia-alert-red">
              <div className="ia-alert-icon red">
                <Droplets size={18} />
              </div>
              <div>
                <h4 className="ia-alert-title">Estrés Hídrico</h4>
                <p className="ia-alert-desc">
                  Sector B-12 en nivel crítico. Riego de emergencia recomendado en 24h.
                </p>
                <button className="ia-alert-action">Activar Riego →</button>
              </div>
            </div>

            <div className="ia-alert-card ia-alert-green">
              <div className="ia-alert-icon green">
                <Leaf size={18} />
              </div>
              <div>
                <h4 className="ia-alert-title">Ventana de Cosecha Óptima</h4>
                <p className="ia-alert-desc">
                  Maduración máxima proyectada: 12–15 Noviembre.
                </p>
                <button className="ia-alert-action green">
                  Ver Calendario →
                </button>
              </div>
            </div>

            <div className="ia-promo-card">
              <Brain size={40} className="ia-promo-bg-icon" />
              <h4 className="ia-promo-title">¿Optimizar fertilización?</h4>
              <p className="ia-promo-desc">
                La IA puede recalcular costos según precios actuales de mercado y salud del suelo.
              </p>
              <button className="ia-promo-btn">Ver Plan Optimizado</button>
            </div>

            {/* Data Sources */}
            <div className="ia-sources-card">
              <p className="ia-sources-title">Fuentes de datos</p>
              {[
                {
                  icon: Satellite,
                  name: 'Sentinel-2',
                  desc: 'NDVI · Última imagen: hace 6h',
                },
                {
                  icon: Globe,
                  name: 'NASA POWER',
                  desc: 'Clima histórico y actual',
                },
                {
                  icon: Microscope,
                  name: 'Laboratorio',
                  desc: 'Suelo · Calibración: 24/05',
                },
              ].map((s) => (
                <div key={s.name} className="ia-source-row">
                  <s.icon size={16} className="ia-source-icon" />
                  <div>
                    <p className="ia-source-name">{s.name}</p>
                    <p className="ia-source-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
