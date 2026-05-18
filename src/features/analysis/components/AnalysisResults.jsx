import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MapPin, Thermometer, Droplets, CloudRain, Sun,
  Sprout, FileText, Download, ArrowLeft, Gauge,
  FlaskConical, Satellite, BarChart3, ChevronDown,
} from 'lucide-react';
import styles from './AnalysisResults.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SCORE_COLOR = (s) => s >= 80 ? '#2D5A27' : s >= 55 ? '#b8860b' : '#ba1a1a';
const SCORE_BG = (s) => s >= 80 ? 'rgba(45,106,79,0.08)' : s >= 55 ? 'rgba(184,134,11,0.08)' : 'rgba(186,26,26,0.08)';

function FactorBar({ label, value, max, unit, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={styles.factorRow}>
      <span className={styles.factorLabel}>{label}</span>
      <div className={styles.factorTrack}>
        <div className={styles.factorFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.factorVal}>{value}{unit}</span>
    </div>
  );
}

function CropCard({ crop, rank, isBest }) {
  const [open, setOpen] = useState(isBest);
  const color = SCORE_COLOR(crop.score);
  const bg = SCORE_BG(crop.score);

  return (
    <div className={`${styles.cropCard} ${isBest ? styles.cropBest : ''}`}>
      <div className={styles.cropHead} onClick={() => setOpen(!open)}>
        <span className={styles.cropRank}>#{rank}</span>
        <span className={styles.cropEmoji}>{crop.emoji || '🌱'}</span>
        <div className={styles.cropInfo}>
          <strong>{crop.cultivo}</strong>
          <span className={styles.cropRisk} style={{ background: bg, color }}>{crop.riesgo}</span>
        </div>
        <div className={styles.cropScoreBox} style={{ background: bg }}>
          <span className={styles.cropScoreNum} style={{ color }}>{crop.score}%</span>
          <span className={styles.cropScoreLabel}>afinidad</span>
        </div>
        <ChevronDown size={16} className={`${styles.cropChev} ${open ? styles.open : ''}`} />
      </div>
      {open && (
        <div className={styles.cropBody}>
          <p className={styles.cropJust}>{crop.justificacion}</p>
          {crop.ciclo_dias && (
            <div className={styles.cropMeta}>
              <span>Ciclo: {crop.ciclo_dias} dias</span>
              {crop.rendimiento_estimado && <span>Rend. estimado: {crop.rendimiento_estimado}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AnalysisResults = ({ data, onNewAnalysis, onDownloadPDF }) => {
  const [mapType, setMapType] = useState('satellite');
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (!data) return null;

  const topCrop = data.recomendaciones?.[0] || {};
  const recs = data.recomendaciones || [];
  const ubicacion = data.ubicacion || {};
  const clima = data.clima || {};
  const satelite = data.indicadores_satelite || {};

  const factors = useMemo(() => [
    { label: 'Temperatura', value: clima.temperatura || 0, max: 40, unit: '°C', color: '#f59e0b', icon: <Thermometer size={13} /> },
    { label: 'Precipitacion', value: clima.precipitacion || 0, max: 200, unit: 'mm', color: '#3b82f6', icon: <CloudRain size={13} /> },
    { label: 'Humedad', value: clima.humedad || 0, max: 100, unit: '%', color: '#0d9488', icon: <Droplets size={13} /> },
    { label: 'NDVI', value: satelite.ndvi || 0, max: 1, unit: '', color: '#10b981', icon: <Satellite size={13} /> },
    { label: 'Radiacion', value: clima.radiacion_solar || 0, max: 25, unit: ' W/m²', color: '#fbbf24', icon: <Sun size={13} /> },
  ], [clima, satelite]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={onNewAnalysis}>
            <ArrowLeft size={14} /> Nueva consulta
          </button>
          <div className={styles.headerTitle}>
            <h1>Reporte de Analisis</h1>
            <div className={styles.locRow}>
              <MapPin size={13} />
              <span>{ubicacion.municipio || ubicacion.lat?.toFixed(4)}, {ubicacion.departamento || ''}</span>
            </div>
          </div>
        </div>
        <button className={styles.downloadBtn} onClick={onDownloadPDF}>
          <Download size={15} /> Descargar PDF
        </button>
      </header>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <Sprout size={18} /> <h2>Cultivos Recomendados</h2>
              <span className={styles.badge}>{recs.length} cultivos evaluados</span>
            </div>
            <div className={styles.cropList}>
              {recs.map((c, i) => (
                <CropCard key={i} crop={c} rank={i + 1} isBest={i === 0} />
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead} onClick={() => setShowBreakdown(!showBreakdown)} style={{ cursor: 'pointer' }}>
              <BarChart3 size={18} /> <h2>Factores Ambientales</h2>
              <ChevronDown size={16} className={`${styles.cropChev} ${showBreakdown ? styles.open : ''}`} />
            </div>
            {showBreakdown && (
              <div className={styles.factorList}>
                {factors.map((f, i) => (
                  <div key={i} className={styles.factorItem}>
                    <div className={styles.factorIcon}>{f.icon}</div>
                    <FactorBar {...f} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <Gauge size={18} /> <h2>Indicadores Satelitales</h2>
            </div>
            <div className={styles.satGrid}>
              <div className={styles.satItem}>
                <span className={styles.satLabel}>NDVI</span>
                <span className={styles.satVal} style={{ color: '#10b981' }}>{satelite.ndvi}</span>
                <span className={styles.satHint}>Vigor vegetacion</span>
              </div>
              <div className={styles.satItem}>
                <span className={styles.satLabel}>NDWI</span>
                <span className={styles.satVal} style={{ color: '#3b82f6' }}>{satelite.ndwi}</span>
                <span className={styles.satHint}>Contenido agua</span>
              </div>
              <div className={styles.satItem}>
                <span className={styles.satLabel}>Calidad</span>
                <span className={styles.satVal} style={{ color: '#2D5A27' }}>{satelite.calidad_suelo}</span>
                <span className={styles.satHint}>Suelo</span>
              </div>
              <div className={styles.satItem}>
                <span className={styles.satLabel}>Nubes</span>
                <span className={styles.satVal} style={{ color: '#707973' }}>{satelite.cobertura_nube}%</span>
                <span className={styles.satHint}>Cobertura</span>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.sideCol}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <MapPin size={18} /> <h2>Mapa de Ubicacion</h2>
            </div>
            <div className={styles.mapWrap}>
              <div className={styles.mapBtns}>
                <button className={`${styles.mapBtn} ${mapType === 'satellite' ? styles.mapBtnActive : ''}`} onClick={() => setMapType('satellite')}>Satelite</button>
                <button className={`${styles.mapBtn} ${mapType === 'terrain' ? styles.mapBtnActive : ''}`} onClick={() => setMapType('terrain')}>Terreno</button>
              </div>
              <MapContainer center={[ubicacion.lat || 10.5, ubicacion.lng || -74.8]} zoom={14} style={{ height: 200, width: '100%', borderRadius: '0 0 1rem 1rem' }} zoomControl={false}>
                {mapType === 'satellite' ? (
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                ) : (
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                )}
                <Marker position={[ubicacion.lat || 10.5, ubicacion.lng || -74.8]} />
                <ZoomControl position="bottomright" />
              </MapContainer>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <FlaskConical size={18} /> <h2>Parametros del Suelo</h2>
            </div>
            <div className={styles.soilGrid}>
              {ubicacion.ph_suelo != null && (
                <div className={styles.soilItem}>
                  <span className={styles.soilLabel}>pH</span>
                  <span className={styles.soilVal}>{ubicacion.ph_suelo}</span>
                </div>
              )}
              {ubicacion.materia_organica != null && (
                <div className={styles.soilItem}>
                  <span className={styles.soilLabel}>Materia Organica</span>
                  <span className={styles.soilVal}>{ubicacion.materia_organica}%</span>
                </div>
              )}
              {ubicacion.textura_suelo && (
                <div className={styles.soilItem}>
                  <span className={styles.soilLabel}>Textura</span>
                  <span className={styles.soilVal}>{ubicacion.textura_suelo}</span>
                </div>
              )}
              {ubicacion.area_hectareas && (
                <div className={styles.soilItem}>
                  <span className={styles.soilLabel}>Area</span>
                  <span className={styles.soilVal}>{ubicacion.area_hectareas} ha</span>
                </div>
              )}
              {ubicacion.mes_siembra && (
                <div className={styles.soilItem}>
                  <span className={styles.soilLabel}>Mes siembra</span>
                  <span className={styles.soilVal}>{ubicacion.mes_siembra}</span>
                </div>
              )}
            </div>
          </section>

          {data.es_mock && (
            <div className={styles.mockBanner}>
              <FileText size={14} /> Datos simulados — Backend no disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
