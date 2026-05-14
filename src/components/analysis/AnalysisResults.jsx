import { useState } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './AnalysisResults.module.css';

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * AnalysisResults — Reusable component to visualize crop analysis results.
 * @param {Object} data - Result data from AnalysisService.
 * @param {Function} onNewAnalysis - Callback to start a new query.
 * @param {Function} onDownloadPDF - Callback to download the report.
 */
const AnalysisResults = ({ data, onNewAnalysis, onDownloadPDF }) => {
  const [mapType, setMapType] = useState('satellite');

  if (!data) return null;

  const mainCrop = data.recomendaciones?.[0] || { cultivo: 'Desconocido', score: 0, riesgo: 'Bajo', justificacion: '' };

  return (
    <div className={styles.dashboardContainer}>
      {/* Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroTitle}>
          <h1 className={styles.titleMain}>Resultados del Análisis</h1>
          <div className={styles.location}>
            <span className="material-symbols-outlined">location_on</span>
            <span>{data.ubicacion?.municipio}, {data.ubicacion?.departamento}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.btnPdf} onClick={onDownloadPDF}>
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Descargar PDF
          </button>
          <button className={styles.btnQuery} onClick={onNewAnalysis}>
            Nueva consulta
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Left Column: Map & Primary Data */}
        <div className={styles.mainCol}>
          {/* Map Container */}
          <section className={`${styles.glassCard} ${styles.mapCard}`}>
            <div className={styles.mapToggle}>
              <button 
                className={`${styles.toggleBtn} ${mapType === 'satellite' ? styles.toggleBtnActive : styles.toggleBtnInactive}`}
                onClick={() => setMapType('satellite')}
              >
                Satélite
              </button>
              <button 
                className={`${styles.toggleBtn} ${mapType === 'terrain' ? styles.toggleBtnActive : styles.toggleBtnInactive}`}
                onClick={() => setMapType('terrain')}
              >
                Terreno
              </button>
            </div>
            <MapContainer 
              center={[data.ubicacion?.lat || 11, data.ubicacion?.lng || -74]} 
              zoom={14} 
              style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
              zoomControl={false}
            >
              {mapType === 'satellite' ? (
                <TileLayer
                  attribution='Tiles &copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              ) : (
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
                />
              )}
              <Marker position={[data.ubicacion?.lat, data.ubicacion?.lng]} />
              <ZoomControl position="bottomright" />
            </MapContainer>
            
            <div className={styles.mapOverlay}>
              <div className={styles.legendItem}>
                <div className={`${styles.dot} bg-emerald-500`}></div>
                <span className={styles.legendText}>Salud vegetal alta</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.dot} bg-amber-400`}></div>
                <span className={styles.legendText}>Humedad moderada</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.dot} bg-red-400`}></div>
                <span className={styles.legendText}>Estrés hídrico</span>
              </div>
            </div>
          </section>

          {/* AI Insights & Recommendations */}
          <section className={`${styles.glassCard} ${styles.insightsCard}`}>
            <h2 className={styles.sectionTitle}>IA Insights & Recomendaciones</h2>
            
            <div className={styles.insightsGrid}>
              {/* Recommendation */}
              <div className={styles.recommendationBox}>
                <p className={styles.labelSmall}>CULTIVO RECOMENDADO</p>
                <div className={styles.cropHeader}>
                  <h3>{mainCrop.cultivo}</h3>
                  <div className={styles.affinityBadge}>
                    <span className="material-symbols-outlined">check_circle</span>
                    {mainCrop.score}% Afinidad
                  </div>
                </div>
                <p className={styles.cropDesc}>{mainCrop.justificacion}</p>
                <button className={styles.btnGradient}>
                  <span>Generar Plan Detallado</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {/* Details */}
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <div className={`${styles.iconCircle} ${styles.iconSoil}`}>
                    <span className="material-symbols-outlined">grass</span>
                  </div>
                  <div>
                    <h4>Calidad del Suelo</h4>
                    <p>{data.indicadores_satelite.calidad_suelo}. Materia orgánica rica apta para crecimiento vegetativo.</p>
                  </div>
                </div>
                
                <div className={styles.detailItem}>
                  <div className={`${styles.iconCircle} ${styles.iconCloud}`}>
                    <span className="material-symbols-outlined">cloud</span>
                  </div>
                  <div>
                    <h4>Inferencia de Nubosidad</h4>
                    <p>{data.indicadores_satelite.cobertura_nube}% de interferencia satelital. Análisis espectral ajustado.</p>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <div className={`${styles.iconCircle} ${styles.iconNdvi}`}>
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <div>
                    <h4>Estado NDVI</h4>
                    <p>Índice {data.indicadores_satelite.ndvi}. Salud vegetativa moderada. Considerar riego dirigido.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Climate Metrics */}
        <div className={styles.sideCol}>
          <div className={`${styles.glassCard} ${styles.climateCard}`}>
            <div className={styles.climateHeader}>
              <h2>Condiciones Climáticas</h2>
              <button className={styles.btnMore}>
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            
            <div className={styles.climateMetrics}>
              {/* Temperature */}
              <div className={styles.climateItem}>
                <div className={styles.climateItemHeader}>
                  <div className={styles.climateLabel}>
                    <span className="material-symbols-outlined text-orange-500">thermostat</span>
                    <span>Temperatura</span>
                  </div>
                  <span className={styles.badgeOptimo}>ÓPTIMO</span>
                </div>
                <div className={styles.climateValue}>
                  <span>{data.clima.temperatura}</span>
                  <small>°C</small>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={`${styles.progressBarFill} bg-orange-500`} style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Precipitation */}
              <div className={styles.climateItem}>
                <div className={styles.climateItemHeader}>
                  <div className={styles.climateLabel}>
                    <span className="material-symbols-outlined text-blue-500">water_drop</span>
                    <span>Precipitación</span>
                  </div>
                  <span className={styles.badgeNormal}>NORMAL</span>
                </div>
                <div className={styles.climateValue}>
                  <span>{data.clima.precipitacion}</span>
                  <small>mm</small>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={`${styles.progressBarFill} bg-blue-500`} style={{ width: '45%' }}></div>
                </div>
              </div>

              {/* Humidity */}
              <div className={styles.climateItem}>
                <div className={styles.climateItemHeader}>
                  <div className={styles.climateLabel}>
                    <span className="material-symbols-outlined text-teal-600">humidity_percentage</span>
                    <span>Humedad</span>
                  </div>
                  <span className={styles.badgeOptimo}>ÓPTIMO</span>
                </div>
                <div className={styles.climateValue}>
                  <span>{data.clima.humedad}</span>
                  <small>%</small>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={`${styles.progressBarFill} bg-teal-600`} style={{ width: '77%' }}></div>
                </div>
              </div>

              {/* Radiation */}
              <div className={styles.climateItem}>
                <div className={styles.climateItemHeader}>
                  <div className={styles.climateLabel}>
                    <span className="material-symbols-outlined text-amber-500">light_mode</span>
                    <span>Radiación</span>
                  </div>
                  <span className={styles.badgeNormal}>NORMAL</span>
                </div>
                <div className={styles.climateValue}>
                  <span>{data.clima.radiacion_solar}</span>
                  <small>W/m²</small>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={`${styles.progressBarFill} bg-amber-500`} style={{ width: '55%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.glassCard} ${styles.trendCard}`}>
            <div className={styles.trendHeader}>
              <h3>Tendencia Rendimiento</h3>
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div className={styles.trendChart}>
              <div className={`${styles.bar} ${styles.barLow}`} style={{ height: '30%' }}></div>
              <div className={`${styles.bar} ${styles.barLow}`} style={{ height: '50%' }}></div>
              <div className={`${styles.bar} ${styles.barLow}`} style={{ height: '40%' }}></div>
              <div className={`${styles.bar} ${styles.barHigh1}`} style={{ height: '70%' }}></div>
              <div className={`${styles.bar} ${styles.barHigh2}`} style={{ height: '85%' }}></div>
              <div className={`${styles.bar} ${styles.barHigh3}`} style={{ height: '95%' }}></div>
            </div>
            <p className={styles.trendFooter}>Últimas 6 temporadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
