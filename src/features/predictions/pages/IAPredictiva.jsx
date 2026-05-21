import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  MapPin,
  TrendingUp,
  Thermometer,
  Droplets,
  CloudRain,
  Sprout,
  Sparkles,
  Target,
  Loader2,
  Compass,
  History,
  ChevronDown,
  X,
  FlaskConical,
  Leaf,
  Info,
} from "lucide-react";
import ResearcherLayout from "@shared/layout/ResearcherLayout/ResearcherLayout";
import useAuthGuard from "@shared/hooks/useAuthGuard";
import useIAPredictiva from "@features/predictions/hooks/useIAPredictiva";
import "./IAPredictiva.css";

const TIPO_CONFIG = {
  simple: {
    label: "Análisis Cultivo",
    icon: Leaf,
    color: "#2d6a4f",
    bg: "rgba(45,106,79,0.08)",
  },
  analisis: {
    label: "Análisis Cultivo",
    icon: Leaf,
    color: "#2d6a4f",
    bg: "rgba(45,106,79,0.08)",
  },
  advanced: {
    label: "Calidad Suelo",
    icon: FlaskConical,
    color: "#75584d",
    bg: "rgba(117,88,77,0.08)",
  },
  suelo: {
    label: "Calidad Suelo",
    icon: FlaskConical,
    color: "#75584d",
    bg: "rgba(117,88,77,0.08)",
  },
  prediccion: {
    label: "Predicción IA",
    icon: TrendingUp,
    color: "#386a20",
    bg: "rgba(56,106,32,0.08)",
  },
};

const SCORE_COLOR = (s) =>
  s >= 85 ? "#006d48" : s >= 65 ? "#ca8a04" : "#ba1a1a";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

const getCoords = (record) => {
  if (!record) return null;
  const lat = record.coordenadas?.lat ?? record.lat;
  const lng = record.coordenadas?.lng ?? record.lng;
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  return { lat: latNum, lng: lngNum };
};

const formatLocation = (record) =>
  [record?.municipio, record?.departamento].filter(Boolean).join(", ") ||
  "Ubicacion sin nombre";

const formatRecordTrigger = (record) => {
  if (!record) return "Seleccionar del historial";
  return `${record.id} - ${record.municipio || record.mejor_cultivo || "Parcela"}`;
};

const getRecordMetric = (record) => {
  if (!record) return null;
  if (record.tipo === "analisis" || record.tipo === "simple") {
    return {
      label: "Cultivo",
      value: record.cultivo || record.cultivo_top || "—",
    };
  }
  if (record.tipo === "suelo" || record.tipo === "advanced") {
    return {
      label: "Suelo",
      value:
        record.calidad_suelo ||
        (record.ph || record.ph_suelo ? `pH ${record.ph || record.ph_suelo}` : "—"),
    };
  }
  return {
    label: "Ventana",
    value: record.mejor_mes || record.mes_siembra || "—",
  };
};

