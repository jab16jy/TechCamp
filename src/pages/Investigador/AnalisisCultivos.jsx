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
  const [selectedParcela, setSelectedParcela] = useState('');

  const CLIMA_POR_PARCELA = {
    'Hacienda El Sol - Hace 2 dias': { temperatura: 26.4, humedad: 72, precipitacion: 1180 },
    'Lote Norte - Hace 1 semana': { temperatura: 28.1, humedad: 65, precipitacion: 940 },
    'Parcela Demo - Ayer': { temperatura: 24.8, humedad: 78, precipitacion: 1320 },
  };

  const clima = selectedParcela && CLIMA_POR_PARCELA[selectedParcela]
    ? CLIMA_POR_PARCELA[selectedParcela]
    : { temperatura: 26.4, humedad: 72, precipitacion: 1180 };

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

  const handleParcelaChange = (e) => {
    setSelectedParcela(e.target.value);
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
      <div className="ac-container max-w-[1440px] mx-auto">
        {/* Tabs */}
        {!isProductor && activeTab === 'analisis' && (
          <div className="ac-tabs mb-4">
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

        {/* SIMPLE MODE - Bento Grid Optimizado */}
        {activeTab === 'analisis' && mode === 'simple' && (
          <form className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative" onSubmit={handleSubmit}>
            
            {/* Columna Izquierda (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Vista de Mapa (Compacta) */}
              <div className="ac-glass p-6 h-[400px] flex flex-col relative overflow-hidden group">
                <div className="flex justify-between items-center mb-4 z-10 relative">
                  <div>
                    <h2 className="text-xl text-[#191c1d] font-bold">Resumen de Parcela</h2>
                    <p className="text-sm text-[#707973]">Sector seleccionado</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="h-10 w-10 bg-[#f8f9fa] rounded-full flex items-center justify-center shadow-sm hover:bg-[#e7e8e9] transition-colors text-[#2d6a4f]">
                      <Map size={20} />
                    </button>
                    <button type="button" className="h-10 w-10 bg-[#f8f9fa] rounded-full flex items-center justify-center shadow-sm hover:bg-[#e7e8e9] transition-colors text-[#2d6a4f]">
                      <MapPin size={20} />
                    </button>
                  </div>
                </div>
                <div className="absolute inset-0 top-20 rounded-b-3xl overflow-hidden bg-white/50">
                  <MapSelector
                    position={{ lat: formulario.lat, lng: formulario.lng }}
                    onPositionChange={handleMapChange}
                    height={400}
                  />
                  <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-[#e1e3e4] z-[1000]">
                    <div className="w-2 h-2 rounded-full bg-[#006d48]"></div>
                    <span className="text-xs font-semibold text-[#191c1d]">Sensores Activos</span>
                  </div>
                </div>
              </div>

              {/* Row de Métricas (Bento) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metricCardsData.map((metric) => {
                  const t = trendMeta[metric.tone] || trendMeta.neutral;
                  const TrendIcon = t.Icon;
                  const MetricIcon = metric.Icon;
                  return (
                    <article key={metric.key} className="ac-glass p-8 flex flex-col justify-between h-48">
                      <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-full ${iconVariant[metric.tone]}`}>
                          <MetricIcon size={24} />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeVariant[metric.tone]}`}>
                          {metric.trend}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#707973] uppercase tracking-wider font-semibold mb-1">{metric.label}</p>
                        <h3 className="text-3xl text-[#191c1d] font-bold">{metric.value}</h3>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${t.css}`}>
                          <TrendIcon size={14} /> {metric.trend}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="ac-glass p-8 flex-1 flex flex-col">
                <div className="mb-6 border-b border-[#e1e3e4] pb-4">
                  <h2 className="text-xl text-[#191c1d] font-bold flex items-center gap-2">
                    <SlidersHorizontal className="text-[#2d6a4f]" size={24} />
                    Recolección de Datos
                  </h2>
                  <p className="text-sm text-[#707973] mt-2">Ingrese los parámetros para el análisis.</p>
                </div>
                
                <div className="flex flex-col gap-6 flex-1">
                  <AnalysisForm
                    data={formulario}
                    onChange={handleFormChange}
                    municipalities={municipiosLista}
                    mode={mode}
                  />

                  {/* Acciones */}
                  <div className="mt-auto pt-6 flex gap-4">
                    <button type="button" className="flex-1 py-3 px-6 rounded-full text-xs font-bold text-[#75584d] bg-transparent hover:bg-[#e7e8e9] transition-colors text-center border border-[#bfc9c1]">
                      Borrador
                    </button>
                    <button type="submit" disabled={cargandoAnalisis} className="flex-1 py-3 px-6 rounded-full text-xs font-bold text-white bg-gradient-to-br from-[#2D6A4F] to-[#52B788] hover:shadow-lg transition-all transform hover:-translate-y-1 text-center shadow-md disabled:opacity-70 disabled:hover:translate-y-0">
                      {cargandoAnalisis ? 'Procesando...' : 'Generar Reporte'}
                    </button>
                  </div>

                  {/* Estado Modelo */}
                  <div className="flex items-center justify-between p-4 bg-[#f3f4f5] rounded-lg mt-2 border border-[#e1e3e4]">
                    <div className="flex items-center gap-3">
                      <Zap className="text-[#2c694e]" size={20} />
                      <div>
                        <p className="text-sm text-[#191c1d] font-semibold">Modelo Agro-IA</p>
                        <p className="text-[10px] text-[#707973]">Precisión actual: 94.2%</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-[#b1f0ce] text-[#002114] px-2 py-1 rounded-full">ACTIVO</span>
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
                  <select className="ac-history-select" value={selectedParcela} onChange={handleParcelaChange}>
                    <option value="">Seleccione una parcela...</option>
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

              {/* Auto climate data cards — shown when parcela selected */}
              {selectedParcela && (
                <div className="ac-climate-data">
                  <div className="ac-climate-card">
                    <div className="ac-climate-card-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                      <Thermometer size={18} />
                    </div>
                    <div className="ac-climate-card-body">
                      <span className="ac-climate-card-label">Temperatura</span>
                      <span className="ac-climate-card-value">{clima.temperatura}°C</span>
                      <span className="ac-climate-card-source">NASA POWER · Auto</span>
                    </div>
                  </div>
                  <div className="ac-climate-card">
                    <div className="ac-climate-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                      <Droplets size={18} />
                    </div>
                    <div className="ac-climate-card-body">
                      <span className="ac-climate-card-label">Humedad Relativa</span>
                      <span className="ac-climate-card-value">{clima.humedad}%</span>
                      <span className="ac-climate-card-source">Sensores IoT · Auto</span>
                    </div>
                  </div>
                  <div className="ac-climate-card">
                    <div className="ac-climate-card-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
                      <CloudRain size={18} />
                    </div>
                    <div className="ac-climate-card-body">
                      <span className="ac-climate-card-label">Precipitación Anual</span>
                      <span className="ac-climate-card-value">{clima.precipitacion} mm</span>
                      <span className="ac-climate-card-source">NASA POWER · Auto</span>
                    </div>
                  </div>
                </div>
              )}

              <section className="ac-glass">
                <div className="ac-card-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FlaskConical size={22} className="ac-card-header__icon" />
                    <h3>Parametros del Suelo</h3>
                  </div>
                  <div className="ac-data-origin">
                    <Info size={12} />
                    <span>Datos importados de: {selectedParcela ? selectedParcela.split(' - ')[0] : 'Hacienda El Sol'} (24/05)</span>
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
                    <label>Humedad del Suelo <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <input type="text" className="ac-adv-input" placeholder="%" value={`${clima.humedad}%`} readOnly />
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
              </section>

              {/* Primary CTA */}
              <div className="ac-submit-cta">
                <p className="ac-submit-cta-desc">
                  Los datos serán procesados por el motor de IA para generar un plan de fertilización y riego personalizado.
                </p>
                <button type="submit" className="ac-btn-primary-solid" disabled={cargandoAnalisis}>
                  {cargandoAnalisis ? (
                    <>
                      <span className="ac-spinner" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Analizar Parcela con IA
                    </>
                  )}
                </button>
              </div>
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
                      <h4>{selectedParcela ? selectedParcela.split(' - ')[0] : 'Hacienda El Sol'}</h4>
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
