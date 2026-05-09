import React from 'react';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './SensoresIoT.module.css';

const SensoresIoT = () => {
  return (
    <ResearcherLayout activeTab="sensores">
      <div className={styles.container}>
        {/* Header Section */}
        <section className={styles.header}>
          <div>
            <h2 className={styles.title}>Monitoreo de Red IoT en Tiempo Real</h2>
            <div className={styles.badges}>
              <span className={styles.badge}>
                <span className={styles.dot}></span>
                12 Nodos Activos
              </span>
              <span className={styles.badge}>
                <span className={`material-symbols-outlined ${styles.iconSmall}`}>battery_5_bar</span>
                Batería Promedio: 85%
              </span>
              <span className={styles.badge}>
                <span className={`material-symbols-outlined ${styles.iconSmall}`}>sync</span>
                Sincronización Local: Activa
              </span>
              <span className={`${styles.badge} ${styles.badgePrimary}`}>
                <span className={`material-symbols-outlined ${styles.iconSmall}`}>cloud_off</span>
                Datos Offline Disponibles
              </span>
            </div>
          </div>
        </section>

        {/* Layout Central: Bento Grid Style */}
        <div className={styles.grid}>
          {/* Mapa Satelital (Left) */}
          <div className={styles.col8}>
            <div className={styles.mapHeader}>
              <span className={styles.mapTitle}>Mapa de Despliegue de Nodos</span>
              <div className={styles.mapControls}>
                <button className={styles.mapBtn}><span className="material-symbols-outlined">layers</span></button>
                <button className={styles.mapBtn}><span className="material-symbols-outlined">zoom_in</span></button>
                <button className={styles.mapBtn}><span className="material-symbols-outlined">zoom_out</span></button>
              </div>
            </div>
            <div className={styles.mapArea}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx_cG7Kgc-peGNPtiEINazJ99iQtoOYsefVvTaxAjhh-QzeUQzMDlzd5YPenFrfJRFUrTQXMvLXCKecrEjnoY5bmntzNxUmeMe31B8HoeYvvinVMfW_uiItqErM9p0DB21M9exNTqWeQS2TF7CVMqU-oIcTjjze24WKhMHsVtqhdVzSbXUmIcfQGpIPv4tj-1rzX-7UHSgwXjXQsBjSZh_SKDh5Fm33WasGmHX7BghZssbFXMI46qdGTsqqCVFtTtz0cs8Kdl-lZw" 
                alt="Vista satelital de parcela agrícola" 
                className={styles.mapImage}
              />
              {/* Pulse/Node Markers */}
              <div className={styles.mapPulse1}></div>
              <div className={styles.mapPulse2}></div>
              <div className={styles.mapDotWarning}></div>
              <div className={styles.mapDotInactive}></div>
              
              <div className={styles.mapLayerPanel}>
                <p className={styles.mapLayerTitle}>Capas</p>
                <label className={styles.mapLayerLabel}>
                  <input type="checkbox" defaultChecked className={styles.mapLayerInput} />
                  <span className={styles.mapLayerText}>Nodos IoT</span>
                </label>
                <label className={styles.mapLayerLabel}>
                  <input type="checkbox" className={styles.mapLayerInput} />
                  <span className={styles.mapLayerText}>Capa Satelital NDVI</span>
                </label>
              </div>
            </div>
          </div>

          {/* Panel de Telemetría (Right) */}
          <div className={styles.col4}>
            {/* Humidity Card */}
            <div className={styles.telemetryCard}>
              <div className={styles.tcHeader}>
                <div className={styles.tcIconBlue}>
                  <span className="material-symbols-outlined">water_drop</span>
                </div>
                <div className={styles.tcMeta}>
                  <div className={styles.tcSignal}>
                    <span className="material-symbols-outlined iconSmall">signal_cellular_alt</span>
                    <span className={styles.tcSignalText}>-92 dBm</span>
                    <span className="material-symbols-outlined iconSmall" style={{marginLeft: '4px'}}>battery_full</span>
                  </div>
                  <div className={styles.tcAuto}>
                    <span className={styles.tcAutoText}>Auto</span>
                    <button className={styles.switchOn}>
                      <div className={styles.switchKnobOn}></div>
                    </button>
                  </div>
                </div>
              </div>
              <p className={styles.tcLabel}>Humedad del Suelo</p>
              <div className={styles.tcValues}>
                <span className={styles.tcMainBlue}>24%</span>
                <span className={styles.tcSubBlue}>+1.2% últ. hora</span>
              </div>
              <div className={styles.barContainerBlue}>
                <div className={styles.barGradient}>
                  <div className={styles.barItem1}></div>
                  <div className={styles.barItem2}></div>
                  <div className={styles.barItem3}></div>
                  <div className={styles.barItem4}></div>
                  <div className={styles.barItem5}></div>
                </div>
              </div>
            </div>

            {/* Temperature Card */}
            <div className={styles.telemetryCard}>
              <div className={styles.tcHeader}>
                <div className={styles.tcIconOrange}>
                  <span className="material-symbols-outlined">thermostat</span>
                </div>
                <div className={styles.tcMeta}>
                  <div className={styles.tcSignal}>
                    <span className="material-symbols-outlined iconSmall">signal_cellular_alt_2_bar</span>
                    <span className={styles.tcSignalText}>-105 dBm</span>
                    <span className="material-symbols-outlined iconSmall" style={{marginLeft: '4px'}}>battery_4_bar</span>
                  </div>
                  <div className={styles.tcAuto}>
                    <span className={styles.tcAutoText}>Auto</span>
                    <button className={styles.switchOff}>
                      <div className={styles.switchKnobOff}></div>
                    </button>
                  </div>
                </div>
              </div>
              <p className={styles.tcLabel}>Temperatura Ambiente</p>
              <div className={styles.tcValues}>
                <span className={styles.tcMainOrange}>28°C</span>
                <span className={styles.tcSubOrange}>vs 27.2°C NASA Hist.</span>
              </div>
              <div className={styles.barContainerOrange}>
                <div className={styles.barFillOrange}></div>
              </div>
            </div>

            {/* Salinity Card */}
            <div className={styles.telemetryCard}>
              <div className={styles.tcHeader}>
                <div className={styles.tcIconPrimary}>
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div className={styles.tcMeta}>
                  <div className={styles.tcSignal}>
                    <span className="material-symbols-outlined iconSmall">signal_cellular_alt</span>
                    <span className={styles.tcSignalText}>-88 dBm</span>
                    <span className="material-symbols-outlined iconSmall" style={{marginLeft: '4px'}}>battery_6_bar</span>
                  </div>
                  <div className={styles.tcAuto}>
                    <span className={styles.tcAutoText}>Auto</span>
                    <button className={styles.switchOn}>
                      <div className={styles.switchKnobOn}></div>
                    </button>
                  </div>
                </div>
              </div>
              <p className={styles.tcLabel}>Conductividad Eléctrica</p>
              <div className={styles.tcValues} style={{marginBottom: '0.5rem'}}>
                <span className={styles.tcMainPrimary}>1.2 dS/m</span>
              </div>
              <span className={styles.badgeOptimal}>Óptimo</span>
            </div>
          </div>
        </div>

        {/* Sección Inferior */}
        <div className={styles.bottomGrid}>
          {/* Comparative Chart Area */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <h3 className={styles.chartCardTitle}>Análisis de Tendencias</h3>
              <div className={styles.chartButtons}>
                <button className={styles.chartBtnActive}>Humedad</button>
                <button className={styles.chartBtnInactive}>NASA POWER Prec.</button>
              </div>
            </div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}><span className={styles.legendLineBlue}></span> Sensor Suelo</div>
                <div className={styles.legendItem}><span className={styles.legendLineGreen}></span> Precipitación NASA</div>
              </div>
            </div>
            <div className={styles.chartGraphic}>
              <div className={styles.chartAxisLabelLeft}>Marzo 10</div>
              <div className={styles.chartAxisLabelRight}>Marzo 17</div>
              <svg className={styles.chartSvg} preserveAspectRatio="none">
                <polyline fill="none" points="0,180 100,160 200,190 300,140 400,120 500,150 600,100" stroke="#2196F3" strokeWidth="3"></polyline>
                <polyline fill="none" points="0,210 100,210 200,210 300,180 400,100 500,210 600,210" stroke="#006e1c" strokeDasharray="4" strokeWidth="3"></polyline>
              </svg>
              <div className={styles.chartIconBg}>
                <span className="material-symbols-outlined">query_stats</span>
              </div>
            </div>
          </div>

          {/* Log de Eventos */}
          <div className={styles.logCard}>
            <div className={styles.logHeader}>
              <h3 className={styles.logTitle}>Log de Eventos</h3>
              <span className="material-symbols-outlined" style={{color: 'var(--m3-on-surface-variant)', cursor: 'pointer'}}>history</span>
            </div>
            <div className={styles.logList}>
              <div className={`${styles.logItem} ${styles.logItemError}`}>
                <span className={`material-symbols-outlined ${styles.logIconError}`}>battery_alert</span>
                <div>
                  <p className={styles.logTextTitle}>Sensor 02: Batería baja</p>
                  <p className={styles.logTextDesc}>Nivel crítico: 12%. Reemplazo sugerido.</p>
                  <span className={styles.logTextTime}>Hace 12 min</span>
                </div>
              </div>
              <div className={`${styles.logItem} ${styles.logItemSuccess}`}>
                <span className={`material-symbols-outlined ${styles.logIconSuccess}`}>sprinkler</span>
                <div>
                  <p className={styles.logTextTitle}>Riego Sector Norte: Activado</p>
                  <p className={styles.logTextDesc}>Iniciado por: Modo Automático (IA).</p>
                  <span className={styles.logTextTime}>Hace 28 min</span>
                </div>
              </div>
              <div className={`${styles.logItem} ${styles.logItemInfo}`}>
                <span className={`material-symbols-outlined ${styles.logIconInfo}`}>sync_alt</span>
                <div>
                  <p className={styles.logTextTitle}>Sincronización Completa</p>
                  <p className={styles.logTextDesc}>12 nodos reportando sin pérdida.</p>
                  <span className={styles.logTextTime}>Hace 1 hora</span>
                </div>
              </div>
            </div>
            <div className={styles.logFooter}>
              <button className={styles.logBtn}>
                Ver historial completo <span className="material-symbols-outlined" style={{fontSize: '16px'}}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Insight Box */}
        <div className={styles.insightBox}>
          <div className={styles.insightHeader}>
            <span className="material-symbols-outlined" style={{color: 'var(--m3-secondary)', fontVariationSettings: "'FILL' 1"}}>psychology_alt</span>
            <h3 className={styles.insightTitle}>Recomendación del Asistente</h3>
          </div>
          <p className={styles.insightText}>
            Se detecta descenso de humedad en el <span className={styles.textSecondary}>Sector Sur (Nodo 04)</span>. 
            Probabilidad de estrés hídrico según IA Predictiva: <span className={styles.textError}>65%</span>. 
            Se sugiere activar riego en la válvula B-12 para compensar la evaporación.
          </p>
          <div className={styles.insightButtons}>
            <button className={styles.insightBtnPrimary}>
              <span className="material-symbols-outlined">sync</span>
              Sincronizar Datos Locales
            </button>
            <button className={styles.insightBtnSecondary}>
              Ver Detalles Sector Sur
            </button>
          </div>
          <div className={styles.insightFooter}>
            <span className={styles.insightFooterText}>Última actualización: hace 4 minutos</span>
          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default SensoresIoT;
