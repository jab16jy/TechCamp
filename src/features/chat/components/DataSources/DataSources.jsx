import { Satellite, Droplets, FlaskConical, MapPin, Database } from 'lucide-react';
import useAppStore from '@shared/store';
import './DataSources.css';

const DataSources = () => {
  const { historial, resultado } = useAppStore();

  const lastAnalysis = historial.length > 0 ? historial[historial.length - 1] : null;
  const soilCount = historial.filter((h) => h.tipo === 'suelo').length;
  const analysisCount = historial.filter((h) => h.tipo === 'analisis').length;

  const sensors = [
    { id: 'Norte-01', name: 'Nodo Norte', ndvi: 0.73, humedad: 72, temp: 28.4, status: 'ok' },
    { id: 'Sur-02', name: 'Nodo Sur', ndvi: 0.61, humedad: 61, temp: 29.8, status: 'warn' },
    { id: 'Este-03', name: 'Nodo Este', ndvi: 0.54, humedad: 55, temp: 31.2, status: 'critical' },
  ];

  const parcelas = [
    { name: 'Hacienda El Sol', area: '24 ha', cultivo: 'Maíz', lastUpdate: 'Hace 2 días' },
    { name: 'Lote Norte', area: '18 ha', cultivo: 'Yuca', lastUpdate: 'Hace 1 semana' },
  ];

  return (
    <div className="data-sources">
      <div className="ds-section">
        <h3 className="ds-section-title">
          <Database size={14} strokeWidth={1.5} />
          Fuentes conectadas
        </h3>

        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-icon-wrap green">
              <FlaskConical size={16} strokeWidth={1.5} />
            </div>
            <div className="ds-card-info">
              <span className="ds-card-label">Análisis de suelo</span>
              <span className="ds-card-value">{soilCount} registros</span>
            </div>
          </div>
          {lastAnalysis && (
            <div className="ds-card-detail">
              Último: {lastAnalysis.municipio || 'Sin ubicación'}
            </div>
          )}
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-icon-wrap blue">
              <Satellite size={16} strokeWidth={1.5} />
            </div>
            <div className="ds-card-info">
              <span className="ds-card-label">Datos satelitales</span>
              <span className="ds-card-value">Sentinel-2 · NDVI</span>
            </div>
          </div>
          {resultado?.indicadores_satelite?.ndvi && (
            <div className="ds-card-detail">
              NDVI actual: {resultado.indicadores_satelite.ndvi}
            </div>
          )}
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-icon-wrap amber">
              <Droplets size={16} strokeWidth={1.5} />
            </div>
            <div className="ds-card-info">
              <span className="ds-card-label">Clima</span>
              <span className="ds-card-value">NASA POWER</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ds-section">
        <h3 className="ds-section-title">
          <MapPin size={14} strokeWidth={1.5} />
          Parcelas
        </h3>
        {parcelas.map((p, i) => (
          <div key={i} className="ds-card ds-card-compact">
            <div className="ds-card-header">
              <div className="ds-card-info">
                <span className="ds-card-label">{p.name}</span>
                <span className="ds-card-value">{p.area} · {p.cultivo}</span>
              </div>
            </div>
            <div className="ds-card-detail">{p.lastUpdate}</div>
          </div>
        ))}
      </div>

      <div className="ds-section">
        <h3 className="ds-section-title">
          <Satellite size={14} strokeWidth={1.5} />
          Sensores IoT
        </h3>
        {sensors.map((s) => (
          <div key={s.id} className="ds-card ds-card-sensor">
            <div className="ds-sensor-header">
              <div className="ds-sensor-status">
                <span className={`ds-dot ds-dot-${s.status}`} />
                <span className="ds-sensor-name">{s.name}</span>
              </div>
              <span className="ds-sensor-id">{s.id}</span>
            </div>
            <div className="ds-sensor-metrics">
              <div className="ds-metric">
                <span className="ds-metric-label">NDVI</span>
                <span className="ds-metric-value">{s.ndvi}</span>
              </div>
              <div className="ds-metric">
                <span className="ds-metric-label">Humedad</span>
                <span className="ds-metric-value">{s.humedad}%</span>
              </div>
              <div className="ds-metric">
                <span className="ds-metric-label">Temp</span>
                <span className="ds-metric-value">{s.temp}°C</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataSources;