import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import AnalysisService from '../../services/analysisService';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import MapSelector from '../../components/analysis/MapSelector';
import AnalysisForm from '../../components/analysis/AnalysisForm';
import {
  Sparkles,
  Map,
  Lightbulb,
  SlidersHorizontal,
  Leaf,
  Droplets,
  FlaskConical,
  Thermometer,
  CloudRain,
  Info,
  CheckCircle2,
  AlertTriangle,
  History,
  MapPin,
  Zap,
  Search,
  Sprout,
} from 'lucide-react';
import './AnalisisCultivos.css';

const AnalisisCultivos = () => {
  const navigate = useNavigate();
  const { formulario, actualizarFormulario, setCargandoAnalisis, cargandoAnalisis, setResultado, agregarToast } = useAppStore();

  const [municipiosLista, setMunicipiosLista] = useState([]);
  const rol = sessionStorage.getItem('rol');
  const isProductor = rol === 'productor';
  const [mode, setMode] = useState('simple');
  const [activeTab, setActiveTab] = useState('analisis');
  const [clima, setClima] = useState({
    temperatura: 24,
    humedad: 75,
    precipitacion: 1200,
  });

  useEffect(() => {
    if (isProductor) setMode('simple');
  }, [isProductor]);

  useEffect(() => {
    AnalysisService.getAvailableLocations().then(setMunicipiosLista);
  }, []);

  const handleFormChange = (newFields) => {
    actualizarFormulario(newFields);
  };

  const handleMapChange = (latlng) => {
    actualizarFormulario({
      lat: latlng.lat,
      lng: latlng.lng,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ['departamento', 'municipio', 'tipo_suelo', 'mes_siembra', 'area_hectareas'];
    const missing = required.filter((field) => !formulario[field]);

    if (missing.length > 0 || !formulario.lat || !formulario.lng) {
      agregarToast('Por favor, completa todos los campos y selecciona la ubicacion en el mapa', 'error');
      return;
    }

    setCargandoAnalisis(true);
    try {
      const resultado = await AnalysisService.performAnalysis({
        ...formulario,
        humedad: clima.humedad,
      });
      setResultado(resultado);
      agregarToast('Analisis completado exitosamente', 'success');

      if (mode === 'advanced') {
        navigate('/investigador/resultado-avanzado');
      } else {
        navigate('/resultado');
      }
    } catch (error) {
      agregarToast('Error al procesar el analisis. Intentalo de nuevo.', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  const handleClimaChange = (e) => {
    const { name, value } = e.target;
    setClima((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const structuredPreview = useMemo(
    () =>
      AnalysisService.createStructuredAnalysisPayload(
        {
          clima: { humedad: clima.humedad },
          indicadores_satelite: { ndvi: clima.humedad > 68 ? 0.72 : 0.28 },
        },
        { ...formulario, humedad: clima.humedad },
      ),
    [clima.humedad, formulario],
  );

  const metricCardsData = [
    {
      key: 'ndvi',
      label: 'Vegetacion (NDVI)',
      value: structuredPreview.output.kpis.ndvi.value,
      trend: structuredPreview.output.kpis.ndvi.trend,
      tone: 'positive',
      Icon: Leaf,
    },
    {
      key: 'humidity',
      label: 'Humedad',
      value: structuredPreview.output.kpis.humidity.value,
      trend: structuredPreview.output.kpis.humidity.trend,
      tone: 'neutral',
      Icon: Droplets,
    },
    {
      key: 'nitrogen',
      label: 'Nitrogeno',
      value: structuredPreview.output.kpis.nitrogen.value,
      trend: structuredPreview.output.kpis.nitrogen.trend,
      tone: 'neutral',
      Icon: FlaskConical,
    },
  ];

  const trendMeta = {
    positive: { Icon: CheckCircle2, css: 'ac-trend--positive' },
    warning: { Icon: AlertTriangle, css: 'ac-trend--warning' },
    neutral: { Icon: Info, css: 'ac-trend--neutral' },
  };

  const iconVariant = {
    positive: 'ac-metric-icon--primary',
    warning: 'ac-metric-icon--secondary',
    neutral: 'ac-metric-icon--neutral',
  };

  const badgeVariant = {
    positive: 'ac-metric-badge--positive',
    warning: 'ac-metric-badge--negative',
    neutral: 'ac-metric-badge--neutral',
  };

  return (
    <ResearcherLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="ac-container">
        {/* Metrics Row */}
        <section className="ac-metrics">
          {metricCardsData.map((metric) => {
            const t = trendMeta[metric.tone] || trendMeta.neutral;
            const TrendIcon = t.Icon;
            const MetricIcon = metric.Icon;
            return (
              <article key={metric.key} className="ac-metric-card">
                <div className="ac-metric-top">
                  <div className={`ac-metric-icon ${iconVariant[metric.tone]}`}>
                    <MetricIcon size={24} />
                  </div>
                  <span className={`ac-metric-badge ${badgeVariant[metric.tone]}`}>
                    {metric.trend}
                  </span>
                </div>
                <div className="ac-metric-info">
                  <p className="ac-metric-label">{metric.label}</p>
                  <h3 className="ac-metric-value">{metric.value}</h3>
                  <div className={`ac-metric-trend ${t.css}`}>
                    <TrendIcon size={14} />
                    <span>{metric.trend}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Tabs */}
        {!isProductor && activeTab === 'analisis' && (
          <div className="ac-tabs">
            <button
              className={`ac-tab ${mode === 'simple' ? 'ac-tab--active' : ''}`}
              onClick={() => setMode('simple')}
            >
              <SlidersHorizontal size={18} />
              Datos de la Parcela
            </button>
            <button
              className={`ac-tab ${mode === 'advanced' ? 'ac-tab--active' : ''}`}
              onClick={() => setMode('advanced')}
            >
              <FlaskConical size={18} />
              Calidad del Suelo
              <span className="ac-tab-badge">MODO AVANZADO</span>
            </button>
            <div className="ac-connection">
              <span className="ac-pulse" />
              <span className="ac-connection-text">Conectado a Red de Sensores</span>
            </div>
          </div>
        )}

        {/* SIMPLE MODE */}
        {activeTab === 'analisis' && mode === 'simple' && (
          <form className="ac-grid" onSubmit={handleSubmit}>
            <div className="ac-col--map">
              <div className="ac-glass">
                <div className="ac-card-header">
                  <Map size={24} className="ac-card-header__icon" />
                  <h3>Ubicacion Geografica</h3>
                </div>
                <p className="ac-card-desc">
                  Seleccione el punto exacto de la parcela sobre el mapa.
                </p>

                <MapSelector
                  position={{ lat: formulario.lat, lng: formulario.lng }}
                  onPositionChange={handleMapChange}
                  height={380}
                />

                <div className="ac-insight">
                  <Lightbulb size={18} className="ac-insight__icon" />
                  <p>
                    <strong>Insight IA:</strong> Humedad de suelo favorable detectada por sensores
                    Sentinel-2 para el area seleccionada.
                  </p>
                </div>
              </div>
            </div>

            <div className="ac-col--form">
              <div className="ac-glass">
                <div className="ac-card-header">
                  <SlidersHorizontal size={24} className="ac-card-header__icon" />
                  <h3>Parametros del Cultivo</h3>
                </div>
                <AnalysisForm
                  data={formulario}
                  onChange={handleFormChange}
                  municipalities={municipiosLista}
                  mode={mode}
                />
              </div>
            </div>

            <div className="ac-col--cta">
              <div className="ac-cta">
                <Sparkles size={140} className="ac-cta__bg" />
                <div className="ac-cta__content">
                  <div className="ac-cta__icon">
                    <Sparkles size={24} />
                  </div>
                  <div className="ac-cta__text">
                    <h4>Listo para el analisis?</h4>
                    <p>
                      Nuestra IA procesara 24 variables agroclimaticas, imagenes satelitales y datos
                      historicos para generar su recomendacion en segundos.
                    </p>
                  </div>
                </div>
                <button type="submit" className="ac-btn-analyze" disabled={cargandoAnalisis}>
                  {cargandoAnalisis ? (
                    <>
                      <span className="ac-spinner" />
                      Analizando...
                    </>
                  ) : (
                    'Analizar con IA'
                  )}
                </button>
              </div>
            </div>

            <div className="ac-col--status">
              <div className="ac-status-card">
                <div className="ac-status-header">
                  <span className="ac-status-header__label">MODELO AGRO-IA</span>
                  <span className="ac-status-badge">ACTIVO</span>
                </div>
                <div className="ac-status-body">
                  <div className="ac-status-row">
                    <span>Precision actual</span>
                    <strong>94.2%</strong>
                  </div>
                  <div className="ac-progress-bar">
                    <div className="ac-progress-fill" style={{ width: '94.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ADVANCED MODE */}
        {activeTab === 'analisis' && mode === 'advanced' && (
          <form className="ac-grid" onSubmit={handleSubmit}>
            <div className="ac-col--wide">
              <div className="ac-history-banner">
                <div className="ac-history-icon">
                  <History size={22} />
                </div>
                <div className="ac-history-text">
                  <h4>Usar datos de parcela existente</h4>
                  <p>Recupere mediciones recientes de sus parcelas guardadas.</p>
                </div>
                <div className="ac-history-select-wrap">
                  <select className="ac-history-select" defaultValue="">
                    <option disabled value="">Seleccione una parcela...</option>
                    <option>Hacienda El Sol - Hace 2 dias</option>
                    <option>Lote Norte - Hace 1 semana</option>
                    <option>Parcela Demo - Ayer</option>
                  </select>
                  <span className="ac-select-arrow">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              <section className="ac-glass">
                <div className="ac-card-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FlaskConical size={22} className="ac-card-header__icon" />
                    <h3>Parametros del Suelo</h3>
                  </div>
                  <div className="ac-data-origin">
                    <Info size={12} />
                    <span>Datos importados de: Hacienda El Sol (24/05)</span>
                  </div>
                </div>

                <div className="ac-adv-form-grid">
                  <div className="ac-field-group">
                    <label>pH del Suelo <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <input type="text" className="ac-adv-input" value="6.5" readOnly />
                  </div>
                  <div className="ac-field-group">
                    <label>Nitrogeno (N) <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <input type="text" className="ac-adv-input" placeholder="mg/kg" value="45" readOnly />
                  </div>
                  <div className="ac-field-group">
                    <label>Humedad <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <input type="text" className="ac-adv-input" placeholder="%" value="72%" readOnly />
                  </div>
                </div>

                <div className="ac-optional-row">
                  <div className="ac-field-group" style={{ opacity: 0.7 }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fosforo (P) - Opcional
                    </label>
                    <input type="text" className="ac-optional-input" placeholder="mg/kg" />
                  </div>
                  <div className="ac-field-group" style={{ opacity: 0.7 }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Potasio (K) - Opcional
                    </label>
                    <input type="text" className="ac-optional-input" placeholder="mg/kg" />
                  </div>
                </div>

                <div className="ac-climate-section">
                  <h4 className="ac-climate-title">Condiciones Climaticas</h4>

                  <div className="ac-slider-group">
                    <div className="ac-slider-header">
                      <div className="ac-slider-label">
                        <Thermometer size={16} style={{ color: '#f97316' }} />
                        <span>Temperatura Promedio</span>
                      </div>
                      <div className="ac-slider-value">
                        <strong>{clima.temperatura}</strong>
                        <span>C</span>
                      </div>
                    </div>
                    <input type="range" name="temperatura" className="ac-range" min="0" max="50" value={clima.temperatura} onChange={handleClimaChange} />
                    <div className="ac-slider-legend">
                      <span>BAJA</span>
                      <span>OPTIMA</span>
                      <span>ALTA</span>
                    </div>
                  </div>

                  <div className="ac-slider-group">
                    <div className="ac-slider-header">
                      <div className="ac-slider-label">
                        <Droplets size={16} style={{ color: '#3b82f6' }} />
                        <span>Humedad Relativa</span>
                      </div>
                      <div className="ac-slider-value">
                        <strong>{clima.humedad}</strong>
                        <span>%</span>
                      </div>
                    </div>
                    <input type="range" name="humedad" className="ac-range" min="0" max="100" value={clima.humedad} onChange={handleClimaChange} />
                    <div className="ac-slider-legend">
                      <span>SECO</span>
                      <span>IDEAL</span>
                      <span>SATURADO</span>
                    </div>
                  </div>

                  <div className="ac-slider-group">
                    <div className="ac-slider-header">
                      <div className="ac-slider-label">
                        <CloudRain size={16} style={{ color: '#38bdf8' }} />
                        <span>Precipitacion Anual</span>
                      </div>
                      <div className="ac-slider-value">
                        <strong>{clima.precipitacion}</strong>
                        <span>mm</span>
                      </div>
                    </div>
                    <input type="range" name="precipitacion" className="ac-range" min="0" max="3000" value={clima.precipitacion} onChange={handleClimaChange} />
                  </div>
                </div>
              </section>
            </div>

            <div className="ac-col--narrow">
              <div className="ac-sticky">
                <section className="ac-glass">
                  <div className="ac-card-header">
                    <MapPin size={20} className="ac-card-header__icon" />
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Ubicacion de Referencia
                    </h3>
                  </div>
                  <div className="ac-sat-preview">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxWm9_efZC4jYLLSKKu1FjeVUmyWh2Mby3tfembXL5snfDbpyapTOPxIjnIdYFog_j-YGp9o27Gurc14zLCI8C-0gZObPQN-yHfRm4_xgRNfE_InO0WERAN2zAgVkAVOQElqm1HfDxPrn10_vYIq6UpWDjY0P329KpPjcCPSduwHBeBQdCJ3ahwtSkoCSpDtIbbs7gTiC59FK7o2zrl1OnWd0A0R_rHotm9G791-Jl8lQ2DUAxoRtNOaUNzryaYbhU_Wc84Po4bDU"
                      alt="Satellite view"
                      className="ac-sat-img"
                    />
                    <div className="ac-sat-overlay">
                      <h4>Hacienda El Sol</h4>
                      <p>Turbaco, Bolivar - 10.33 N, 75.41 W</p>
                    </div>
                  </div>
                  <div className="ac-insight">
                    <Lightbulb size={18} className="ac-insight__icon" />
                    <p>
                      <strong>Insight IA:</strong> Humedad de suelo favorable detectada por sensores para el area seleccionada.
                    </p>
                  </div>
                </section>

                <div className="ac-large-cta">
                  <div className="ac-large-cta__decor" />
                  <div className="ac-large-cta__top">
                    <div className="ac-large-cta__circle">
                      <Sparkles size={28} />
                    </div>
                    <h3>Todo listo?</h3>
                  </div>
                  <p>
                    Inicie el analisis de precision con IA para obtener su plan de fertilizacion y riego.
                  </p>
                  <button type="submit" className="ac-btn-execute" disabled={cargandoAnalisis}>
                    {cargandoAnalisis ? (
                      <>
                        <span className="ac-spinner" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        Analizar Parcela con IA
                        <Zap size={24} />
                      </>
                    )}
                  </button>
                </div>

                <div className="ac-glass ac-glass--auto">
                  <div className="ac-status-header" style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Salud del Algoritmo</span>
                    <span className="ac-status-badge" style={{ fontSize: '10px' }}>OPTIMO</span>
                  </div>
                  <div className="ac-progress-bar">
                    <div className="ac-progress-fill" style={{ width: '94.2%' }} />
                  </div>
                  <div className="ac-status-row" style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#707973' }}>Precision: 94.2%</span>
                    <span style={{ fontSize: '12px', color: '#707973', fontStyle: 'italic' }}>v4.2.0-stable</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Structured Response */}
        {activeTab === 'analisis' && (
          <section className="ac-response">
            <div className="ac-response__header">
              <div>
                <span className="ac-section-tag">Structured Response</span>
                <h2>Salida parseable para el frontend minimalista</h2>
              </div>
              <span className="ac-response-badge">JSON Ready</span>
            </div>

            <div className="ac-thought-card">
              <span className="ac-thought-label">Analisis IA</span>
              <p>{structuredPreview.thought}</p>
            </div>

            <div className="ac-ranking">
              {structuredPreview.output.ranking.map((item) => (
                <article key={item.rank} className="ac-rank-card">
                  <div className="ac-rank-top">
                    <span className="ac-rank-num">#{item.rank}</span>
                    <span className="ac-rank-score">{item.score}</span>
                  </div>
                  <h3>{item.crop}</h3>
                  <p>{item.explanation}</p>
                </article>
              ))}
            </div>

            <div className="ac-note-card">
              <span className="ac-note-label">Technical Note</span>
              <p>{structuredPreview.output.technical_note}</p>
            </div>
          </section>
        )}



        {/* Historial Tab */}
        {activeTab === 'historial' && (
          <div className="ac-historial">
            <div className="ac-table-card">
              <div className="ac-table-header">
                <h2 className="ac-table-title">Consultas recientes</h2>
                <div className="ac-search-wrap">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por ID o Municipio..."
                    className="ac-search-input"
                  />
                </div>
              </div>

              <div className="ac-table-scroll">
                <table className="ac-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Municipio</th>
                      <th>Cultivo rec.</th>
                      <th className="ac-txt-center">Score IA</th>
                      <th>Estado</th>
                      <th className="ac-txt-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'C-0421', fecha: '2025-04-21', municipio: 'Monteria', cultivo: 'Maiz', score: 94, estado: 'Exitosa' },
                      { id: 'C-0420', fecha: '2025-04-20', municipio: 'Barranquilla', cultivo: 'Platano', score: 88, estado: 'Exitosa' },
                      { id: 'C-0419', fecha: '2025-04-19', municipio: 'Sincelejo', cultivo: 'Yuca', score: 76, estado: 'Exitosa' },
                    ].map((row) => (
                      <tr key={row.id}>
                        <td className="ac-row-id">{row.id}</td>
                        <td className="ac-row-date">{row.fecha}</td>
                        <td className="ac-row-loc">{row.municipio}</td>
                        <td>
                          <div className="ac-crop-info">
                            <Sprout size={16} />
                            <span>{row.cultivo}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`ac-score ${row.score < 70 ? 'ac-score--low' : ''}`}>
                            {row.score}%
                          </span>
                        </td>
                        <td>
                          <span className={`ac-cell-badge ${row.estado !== 'Exitosa' ? 'ac-cell-badge--warn' : ''}`}>
                            {row.estado}
                          </span>
                        </td>
                        <td className="ac-txt-right">
                          <button className="ac-view-btn">Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResearcherLayout>
  );
};

export default AnalisisCultivos;
