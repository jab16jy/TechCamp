import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, ShieldAlert, Bell, FileText,
  TrendingUp, MapPin, Calendar, Download, Printer, X,
  Sprout, Gauge, Droplets, Thermometer, Loader2, BarChart3,
  ListChecks,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useReportManager from '@features/reports/hooks/useReportManager';
import './GestionReportes.css';

const SEVERIDAD_ICON = {
  critica: { icon: ShieldAlert, color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)' },
  advertencia: { icon: AlertTriangle, color: '#b8860b', bg: 'rgba(184,134,11,0.08)' },
  info: { icon: Bell, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
};

const SCORE_COLOR = (s) => s >= 80 ? '#2D5A27' : s >= 55 ? '#b8860b' : '#ba1a1a';

const GestionReportes = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const {
    alertas, analyses, loading, exporting, selectedAnalysis,
    exportData, handleExport, clearExport, tareasRiego,
  } = useReportManager();

  if (!authorized) return null;

  if (exportData) {
    return (
      <ResearcherLayout activeTab="reportes">
        <div className="gr-root">
          <div className="gr-print-view">
            <div className="gr-print-toolbar">
              <button className="gr-back-btn" onClick={clearExport}>
                <ArrowLeft size={13} /> Volver
              </button>
              <button className="gr-print-btn" onClick={() => window.print()}>
                <Printer size={14} /> Imprimir / Guardar PDF
              </button>
            </div>
            <div className="gr-print-report">
              <h1 className="gr-print-title">{exportData.titulo}</h1>
              <p className="gr-print-date">{new Date(exportData.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

              <section className="gr-print-section">
                <h2>Ubicacion</h2>
                <p>{exportData.ubicacion?.municipio}, {exportData.ubicacion?.departamento}</p>
                <p>Coordenadas: {exportData.ubicacion?.lat?.toFixed(4)} N, {exportData.ubicacion?.lng?.toFixed(4)} W</p>
              </section>

              <section className="gr-print-section">
                <h2>Datos Climaticos</h2>
                <div className="gr-print-grid">
                  <div><strong>Temperatura:</strong> {exportData.clima?.temperatura} C</div>
                  <div><strong>Precipitacion:</strong> {exportData.clima?.precipitacion} mm</div>
                  <div><strong>Humedad:</strong> {exportData.clima?.humedad}%</div>
                </div>
              </section>

              <section className="gr-print-section">
                <h2>Indicadores Satelitales</h2>
                <div className="gr-print-grid">
                  <div><strong>NDVI:</strong> {exportData.satelite?.ndvi}</div>
                  <div><strong>NDWI:</strong> {exportData.satelite?.ndwi}</div>
                  <div><strong>Calidad suelo:</strong> {exportData.satelite?.calidad_suelo}</div>
                </div>
              </section>

              <section className="gr-print-section">
                <h2>Parametros del Suelo</h2>
                <div className="gr-print-grid">
                  <div><strong>pH:</strong> {exportData.suelo?.ph}</div>
                  <div><strong>Tipo:</strong> {exportData.suelo?.tipo}</div>
                  <div><strong>Textura:</strong> {exportData.suelo?.textura}</div>
                  <div><strong>Materia Organica:</strong> {exportData.suelo?.materia_organica}%</div>
                </div>
              </section>

              <section className="gr-print-section">
                <h2>Cultivos Recomendados</h2>
                {exportData.recomendaciones?.map((r, i) => (
                  <div key={i} className="gr-print-rec">
                    <span>{i + 1}.</span>
                    <span>{r.emoji}</span>
                    <strong>{r.cultivo}</strong>
                    <span style={{ color: SCORE_COLOR(r.score) }}>{r.score}%</span>
                    <span className="risk-{r.riesgo}">{r.riesgo}</span>
                    <p className="gr-print-rec-just">{r.justificacion}</p>
                  </div>
                ))}
              </section>

              <section className="gr-print-section">
                <h2>Resumen</h2>
                <p>{exportData.resumen}</p>
              </section>

              <footer className="gr-print-footer">
                <p>Generado por AgroCaribe IA — Sistema Inteligente de Recomendacion de Cultivos</p>
                <p>Region Caribe Colombiana</p>
              </footer>
            </div>
          </div>
        </div>
      </ResearcherLayout>
    );
  }

  return (
    <ResearcherLayout activeTab="reportes">
      <div className="gr-root">
        <header className="gr-header">
          <div className="gr-header-top">
            <button className="gr-back-btn" onClick={() => navigate('/investigador/dashboard')}>
              <ArrowLeft size={13} /> Volver
            </button>
          </div>
          <div className="gr-header-main">
            <div className="gr-title-wrap">
              <div className="gr-title-icon">
                <BarChart3 size={28} />
              </div>
              <div>
                <h1 className="gr-title">Gestion y Reportes</h1>
                <p className="gr-subtitle">Alertas del sistema, comparativa de analisis y exportacion de reportes</p>
              </div>
            </div>
          </div>
        </header>

        <div className="gr-content">
          {/* ALERTAS */}
          <div className="gr-card gr-alerts-card">
            <div className="gr-card-head">
              <div className="gr-card-head-left">
                <ShieldAlert size={18} />
                <h2>Alertas del Sistema</h2>
              </div>
              {!loading && (
                <span className="gr-alert-count">
                  {alertas.filter((a) => a.severidad === 'critica').length} criticas, {alertas.filter((a) => a.severidad === 'advertencia').length} advertencias
                </span>
              )}
            </div>
            <div className="gr-alerts-list">
              {loading && (
                <div className="gr-empty">
                  <Loader2 size={24} className="spin" />
                  <p>Cargando alertas...</p>
                </div>
              )}
              {!loading && alertas.length === 0 && (
                <div className="gr-empty">
                  <AlertTriangle size={32} />
                  <h3>Sin alertas activas</h3>
                  <p>El sistema no ha detectado anomalias en sensores ni analisis.</p>
                </div>
              )}
              {!loading && alertas.map((a, i) => {
                const sev = SEVERIDAD_ICON[a.severidad] || SEVERIDAD_ICON.info;
                const SevIcon = sev.icon;
                return (
                  <div key={i} className="gr-alert" style={{ borderLeftColor: sev.color }}>
                    <div className="gr-alert-icon" style={{ background: sev.bg, color: sev.color }}>
                      <SevIcon size={16} />
                    </div>
                    <div className="gr-alert-body">
                      <div className="gr-alert-head">
                        <span className="gr-alert-sev" style={{ color: sev.color }}>{a.severidad.toUpperCase()}</span>
                        <span className="gr-alert-source">{a.fuente}</span>
                      </div>
                      <p className="gr-alert-msg">{a.mensaje}</p>
                      {a.accion && <p className="gr-alert-action">{a.accion}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TAREAS DE RIEGO ACTIVAS */}
          <div className="gr-card">
            <div className="gr-card-head">
              <div className="gr-card-head-left">
                <ListChecks size={18} />
                <h2>Tareas de Riego y Alertas Climaticas</h2>
              </div>
              {tareasRiego.filter((t) => t.estado === 'Pendiente').length > 0 && (
                <span className="gr-alert-count">
                  {tareasRiego.filter((t) => t.estado === 'Pendiente').length} pendientes
                </span>
              )}
            </div>
            <div className="gr-alerts-list">
              {tareasRiego.length === 0 && (
                <div className="gr-empty">
                  <Droplets size={32} />
                  <h3>Sin tareas de riego ni alertas</h3>
                  <p>Los planes exportados desde IA Predictiva y las alertas climaticas apareceran aqui.</p>
                </div>
              )}
              {tareasRiego.map((t, i) => {
                const isRiego = t.tipo === 'plan_riego';
                const isClimatica = t.tipo === 'riesgo_climatico';
                const sevColor = t.severidad === 'critico' ? '#ba1a1a' : t.prioridad === 'alta' ? '#ba1a1a' : '#b8860b';
                const sevBg = t.severidad === 'critico' ? 'rgba(186,26,26,0.08)' : 'rgba(184,134,11,0.08)';
                return (
                  <div key={i} className="gr-alert" style={{ borderLeftColor: sevColor }}>
                    <div className="gr-alert-icon" style={{ background: sevBg, color: sevColor }}>
                      {isRiego ? <Droplets size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div className="gr-alert-body">
                      <div className="gr-alert-head">
                        <span className="gr-alert-sev" style={{ color: sevColor }}>
                          {isClimatica ? t.severidad?.toUpperCase() || 'ALERTA' : 'ALTA PRIORIDAD'}
                        </span>
                        <span className="gr-alert-source">
                          {isRiego ? 'Plan de Riego' : 'Riesgo Climatico'}
                          {t.mes_afectado ? ` · Mes ${t.mes_afectado}` : ''}
                        </span>
                      </div>
                      <p className="gr-alert-msg">
                        <strong>{t.titulo}</strong>
                        {t.cultivo || t.cultivo_afectado ? ` — ${t.cultivo || t.cultivo_afectado}` : ''}
                        {t.volumen_total_m3_ha && ` · ${t.volumen_total_m3_ha} m³/ha`}
                      </p>
                      {(t.descripcion || t.accion_recomendada) && (
                        <p className="gr-alert-action" style={{ fontSize: '0.7rem' }}>
                          {(t.descripcion || t.accion_recomendada).slice(0, 200)}
                          {(t.descripcion || t.accion_recomendada).length > 200 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMPARATIVA + EXPORT */}
          <div className="gr-grid-2col">
            {/* COMPARATIVA */}
            <div className="gr-card">
              <div className="gr-card-head">
                <div className="gr-card-head-left">
                  <TrendingUp size={18} />
                  <h2>Analisis Recientes</h2>
                </div>
              </div>
              <div className="gr-analysis-list">
                {loading && (
                  <div className="gr-empty">
                    <Loader2 size={24} className="spin" />
                    <p>Cargando...</p>
                  </div>
                )}
                {!loading && analyses.length === 0 && (
                  <div className="gr-empty">
                    <FileText size={32} />
                    <h3>Sin analisis</h3>
                    <p>Realiza tu primer analisis de parcela para verlo aqui.</p>
                  </div>
                )}
                {!loading && analyses.map((a, i) => (
                  <div key={i} className="gr-analysis-row">
                    <div className="gr-analysis-info">
                      <span className="gr-analysis-id">{a.id}</span>
                      <span className="gr-analysis-crop">
                        <Sprout size={13} /> {a.cultivo || '—'}
                      </span>
                      <span className="gr-analysis-score" style={{ color: SCORE_COLOR(a.score) }}>{a.score}%</span>
                    </div>
                    <div className="gr-analysis-meta">
                      <span><MapPin size={11} /> {a.municipio || '—'}</span>
                      <span><Calendar size={11} /> {a.fecha?.slice(0, 10) || '—'}</span>
                    </div>
                    <button
                      className="gr-export-mini"
                      onClick={() => handleExport(a.id)}
                      disabled={exporting && selectedAnalysis === a.id}
                    >
                      {exporting && selectedAnalysis === a.id ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                      Exportar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ESTADISTICAS */}
            <div className="gr-card">
              <div className="gr-card-head">
                <div className="gr-card-head-left">
                  <Gauge size={18} />
                  <h2>Resumen</h2>
                </div>
              </div>
              <div className="gr-summary-stats">
                <div className="gr-summary-stat">
                  <div className="gr-summary-icon" style={{ background: 'rgba(45,90,39,0.08)', color: '#2D5A27' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <span className="gr-summary-num">{analyses.length}</span>
                    <span className="gr-summary-label">Analisis totales</span>
                  </div>
                </div>
                <div className="gr-summary-stat">
                  <div className="gr-summary-icon" style={{ background: 'rgba(184,134,11,0.08)', color: '#b8860b' }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <span className="gr-summary-num">{alertas.length}</span>
                    <span className="gr-summary-label">Alertas activas</span>
                  </div>
                </div>
                {analyses.length > 0 && (
                  <div className="gr-summary-stat">
                    <div className="gr-summary-icon" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                      <Sprout size={22} />
                    </div>
                    <div>
                      <span className="gr-summary-num">
                        {analyses[0]?.cultivo || '—'}
                      </span>
                      <span className="gr-summary-label">Ultimo cultivo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default GestionReportes;
