import React, { useEffect, useState } from "react";
import ResearcherLayout from "@shared/layout/ResearcherLayout/ResearcherLayout";
import ProductorLayout from "@shared/layout/ProductorLayout/ProductorLayout";
import MapSelector from "@features/analysis/components/MapSelector";
import AnalysisForm from "@features/analysis/components/AnalysisForm";
import MetricCardsGrid from "@features/analysis/components/MetricCardsGrid/MetricCardsGrid";
import CalidadSueloModule from "@features/analysis/components/CalidadSueloModule";
import HistorialTab from "@features/analysis/components/HistorialTab/HistorialTab";
import { useAnalisisCultivos } from "@features/analysis/hooks/useAnalisisCultivos";
import {
  Sparkles,
  Map,
  SlidersHorizontal,
  FlaskConical,
  MapPin,
  Zap,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Download,
  Share2,
  Loader2,
  Sprout,
  Beaker,
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
    handleFormChange,
    handleMapChange,
    handleGeoDetected,
    handleSubmit,
    metricCardsData,
    navigate,
  } = useAnalisisCultivos();

  const rol = sessionStorage.getItem("rol");
  const [modulo, setModulo] = useState(
    rol === "productor" ? "cultivo" : null
  );

  useEffect(() => {
    if (rol === "productor") setModulo("cultivo");
  }, [rol]);

  const Layout = isProductor ? ProductorLayout : ResearcherLayout;
  const layoutProps = isProductor
    ? {}
    : { activeTab, onTabChange: setActiveTab };

  const getModuleTitle = () => {
    if (modulo === "cultivo") return { main: "Análisis de Cultivo", sub: "Datos de Parcela" };
    if (modulo === "suelo") return { main: "Análisis de Parcela", sub: "Calidad del Suelo" };
    return { main: "Análisis de Parcela", sub: "Selecciona un Módulo" };
  };

  const title = getModuleTitle();

  return (
    <Layout {...layoutProps}>
      <div className="ac-container max-w-[1440px] mx-auto">
        {/* ── HEADER ── */}
        <header className="ac-header">
          <div className="ac-header-left">
            <div className="ac-nav-row">
              <button
                className="ac-back-btn"
                onClick={() => {
                  if (modulo) {
                    setModulo(null);
                  } else {
                    navigate(isProductor ? "/" : "/investigador/dashboard");
                  }
                }}
              >
                <ArrowLeft size={14} />
                {modulo
                  ? "Volver al selector"
                  : isProductor
                    ? "Inicio"
                    : "Volver al Dashboard"}
              </button>
              <nav className="ac-breadcrumb">
                <span>Módulos</span>
                <ChevronRight size={12} />
                <span className="ac-crumb-active">{title.main}</span>
              </nav>
            </div>
            <div className="ac-title-row">
              <h1 className="ac-title">
                {title.main}{" "}
                <span className="ac-title-light">· {title.sub}</span>
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

        {/* ── HUB: Módulo Selector ── */}
        {!modulo && activeTab === "analisis" && !isProductor && (
          <div className="ac-hub-grid">
            <button
              className="ac-hub-card"
              onClick={() => setModulo("cultivo")}
            >
              <div className="ac-hub-card-icon ac-hub-card-icon--cultivo">
                <Sprout size={36} />
              </div>
              <h2 className="ac-hub-card-title">Análisis de Cultivo</h2>
              <p className="ac-hub-card-desc">
                Evalúa el rendimiento de tus cultivos con datos satelitales,
                parámetros climáticos y análisis de suelo. Obtén recomendaciones
                personalizadas para maximizar la productividad de tu parcela.
              </p>
              <span className="ac-hub-card-cta">
                <SlidersHorizontal size={16} />
                Comenzar Análisis
              </span>
            </button>

            <button
              className="ac-hub-card"
              onClick={() => setModulo("suelo")}
            >
              <div className="ac-hub-card-icon ac-hub-card-icon--suelo">
                <Beaker size={36} />
              </div>
              <h2 className="ac-hub-card-title">Calidad del Suelo</h2>
              <p className="ac-hub-card-desc">
                Analiza los parámetros fisicoquímicos del suelo: pH, nitrógeno,
                fósforo, potasio y humedad. Carga datos históricos o ingresa
                mediciones directas de laboratorio para un diagnóstico preciso.
              </p>
              <span className="ac-hub-card-cta">
                <FlaskConical size={16} />
                Comenzar Diagnóstico
              </span>
            </button>
          </div>
        )}

        {/* ── MÓDULO: Análisis de Cultivo ── */}
        {activeTab === "analisis" && modulo === "cultivo" && (
          <form
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative"
            onSubmit={handleSubmit}
          >
            {/* Columna Izquierda (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
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
                    mode="simple"
                  />

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

        {/* ── MÓDULO: Calidad del Suelo ── */}
        {activeTab === "analisis" && modulo === "suelo" && (
          <CalidadSueloModule onBack={() => setModulo(null)} />
        )}

        {/* Historial Tab */}
        {activeTab === "historial" && <HistorialTab />}
      </div>
    </Layout>
  );
};

export default AnalisisCultivos;
