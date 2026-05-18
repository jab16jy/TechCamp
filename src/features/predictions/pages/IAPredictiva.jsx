import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Calendar, MapPin, TrendingUp,
  Thermometer, Droplets, CloudRain, Sprout, Sparkles,
  Target, Loader2, Compass,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useIAPredictiva from '@features/predictions/hooks/useIAPredictiva';
import './IAPredictiva.css';

const IAPredictiva = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const {
    loading,
    prediction,
    lat, setLat,
    lng, setLng,
    handleGenerate,
    handleUseLastAnalysis,
    hasLastAnalysis,
  } = useIAPredictiva();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        <header className="ia-header">
          <div className="ia-header-left">
            <div className="ia-nav-row">
              <button className="ia-back-btn" onClick={() => navigate('/investigador/dashboard')}>
                <ArrowLeft size={14} />
                Volver al Dashboard
              </button>
              <nav className="ia-breadcrumb">
                <span>Modulos</span>
                <ChevronRight size={12} />
                <span className="ia-crumb-active">IA Predictiva</span>
              </nav>
            </div>
            <div className="ia-title-row">
              <h1 className="ia-title">
                IA Predictiva <span className="ia-title-light">- Proyeccion Climatica 6 Meses</span>
              </h1>
              <span className="ia-badge-mode">NASA POWER + OpenMeteo</span>
            </div>
          </div>
        </header>

        <div className="ia-content">
          <div className="ia-input-card">
            <div className="ia-coord-controls">
              <div className="ia-coord-field">
                <label>Latitud</label>
                <input type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
              </div>
              <div className="ia-coord-field">
                <label>Longitud</label>
                <input type="number" step="0.0001" value={lng} onChange={(e) => setLng(Number(e.target.value))} />
              </div>
              {hasLastAnalysis && (
                <button className="ia-use-last" onClick={handleUseLastAnalysis}>
                  <Compass size={14} />
                  Usar ultimo analisis
                </button>
              )}
              <button className="ia-generate-btn" onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                {loading ? 'Generando...' : 'Generar Proyeccion'}
              </button>
            </div>
          </div>

          {prediction && (
            <>
              <div className="ia-highlight-row">
                <div className="ia-highlight-card best">
                  <Target size={18} />
                  <div>
                    <span className="ia-hl-label">Mejor mes para sembrar</span>
                    <span className="ia-hl-value">{prediction.mejor_mes || '—'}</span>
                  </div>
                </div>
                <div className="ia-highlight-card crop">
                  <Sprout size={18} />
                  <div>
                    <span className="ia-hl-label">Cultivo mas apto</span>
                    <span className="ia-hl-value">{prediction.mejor_cultivo || '—'}</span>
                  </div>
                </div>
                <div className="ia-highlight-card source">
                  <MapPin size={18} />
                  <div>
                    <span className="ia-hl-label">Fuente de datos</span>
                    <span className="ia-hl-value fs-sm">{prediction.fuente}</span>
                  </div>
                </div>
              </div>

              <div className="ia-timeline-section">
                <h3 className="ia-section-title">
                  <TrendingUp size={16} />
                  Proyeccion mensual
                </h3>
                <div className="ia-timeline">
                  {prediction.meses.map((mes, i) => (
                    <div key={i} className={`ia-month-card ${prediction.mejor_mes === mes.month ? 'is-best' : ''}`}>
                      <div className="ia-month-header">
                        <Calendar size={14} />
                        <strong>{mes.month} {mes.year}</strong>
                        {prediction.mejor_mes === mes.month && (
                          <span className="ia-best-badge">Optimo</span>
                        )}
                      </div>

                      <div className="ia-month-stats">
                        <div className="ia-stat">
                          <Thermometer size={13} />
                          <span>{mes.temperatura}°C</span>
                        </div>
                        <div className="ia-stat">
                          <CloudRain size={13} />
                          <span>{mes.precipitacion} mm</span>
                        </div>
                        <div className="ia-stat">
                          <Droplets size={13} />
                          <span>{mes.humedad}%</span>
                        </div>
                        <div className="ia-stat ndvi-stat">
                          <span className="ia-ndvi-dot" style={{ background: `hsl(${100 + mes.ndvi_estimado * 40}, 50%, ${30 + mes.ndvi_estimado * 20}%)` }} />
                          <span>NDVI {mes.ndvi_estimado}</span>
                        </div>
                      </div>

                      {mes.cultivos_recomendados.length > 0 && (
                        <div className="ia-month-crops">
                          <span className="ia-crops-label">Cultivos recomendados:</span>
                          {mes.cultivos_recomendados.slice(0, 2).map((c, j) => (
                            <div key={j} className="ia-crop-row">
                              <span className="ia-crop-emoji">{c.emoji}</span>
                              <span className="ia-crop-name">{c.cultivo}</span>
                              <span className={`ia-crop-score score-${c.riesgo}`}>{c.score}%</span>
                              <span className={`ia-risk-tag risk-${c.riesgo}`}>{c.riesgo}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!prediction && !loading && (
            <div className="ia-empty">
              <div className="ia-empty-icon">
                <Calendar size={48} />
              </div>
              <h2>Proyeccion climatica a 6 meses</h2>
              <p>
                Ingresa las coordenadas de tu parcela o usa los datos de tu
                ultimo analisis. El sistema consultara NASA POWER y OpenMeteo
                para proyectar temperatura, precipitacion, humedad y NDVI
                estimado mes a mes, recomendando el cultivo mas apto para cada periodo.
              </p>
              <div className="ia-empty-steps">
                <div className="ia-step">
                  <span className="ia-step-num">1</span>
                  <span>Selecciona coordenadas</span>
                </div>
                <div className="ia-step">
                  <span className="ia-step-num">2</span>
                  <span>Genera la proyeccion</span>
                </div>
                <div className="ia-step">
                  <span className="ia-step-num">3</span>
                  <span>Revisa el mes optimo y cultivos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
