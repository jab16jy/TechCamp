// ============================================
// DashboardInvestigador.jsx — Panel de métricas para investigadores
// Accessible only after authentication via LoginInvestigador.
// Shows: model KPIs, prediction charts (placeholder), historical
// queries table, quick access to the map/form, and export options.
// ============================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './DashboardInvestigador.module.css';

// ── Datos de métricas del modelo (simulados / placeholder) ──
const METRICAS = [
  { icono: '🎯', valor: '91.3%', label: 'Accuracy global', delta: '+2.1%', positivo: true },
  { icono: '📊', valor: '0.887', label: 'F1-Score macro', delta: '+0.04', positivo: true },
  { icono: '🗂️', valor: '4 218', label: 'Consultas totales', delta: '+134 este mes', positivo: true },
  { icono: '⚡', valor: '1.2 s', label: 'Latencia media', delta: '-0.3 s', positivo: true },
];

// ── Rendimiento por cultivo (placeholder para gráfico de barras) ──
const RENDIMIENTO_CULTIVOS = [
  { cultivo: 'Maíz',    precision: 94, recall: 91, color: '#e8b84b' },
  { cultivo: 'Yuca',    precision: 89, recall: 87, color: '#4ab86a' },
  { cultivo: 'Plátano', precision: 92, recall: 95, color: '#2d9e4f' },
  { cultivo: 'Arroz',   precision: 88, recall: 83, color: '#0d3d1c' },
  { cultivo: 'Frijol',  precision: 86, recall: 84, color: '#f96167' },
  { cultivo: 'Ñame',    precision: 90, recall: 88, color: '#7b61ff' },
];


// ── Íconos para los tipos de exportación ──
const EXPORTACIONES = [
  { icono: '📄', label: 'CSV de consultas', desc: 'Todas las predicciones en formato tabular' },
  { icono: '📊', label: 'Reporte PDF', desc: 'Resumen ejecutivo del modelo y métricas' },
  { icono: '🗃️', label: 'Dataset JSON', desc: 'Datos crudos para re-entrenamiento' },
];

