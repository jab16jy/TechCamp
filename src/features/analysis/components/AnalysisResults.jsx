import { useState, useMemo } from 'react';
import {
  MapPin, Thermometer, Droplets, CloudRain, Sun,
  Sprout, FileText, Download, ArrowLeft, Gauge,
  FlaskConical, Satellite, BarChart3, ChevronDown,
  TrendingUp, TrendingDown, Minus, Lightbulb,
} from 'lucide-react';
import styles from './AnalysisResults.module.css';

const IMPROVEMENT_MAP = {
  'Temperatura':      'Elegir variedad tolerante al calor o ajustar fecha de siembra',
  'Precipitacion':    'Instalar riego por goteo para compensar déficit hídrico',
  'Humedad':          'Mejorar drenaje o usar cobertura vegetal para retener humedad',
  'pH':               'Encalar con cal agrícola (subir pH) o aplicar azufre (bajar pH)',
  'Materia Organica': 'Incorporar compost, abono verde o bokashi para aumentar MO',
  'Calcio':           'Aplicar cal dolomítica o yeso agrícola (CaSO₄)',
  'CIC':              'Aumentar MO para mejorar la capacidad de intercambio catiónico',
  'Conductividad':    'Reducir salinidad con lixiviación y aplicación de yeso',
  'Magnesio':         'Aplicar dolomita o sulfato de magnesio (Kieserita)',
  'Potasio':          'Fertilizar con KCl o sulfato de potasio según análisis foliar',
  'Fosforo':          'Aplicar superfosfato triple o roca fosfórica según pH',
  'Azufre':           'Aplicar azufre elemental o yeso al suelo',
  'Boro':             'Aplicar bórax (1–2 kg/ha) en fertirriego o foliar',
  'Sodio':            'Aplicar yeso agrícola para desplazar el sodio intercambiable',
  'NDVI':             'Mejorar fertilización y control de malezas para incrementar vigor',
};

