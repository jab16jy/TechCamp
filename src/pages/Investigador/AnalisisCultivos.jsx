import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import AnalysisService from '../../services/analysisService';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import MapSelector from '../../components/analysis/MapSelector';
import AnalysisForm from '../../components/analysis/AnalysisForm';
import styles from './AnalisisCultivos.module.css';

const PROMPT_BLOCKS = [
  { label: 'Rol', value: 'Arquitecto Senior de IA Agricola' },
  { label: 'Contexto', value: 'Analisis de NASA POWER y Sentinel-2 para el municipio seleccionado' },
  { label: 'Tarea', value: 'Generar un ranking de 3 cultivos optimos con razones accionables' },
  { label: 'Delimitadores', value: '<suelo_data />  <clima_history />  <ndvi_signal />' },
  { label: 'Salida', value: 'JSON estructurado para scorecards, ranking y recomendaciones visibles' },
];

const AnalisisCultivos = () => {
  const navigate = useNavigate();
  const { formulario, actualizarFormulario, setCargandoAnalisis, setResultado, agregarToast } = useAppStore();

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
          clima: {
            humedad: clima.humedad,
          },
          indicadores_satelite: {
            ndvi: clima.humedad > 68 ? 0.72 : 0.28,
          },
        },
        {
          ...formulario,
          humedad: clima.humedad,
        },
      ),
    [clima.humedad, formulario],
  );

  const metricCards = [
    {
      label: 'Vegetación (NDVI)',
      value: structuredPreview.output.kpis.ndvi.value,
      trend: structuredPreview.output.kpis.ndvi.trend,
      tone: 'positive',
    },
    {
      label: 'Humedad',
      value: structuredPreview.output.kpis.humidity.value,
      trend: structuredPreview.output.kpis.humidity.trend,
      tone: 'neutral',
    },
    {
      label: 'Nitrógeno',
      value: structuredPreview.output.kpis.nitrogen.value,
      trend: structuredPreview.output.kpis.nitrogen.trend,
      tone: 'neutral',
    },
  ];

  return (
    <ResearcherLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>Sistema de recomendación agrícola</span>
            <h1 className="premium-font">Análisis de Cultivos</h1>
            <p>
              Un espacio más limpio para explorar suelo, clima y geografía antes de ejecutar la
              recomendación.
            </p>
          </div>
          <button type="button" className={styles.headerAction}>
            Nueva consulta +
          </button>
        </header>

        <section className={styles.metricGrid}>
          {metricCards.map((metric) => (
            <article key={metric.label} className={styles.metricCard}>
              <p>{metric.label}</p>
              <div>
                <strong>{metric.value}</strong>
                <span className={metric.tone === 'positive' ? styles.metricPositive : styles.metricNeutral}>
                  {metric.trend}
                </span>
              </div>
            </article>
          ))}
        </section>

        {!isProductor && activeTab === 'analisis' && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${mode === 'simple' ? styles.tabBtnActive : ''}`}
              onClick={() => setMode('simple')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>
                list_alt
              </span>
              Datos de la Parcela
            </button>
            <button
              className={`${styles.tabBtn} ${mode === 'advanced' ? styles.tabBtnActive : ''}`}
              onClick={() => setMode('advanced')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>
                biotech
              </span>
              Calidad del Suelo
              <span className={styles.tabBadge}>MODO AVANZADO</span>
            </button>

            <div className={styles.connectionStatus}>
              <span className={styles.pulseDot}></span>
              <span className={styles.statusText}>Conectado a Red de Sensores</span>
            </div>
          </div>
        )}

        {activeTab === 'analisis' && mode === 'simple' && (
          <form className={styles.gridMain} onSubmit={handleSubmit}>
            <div className={styles.colMap}>
              <div className={styles.premiumCard}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">map</span>
                  <h3>Ubicación Geográfica</h3>
                </div>
                <p className={styles.cardDesc}>Seleccione el punto exacto de la parcela sobre el mapa.</p>

                <MapSelector
                  position={{ lat: formulario.lat, lng: formulario.lng }}
                  onPositionChange={handleMapChange}
                  height={380}
                />

                <div className={styles.insightBox}>
                  <span className="material-symbols-outlined">lightbulb</span>
                  <p>
                    <strong>Insight IA:</strong> Humedad de suelo favorable detectada por sensores
                    Sentinel-2 para el área seleccionada.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.colForm}>
              <div className={styles.premiumCard}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">settings_input_component</span>
                  <h3>Parámetros del Cultivo</h3>
                </div>

                <AnalysisForm
                  data={formulario}
                  onChange={handleFormChange}
                  municipalities={municipiosLista}
                  mode={mode}
                />
              </div>
            </div>

            <div className={styles.colCta}>
              <div className={styles.ctaCard}>
                <span className={`material-symbols-outlined ${styles.ctaBgIcon}`}>auto_awesome</span>
                <div className={styles.ctaContent}>
                  <div className={styles.ctaIconBox}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div className={styles.ctaText}>
                    <h4>¿Listo para el análisis?</h4>
                    <p>
                      Nuestra IA procesará 24 variables agroclimáticas, imágenes satelitales y datos
                      históricos para generar su recomendación en segundos.
                    </p>
                  </div>
                </div>
                <button type="submit" className={styles.btnAnalyze}>
                  Analizar con IA
                </button>
              </div>
            </div>

            <div className={styles.colStatus}>
              <div className={styles.statusCard}>
                <div className={styles.statusHeader}>
                  <p>MODELO AGRO-IA</p>
                  <span className={styles.badgeOptimo}>ACTIVO</span>
                </div>
                <div className={styles.statusBody}>
                  <div className={styles.accRow}>
                    <span>Precisión actual</span>
                    <strong>94.2%</strong>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '94.2%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'analisis' && mode === 'advanced' && (
          <form className={styles.gridMain} onSubmit={handleSubmit}>
            <div className={styles.colMap} style={{ gridColumn: 'span 7' }}>
              <div className={styles.historyBanner}>
                <div className={styles.historyIcon}>
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div className={styles.historyText}>
                  <h4>Usar datos de parcela existente</h4>
                  <p>Recupere mediciones recientes de sus parcelas guardadas.</p>
                </div>
                <div className={styles.historySelectWrapper}>
                  <select className={styles.historySelect} defaultValue="">
                    <option disabled value="">
                      Seleccione una parcela...
                    </option>
                    <option>Hacienda El Sol - Hace 2 dias</option>
                    <option>Lote Norte - Hace 1 semana</option>
                    <option>Parcela Demo - Ayer</option>
                  </select>
                  <span className={`material-symbols-outlined ${styles.selectArrow}`}>expand_more</span>
                </div>
              </div>

              <section className={styles.premiumCard}>
                <div className={styles.cardHeader} style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#10b981' }}>
                      science
                    </span>
                    <h3>Parámetros del Suelo</h3>
                  </div>
                  <div className={styles.dataOrigin}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      info
                    </span>
                    <span>Datos importados de: Hacienda El Sol (24/05)</span>
                  </div>
                </div>

                <div className={styles.advancedFormGrid}>
                  <div className={styles.fieldGroup}>
                    <label>
                      pH del Suelo <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" className={styles.advancedInput} value="6.5" readOnly />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>
                      Nitrogeno (N) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" className={styles.advancedInput} placeholder="mg/kg" value="45" readOnly />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>
                      Humedad <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" className={styles.advancedInput} placeholder="%" value="72%" readOnly />
                  </div>
                </div>

                <div className={styles.optionalRow}>
                  <div className={styles.fieldGroup} style={{ opacity: 0.7 }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fosforo (P) - Opcional
                    </label>
                    <input type="text" className={styles.optionalInput} placeholder="mg/kg" />
                  </div>
                  <div className={styles.fieldGroup} style={{ opacity: 0.7 }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Potasio (K) - Opcional
                    </label>
                    <input type="text" className={styles.optionalInput} placeholder="mg/kg" />
                  </div>
                </div>

                <div className={styles.climateSection}>
                  <h4 className={styles.climateTitle}>Condiciones Climaticas</h4>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <div className={styles.sliderLabel}>
                        <span className="material-symbols-outlined" style={{ color: '#f97316' }}>
                          thermostat
                        </span>
                        <span>Temperatura Promedio</span>
                      </div>
                      <div className={styles.sliderValue}>
                        <strong>{clima.temperatura}</strong>
                        <span>C</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      name="temperatura"
                      className={styles.rangeInput}
                      min="0"
                      max="50"
                      value={clima.temperatura}
                      onChange={handleClimaChange}
                    />
                    <div className={styles.sliderLegend}>
                      <span>BAJA</span>
                      <span>OPTIMA</span>
                      <span>ALTA</span>
                    </div>
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <div className={styles.sliderLabel}>
                        <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>
                          humidity_percentage
                        </span>
                        <span>Humedad Relativa</span>
                      </div>
                      <div className={styles.sliderValue}>
                        <strong>{clima.humedad}</strong>
                        <span>%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      name="humedad"
                      className={styles.rangeInput}
                      min="0"
                      max="100"
                      value={clima.humedad}
                      onChange={handleClimaChange}
                    />
                    <div className={styles.sliderLegend}>
                      <span>SECO</span>
                      <span>IDEAL</span>
                      <span>SATURADO</span>
                    </div>
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <div className={styles.sliderLabel}>
                        <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>
                          rainy
                        </span>
                        <span>Precipitacion Anual</span>
                      </div>
                      <div className={styles.sliderValue}>
                        <strong>{clima.precipitacion}</strong>
                        <span>mm</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      name="precipitacion"
                      className={styles.rangeInput}
                      min="0"
                      max="3000"
                      value={clima.precipitacion}
                      onChange={handleClimaChange}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.colForm} style={{ gridColumn: 'span 5' }}>
              <div className={styles.stickyColumn}>
                <section className={styles.premiumCard} style={{ height: 'auto', marginBottom: '1.5rem' }}>
                  <div className={styles.cardHeader}>
                    <span className="material-symbols-outlined">location_on</span>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Ubicación de Referencia
                    </h3>
                  </div>
                  <div className={styles.satellitePreview}>
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxWm9_efZC4jYLLSKKu1FjeVUmyWh2Mby3tfembXL5snfDbpyapTOPxIjnIdYFog_j-YGp9o27Gurc14zLCI8C-0gZObPQN-yHfRm4_xgRNfE_InO0WERAN2zAgVkAVOQElqm1HfDxPrn10_vYIq6UpWDjY0P329KpPjcCPSduwHBeBQdCJ3ahwtSkoCSpDtIbbs7gTiC59FK7o2zrl1OnWd0A0R_rHotm9G791-Jl8lQ2DUAxoRtNOaUNzryaYbhU_Wc84Po4bDU"
                      alt="Satellite view"
                      className={styles.satelliteImg}
                    />
                    <div className={styles.satelliteOverlay}>
                      <h4>Hacienda El Sol</h4>
                      <p>Turbaco, Bolivar · 10.33 N, 75.41 W</p>
                    </div>
                  </div>
                  <div className={styles.insightBox} style={{ borderLeft: '4px solid #10b981', borderRadius: '0 8px 8px 0' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.4' }}>
                      <strong>Insight IA:</strong> Humedad de suelo favorable detectada por sensores para el área seleccionada.
                    </p>
                  </div>
                </section>

                <div className={styles.largeCta} style={{ marginBottom: '1.5rem' }}>
                  <div className={styles.ctaDecor}></div>
                  <div className={styles.ctaTop}>
                    <div className={styles.ctaIconCircle}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                        auto_awesome
                      </span>
                    </div>
                    <h3>¿Todo listo?</h3>
                  </div>
                  <p>Inicie el análisis de precisión con IA para obtener su plan de fertilización y riego.</p>
                  <button type="submit" className={styles.btnExecuteLarge}>
                    Analizar Parcela con IA
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                      bolt
                    </span>
                  </button>
                </div>

                <div className={styles.premiumCard} style={{ height: 'auto' }}>
                  <div className={styles.statusHeader} style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Salud del Algoritmo</span>
                    <span className={styles.badgeOptimo} style={{ fontSize: '10px' }}>
                      OPTIMO
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '94.2%' }}></div>
                  </div>
                  <div className={styles.accRow} style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Precisión: 94.2%</span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>v4.2.0-stable</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'analisis' && (
          <section className={styles.responseSection}>
            <div className={styles.responseHeader}>
              <div>
                <span className={styles.sectionTag}>Structured Response</span>
                <h2>Salida parseable para el frontend minimalista</h2>
              </div>
              <span className={styles.responseBadge}>JSON Ready</span>
            </div>

            <div className={styles.thoughtCard}>
              <span className={styles.thoughtLabel}>&lt;thought&gt;</span>
              <p>{structuredPreview.thought}</p>
            </div>

            <div className={styles.rankingGrid}>
              {structuredPreview.output.ranking.map((item) => (
                <article key={item.rank} className={styles.rankingCard}>
                  <div className={styles.rankingTop}>
                    <span className={styles.rankNumber}>#{item.rank}</span>
                    <span className={styles.rankScore}>{item.score}</span>
                  </div>
                  <h3>{item.crop}</h3>
                  <p>{item.explanation}</p>
                </article>
              ))}
            </div>

            <div className={styles.noteCard}>
              <span className={styles.noteLabel}>Technical Note</span>
              <p>{structuredPreview.output.technical_note}</p>
            </div>
          </section>
        )}

        {activeTab === 'analisis' && (
          <section className={styles.architectureSection}>
            <div className={styles.architectureIntro}>
              <span className={styles.sectionTag}>Prompt Architecture</span>
              <h2>Motor de recomendacion preparado para una interfaz limpia</h2>
              <p>
                El flujo de IA entrega bloques estructurados para alimentar scorecards, ranking de
                cultivos y explicaciones legibles dentro del panel.
              </p>
            </div>

            <div className={styles.architectureGrid}>
              <div className={styles.architectureCard}>
                {PROMPT_BLOCKS.map((block) => (
                  <div key={block.label} className={styles.architectureRow}>
                    <span>{block.label}</span>
                    <p>{block.value}</p>
                  </div>
                ))}
              </div>

              <div className={styles.jsonCard}>
                <div className={styles.jsonHeader}>
                  <span className="material-symbols-outlined">data_object</span>
                  <p>JSON de salida</p>
                </div>
                <pre className={styles.jsonPreview}>{JSON.stringify(structuredPreview.output, null, 2)}</pre>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'historial' && (
          <div className={styles.historialSection}>
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>Consultas recientes</h2>
                <div className={styles.searchWrapper}>
                  <span className="material-symbols-outlined">search</span>
                  <input type="text" placeholder="Buscar por ID o Municipio..." className={styles.searchInput} />
                </div>
              </div>

              <div className={styles.tableScroll}>
                <table className={styles.mainTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Municipio</th>
                      <th>Cultivo rec.</th>
                      <th className={styles.textCenter}>Score IA</th>
                      <th>Estado</th>
                      <th className={styles.textRight}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'C-0421', fecha: '2025-04-21', municipio: 'Monteria', cultivo: 'Maiz', score: 94, estado: 'Exitosa' },
                      { id: 'C-0420', fecha: '2025-04-20', municipio: 'Barranquilla', cultivo: 'Platano', score: 88, estado: 'Exitosa' },
                      { id: 'C-0419', fecha: '2025-04-19', municipio: 'Sincelejo', cultivo: 'Yuca', score: 76, estado: 'Exitosa' },
                    ].map((row) => (
                      <tr key={row.id}>
                        <td className={styles.rowId}>{row.id}</td>
                        <td className={styles.rowDate}>{row.fecha}</td>
                        <td className={styles.rowLocation}>{row.municipio}</td>
                        <td>
                          <div className={styles.cropInfo}>
                            <span className="material-symbols-outlined">agriculture</span>
                            <span>{row.cultivo}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.scoreContainer}>
                            <span className={`${styles.scoreText} ${row.score < 70 ? styles.scoreLow : ''}`}>{row.score}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${row.estado !== 'Exitosa' ? styles.statusWarning : ''}`}>
                            {row.estado}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <button className={styles.viewBtn}>Ver</button>
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
