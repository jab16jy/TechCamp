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

  // Progress ring calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (mainCrop.score / 100) * circumference;

  // NDVI gauge rotation (-1 to 1)
  const ndviRotation = ((data.indicadores_satelite.ndvi + 1) / 2) * 180;

  return (
    <div className={styles.premiumContent}>
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
            Descargar reporte PDF
          </button>
          <button className={styles.btnQuery} onClick={onNewAnalysis}>
            Nueva consulta
          </button>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Left Column */}
        <div className={styles.mainCol}>
          {/* Quick Metrics */}
          <div className={styles.metricsGrid}>
            <MetricCard 
              label="Temperatura" 
              value={`${data.clima.temperatura}°C`} 
              icon="device_thermostat" 
              status="Óptimo"
              statusClass={styles.badgeOptimo}
              colorClass="bg-orange-50 text-orange-600"
            />
            <MetricCard 
              label="Precipitación" 
              value={`${data.clima.precipitacion}mm`} 
              icon="rainy" 
              status="Normal"
              statusClass={styles.badgeNormal}
              colorClass="bg-blue-50 text-blue-600"
            />
            <MetricCard 
              label="Humedad" 
              value={`${data.clima.humedad}%`} 
              icon="humidity_percentage" 
              status="Óptimo"
              statusClass={styles.badgeOptimo}
              colorClass="bg-cyan-50 text-cyan-600"
            />
            <MetricCard 
              label="Radiación" 
              value={`${data.clima.radiacion_solar}W/m²`} 
              icon="light_mode" 
              status="Alerta"
              statusClass={styles.badgeAlerta}
              colorClass="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Map Section */}
          <section className={styles.mapSection}>
            <div className={styles.mapHeader}>
              <div className={styles.mapTitle}>
                <span className="material-symbols-outlined">map</span>
                <h3>Visualización Espacial</h3>
              </div>
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
            </div>
            <div className={styles.mapContainer}>
              <MapContainer 
                center={[data.ubicacion?.lat || 11, data.ubicacion?.lng || -74]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
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
            </div>
          </section>

          {/* Main Recommendation Card - MOVED BELOW MAP */}
          <section className={styles.recommendedSection}>
            <div className={styles.topographicBg}></div>
            <div className={styles.recommendedContent}>
              <div className={styles.recommendedInfo}>
                <div className={styles.recommendedTitle}>
                  <h2 className="premium-font">{mainCrop.cultivo}</h2>
                  <span className={styles.riskBadge}>Riesgo {mainCrop.riesgo}</span>
                </div>
                <p className={styles.recommendedDesc}>{mainCrop.justificacion}</p>
                <div className={styles.recommendedMeta}>
                  <span>Proyectado para siembra en: {data.ubicacion?.mes_siembra}</span>
                </div>
              </div>

              <div className={styles.progressWrapper}>
                <div className={styles.progressRing}>
                  <svg className={styles.progressRingSvg}>
                    <circle className={styles.progressRingCircleBg} cx="64" cy="64" r={radius} />
                    <circle 
                      className={styles.progressRingCircle} 
                      cx="64" cy="64" r={radius} 
                      style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                    />
                  </svg>
                  <div className={styles.progressValue}>
                    <span className={styles.progressNumber}>{mainCrop.score}%</span>
                    <span className={styles.progressLabel}>Afinidad</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside className={styles.sideCol}>
          {/* NDVI Card */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h3>Índice NDVI</h3>
              <span className="material-symbols-outlined">info</span>
            </div>
            <div className={styles.gaugeContainer}>
              <div className={styles.gaugeWrapper}>
                <div className={styles.gaugeBg}></div>
                <div 
                  className={styles.gaugeFill} 
                  style={{ transform: `rotate(${ndviRotation}deg)` }}
                ></div>
                <div className={styles.gaugeInfo}>
                  <span className={styles.gaugeValue}>{data.indicadores_satelite.ndvi}</span>
                  <span className={styles.gaugeLabel}>Salud de Cultivo</span>
                </div>
              </div>
              <div className={styles.gaugeRange}>
                <span>BAJO</span>
                <span>ÓPTIMO</span>
              </div>
            </div>
            <p className={styles.insightText}>
              El índice de vegetación actual sugiere un crecimiento vigoroso. No se detectan anomalías de plagas.
            </p>
          </div>

          {/* Indicators List */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h3>Indicadores Satelitales</h3>
            </div>
            <div className={styles.dataList}>
              <DataItem label="NDWI (Agua)" value={data.indicadores_satelite.ndwi} sub="Humedad en hoja" />
              <DataItem label="Calidad Suelo" value={data.indicadores_satelite.calidad_suelo} sub="Análisis espectral" />
              <DataItem label="Nubosidad" value={`${data.indicadores_satelite.cobertura_nube}%`} sub="Obstrucción" />
            </div>
            <button className={styles.btnHistory}>
              <span className="material-symbols-outlined">history</span>
              Ver historial de zona
            </button>
          </div>

          {/* AI Insight Card */}
          <div className={styles.insightCard}>
            <div className={styles.insightBg}></div>
            <div className={styles.insightHeader}>
              <span className="material-symbols-outlined">psychology</span>
              <span className={styles.insightBadge}>IA INSIGHT</span>
            </div>
            <p className={styles.insightText}>
              "Se detecta una ventana de siembra óptima en los próximos 12 días basada en patrones de la Niña."
            </p>
            <img 
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=400" 
              alt="Análisis IA" 
              className={styles.insightImage}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, status, statusClass, colorClass }) => (
  <div className={styles.metricCard}>
    <div className={styles.metricHeader}>
      <div className={`${styles.metricIconWrapper} ${colorClass}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className={`${styles.badge} ${statusClass}`}>{status}</span>
    </div>
    <div className={styles.metricInfo}>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  </div>
);

const DataItem = ({ label, value, sub }) => (
  <div className={styles.dataItem}>
    <div className={styles.dataInfo}>
      <span className={styles.dataName}>{label}</span>
      <span className={styles.dataSub}>{sub}</span>
    </div>
    <span className={styles.dataValue}>{value}</span>
  </div>
);

export default AnalysisResults;