function getImprovements(crop) {
  if (!crop) return [];
  const weights = crop.factor_weights || [];
  if (crop.score >= 85) {
    return ['Mantener pH y MO con compost anual', 'Monitorear plagas en período crítico'];
  }
  const weak = weights
    .filter((f) => f.score_parcial != null && f.score_parcial < 0.55)
    .sort((a, b) => a.score_parcial - b.score_parcial)
    .slice(0, 3);

  const hints = weak.map((f) => IMPROVEMENT_MAP[f.factor] || `Optimizar ${f.factor}`);
  if (hints.length === 0) {
    return ['Realizar análisis de suelo completo para identificar limitantes'];
  }
  return hints;
}

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
  const improvements = useMemo(() => getImprovements(crop), [crop]);

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
              <span>Ciclo: {crop.ciclo_dias} días</span>
              {crop.rendimiento_estimado && <span>Rend. estimado: {crop.rendimiento_estimado}</span>}
            </div>
          )}
          {improvements.length > 0 && (
            <div className={styles.improvementsBox}>
              <div className={styles.improvementsHead}>
                <Lightbulb size={11} />
                <span>¿Cómo mejorar?</span>
              </div>
              <ul className={styles.improvementsList}>
                {improvements.map((hint, i) => (
                  <li key={i} className={styles.improvementItem}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnomalyDiff({ value, unit }) {
  const isUp = value > 1;
  const isDown = value < -1;
  const color = isUp ? '#f59e0b' : isDown ? '#3b82f6' : '#707973';
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const sign = value > 0 ? '+' : '';

  return (
    <div className={styles.anomDiff} style={{ color }}>
      <Icon size={11} />
      <span>{sign}{value}{unit}</span>
    </div>
  );
}

const CHEM_DISPLAY = [
  { key: 'calcio',        label: 'Calcio',       unit: 'cmol/kg' },
  { key: 'cic',           label: 'CIC',           unit: 'cmol/kg' },
  { key: 'conductividad', label: 'Conduct.',      unit: 'dS/m'    },
  { key: 'magnesio',      label: 'Magnesio',      unit: 'cmol/kg' },
  { key: 'potasio',       label: 'Potasio',       unit: 'cmol/kg' },
  { key: 'fosforo',       label: 'Fósforo',       unit: 'mg/kg'   },
  { key: 'azufre',        label: 'Azufre',        unit: 'mg/kg'   },
  { key: 'boro',          label: 'Boro',          unit: 'mg/kg'   },
  { key: 'sodio',         label: 'Sodio',         unit: 'cmol/kg' },
];

// High-stress variables where exceeding p90 is also bad
const HIGH_IS_BAD = new Set(['conductividad', 'sodio']);

function getSemaphore(value, fieldKey, perfil) {
  if (value == null || !perfil) return 'unknown';
  const p10 = perfil[`${fieldKey}_p10`];
  const p90 = perfil[`${fieldKey}_p90`];
  if (p10 == null || p90 == null) return 'unknown';
  const v = Number(value);

  if (HIGH_IS_BAD.has(fieldKey)) {
    if (v <= p90) return 'optimal';
    if (v <= p90 * 1.6) return 'warning';
    return 'critical';
  }
  // Deficiency-based semaphore
  if (v >= p10) return 'optimal';
  if (v >= p10 * 0.4) return 'warning';
  return 'critical';
}

const SEMAPHORE_STYLES = {
  optimal:  { color: '#15803d', bg: 'rgba(21,128,61,0.12)',  label: '✓' },
  warning:  { color: '#b45309', bg: 'rgba(180,83,9,0.12)',   label: '!' },
  critical: { color: '#b91c1c', bg: 'rgba(185,28,28,0.12)',  label: '↓' },
  unknown:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', label: '?' },
};

const AnalysisResults = ({ data, onNewAnalysis, onDownloadPDF }) => {
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (!data) return null;

  const topCrop = data.recomendaciones?.[0] || {};
  const recs = data.recomendaciones || [];
  const ubicacion = data.ubicacion || {};
  const clima = data.clima || {};
  const satelite = data.indicadores_satelite || {};
  const anomalia = data.anomalia || null;

  const chemValues = CHEM_DISPLAY.filter(({ key }) => ubicacion[key] != null);
  const topPerfil = topCrop?.perfil_quimico || null;

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
              <span className={styles.badge}>Top 3 · 18 variables</span>
            </div>
            <div className={styles.cropList}>
              {recs.slice(0, 3).map((c, i) => (
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

          {anomalia && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <TrendingUp size={18} /> <h2>Anomalia Climatica</h2>
                <span className={styles.anomSource}>{anomalia.fuente}</span>
              </div>
              <div className={styles.anomGrid}>
                <div className={styles.anomItem}>
                  <div className={styles.anomHeader}>
                    <Thermometer size={12} />
                    <span>Temperatura</span>
                  </div>
                  <div className={styles.anomValues}>
                    <span className={styles.anomActual}>{anomalia.temperatura_actual}°C</span>
                    <span className={styles.anomHist}>vs {anomalia.temperatura_historica}°C</span>
                  </div>
                  <AnomalyDiff value={anomalia.anomalia_temperatura} unit="°C" />
                </div>
                <div className={styles.anomItem}>
                  <div className={styles.anomHeader}>
                    <CloudRain size={12} />
                    <span>Precipitacion</span>
                  </div>
                  <div className={styles.anomValues}>
                    <span className={styles.anomActual}>{anomalia.precipitacion_actual}mm</span>
                    <span className={styles.anomHist}>vs {anomalia.precipitacion_historica}mm</span>
                  </div>
                  <AnomalyDiff value={anomalia.anomalia_precipitacion} unit="mm" />
                </div>
                <div className={styles.anomItem}>
                  <div className={styles.anomHeader}>
                    <Droplets size={12} />
                    <span>Humedad</span>
                  </div>
                  <div className={styles.anomValues}>
                    <span className={styles.anomActual}>{anomalia.humedad_actual}%</span>
                    <span className={styles.anomHist}>vs {anomalia.humedad_historica}%</span>
                  </div>
                  <AnomalyDiff value={anomalia.anomalia_humedad} unit="%" />
                </div>
              </div>
            </section>
          )}

          {chemValues.length > 0 && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <FlaskConical size={18} /> <h2>Química del Suelo</h2>
                <span className={styles.badge}>AGROSAVIA</span>
              </div>
              {topPerfil && (
                <p className={styles.chemHint}>
                  Semáforo vs. {topCrop.emoji} {topCrop.cultivo}
                </p>
              )}
              <div className={styles.soilGrid}>
                {chemValues.map(({ key, label, unit }) => {
                  const status = getSemaphore(ubicacion[key], key, topPerfil);
                  const s = SEMAPHORE_STYLES[status];
                  return (
                    <div key={key} className={styles.soilItem}>
                      <div className={styles.soilItemHead}>
                        <span className={styles.soilLabel}>{label}</span>
                        <span
                          className={styles.semDot}
                          style={{ color: s.color, background: s.bg }}
                          title={status}
                        >
                          {s.label}
                        </span>
                      </div>
                      <span className={styles.soilVal}>{Number(ubicacion[key]).toFixed(2)}</span>
                      <span className={styles.soilUnit}>{unit}</span>
                    </div>
                  );
                })}
              </div>
              {topPerfil && (
                <div className={styles.semLegend}>
                  <span style={{ color: SEMAPHORE_STYLES.optimal.color }}>✓ Óptimo</span>
                  <span style={{ color: SEMAPHORE_STYLES.warning.color }}>! Marginal</span>
                  <span style={{ color: SEMAPHORE_STYLES.critical.color }}>↓ Deficiente</span>
                </div>
              )}
            </section>
          )}

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
