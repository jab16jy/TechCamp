import { Satellite, Droplets, FlaskConical, MapPin, Database, Leaf, TrendingUp } from 'lucide-react';
import useAppStore from '@shared/store';
import './DataSources.css';

const DataSources = () => {
  const { historial, resultado } = useAppStore();

  const lastAnalysis = historial.length > 0
    ? [...historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
    : null;

  const topCultivo = resultado?.recomendaciones?.[0]?.cultivo;
  const depto = resultado?.ubicacion?.departamento;
  const municipio = resultado?.ubicacion?.municipio;
  const ndvi = resultado?.indicadores_satelite?.ndvi;

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
              <span className="ds-card-label">Análisis de cultivos</span>
              <span className="ds-card-value">{historial.length} {historial.length === 1 ? 'registro' : 'registros'}</span>
            </div>
          </div>
          {lastAnalysis && (
            <div className="ds-card-detail">
              Último: {lastAnalysis.municipio || lastAnalysis.departamento || 'Sin ubicación'}
              {lastAnalysis.cultivo && ` · ${lastAnalysis.cultivo}`}
            </div>
          )}
          {topCultivo && (
            <div className="ds-card-detail" style={{ color: '#2D5A27', fontWeight: 600 }}>
              Activo: {topCultivo}{municipio ? ` · ${municipio}` : ''}{depto ? `, ${depto}` : ''}
            </div>
          )}
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-icon-wrap amber">
              <TrendingUp size={16} strokeWidth={1.5} />
            </div>
            <div className="ds-card-info">
              <span className="ds-card-label">EVA · Cosechas Caribe</span>
              <span className="ds-card-value">26,402 registros · 2018–2025</span>
            </div>
          </div>
          <div className="ds-card-detail">Área, producción y rendimiento por municipio</div>
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-icon-wrap green" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
              <Leaf size={16} strokeWidth={1.5} />
            </div>
            <div className="ds-card-info">
              <span className="ds-card-label">Foliar AGROSAVIA</span>
              <span className="ds-card-value">1,756 registros · 6 dptos</span>
            </div>
          </div>
          <div className="ds-card-detail">N, P, K, Ca, Mg, S, Fe, Cu, Mn, Zn, B por cultivo</div>
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
          {ndvi && <div className="ds-card-detail">NDVI actual: {ndvi}</div>}
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-icon-wrap amber">
              <Droplets size={16} strokeWidth={1.5} />
            </div>
            <div className="ds-card-info">
              <span className="ds-card-label">Clima · NASA POWER</span>
              <span className="ds-card-value">Temp · Precip · Humedad</span>
            </div>
          </div>
        </div>
      </div>

      {topCultivo && (
        <div className="ds-section">
          <h3 className="ds-section-title">
            <MapPin size={14} strokeWidth={1.5} />
            Análisis activo
          </h3>
          <div className="ds-card ds-card-compact">
            <div className="ds-card-header">
              <div className="ds-card-info">
                <span className="ds-card-label">{topCultivo}</span>
                <span className="ds-card-value">
                  {[municipio, depto].filter(Boolean).join(', ') || 'Región Caribe'}
                </span>
              </div>
            </div>
            {resultado?.recomendaciones?.[0]?.score != null && (
              <div className="ds-card-detail">
                Score: {resultado.recomendaciones[0].score}% · {resultado.recomendaciones[0].riesgo}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSources;
