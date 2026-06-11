import { useState } from 'react';
import { TrendingUp, Map, Leaf, BarChart3, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { getStudioData } from '@shared/services/api';
import useAppStore from '@shared/store';
import './StudioPanel.css';

const HarvestCard = ({ harvest, cultivo }) => {
  if (!harvest) return <div className="studio-empty">Sin datos EVA para {cultivo}</div>;

  const { yield_median_t_ha: med, yield_p10_t_ha: lo, yield_p90_t_ha: hi,
          trend_label, trend_pct, years_covered, estimated_production_t, area_ha } = harvest;

  const trendColor = trend_label === 'en aumento' ? '#22c55e' : trend_label === 'en descenso' ? '#ef4444' : '#94a3b8';
  const years = years_covered?.length >= 2
    ? `${years_covered[0]}–${years_covered[years_covered.length - 1]}`
    : (years_covered?.[0] ?? 'N/D');

  return (
    <div className="studio-data-card">
      <div className="sdc-header">
        <TrendingUp size={13} strokeWidth={1.5} />
        <span>Rendimiento · {years}</span>
      </div>
      <div className="sdc-yield-row">
        <div className="sdc-kpi">
          <span className="sdc-kpi-val">{med}</span>
          <span className="sdc-kpi-unit">t/ha</span>
          <span className="sdc-kpi-label">mediana</span>
        </div>
        <div className="sdc-range">
          <span className="sdc-range-label">Rango típico</span>
          <span className="sdc-range-val">{lo} – {hi} t/ha</span>
        </div>
        <div className="sdc-trend" style={{ color: trendColor }}>
          <span className="sdc-trend-label">Tendencia</span>
          <span className="sdc-trend-val">
            {trend_label}{trend_pct != null ? ` (${trend_pct > 0 ? '+' : ''}${trend_pct}%)` : ''}
          </span>
        </div>
      </div>
      {estimated_production_t != null && (
        <div className="sdc-estimate">
          Estimado para {area_ha} ha: <strong>{estimated_production_t} t</strong>
        </div>
      )}
    </div>
  );
};

const FoliarCard = ({ foliar, cultivo }) => {
  const [expanded, setExpanded] = useState(false);
  if (!foliar?.nutrients) return <div className="studio-empty">Sin datos foliares para {cultivo}</div>;

  const entries = Object.entries(foliar.nutrients);
  const visible = expanded ? entries : entries.slice(0, 5);

  return (
    <div className="studio-data-card">
      <div className="sdc-header">
        <Leaf size={13} strokeWidth={1.5} />
        <span>Foliar · {foliar.n_samples} muestras</span>
      </div>
      <div className="sdc-nut-grid">
        <div className="sdc-nut-head">
          <span>Nutriente</span><span>p10 – p90</span><span>p50</span>
        </div>
        {visible.map(([key, nut]) => (
          <div key={key} className="sdc-nut-row">
            <span className="sdc-nut-label">{nut.label}</span>
            <span className="sdc-nut-range">{nut.p10}–{nut.p90} <em>{nut.unit}</em></span>
            <span className="sdc-nut-p50">{nut.p50}</span>
          </div>
        ))}
      </div>
      {entries.length > 5 && (
        <button className="sdc-expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? <><ChevronUp size={11} /> menos</> : <><ChevronDown size={11} /> {entries.length - 5} más</>}
        </button>
      )}
    </div>
  );
};

const StudioPanel = () => {
  const { resultado } = useAppStore();
  const [studioData, setStudioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState(null);

  const topCultivo = resultado?.recomendaciones?.[0]?.cultivo;
  const depto = resultado?.ubicacion?.departamento;
  const areaHa = resultado?.ubicacion?.area_hectareas;

  const fetchData = async (view) => {
    if (!topCultivo) return;
    setActiveView(view);
    if (studioData?.cultivo === topCultivo) return;
    setLoading(true);
    try {
      const data = await getStudioData(topCultivo, depto || null, areaHa || null);
      setStudioData(data);
    } catch {
      setStudioData({ error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-panel">
      <h3 className="studio-title">
        <BarChart3 size={14} strokeWidth={1.5} />
        Studio
      </h3>
      <p className="studio-subtitle">
        {topCultivo ? `Cultivo: ${topCultivo}` : 'Análisis de datos'}
      </p>

      <div className="studio-actions">
        <button
          className={`studio-card studio-card-amber${activeView === 'harvest' ? ' studio-card-active' : ''}`}
          onClick={() => fetchData('harvest')}
          disabled={!topCultivo}
        >
          <div className="studio-card-icon"><TrendingUp size={18} strokeWidth={1.5} /></div>
          <div className="studio-card-content">
            <span className="studio-card-title">Predicción de cosecha</span>
            <span className="studio-card-desc">Rendimiento histórico EVA</span>
          </div>
        </button>

        <button
          className={`studio-card studio-card-green${activeView === 'foliar' ? ' studio-card-active' : ''}`}
          onClick={() => fetchData('foliar')}
          disabled={!topCultivo}
        >
          <div className="studio-card-icon"><Leaf size={18} strokeWidth={1.5} /></div>
          <div className="studio-card-content">
            <span className="studio-card-title">Perfil foliar</span>
            <span className="studio-card-desc">Normas nutricionales AGROSAVIA</span>
          </div>
        </button>

        <button
          className={`studio-card studio-card-blue${activeView === 'map' ? ' studio-card-active' : ''}`}
          onClick={() => fetchData('map')}
          disabled={!topCultivo}
        >
          <div className="studio-card-icon"><Map size={18} strokeWidth={1.5} /></div>
          <div className="studio-card-content">
            <span className="studio-card-title">Mapa de nutrientes</span>
            <span className="studio-card-desc">Distribución foliar regional</span>
          </div>
        </button>
      </div>

      {loading && (
        <div className="studio-loading">
          <Loader size={15} strokeWidth={1.5} className="studio-spinner" />
          <span>Cargando datos...</span>
        </div>
      )}

      {!loading && studioData && !studioData.error && (
        <div className="studio-results">
          {activeView === 'harvest' && (
            <HarvestCard harvest={studioData.harvest} cultivo={topCultivo} />
          )}
          {activeView === 'foliar' && (
            <FoliarCard foliar={studioData.foliar} cultivo={topCultivo} />
          )}
          {activeView === 'map' && (
            <>
              <HarvestCard harvest={studioData.harvest} cultivo={topCultivo} />
              <FoliarCard foliar={studioData.foliar} cultivo={topCultivo} />
            </>
          )}
        </div>
      )}

      {!loading && studioData?.error && (
        <div className="studio-empty">No se pudieron cargar los datos.</div>
      )}

      {!topCultivo && (
        <p className="studio-hint">
          Realiza un análisis de cultivos primero para habilitar las herramientas de Studio.
        </p>
      )}
    </div>
  );
};

export default StudioPanel;