const DashboardInvestigador = () => {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState('asesor');
  const agregarToast = useAppStore((s) => s.agregarToast);

  // ── Simular exportación ──
  const handleExportar = (tipo) => {
    agregarToast(`Preparando ${tipo}… (función en desarrollo)`, 'info');
  };

  return (
    <ResearcherLayout activeTab={tabActiva} onTabChange={setTabActiva}>
      {/* ── SECCIÓN: Métricas del modelo ── */}

          {tabActiva === 'asesor' && (
            <div className={styles.asesorGrid}>
              {/* 70% Chatbot Area */}
              <section className={styles.chatSection}>
                <div className={styles.chatContainer}>
                  {/* Subtle Grain Overlay */}
                  <div className={styles.grainyBg}></div>
                  {/* Chat Header */}
                  <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderLeft}>
                      <div className={styles.botAvatar}>
                        <span className="material-symbols-outlined text-on-primary">smart_toy</span>
                      </div>
                      <div>
                        <h3 className={styles.botTitle}>Agro-Asesor Inteligente</h3>
                        <p className={styles.botStatus}>
                          <span className={styles.statusDot}></span> En línea • Modelo v4.2 Pro
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined cursor-pointer">more_vert</span>
                  </div>
                  {/* Chat History */}
                  <div className={styles.chatHistory}>
                    <div className={styles.chatMessageWrapper}>
                      <div className={styles.chatIconBox}>
                        <span className="material-symbols-outlined">auto_awesome</span>
                      </div>
                      <div className={styles.chatMessageBubble}>
                        <p>Hola, he analizado los datos de Sentinel-2 y tus sensores IoT. Hoy la humedad en Turbaco está en niveles óptimos (28%). ¿En qué puedo ayudarte?</p>
                        <span className={styles.chatTime}>10:24 AM • PROCESADO POR IA</span>
                      </div>
                    </div>
                  </div>
                  {/* Chat Footer / Input */}
                  <div className={styles.chatFooter}>
                    {/* Quick Suggestions */}
                    <div className={styles.quickSuggestions}>
                      <button className={styles.suggestionBtn}>Ver riesgos climáticos</button>
                      <button className={styles.suggestionBtn}>Estado de sensores</button>
                      <button className={styles.suggestionBtn}>Optimizar fertilización</button>
                    </div>
                    <div className={styles.inputWrapper}>
                      <input className={styles.chatInput} placeholder="Pregúntale a la IA sobre tus cultivos..." type="text"/>
                      <div className={styles.inputActions}>
                        <button className={styles.iconBtn}>
                          <span className="material-symbols-outlined">mic</span>
                        </button>
                        <button className={styles.sendBtn}>
                          <span className="material-symbols-outlined">send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 30% Panel Control Técnico */}
              <section className={styles.controlSection}>
                {/* Metrics Card */}
                <div className={styles.controlCard}>
                  <h4 className={styles.controlTitle}>Salud del Modelo IA</h4>
                  <div className={styles.gaugeRelative}>
                    {/* SVG Gauge */}
                    <svg className={styles.gaugeSvg}>
                      <circle className={styles.gaugeBgCircle} cx="96" cy="96" r="88" strokeWidth="12" fill="transparent"></circle>
                      <circle className={styles.gaugeFillCircle} cx="96" cy="96" r="88" strokeWidth="12" fill="transparent" strokeDasharray="552.92" strokeDashoffset="32" strokeLinecap="round"></circle>
                    </svg>
                    <div className={styles.gaugeCenter}>
                      <span className={styles.gaugeValue}>94.2%</span>
                      <span className={styles.gaugeLabel}>Precisión</span>
                    </div>
                  </div>
                  <div className={styles.miniMetricsGrid}>
                    <div className={styles.miniMetric}>
                      <p className={styles.miniMetricLabel}>Latencia</p>
                      <p className={styles.miniMetricValue}>124ms</p>
                    </div>
                    <div className={styles.miniMetric}>
                      <p className={styles.miniMetricLabel}>Confianza</p>
                      <p className={styles.miniMetricValue}>Alta</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.controlCard}>
                  <h4 className={styles.controlTitle}>Acciones Rápidas</h4>
                  <div className={styles.actionsList}>
                    <button className={styles.actionItemBtn} onClick={() => setTabActiva('exportar')}>
                      <div className={styles.actionItemLeft}>
                        <span className="material-symbols-outlined text-primary">description</span>
                        <span>Exportar Reporte General</span>
                      </div>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <button className={styles.actionItemBtn} onClick={() => setTabActiva('metricas')}>
                      <div className={styles.actionItemLeft}>
                        <span className="material-symbols-outlined text-primary">model_training</span>
                        <span>Métricas de entrenamiento</span>
                      </div>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Field View Preview */}
                <div className={styles.fieldPreviewCard}>
                  <div className={styles.fieldImgWrapper}>
                    <img className={styles.fieldImg} src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkRiuTuLPfG1E0Kzq99oA_lQTXVQdYEZsGjaFKXaFNLvQO56A3VbxQzWwCGNIez9PMGvlo0vqrpKvsd1yGeYr5Mq3ix9QSDslr8inZk8fWjkupEsxFs-zm3dt8U-80uQm3ROCsg9UN-xIwBICc0egrcmZCBIdy5J3WKroTzN98Row2QT7uC5jV-rGdhI_X92Riln0ric69xD3F6YWVbsteTddQMBv360q2aOwP0eT755s4QU1xPXeWzs7xU-Fo0kbB0vep2AAVyUE" alt="Field"/>
                    <div className={styles.fieldImgOverlay}></div>
                    <div className={styles.fieldImgText}>
                      <span className="material-symbols-outlined">location_on</span> Sector Norte, Turbaco
                    </div>
                  </div>
                  <div className={styles.fieldStatus}>
                    <div className={styles.fieldStatusHeader}>
                      <span className={styles.fieldStatusTitle}>Estado de Suelo</span>
                      <span className={styles.fieldStatusValue}>28% Humedad</span>
                    </div>
                    <div className={styles.fieldStatusTrack}>
                      <div className={styles.fieldStatusFill} style={{ width: '28%' }}></div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {tabActiva === 'metricas' && (
            <div className={styles.metricasSection}>
              {/* Background Effects */}
              <div className={styles.ecoGrain}></div>
              <div className={styles.topographicBg}></div>

              {/* Hero Header */}
              <section className={styles.metricasHero}>
                <h1 className={styles.metricasTitle}>Rendimiento del Modelo IA</h1>
                <p className={styles.metricasSubtitle}>
                  Analítica de rendimiento en tiempo real para la predicción de cultivos. Estos datos reflejan la precisión operativa del motor de AgroCaribe IA en toda la región.
                </p>
              </section>

              {/* KPI Grid */}
              <section className={styles.kpiGrid}>
                {METRICAS.map((m, idx) => (
                  <div key={idx} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={`${styles.kpiIconBox} ${idx === 1 ? styles.kpiIconBoxAlt : idx === 2 ? styles.kpiIconBoxSecondary : idx === 3 ? styles.kpiIconBoxHighest : ''}`}>
                        <span className="material-symbols-outlined">
                          {idx === 0 ? 'insights' : idx === 1 ? 'query_stats' : idx === 2 ? 'database' : 'speed'}
                        </span>
                      </span>
                      <div className={styles.kpiTrend}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {idx === 2 ? 'history' : idx === 3 ? 'bolt' : 'trending_up'}
                        </span>
                        <span>{m.delta}</span>
                      </div>
                    </div>
                    <p className={styles.kpiLabel}>{m.label}</p>
                    <h2 className={styles.kpiValue}>{m.valor}</h2>
                  </div>
                ))}
              </section>

              {/* Visualization Section */}
              <section className={styles.vizSection}>
                <div className={styles.vizCard}>
                  <div className={styles.vizHeader}>
                    <div className={styles.vizHeaderLeft}>
                      <h3 className={styles.vizTitle}>Precisión y Recall por Cultivo</h3>
                      <p className={styles.vizSubtitle}>Análisis detallado de la eficiencia predictiva categorizada por tipo de plantación.</p>
                    </div>
                    <div className={styles.vizLegend}>
                      <div className={styles.legendItem}>
                        <div className={styles.legendDotPrimary}></div>
                        <span>Precisión</span>
                      </div>
                      <div className={styles.legendItem}>
                        <div className={styles.legendDotSecondary}></div>
                        <span>Recall</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.vizBody}>
                    {RENDIMIENTO_CULTIVOS.map((c, idx) => (
                      <div key={idx} className={styles.cropRow}>
                        <div className={styles.cropInfoBox}>
                          <div className={styles.cropIconCircle}>
                            <span className="material-symbols-outlined">
                              {idx === 0 ? 'grass' : idx === 1 ? 'potted_plant' : idx === 2 ? 'nature_people' : idx === 3 ? 'eco' : 'agriculture'}
                            </span>
                          </div>
                          <span className={styles.cropName}>{c.cultivo}</span>
                        </div>
                        <div className={styles.cropBars}>
                          <div className={styles.barWrapper}>
                            <div className={styles.barTrack}>
                              <div className={styles.barFillPrimary} style={{ width: `${c.precision}%` }}></div>
                            </div>
                            <span className={styles.barValueLabel}>{c.precision}% Precisión</span>
                          </div>
                          <div className={styles.barWrapper}>
                            <div className={styles.barTrack}>
                              <div className={styles.barFillSecondary} style={{ width: `${c.recall}%` }}></div>
                            </div>
                            <span className={styles.barValueLabelSecondary}>{c.recall}% Recall</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* AI Insight Sidebar */}
                    <div className={styles.metricAIInsight}>
                      <span className="material-symbols-outlined text-primary">auto_awesome</span>
                      <div>
                        <h4 className={styles.insightTitle}>AI Optimization Insight</h4>
                        <p className={styles.insightText}>
                          El modelo muestra una mayor estabilidad en cultivos de ciclo corto (Arroz, Maíz) con una reducción de falsos positivos del 4.2% este mes. Se recomienda recalibrar el dataset para Ñame durante la transición estacional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {tabActiva === 'exportar' && (
            <div className={styles.exportSection}>
              {/* Download Cards Grid */}
              <div className={styles.downloadGrid}>
                {/* CSV Card */}
                <div className={styles.downloadCard}>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-outlined">table_view</span>
                  </div>
                  <h3 className={styles.cardTitle}>Predicciones en formato tabular (CSV)</h3>
                  <p className={styles.cardDesc}>Descargar todas las predicciones registradas para análisis externo y visualización en herramientas BI.</p>
                  <button className={`${styles.downloadBtn} ${styles.btnOutline}`} onClick={() => handleExportar('CSV')}>
                    <span className="material-symbols-outlined">download</span>
                    Descargar CSV
                  </button>
                </div>

                {/* PDF Card */}
                <div className={styles.downloadCard}>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <h3 className={styles.cardTitle}>Reporte PDF Ejecutivo</h3>
                  <p className={styles.cardDesc}>Resumen visual y ejecutivo del rendimiento del modelo, tendencias de cultivo y métricas clave de salud foliar.</p>
                  <button className={`${styles.downloadBtn} ${styles.btnFilled}`} onClick={() => handleExportar('PDF')}>
                    <span className="material-symbols-outlined">download</span>
                    Descargar PDF
                  </button>
                </div>

                {/* JSON Card */}
                <div className={styles.downloadCard}>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-outlined">data_object</span>
                  </div>
                  <h3 className={styles.cardTitle}>Dataset JSON</h3>
                  <p className={styles.cardDesc}>Datos crudos estructurados ideales para procesos de re-entrenamiento de modelos y auditoría técnica profunda.</p>
                  <button className={`${styles.downloadBtn} ${styles.btnOutline}`} onClick={() => handleExportar('JSON')}>
                    <span className="material-symbols-outlined">download</span>
                    Descargar JSON
                  </button>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className={styles.advancedCard}>
                <div className={styles.bgIcon}>
                  <span className="material-symbols-outlined">precision_manufacturing</span>
                </div>
                <div className={styles.advancedHeader}>
                  <div>
                    <div className={styles.advancedTitleRow}>
                      <span className="material-symbols-outlined">tune</span>
                      <h2 className={styles.advancedTitle}>Configurar exportación avanzada</h2>
                    </div>
                    <p className={styles.advancedDesc}>Refine sus datos mediante filtros granulares por rango de fecha, municipio, departamento y tipo de cultivo específico. Ideal para investigadores que requieren segmentaciones territoriales precisas.</p>
                  </div>
                  <div>
                    <span className={styles.devBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>build_circle</span>
                      En desarrollo (Próxima versión)
                    </span>
                  </div>
                </div>

                <div className={styles.filterGrid}>
                  <div className={styles.filterItem}>
                    <span className={styles.filterLabel}>Rango Fecha</span>
                    <span className={styles.filterValue}>Últimos 30 días</span>
                  </div>
                  <div className={styles.filterItem}>
                    <span className={styles.filterLabel}>Territorio</span>
                    <span className={styles.filterValue}>Antioquia</span>
                  </div>
                  <div className={styles.filterItem}>
                    <span className={styles.filterLabel}>Municipio</span>
                    <span className={styles.filterValue}>Sonsón</span>
                  </div>
                  <div className={styles.filterItem}>
                    <span className={styles.filterLabel}>Cultivo</span>
                    <span className={styles.filterValue}>Aguacate Hass</span>
                  </div>
                </div>
              </div>


              {/* Page Footer */}
              <footer className={styles.dashboardFooter}>
                <div className={styles.footerContent}>
                  <span className={styles.footerBrand}>AgroCaribe IA Portal de Investigador</span>
                  <p className={styles.footerCopy}>© 2024 Innovación Sostenible. Todos los derechos reservados.</p>
                </div>
              </footer>
            </div>
          )}
      {/* Floating Action Button */}
      <div className={styles.fabContainer}>
        <button className={styles.fab}>
          <span className="material-symbols-outlined">add_chart</span>
          <span className={styles.fabTooltip}>Nueva Analítica</span>
        </button>
      </div>
    </ResearcherLayout>
  );
};

export default DashboardInvestigador;
