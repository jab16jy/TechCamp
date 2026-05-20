import React from "react";
import ResearcherLayout from "@shared/layout/ResearcherLayout/ResearcherLayout";
import ProductorLayout from "@shared/layout/ProductorLayout/ProductorLayout";
import MapSelector from "@features/analysis/components/MapSelector";
import AnalysisForm from "@features/analysis/components/AnalysisForm";
import MetricCardsGrid from "@features/analysis/components/MetricCardsGrid/MetricCardsGrid";
import ClimateDataCards from "@features/analysis/components/ClimateDataCards/ClimateDataCards";
import AlgorithmHealthCard from "@features/analysis/components/AlgorithmHealthCard/AlgorithmHealthCard";
import HistorialTab from "@features/analysis/components/HistorialTab/HistorialTab";
import DataSourcesCard from "@shared/ui/DataSourcesCard/DataSourcesCard";
import { useAnalisisCultivos } from "@features/analysis/hooks/useAnalisisCultivos";
import {
  Sparkles,
  Map,
  Lightbulb,
  SlidersHorizontal,
  FlaskConical,
  Info,
  History,
  MapPin,
  Zap,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Download,
  Share2,
  Loader2,
} from "lucide-react";
import "./AnalisisCultivos.css";

const AnalisisCultivos = () => {
  const {
    municipiosLista,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    selectedParcela,
    selectedParcelaRecord,
    selectedParcelaLabel,
    historialRegistros,
    isProductor,
    clima,
    formulario,
    cargandoAnalisis,
    handleFormChange,
    handleMapChange,
    handleGeoDetected,
    handleSubmit,
    handleParcelaChange,
    metricCardsData,
    navigate,
  } = useAnalisisCultivos();

  const Layout = isProductor ? ProductorLayout : ResearcherLayout;
  const layoutProps = isProductor
    ? {}
    : { activeTab, onTabChange: setActiveTab };

  return (
    <Layout {...layoutProps}>
      <div className="ac-container max-w-[1440px] mx-auto">
        {/* ── HEADER ── */}
        <header className="ac-header">
          <div className="ac-header-left">
            <div className="ac-nav-row">
              <button
                className="ac-back-btn"
                onClick={() =>
                  navigate(isProductor ? "/" : "/investigador/dashboard")
                }
              >
                <ArrowLeft size={14} />
                {isProductor ? "Inicio" : "Volver al Dashboard"}
              </button>
              <nav className="ac-breadcrumb">
                <span>Módulos</span>
                <ChevronRight size={12} />
                <span className="ac-crumb-active">Análisis de Parcela</span>
              </nav>
            </div>
            <div className="ac-title-row">
              <h1 className="ac-title">
                Análisis de Parcela{" "}
                <span className="ac-title-light">· Calidad del Suelo</span>
              </h1>
              <div className="ac-meta-badges">
                <span className="ac-badge-mode">MOTOR ACTIVO</span>
                <span className="ac-badge-ref">
                  <Calendar size={10} />
                  {new Date().toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="ac-badge-ref">
                  <MapPin size={10} />
                  Zona Caribe · Colombia
                </span>
              </div>
            </div>
          </div>
          <div className="ac-header-right">
            <div className="ac-algo-badge">
              <span className="ac-algo-score">
                94.2<small>%</small>
              </span>
              <div>
                <p className="ac-algo-label">Precisión Algorítmica</p>
                <p className="ac-algo-ver">v4.2.0 · Random Forest</p>
              </div>
            </div>
            <div className="ac-header-btns">
              <button className="ac-btn-ghost">
                <Download size={14} />
                Exportar
              </button>
              <button className="ac-btn-primary">
                <Share2 size={14} />
                Informe
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        {!isProductor && activeTab === "analisis" && (
          <div className="ac-tabs mb-4">
            <button
              className={`ac-tab ${mode === "simple" ? "ac-tab--active" : ""}`}
              onClick={() => setMode("simple")}
            >
              <SlidersHorizontal size={18} />
              Datos de la Parcela
            </button>
            <button
              className={`ac-tab ${mode === "advanced" ? "ac-tab--active" : ""}`}
              onClick={() => setMode("advanced")}
            >
              <FlaskConical size={18} />
              Calidad del Suelo
              <span className="ac-tab-badge">MODO AVANZADO</span>
            </button>
            <div className="ac-connection">
              <span className="ac-pulse" />
              <span className="ac-connection-text">
                Conectado a Red de Sensores
              </span>
            </div>
          </div>
        )}

        {/* SIMPLE MODE - Bento Grid Optimizado */}
        {activeTab === "analisis" && mode === "simple" && (
          <form
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative"
            onSubmit={handleSubmit}
          >
            {/* Columna Izquierda (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Vista de Mapa (Compacta) */}
              <div className="ac-map-card ac-glass p-6 h-[400px] flex flex-col relative overflow-hidden group">
                <div className="flex justify-between items-center mb-4 z-10 relative">
                  <div>
                    <h2 className="text-xl text-[#191c1d] font-bold">
                      Resumen de Parcela
                    </h2>
                    <p className="text-sm text-[#707973]">
                      Sector seleccionado
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="ac-map-tool-btn">
                      <Map size={20} />
                    </button>
                    <button type="button" className="ac-map-tool-btn">
                      <MapPin size={20} />
                    </button>
                  </div>
                </div>
                <div className="absolute inset-0 top-20 rounded-b-[2rem] overflow-hidden">
                  <MapSelector
                    position={{ lat: formulario.lat, lng: formulario.lng }}
                    onPositionChange={handleMapChange}
                    onGeoDetected={handleGeoDetected}
                    height={400}
                  />
                </div>
              </div>

              {/* Row de Métricas (Bento) */}
              <MetricCardsGrid metrics={metricCardsData} />
            </div>

            {/* Columna Derecha (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="ac-glass p-8 flex-1 flex flex-col">
                <div className="mb-6 border-b border-[#e1e3e4] pb-4">
                  <h2 className="text-xl text-[#191c1d] font-bold flex items-center gap-2">
                    <SlidersHorizontal className="text-[#2d6a4f]" size={24} />
                    Recolección de Datos
                  </h2>
                  <p className="text-sm text-[#707973] mt-2">
                    Ingrese los parámetros para el análisis.
                  </p>
                </div>

                <div className="flex flex-col gap-6 flex-1">
                  <AnalysisForm
                    data={formulario}
                    onChange={handleFormChange}
                    municipalities={municipiosLista}
                    mode={mode}
                  />

                  {/* Acciones */}
                  <div className="mt-auto pt-6 flex gap-4">
                    <button
                      type="button"
                      className="ac-btn-ghost flex-1 justify-center"
                    >
                      Borrador
                    </button>
                    <button
                      type="submit"
                      disabled={cargandoAnalisis}
                      className="ac-btn-execute flex-1"
                    >
                      {cargandoAnalisis ? (
                        <>
                          <Loader2 size={16} className="ac-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generar Reporte
                        </>
                      )}
                    </button>
                  </div>

                  {/* Estado Modelo */}
                  <div className="ac-model-status">
                    <div className="flex items-center gap-3">
                      <Zap className="text-[#2c694e]" size={20} />
                      <div>
                        <p className="text-sm text-[#191c1d] font-semibold">
                          Modelo Agro-IA
                        </p>
                        <p className="text-[10px] text-[#707973]">
                          Precisión actual: 94.2%
                        </p>
                      </div>
                    </div>
                    <span className="ac-status-pill">ACTIVO</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ADVANCED MODE */}
        {activeTab === "analisis" && mode === "advanced" && (
          <form className="ac-grid" onSubmit={handleSubmit}>
            <div className="ac-col--wide">
              <div className="ac-history-banner">
                <div className="ac-history-icon">
                  <History size={22} />
                </div>
                <div className="ac-history-text">
                  <h4>Usar datos de parcela existente</h4>
                  <p>
                    Recupere mediciones recientes de sus parcelas guardadas.
                  </p>
                </div>
                <div className="ac-history-select-wrap">
                  <select
                    className="ac-history-select"
                    value={selectedParcela}
                    onChange={handleParcelaChange}
                  >
                    <option value="">
                      Seleccione un registro del historial...
                    </option>
                    {historialRegistros.map((registro) => {
                      const fecha = registro.fecha
                        ? new Date(registro.fecha).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Sin fecha";
                      const tipo =
                        registro.tipo === "suelo" ||
                        registro.tipo === "advanced"
                          ? "Suelo"
                          : "Cultivo";
                      const coords = registro.coordenadas
                        ? ` · ${Number(registro.coordenadas.lat).toFixed(4)}, ${Number(registro.coordenadas.lng).toFixed(4)}`
                        : "";
                      return (
                        <option key={registro.id} value={registro.id}>
                          {registro.id} ·{" "}
                          {registro.municipio || "Sin municipio"} · {fecha} ·{" "}
                          {tipo}
                          {coords}
                        </option>
                      );
                    })}
                  </select>
                  <span className="ac-select-arrow">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Auto climate data cards — shown when parcela selected */}
              {selectedParcelaRecord && (
                <ClimateDataCards
                  clima={clima}
                  selectedParcela={selectedParcelaLabel}
                />
              )}

              <section className="ac-glass ac-glass--auto">
                <div
                  className="ac-card-header"
                  style={{ justifyContent: "space-between" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <FlaskConical size={22} className="ac-card-header__icon" />
                    <h3>Parametros del Suelo</h3>
                  </div>
                  <div className="ac-data-origin">
                    <Info size={12} />
                    <span>
                      Datos importados de:{" "}
                      {selectedParcelaRecord
                        ? selectedParcelaLabel
                        : "seleccione un registro histórico"}
                    </span>
                  </div>
                </div>

                <div className="ac-adv-form-grid">
                  <div className="ac-field-group">
                    <label>
                      pH del Suelo <span style={{ color: "#ba1a1a" }}>*</span>
                    </label>
                    <input
                      type="number"
                      name="ph_suelo"
                      className="ac-adv-input"
                      value={formulario.ph_suelo || ""}
                      onChange={(e) =>
                        handleFormChange({ ph_suelo: e.target.value })
                      }
                      placeholder="Ej: 6.5"
                      min="0"
                      max="14"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="ac-field-group">
                    <label>
                      Nitrogeno (N) <span style={{ color: "#ba1a1a" }}>*</span>
                    </label>
                    <input
                      type="number"
                      name="nitrogeno"
                      className="ac-adv-input"
                      placeholder="mg/kg"
                      value={formulario.nitrogeno || ""}
                      onChange={(e) =>
                        handleFormChange({ nitrogeno: e.target.value })
                      }
                      step="1"
                      min="0"
                      required
                    />
                  </div>
                  <div className="ac-field-group">
                    <label>
                      Humedad del Suelo{" "}
                      <span style={{ color: "#ba1a1a" }}>*</span>
                    </label>
                    <input
                      type="number"
                      name="humedad_suelo"
                      className="ac-adv-input"
                      placeholder="%"
                      value={formulario.humedad_suelo || clima.humedad || ""}
                      onChange={(e) =>
                        handleFormChange({ humedad_suelo: e.target.value })
                      }
                      step="1"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div className="ac-optional-row">
                  <div className="ac-field-group" style={{ opacity: 0.7 }}>
                    <label
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Fosforo (P) - Opcional
                    </label>
                    <input
                      type="number"
                      name="fosforo"
                      className="ac-optional-input"
                      placeholder="mg/kg"
                      value={formulario.fosforo || ""}
                      onChange={(e) =>
                        handleFormChange({ fosforo: e.target.value })
                      }
                      min="0"
                    />
                  </div>
                  <div className="ac-field-group" style={{ opacity: 0.7 }}>
                    <label
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Potasio (K) - Opcional
                    </label>
                    <input
                      type="number"
                      name="potasio"
                      className="ac-optional-input"
                      placeholder="mg/kg"
                      value={formulario.potasio || ""}
                      onChange={(e) =>
                        handleFormChange({ potasio: e.target.value })
                      }
                      min="0"
                    />
                  </div>
                </div>
              </section>

              {/* Primary CTA */}
              <div className="ac-submit-cta">
                <p className="ac-submit-cta-desc">
                  Los datos serán procesados por el motor de IA para generar un
                  plan de fertilización y riego personalizado.
                </p>
                <button
                  type="submit"
                  className="ac-btn-execute"
                  disabled={cargandoAnalisis}
                >
                  {cargandoAnalisis ? (
                    <>
                      <Loader2 size={16} className="ac-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Analizar Parcela con IA
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="ac-col--narrow">
              <div className="ac-sticky">
                <section className="ac-glass">
                  <div className="ac-card-header">
                    <MapPin size={20} className="ac-card-header__icon" />
                    <h3
                      style={{
                        fontSize: "14px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Ubicacion de Referencia
                    </h3>
                  </div>
                  <div className="ac-sat-preview">
                    <MapSelector
                      position={{ lat: formulario.lat, lng: formulario.lng }}
                      onPositionChange={handleMapChange}
                      onGeoDetected={handleGeoDetected}
                      height={260}
                    />
                    <div className="ac-sat-overlay">
                      <h4>
                        {selectedParcelaRecord
                          ? selectedParcelaLabel
                          : formulario.municipio || "Ubicación seleccionada"}
                      </h4>
                      <p>
                        {formulario.municipio || "Municipio pendiente"}
                        {formulario.departamento
                          ? `, ${formulario.departamento}`
                          : ""}{" "}
                        · {Number(formulario.lat).toFixed(4)} N,{" "}
                        {Number(formulario.lng).toFixed(4)} W
                      </p>
                    </div>
                  </div>
                  <div className="ac-insight">
                    <Lightbulb size={18} className="ac-insight__icon" />
                    <p>
                      <strong>Insight IA:</strong> Humedad de suelo favorable
                      detectada por sensores para el area seleccionada.
                    </p>
                  </div>
                </section>

                <AlgorithmHealthCard />

                <DataSourcesCard />
              </div>
            </div>
          </form>
        )}

        {/* Historial Tab */}
        {activeTab === "historial" && <HistorialTab />}
      </div>
    </Layout>
  );
};

export default AnalisisCultivos;
