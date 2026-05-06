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

// ── Historial de consultas recientes (simulado) ──
const HISTORIAL_DEMO = [
  { id: 'C-0421', fecha: '2025-04-21', municipio: 'Montería', cultivo: 'Maíz',    score: 94, estado: 'Exitosa' },
  { id: 'C-0420', fecha: '2025-04-20', municipio: 'Barranquilla', cultivo: 'Plátano', score: 88, estado: 'Exitosa' },
  { id: 'C-0419', fecha: '2025-04-19', municipio: 'Sincelejo', cultivo: 'Yuca',   score: 76, estado: 'Exitosa' },
  { id: 'C-0418', fecha: '2025-04-18', municipio: 'Valledupar', cultivo: 'Arroz', score: 91, estado: 'Exitosa' },
  { id: 'C-0417', fecha: '2025-04-17', municipio: 'Magangué',   cultivo: 'Frijol', score: 63, estado: 'Baja confianza' },
  { id: 'C-0416', fecha: '2025-04-16', municipio: 'Sahagún',    cultivo: 'Maíz',   score: 85, estado: 'Exitosa' },
];

// ── Íconos para los tipos de exportación ──
const EXPORTACIONES = [
  { icono: '📄', label: 'CSV de consultas', desc: 'Todas las predicciones en formato tabular' },
  { icono: '📊', label: 'Reporte PDF', desc: 'Resumen ejecutivo del modelo y métricas' },
  { icono: '🗃️', label: 'Dataset JSON', desc: 'Datos crudos para re-entrenamiento' },
];

const DashboardInvestigador = () => {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState('metricas');
  const agregarToast = useAppStore((s) => s.agregarToast);

  // ── Simular exportación ──
  const handleExportar = (tipo) => {
    agregarToast(`Preparando ${tipo}… (función en desarrollo)`, 'info');
  };

  return (
    <ResearcherLayout activeTab={tabActiva} onTabChange={setTabActiva}>
      {/* ── SECCIÓN: Métricas del modelo ── */}
      {tabActiva === 'historial' && (
            <div className={styles.historialSection}>
              {/* Page Header */}
              <div className={styles.sectionHeader}>
                <div>
                  <h1 className={styles.sectionTitle}>Historial de consultas</h1>
                  <p className={styles.sectionSubtitle}>
                    Registro centralizado de predicciones y análisis generados por el motor de IA AgroCaribe para la optimización de rendimientos regionales.
                  </p>
                </div>
                <div className={styles.headerActions}>
                  <button className={styles.filterBtn}>
                    <span className="material-symbols-outlined">filter_list</span>
                    Filtrar
                  </button>
                  <button className={styles.exportBtn} onClick={() => handleExportar('CSV')}>
                    <span className="material-symbols-outlined">csv</span>
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Bento Stats */}
              <div className={styles.bentoGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total Consultas</span>
                  <p className={styles.statValue}>1,284</p>
                  <div className={styles.statTrend}>
                    <span className="material-symbols-outlined">trending_up</span>
                    <span>+12% este mes</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Confianza Promedio</span>
                  <p className={styles.statValue}>86.4%</p>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '86.4%' }}></div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Municipio Líder</span>
                  <p className={styles.statValue}>Montería</p>
                  <p className={styles.statSubText}>422 consultas realizadas</p>
                </div>
                <div className={`${styles.statCard} ${styles.aiInsightCard}`}>
                  <span className={styles.aiInsightLabel}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>auto_awesome</span>
                    AI Insight
                  </span>
                  <p className={styles.aiInsightText}>Tendencia al alza en peticiones para cultivo de Yuca en el departamento de Sucre.</p>
                </div>
              </div>

              {/* Table Container */}
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
                      {HISTORIAL_DEMO.map((row) => (
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
                              <div className={styles.scoreBar}>
                                <div 
                                  className={`${styles.scoreFill} ${row.score < 70 ? styles.scoreFillLow : ''}`} 
                                  style={{ width: `${row.score}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${row.estado !== 'Exitosa' ? styles.statusWarning : ''}`}>
                              {row.estado}
                            </span>
                          </td>
                          <td className={styles.textRight}>
                            <button className={styles.viewBtn}>
                              Ver <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={styles.pagination}>
                  <p className={styles.paginationInfo}>Mostrando <span>5</span> de <span>1,284</span> resultados</p>
                  <div className={styles.paginationControls}>
                    <button className={styles.pageArrow} disabled>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className={`${styles.pageNum} ${styles.pageNumActive}`}>1</button>
                    <button className={styles.pageNum}>2</button>
                    <button className={styles.pageNum}>3</button>
                    <button className={styles.pageArrow}>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
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
