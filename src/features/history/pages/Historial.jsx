import { useState } from 'react';
import {
  History, Leaf, FlaskConical, MapPin, Calendar, Trash2,
  Eye, Search, X, ArrowLeft, Sprout, TrendingUp,
  ChevronDown, Gauge, Droplets, Layers, AlertTriangle,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useHistorial, { formatDate, formatTime } from '@features/history/hooks/useHistorial';
import './Historial.css';

const TIPO_CONFIG = {
  simple: { label: 'Analisis Cultivo', icon: Leaf, color: '#2d6a4f', bg: 'rgba(45,106,79,0.08)' },
  analisis: { label: 'Analisis Cultivo', icon: Leaf, color: '#2d6a4f', bg: 'rgba(45,106,79,0.08)' },
  advanced: { label: 'Calidad Suelo', icon: FlaskConical, color: '#75584d', bg: 'rgba(117,88,77,0.08)' },
  suelo: { label: 'Calidad Suelo', icon: FlaskConical, color: '#75584d', bg: 'rgba(117,88,77,0.08)' },
  prediccion: { label: 'Prediccion IA', icon: TrendingUp, color: '#386a20', bg: 'rgba(56,106,32,0.08)' },
};

const SCORE_COLOR = (s) => s >= 85 ? '#006d48' : s >= 65 ? '#ca8a04' : '#ba1a1a';

function StatCard({ num, label, color, icon: Icon }) {
  return (
    <div className="h-stat-card">
      <div className="h-stat-icon" style={{ background: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <div className="h-stat-body">
        <span className="h-stat-num">{num}</span>
        <span className="h-stat-label">{label}</span>
      </div>
    </div>
  );
}

function HistorialCard({ item, onView, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const config = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.analisis;
  const Icon = config.icon;

  const isSoil = item.tipo === 'advanced' || item.tipo === 'suelo';
  const isPred = item.tipo === 'prediccion';

  return (
    <article className={`h-card ${expanded ? 'h-card--expanded' : ''}`}>
      <div className="h-card-glass">
        <div className="h-card-body" onClick={() => setExpanded((v) => !v)}>
          <div className="h-card-icon" style={{ background: config.bg, color: config.color }}>
            <Icon size={22} />
          </div>

          <div className="h-card-meta">
            <div className="h-card-header">
              <div>
                <span className="h-card-id">{item.id}</span>
                <span className="h-card-type" style={{ background: config.bg, color: config.color }}>
                  {config.label}
                </span>
              </div>
              <span className="h-card-date">
                <Calendar size={12} />
                {formatDate(item.fecha)}
              </span>
            </div>

            <div className="h-card-loc">
              <MapPin size={13} />
              <span>{item.municipio || '—'}{item.departamento ? `, ${item.departamento}` : ''}</span>
            </div>

            <div className="h-card-result">
              {isPred ? (
                <div className="h-result-row">
                  <TrendingUp size={15} />
                  <span className="h-result-crop">{item.mejor_cultivo || item.cultivo || '—'}</span>
                  {item.score != null && (
                    <>
                      <div className="h-score-line" style={{ flex: 1, maxWidth: 100 }}>
                        <div className="h-score-fill" style={{ width: `${item.score}%`, background: SCORE_COLOR(item.score) }} />
                      </div>
                      <span className="h-score-val" style={{ color: SCORE_COLOR(item.score) }}>{item.score}%</span>
                    </>
                  )}
                </div>
              ) : isSoil ? (
                <div className="h-soil-row">
                  {item.ph_suelo && <span className="h-soil-chip"><Gauge size={11} />pH {item.ph_suelo}</span>}
                  {item.materia_organica && <span className="h-soil-chip"><Droplets size={11} />MO {item.materia_organica}%</span>}
                  {item.textura_suelo && <span className="h-soil-chip"><Layers size={11} />{item.textura_suelo}</span>}
                  {item.score != null && <span className="h-soil-chip score" style={{ color: SCORE_COLOR(item.score) }}>{item.score}%</span>}
                </div>
              ) : (
                <div className="h-result-row">
                  <Sprout size={15} />
                  <span className="h-result-crop">{item.cultivo || item.cultivo_top || '—'}</span>
                  {item.score != null && (
                    <>
                      <div className="h-score-line" style={{ flex: 1, maxWidth: 100 }}>
                        <div className="h-score-fill" style={{ width: `${item.score}%`, background: SCORE_COLOR(item.score) }} />
                      </div>
                      <span className="h-score-val" style={{ color: SCORE_COLOR(item.score) }}>{item.score}%</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-card-actions">
            <button className="h-act" onClick={(e) => { e.stopPropagation(); onView(item); }} title="Ver detalle">
              <Eye size={15} />
            </button>
            <button className="h-act danger" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Eliminar">
              <Trash2 size={15} />
            </button>
            <ChevronDown size={16} className={`h-chevron ${expanded ? 'open' : ''}`} />
          </div>
        </div>

        {expanded && (
          <div className="h-card-detail">
            <div className="h-detail-grid">
              {item.coordenadas && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Coordenadas</span>
                  <span className="h-dt-val">{Number(item.coordenadas.lat).toFixed(4)}, {Number(item.coordenadas.lng).toFixed(4)}</span>
                </div>
              )}
              {item.area_hectareas && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Area</span>
                  <span className="h-dt-val">{item.area_hectareas} ha</span>
                </div>
              )}
              {item.mes_siembra && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Mes siembra</span>
                  <span className="h-dt-val">{item.mes_siembra}</span>
                </div>
              )}
              {item.mejor_mes && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Mejor mes</span>
                  <span className="h-dt-val">{item.mejor_mes}</span>
                </div>
              )}
              {item.mejor_cultivo && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Cultivo recomendado</span>
                  <span className="h-dt-val">{item.mejor_cultivo}</span>
                </div>
              )}
              {item.fuente && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Fuente</span>
                  <span className="h-dt-val">{item.fuente}</span>
                </div>
              )}
              {item.ph_suelo && (
                <div className="h-detail-item">
                  <span className="h-dt-label">pH suelo</span>
                  <span className="h-dt-val">{item.ph_suelo}</span>
                </div>
              )}
              {item.materia_organica && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Materia organica</span>
                  <span className="h-dt-val">{item.materia_organica}%</span>
                </div>
              )}
              {item.textura_suelo && (
                <div className="h-detail-item">
                  <span className="h-dt-label">Textura</span>
                  <span className="h-dt-val">{item.textura_suelo}</span>
                </div>
              )}
            </div>

            {item.recomendaciones && item.recomendaciones.length > 0 && (
              <div className="h-detail-recs">
                <span className="h-recs-title">Cultivos recomendados</span>
                <div className="h-recs-list">
                  {item.recomendaciones.slice(0, 3).map((r, i) => (
                    <div key={i} className="h-rec-item">
                      <span className="h-rec-emoji">{r.emoji || '🌱'}</span>
                      <span className="h-rec-crop">{r.cultivo}</span>
                      <span className="h-rec-score" style={{ color: SCORE_COLOR(r.score) }}>{r.score}%</span>
                      <span className={`h-rec-risk risk-${r.riesgo}`}>{r.riesgo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.rankings && item.rankings.length > 0 && (
              <div className="h-detail-recs">
                <span className="h-recs-title">Ranking de cultivos</span>
                <div className="h-recs-list">
                  {item.rankings.slice(0, 3).map((r, i) => (
                    <div key={i} className="h-rec-item">
                      <span className="h-rec-pos">#{r.rank}</span>
                      <span className="h-rec-crop">{r.crop}</span>
                      <span className="h-rec-score" style={{ color: SCORE_COLOR(r.score) }}>{r.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

const Historial = () => {
  const authorized = useAuthGuard('investigador');
  const {
    search, setSearch,
    filterTipo, setFilterTipo,
    loading,
    filtered,
    stats,
    handleView, handleDelete, handleClearAll,
    clearSearch, navigate,
  } = useHistorial();

  if (!authorized) return null;

  const FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'analisis', label: 'Cultivos' },
    { key: 'suelo', label: 'Suelo' },
    { key: 'prediccion', label: 'IA' },
  ];

  return (
    <ResearcherLayout activeTab="historial">
      <div className="h-root">
        <header className="h-header">
          <div className="h-header-top">
            <button className="h-back-btn" onClick={() => navigate('/investigador/dashboard')}>
              <ArrowLeft size={13} />
              Volver
            </button>
          </div>
          <div className="h-header-main">
            <div className="h-title-wrap">
              <div className="h-title-icon">
                <History size={28} />
              </div>
              <div>
                <h1 className="h-title">Historial de Analisis</h1>
                <p className="h-subtitle">Registro completo de analisis de cultivos, suelo y predicciones IA</p>
              </div>
            </div>
            {stats.total > 0 && (
              <button className="h-btn-clear" onClick={handleClearAll}>
                <Trash2 size={14} />
                Limpiar
              </button>
            )}
          </div>
        </header>

        <div className="h-stats">
          <StatCard num={stats.total} label="Total" color="#2d6a4f" icon={History} />
          <StatCard num={stats.analisis} label="Cultivos" color="#2d6a4f" icon={Leaf} />
          <StatCard num={stats.suelo} label="Suelo" color="#75584d" icon={FlaskConical} />
          <StatCard num={stats.prediccion} label="IA" color="#386a20" icon={TrendingUp} />
        </div>

        <div className="h-toolbar">
          <div className="h-search-wrap">
            <Search size={15} className="h-search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, municipio o cultivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-search-input"
            />
            {search && (
              <button className="h-search-clear" onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="h-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`h-tab ${filterTipo === f.key ? 'active' : ''}`}
                onClick={() => setFilterTipo(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-list">
          {loading && filtered.length === 0 && (
            <div className="h-empty">
              <div className="h-loader" />
              <p>Cargando historial...</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="h-empty">
              <div className="h-empty-icon">
                <History size={48} />
              </div>
              <h3>{stats.total === 0 ? 'Sin registros aun' : 'Sin resultados'}</h3>
              <p>
                {stats.total === 0
                  ? 'Los analisis de cultivos, calidad de suelo y predicciones apareceran aqui.'
                  : 'Intenta con otros terminos de busqueda o filtros.'}
              </p>
              {stats.total === 0 && (
                <button className="h-empty-cta" onClick={() => navigate('/investigador/analisis')}>
                  <Leaf size={16} />
                  Ir a Analisis de Parcela
                </button>
              )}
            </div>
          )}

          {filtered.map((item) => (
            <HistorialCard
              key={item.id}
              item={item}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default Historial;
