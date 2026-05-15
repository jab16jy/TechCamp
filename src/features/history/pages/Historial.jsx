import { useState } from 'react';
import {
  History, Leaf, FlaskConical, MapPin, Calendar, Trash2,
  Eye, Filter, Search, ChevronRight, X, ArrowLeft,
  Sprout
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useHistorial, { TYPE_META, ESTADO_COLORS, formatDate } from '@features/history/hooks/useHistorial';
import './Historial.css';

function ScoreBar({ score }) {
  const color = score >= 85 ? '#006d48' : score >= 70 ? '#ca8a04' : '#ba1a1a';
  return (
    <div className="h-score-wrap">
      <div className="h-score-bar">
        <div className="h-score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="h-score-num" style={{ color }}>{score}%</span>
    </div>
  );
}

function HistorialCard({ item, onView, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[item.tipo] || TYPE_META.analisis;
  const estadoColors = ESTADO_COLORS[item.estado] || ESTADO_COLORS.Exitosa;

  const Icon = item.tipo === 'analisis' ? Leaf : FlaskConical;

  return (
    <article className={`h-card ${expanded ? 'h-card--expanded' : ''}`}>
      <div className="h-card-main">
        <div className="h-card-icon-wrap" style={{ background: meta.bgColor, color: meta.color }}>
          <Icon size={20} />
        </div>

        <div className="h-card-info">
          <div className="h-card-top">
            <div className="h-card-id-row">
              <span className="h-card-id">{item.id}</span>
              <span className="h-card-badge" style={{ background: meta.bgColor, color: meta.color }}>
                {meta.label}
              </span>
              <span className="h-card-estado" style={{ background: estadoColors.bg, color: estadoColors.color }}>
                {item.estado || 'Exitosa'}
              </span>
            </div>
            <div className="h-card-date">
              <Calendar size={12} />
              <span>{formatDate(item.fecha)}</span>
            </div>
          </div>

          <div className="h-card-location">
            <MapPin size={13} />
            <span>{item.municipio}{item.departamento ? `, ${item.departamento}` : ''}</span>
          </div>

          <div className="h-card-result">
            {item.tipo === 'analisis' ? (
              <>
                <div className="h-result-main">
                  <Sprout size={15} style={{ color: meta.color }} />
                  <span className="h-result-label">Cultivo recomendado:</span>
                  <span className="h-result-value">{item.cultivo || item.cultivo_top || '—'}</span>
                </div>
                {item.score != null && <ScoreBar score={item.score} />}
                {item.area_hectareas && (
                  <div className="h-result-extra">
                    <span>{item.area_hectareas} ha</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="h-result-main">
                  <FlaskConical size={15} style={{ color: meta.color }} />
                  <span className="h-result-label">Calidad del suelo:</span>
                  <span className="h-result-value">{item.calidad_suelo || '—'}</span>
                </div>
                <div className="h-soil-chips">
                  {item.ph && <span className="h-soil-chip">pH {item.ph}</span>}
                  {item.nitrogeno && <span className="h-soil-chip">N {item.nitrogeno}</span>}
                  {item.fosforo && <span className="h-soil-chip">P {item.fosforo}</span>}
                  {item.potasio && <span className="h-soil-chip">K {item.potasio}</span>}
                  {item.ndvi && <span className="h-soil-chip">NDVI {item.ndvi}</span>}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-card-actions">
          <button
            className="h-action-expand"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Colapsar' : 'Ver más'}
          >
            <ChevronRight size={16} className={expanded ? 'h-chevron-up' : ''} />
          </button>
          <button
            className="h-action-view"
            onClick={() => onView(item)}
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            className="h-action-delete"
            onClick={() => onDelete(item.id)}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="h-card-detail">
          <div className="h-detail-grid">
            {item.coordenadas && (
              <div className="h-detail-item">
                <span className="h-detail-label">Coordenadas</span>
                <span className="h-detail-value">{parseFloat(item.coordenadas.lat).toFixed(4)}, {parseFloat(item.coordenadas.lng).toFixed(4)}</span>
              </div>
            )}
            {item.area_hectareas && (
              <div className="h-detail-item">
                <span className="h-detail-label">Área</span>
                <span className="h-detail-value">{item.area_hectareas} hectáreas</span>
              </div>
            )}
            {item.mes_siembra && (
              <div className="h-detail-item">
                <span className="h-detail-label">Mes de siembra</span>
                <span className="h-detail-value">{item.mes_siembra}</span>
              </div>
            )}
            {item.tipo_suelo && (
              <div className="h-detail-item">
                <span className="h-detail-label">Tipo de suelo</span>
                <span className="h-detail-value">{item.tipo_suelo}</span>
              </div>
            )}
            {item.ph && (
              <div className="h-detail-item">
                <span className="h-detail-label">pH</span>
                <span className="h-detail-value">{item.ph}</span>
              </div>
            )}
            {item.materia_organica && (
              <div className="h-detail-item">
                <span className="h-detail-label">Materia orgánica</span>
                <span className="h-detail-value">{item.materia_organica}%</span>
              </div>
            )}
          </div>

          {item.tipo === 'analisis' && item.rankings && (
            <div className="h-detail-ranking">
              <span className="h-detail-label">Top cultivos</span>
              <div className="h-ranking-list">
                {item.rankings.map((r, i) => (
                  <div key={i} className="h-ranking-item">
                    <span className="h-ranking-pos">#{r.rank}</span>
                    <span className="h-ranking-crop">{r.crop}</span>
                    <span className="h-ranking-score">{r.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

const Historial = () => {
  const authorized = useAuthGuard('investigador');
  const {
    search,
    setSearch,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    historial,
    filtered,
    stats,
    handleView,
    handleDelete,
    handleClearAll,
    clearSearch,
    navigate,
  } = useHistorial();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="historial">
      <div className="h-root">
        {/* Header */}
        <header className="h-header">
          <div className="h-header-left">
            <div className="h-nav-row">
              <button className="h-back-btn" onClick={() => navigate('/investigador/dashboard')}>
                <ArrowLeft size={13} />
                Volver al Dashboard
              </button>
              <nav className="h-breadcrumb">
                <span>Módulos</span>
                <ChevronRight size={12} />
                <span className="h-crumb-active">Historial de Análisis</span>
              </nav>
            </div>
            <div className="h-title-row">
              <div className="h-title-icon">
                <History size={26} />
              </div>
              <div>
                <h1 className="h-title">Historial de Análisis</h1>
                <p className="h-subtitle">Registro completo de análisis de cultivos y calidad de suelo</p>
              </div>
            </div>
          </div>
          <div className="h-header-right">
            {historial.length > 0 && (
              <button className="h-btn-danger" onClick={handleClearAll}>
                <Trash2 size={14} />
                Limpiar todo
              </button>
            )}
          </div>
        </header>

        {/* Stats Row */}
        <div className="h-stats-row">
          <div className="h-stat-card">
            <span className="h-stat-num">{stats.total}</span>
            <span className="h-stat-label">Total registros</span>
          </div>
          <div className="h-stat-card h-stat-card--analisis">
            <span className="h-stat-num">{stats.analisis}</span>
            <span className="h-stat-label">Análisis de cultivo</span>
          </div>
          <div className="h-stat-card h-stat-card--suelo">
            <span className="h-stat-num">{stats.suelo}</span>
            <span className="h-stat-label">Calidad de suelo</span>
          </div>
        </div>

        {/* Filters */}
        <div className="h-filters">
          <div className="h-search-wrap">
            <Search size={16} className="h-search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, municipio o cultivo..."
              className="h-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="h-search-clear" onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="h-filter-group">
            <Filter size={14} className="h-filter-icon" />
            <select
              className="h-filter-select"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              <option value="analisis">Análisis Cultivo</option>
              <option value="suelo">Calidad Suelo</option>
            </select>
            <select
              className="h-filter-select"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="Exitosa">Exitosa</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Error">Error</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="h-list">
          {filtered.length === 0 ? (
            <div className="h-empty">
              <div className="h-empty-icon">
                <History size={40} />
              </div>
              <h3 className="h-empty-title">
                {historial.length === 0 ? 'Sin registros aún' : 'No hay resultados'}
              </h3>
              <p className="h-empty-desc">
                {historial.length === 0
                  ? 'Los análisis de cultivos y calidad de suelo aparecerán aquí'
                  : 'Intenta con otros términos de búsqueda'}
              </p>
              {historial.length === 0 && (
                <button className="h-empty-cta" onClick={() => navigate('/investigador/analisis')}>
                  <Leaf size={16} />
                  Ir a Análisis de Parcela
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => (
              <HistorialCard
                key={item.id}
                item={item}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default Historial;
