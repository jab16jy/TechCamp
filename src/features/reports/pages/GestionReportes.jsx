import { useNavigate } from 'react-router-dom';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import GaugeChart from '@features/reports/components/GaugeChart/GaugeChart';
import NdviMiniMap from '@features/reports/components/NdviMiniMap/NdviMiniMap';
import HydroChart from '@features/reports/components/HydroChart/HydroChart';
import useTaskManager, { NDVI_MONTHS, TASKS } from '@features/reports/hooks/useTaskManager';
import './GestionReportes.css';

// ── Main ──
const GestionReportes = () => {
  const navigate = useNavigate();
  const {
    activeMonth,
    setActiveMonth,
    tasks,
    toggleTask,
    completedCount,
    totalCount,
    progressPercent,
  } = useTaskManager();

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
              <span className="gr-task-count">{completedCount}/{totalCount} completadas</span>
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
                <div className="gr-task-progress-fill" style={{width:`${progressPercent}%`}}></div>
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