const IAPredictiva = () => {
  const authorized = useAuthGuard("investigador");
  const navigate = useNavigate();
  const {
    loading,
    prediction,
    lat,
    setLat,
    lng,
    setLng,
    handleGenerate,
    historial,
    selectedHistoryId,
    handleSelectHistory,
    handleClearSelection,
    selectedRecord,
  } = useIAPredictiva();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        <header className="ia-header">
          <div className="ia-header-left">
            <div className="ia-nav-row">
              <button
                className="ia-back-btn"
                onClick={() => navigate("/investigador/dashboard")}
              >
                <ArrowLeft size={14} />
                Volver al Dashboard
              </button>
              <nav className="ia-breadcrumb">
                <span>Modulos</span>
                <ChevronRight size={12} />
                <span className="ia-crumb-active">IA Predictiva</span>
              </nav>
            </div>
            <div className="ia-title-row">
              <h1 className="ia-title">
                IA Predictiva{" "}
                <span className="ia-title-light">
                  - Proyeccion Climatica 6 Meses
                </span>
              </h1>
              <span className="ia-badge-mode">NASA POWER + OpenMeteo</span>
            </div>
            <p className="ia-page-intent">
              Planificacion estacional para decidir ventana de siembra, cultivo
              recomendado y riesgo climatico futuro. Analisis de Cultivo
              diagnostica el lote actual; esta vista proyecta los proximos 6
              meses.
            </p>
          </div>
        </header>

        <div className="ia-content">
          <div className="ia-input-card">
            <div className="ia-coord-controls">
              <div className="ia-coord-field">
                <label>Latitud</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="10.5"
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    handleClearSelection(true);
                  }}
                />
              </div>
              <div className="ia-coord-field">
                <label>Longitud</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="-74.8"
                  value={lng}
                  onChange={(e) => {
                    setLng(e.target.value);
                    handleClearSelection(true);
                  }}
                />
              </div>

              {/* Premium Glassmorphic History Selector Popover */}
              <div className="ia-dropdown-container" ref={dropdownRef}>
                <button
                  type="button"
                  className={`ia-use-last ${isOpen ? "active" : ""}`}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <History size={14} />
                  <span>{formatRecordTrigger(selectedRecord)}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>

                {isOpen && (
                  <div className="ia-history-popover">
                    <div className="ia-popover-header">
                      <span>Registros con ubicacion</span>
                      <button
                        type="button"
                        className="ia-popover-close"
                        onClick={() => setIsOpen(false)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="ia-popover-list">
                      {historial.length === 0 ? (
                        <div className="ia-popover-empty">
                          <History
                            size={24}
                            style={{ opacity: 0.4, marginBottom: "0.25rem" }}
                          />
                          <span>Sin registros con ubicacion reutilizable</span>
                        </div>
                      ) : (
                        historial.map((item) => {
                          const config =
                            TIPO_CONFIG[item.tipo] || TIPO_CONFIG.analisis;
                          const IconComponent = config.icon;
                          const isSelected = item.id === selectedHistoryId;
                          const coords = getCoords(item);
                          const metric = getRecordMetric(item);
                          return (
                            <div
                              key={item.id}
                              className={`ia-popover-item ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                handleSelectHistory(item.id);
                                setIsOpen(false);
                              }}
                            >
                              <div className="ia-popover-item-header">
                                <span className="ia-popover-item-id">
                                  {item.id}
                                </span>
                                <span
                                  className="ia-popover-item-badge"
                                  style={{
                                    background: config.bg,
                                    color: config.color,
                                  }}
                                >
                                  <IconComponent size={10} />
                                  {config.label}
                                </span>
                              </div>
                              <div className="ia-popover-item-date">
                                <Calendar size={10} />
                                {formatDate(item.fecha)}
                              </div>
                              <div className="ia-popover-item-details">
                                <MapPin size={10} />
                                <span>{formatLocation(item)}</span>
                              </div>
                              {coords && (
                                <div className="ia-popover-item-coords">
                                  <Compass size={10} />
                                  <span>
                                    {coords.lat.toFixed(4)},{" "}
                                    {coords.lng.toFixed(4)}
                                  </span>
                                </div>
                              )}
                              {metric && (
                                <div className="ia-popover-item-metric">
                                  <span>{metric.label}</span>
                                  <strong>{metric.value}</strong>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="ia-generate-btn"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {loading ? "Generando..." : "Generar Proyeccion"}
              </button>
            </div>

            {/* Elegant Active Record preview card! */}
            {selectedRecord && (
              <div className="ia-active-record-card">
                <div className="ia-active-record-header">
                  <div className="ia-active-record-title">
                    <History size={15} className="ia-active-record-icon" />
                    <span>
                      Parcela base:{" "}
                      <strong className="ia-active-record-id-text">
                        {selectedRecord.id}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ia-active-record-clear"
                    onClick={() => handleClearSelection()}
                    title="Desvincular registro"
                  >
                    <X size={13} />
                    Desvincular
                  </button>
                </div>

                <div className="ia-active-record-body">
                  <div className="ia-active-record-info">
                    <div className="ia-active-record-note">
                      <Info size={12} />
                      <span>
                        Este registro solo precarga coordenadas. Ejecuta
                        Generar Proyeccion para calcular el escenario.
                      </span>
                    </div>
                    <div className="ia-active-record-meta-item">
                      <MapPin size={12} />
                      <span>{formatLocation(selectedRecord)}</span>
                    </div>
                    <div className="ia-active-record-meta-item">
                      <Calendar size={12} />
                      <span>{formatDate(selectedRecord.fecha)}</span>
                    </div>
                    {getCoords(selectedRecord) && (
                      <div className="ia-active-record-meta-item">
                        <Compass size={12} />
                        <span>
                          Lat: {getCoords(selectedRecord).lat.toFixed(4)} |
                          Lng: {getCoords(selectedRecord).lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="ia-active-record-metrics">
                    {selectedRecord.tipo === "analisis" ||
                    selectedRecord.tipo === "simple" ? (
                      <>
                        <div className="ia-active-metric">
                          <span className="ia-metric-label">Cultivo</span>
                          <span className="ia-metric-value">
                            {selectedRecord.cultivo ||
                              selectedRecord.cultivo_top ||
                              "—"}
                          </span>
                        </div>
                        {selectedRecord.score != null && (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">Aptitud</span>
                            <span
                              className="ia-metric-value animate-pulse-slow"
                              style={{
                                color: SCORE_COLOR(selectedRecord.score),
                              }}
                            >
                              {selectedRecord.score}%
                            </span>
                          </div>
                        )}
                        {selectedRecord.area_hectareas && (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">Área</span>
                            <span className="ia-metric-value">
                              {selectedRecord.area_hectareas} ha
                            </span>
                          </div>
                        )}
                      </>
                    ) : selectedRecord.tipo === "suelo" ||
                      selectedRecord.tipo === "advanced" ? (
                      <>
                        {selectedRecord.ph != null ? (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">pH Suelo</span>
                            <span className="ia-metric-value">
                              {selectedRecord.ph ||
                                selectedRecord.ph_suelo ||
                                "—"}
                            </span>
                          </div>
                        ) : null}
                        {selectedRecord.materia_organica && (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">
                              Mat. Orgánica
                            </span>
                            <span className="ia-metric-value">
                              {selectedRecord.materia_organica}%
                            </span>
                          </div>
                        )}
                        {selectedRecord.calidad_suelo && (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">Calidad</span>
                            <span className="ia-metric-value">
                              {selectedRecord.calidad_suelo}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="ia-active-metric">
                          <span className="ia-metric-label">
                            Cultivo Proyectado
                          </span>
                          <span className="ia-metric-value">
                            {selectedRecord.mejor_cultivo ||
                              selectedRecord.cultivo ||
                              "—"}
                          </span>
                        </div>
                        {selectedRecord.mejor_mes && (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">Mejor Mes</span>
                            <span className="ia-metric-value">
                              {selectedRecord.mejor_mes}
                            </span>
                          </div>
                        )}
                        {selectedRecord.score != null && (
                          <div className="ia-active-metric">
                            <span className="ia-metric-label">Puntuacion</span>
                            <span
                              className="ia-metric-value"
                              style={{
                                color: SCORE_COLOR(selectedRecord.score),
                              }}
                            >
                              {selectedRecord.score}%
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {prediction && (
            <>
              <div className="ia-highlight-row">
                <div className="ia-highlight-card best">
                  <Target size={18} />
                  <div>
                    <span className="ia-hl-label">Mejor mes para sembrar</span>
                    <span className="ia-hl-value">
                      {prediction.mejor_mes || "—"}
                    </span>
                  </div>
                </div>
                <div className="ia-highlight-card crop">
                  <Sprout size={18} />
                  <div>
                    <span className="ia-hl-label">Cultivo mas apto</span>
                    <span className="ia-hl-value">
                      {prediction.mejor_cultivo || "—"}
                    </span>
                  </div>
                </div>
                <div className="ia-highlight-card source">
                  <MapPin size={18} />
                  <div>
                    <span className="ia-hl-label">Fuente de datos</span>
                    <span className="ia-hl-value fs-sm">
                      {prediction.fuente}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ia-timeline-section">
                <h3 className="ia-section-title">
                  <TrendingUp size={16} />
                  Proyeccion mensual
                </h3>
                <div className="ia-timeline">
                  {prediction.meses.map((mes, i) => (
                    <div
                      key={i}
                      className={`ia-month-card ${prediction.mejor_mes === mes.month ? "is-best" : ""}`}
                    >
                      <div className="ia-month-header">
                        <Calendar size={14} />
                        <strong>
                          {mes.month} {mes.year}
                        </strong>
                        {prediction.mejor_mes === mes.month && (
                          <span className="ia-best-badge">Optimo</span>
                        )}
                      </div>

                      <div className="ia-month-stats">
                        <div className="ia-stat">
                          <Thermometer size={13} />
                          <span>{mes.temperatura}°C</span>
                        </div>
                        <div className="ia-stat">
                          <CloudRain size={13} />
                          <span>{mes.precipitacion} mm</span>
                        </div>
                        <div className="ia-stat">
                          <Droplets size={13} />
                          <span>{mes.humedad}%</span>
                        </div>
                        <div className="ia-stat ndvi-stat">
                          <span
                            className="ia-ndvi-dot"
                            style={{
                              background: `hsl(${100 + mes.ndvi_estimado * 40}, 50%, ${30 + mes.ndvi_estimado * 20}%)`,
                            }}
                          />
                          <span>NDVI {mes.ndvi_estimado}</span>
                        </div>
                      </div>

                      {mes.cultivos_recomendados.length > 0 && (
                        <div className="ia-month-crops">
                          <span className="ia-crops-label">
                            Cultivos recomendados:
                          </span>
                          {mes.cultivos_recomendados.slice(0, 2).map((c, j) => (
                            <div key={j} className="ia-crop-row">
                              <span className="ia-crop-emoji">{c.emoji}</span>
                              <span className="ia-crop-name">{c.cultivo}</span>
                              <span
                                className={`ia-crop-score score-${c.riesgo}`}
                              >
                                {c.score}%
                              </span>
                              <span className={`ia-risk-tag risk-${c.riesgo}`}>
                                {c.riesgo}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!prediction && !loading && (
            <div className="ia-empty">
              <div className="ia-empty-icon">
                <Calendar size={48} />
              </div>
              <h2>Proyeccion climatica a 6 meses</h2>
              <p>
                Ingresa las coordenadas de tu parcela o selecciona un registro
                del historial para precargar su ubicacion. El sistema consultara
                NASA POWER y OpenMeteo para proyectar temperatura,
                precipitacion, humedad y NDVI estimado mes a mes, recomendando
                el cultivo mas apto para cada periodo.
              </p>
              <div className="ia-empty-steps">
                <div className="ia-step">
                  <span className="ia-step-num">1</span>
                  <span>Selecciona coordenadas</span>
                </div>
                <div className="ia-step">
                  <span className="ia-step-num">2</span>
                  <span>Genera la proyeccion</span>
                </div>
                <div className="ia-step">
                  <span className="ia-step-num">3</span>
                  <span>Revisa el mes optimo y cultivos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
