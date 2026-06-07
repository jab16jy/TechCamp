import React from "react";
import ResearcherLayout from "@shared/layout/ResearcherLayout/ResearcherLayout";
import ProductorLayout from "@shared/layout/ProductorLayout/ProductorLayout";
import MapSelector from "@features/analysis/components/MapSelector";
import AnalysisForm from "@features/analysis/components/AnalysisForm";
import MetricCardsGrid from "@features/analysis/components/MetricCardsGrid/MetricCardsGrid";
import HistorialTab from "@features/analysis/components/HistorialTab/HistorialTab";
import { useAnalisisCultivos } from "@features/analysis/hooks/useAnalisisCultivos";
import {
  Sparkles,
  SlidersHorizontal,
  ArrowLeft,
  Zap,
  Loader2,
} from "lucide-react";
import "./AnalisisCultivos.css";

const AnalisisCultivos = () => {
  const {
    municipiosLista,
    activeTab,
    setActiveTab,
    isProductor,
    formulario,
    cargandoAnalisis,
    drawnAreaData,
    handleFormChange,
    handleMapChange,
    handleGeoDetected,
    handleDrawnArea,
    handleSubmit,
    metricCardsData,
    modelMetrics,
    navigate,
    historialRegistros,
  } = useAnalisisCultivos();

  const Layout = isProductor ? ProductorLayout : ResearcherLayout;
  const layoutProps = isProductor
    ? {}
    : { activeTab, onTabChange: setActiveTab };

  return (
    <Layout {...layoutProps}>
      <div className="ac-page">
        {/* ── Top bar: back + title ── */}
        <div className="ac-top-bar">
          <button
            className="ac-back-btn"
            onClick={() => navigate(isProductor ? "/" : "/investigador/dashboard")}
          >
            <ArrowLeft size={14} />
          </button>
          <h1 className="ac-page-title">Análisis de Cultivo</h1>
          <span className="ac-title-light">· Datos de Parcela · Zona Caribe</span>
        </div>

        {/* ── ANÁLISIS DE CULTIVO ── */}
        {activeTab === "analisis" && (
          <form className="ac-content" onSubmit={handleSubmit}>
            {/* Left Panel: Data Collection (white) */}
            <aside className="ac-left-panel">
              <div className="ac-panel-header">
                <SlidersHorizontal size={18} />
                <h2>Recolección de Datos</h2>
              </div>

              <AnalysisForm
                data={formulario}
                onChange={handleFormChange}
                municipalities={municipiosLista}
                drawnArea={drawnAreaData}
              />

              {/* Action buttons */}
              <div className="ac-panel-actions">
                <button type="button" className="ac-btn-secondary flex-1">
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

              {/* Model Status */}
              <div className="ac-model-status">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-[#2D5A27]" />
                  <div>
                    <p className="ac-model-status-title">Modelo Agro-IA</p>
                    <p className="ac-model-status-desc">
                      Precisión:{' '}
                      {modelMetrics?.accuracy != null
                        ? `${(modelMetrics.accuracy * 100).toFixed(1)}%`
                        : modelMetrics?.cv_accuracy_mean != null
                          ? `${(modelMetrics.cv_accuracy_mean * 100).toFixed(1)}%`
                          : 'Cargando...'}
                    </p>
                  </div>
                </div>
                <span className={
                  `ac-status-pill ${
                    modelMetrics?.accuracy != null
                      ? modelMetrics.accuracy >= 0.8
                        ? 'ac-status-pill--optimo'
                        : 'ac-status-pill--mejorable'
                      : ''
                  }`
                }>
                  {modelMetrics?.accuracy != null
                    ? (modelMetrics.accuracy >= 0.8 ? 'OPTIMO' : 'MEJORABLE')
                    : 'ACTIVO'}
                </span>
              </div>
            </aside>

            {/* Right Panel: Map + bottom metrics */}
            <div className="ac-map-area">
              <div className="ac-map-container-inner">
                <MapSelector
                  position={{
                    lat: formulario.lat,
                    lng: formulario.lng,
                  }}
                  onPositionChange={handleMapChange}
                  onGeoDetected={handleGeoDetected}
                  onDrawnArea={handleDrawnArea}
                />
              </div>

              {/* Bottom metrics strip */}
              <div className="ac-map-metrics">
                <MetricCardsGrid metrics={metricCardsData} />
              </div>
            </div>
          </form>
        )}

        {/* Historial Tab */}
        {activeTab === "historial" && (
          <HistorialTab
            registros={historialRegistros}
            loading={cargandoAnalisis}
          />
        )}
      </div>
    </Layout>
  );
};

export default AnalisisCultivos;
