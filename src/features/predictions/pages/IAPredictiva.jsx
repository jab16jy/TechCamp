import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Download,
  Share2,
  TrendingUp,
  Map as MapIcon,
  Clock,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import usePredictionSimulator from '@features/predictions/hooks/usePredictionSimulator';
import FeatureChart, { DEFAULT_FEATURES } from '@features/predictions/components/FeatureChart/FeatureChart';
import GrowthChart from '@features/predictions/components/GrowthChart/GrowthChart';
import FieldMap from '@features/predictions/components/FieldMap/FieldMap';
import SimulatorPanel from '@features/predictions/components/SimulatorPanel/SimulatorPanel';
import AIAlertsPanel from '@features/predictions/components/AIAlertsPanel/AIAlertsPanel';
import InfoTip from '@shared/ui/InfoTip/InfoTip';
import './IAPredictiva.css';

const IAPredictiva = () => {
  const authorized = useAuthGuard('investigador');
  if (!authorized) return null;

  const navigate = useNavigate();

  const {
    riego,
    setRiego,
    npk,
    setNpk,
    compare,
    setCompare,
    timeIdx,
    setTimeIdx,
    fechaSiembra,
    setFechaSiembra,
    variedad,
    setVariedad,
    simulando,
    simResult,
    setSimResult,
    handleSimular,
    clearSim,
    metrics,
    MONTHS,
  } = usePredictionSimulator();

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
            <SimulatorPanel
              riego={riego}
              setRiego={setRiego}
              npk={npk}
              setNpk={setNpk}
              fechaSiembra={fechaSiembra}
              setFechaSiembra={setFechaSiembra}
              variedad={variedad}
              setVariedad={setVariedad}
              simResult={simResult}
              setSimResult={setSimResult}
              simulando={simulando}
              handleSimular={handleSimular}
              clearSim={clearSim}
              compare={compare}
              setCompare={setCompare}
            />

            <FeatureChart features={simResult ? simResult.factores : DEFAULT_FEATURES} />
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
          <AIAlertsPanel />
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
