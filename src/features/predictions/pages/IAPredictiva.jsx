import React, { useState, useMemo, useCallback, useEffect, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Sprout, Search, Sun, AlertTriangle, GitCompare, ShieldAlert, CalendarRange, ChevronDown } from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useAppStore from '@shared/store';
import usePrediccion from '@features/predictions/hooks/usePrediccion';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import ControlBar from '@features/predictions/components/ControlBar';
import PlantabilityPanel from '@features/predictions/components/PlantabilityPanel';
import ScenarioSimulator from '@features/predictions/components/ScenarioSimulator/ScenarioSimulator';
import GrowthStressChart from '@features/predictions/components/ScenarioSimulator/GrowthStressChart';
import MonthlyProjectionTabs from '@features/predictions/components/MonthlyProjectionTabs/MonthlyProjectionTabs';
import FeatureChart from '@features/predictions/components/FeatureChart/FeatureChart';
import ClimateRiskPanel from '@features/predictions/components/ClimateRiskPanel/ClimateRiskPanel';
import MLRiskPanel from '@features/predictions/components/MLRiskPanel/MLRiskPanel';
import SimulationSection from '@features/predictions/components/SimulationSection/SimulationSection';
import MitigationActions from '@features/predictions/components/MitigationActions/MitigationActions';
import './IAPredictiva.css';

// ── Error Boundary para la sección de resultados ──
class ResultsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(`[IAPredictiva] Crash en "${this.props.label}":`, error?.message || error, info?.componentStack);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error
        ? (this.state.error.message || String(this.state.error).slice(0, 120))
        : '';
      return (
        <BentoCard span={{ col: 12, row: 1 }} variant="default">
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(186,26,26,0.08)' }}>
              <AlertTriangle size={28} style={{ color: '#ba1a1a' }} />
            </div>
            <p className="text-sm text-[#6b7280]">Error en: <strong>{this.props.label || 'resultados'}</strong></p>
            <p className="text-xs text-[#9ca3af] max-w-sm break-all">{errMsg}</p>
          </div>
        </BentoCard>
      );
    }
    return this.props.children;
  }
}

// ── Department centroid coordinates [lon, lat] for Caribbean region ──
const DEPT_COORDS = {
  'Atlántico':   [-74.88, 10.94],
  'Bolívar':     [-74.85,  8.67],
  'Córdoba':     [-75.88,  8.33],
  'Magdalena':   [-74.18, 10.42],
  'Cesar':       [-73.65,  9.33],
  'La Guajira':  [-72.50, 11.33],
  'Sucre':       [-75.13,  9.30],
  'San Andrés':  [-81.70, 12.53],
};

const _nowDate = new Date();
const CURRENT_YEAR  = _nowDate.getFullYear();
const CURRENT_MONTH = _nowDate.getMonth() + 1;

const IAPredictiva = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const { historial } = useAppStore();

  // ── Hook: only usePrediccion remains ──
  const predHook = usePrediccion();

  // ── Destructure for convenience ──
  const {
    proyeccion6M, loadingProyeccion, estado,
    npkSim, riegoSim, stale: predStale,
    fechaSiembra,
    setNpkSim, setRiegoSim,
    fetchProyeccion, simularEscenario, selectAnalysis, clearProyeccion,
    compareData, loadingCompare, compararEscenarios, clearCompare,
  } = predHook;

  // ── Local state ──
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [queryCoords, setQueryCoords] = useState(null);
  const [precipDeltaPct, setPrecipDeltaPctState] = useState(0);
  const [tempDeltaC, setTempDeltaCState] = useState(0);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCultivo, setSelectedCultivo] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [riskData, setRiskData] = useState({ flood: null, drought: null });
  const [seasonalOpen, setSeasonalOpen] = useState(true);

  const handleRiskData = useCallback(({ flood, drought }) => {
    setRiskData({ flood, drought });
  }, []);

  // ── Derived: analysis list with coordinates ──
  const analisisConCoordenadas = useMemo(
    () => historial.filter((item) => {
      const lat = item.coordenadas?.lat ?? item.lat;
      const lng = item.coordenadas?.lng ?? item.lng;
      return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    }),
    [historial],
  );

  const inheritedRecord = useMemo(
    () => analisisConCoordenadas.find((item) => item.id === selectedAnalysisId) || null,
    [analisisConCoordenadas, selectedAnalysisId],
  );

  // ── Handlers ──
  const handleDeptChange = useCallback((dept) => {
    setSelectedDept(dept);
    if (!dept) setQueryCoords(null);
  }, []);

  const handleExecute = useCallback(() => {
    if (!selectedDept || !DEPT_COORDS[selectedDept]) return;
    const [lon, lat] = DEPT_COORDS[selectedDept];
    setQueryCoords({ lat, lng: lon });
    // Trigger the full seasonal projection — drives the isProjected dashboard
    fetchProyeccion({
      lat,
      lng: lon,
      cultivo: selectedCultivo || 'Maiz',
      meses: 6,
      fechaSiembraStr: selectedFecha || null,
    });
  }, [selectedDept, selectedCultivo, selectedFecha, fetchProyeccion]);

  const handleSelectAnalysis = useCallback((id) => {
    setSelectedAnalysisId(id);
    const localRecord = analisisConCoordenadas.find((a) => a.id === id) || null;
    selectAnalysis(id, localRecord).then((result) => {
      if (result && localRecord) {
        const lat = localRecord.coordenadas?.lat ?? localRecord.lat;
        const lng = localRecord.coordenadas?.lng ?? localRecord.lng;
        if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
          setQueryCoords({ lat: Number(lat), lng: Number(lng) });
        }
      }
    });
  }, [selectAnalysis, analisisConCoordenadas]);

  const handleSimularContramedida = useCallback(async () => {
    if (!queryCoords) return;
    await simularEscenario({
      precipDeltaPct,
      tempDeltaC,
      npkOverride: npkSim,
      riegoOverride: riegoSim,
      lat: queryCoords.lat,
      lng: queryCoords.lng,
    });
  }, [simularEscenario, precipDeltaPct, tempDeltaC, npkSim, riegoSim, queryCoords]);

  const handleClearAll = useCallback(() => {
    clearProyeccion();
    setSelectedAnalysisId(null);
    setQueryCoords(null);
    setPrecipDeltaPctState(0);
    setTempDeltaCState(0);
    setSelectedDept(null);
    setSelectedCultivo('');
    setSelectedFecha('');
  }, [clearProyeccion]);

  // ── Precip/temp setters that also trigger stale ──
  const handlePrecipChange = useCallback((v) => {
    setPrecipDeltaPctState(v);
    setNpkSim(npkSim); // trigger stale flag via usePrediccion
  }, [setNpkSim, npkSim]);

  const handleTempChange = useCallback((v) => {
    setTempDeltaCState(v);
    setRiegoSim(riegoSim); // trigger stale flag via usePrediccion
  }, [setRiegoSim, riegoSim]);

  // ── Derived: feature chart factors ──
  const featureFactors = useMemo(
    () => proyeccion6M?.meses?.[0]?.cultivos_recomendados?.[0]?.factor_weights || [],
    [proyeccion6M],
  );

  // ── Auth guard ──
  if (!authorized) return null;

  // Debug: log state transitions
  console.debug('[IAPredictiva] Render — estado:', estado, 'loadingProyeccion:', loadingProyeccion, 'proyeccion6M:', !!proyeccion6M);

  const isProjected = estado === 'PROJECTED' || estado === 'PLAN_READY';
  const isLoading = estado === 'LOADING' || estado === 'SIMULATING' || loadingProyeccion;

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        {/* ═══════════ HEADER ═══════════ */}
        <header className="ia-header">
          <div className="ia-header-left">
            <button className="ia-back-btn" onClick={() => navigate('/investigador/dashboard')}>
              <ArrowLeft size={14} />
              Dashboard
            </button>
            <div className="ia-header-row">
              <h1 className="ia-title">
                IA Predictiva
                <span className="ia-title-light"> — Modelo de Riesgo Climático</span>
              </h1>
            </div>
            <p className="ia-page-intent">
              Predicción de riesgo de inundación y sequía con un modelo ML para cultivos del
              Caribe colombiano. La planificación estacional y la simulación de escenarios se
              ofrecen como apoyo complementario.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="ia-badge-mode">RiskClassifier ML · NASA POWER + OpenMeteo</span>
              {selectedAnalysisId && inheritedRecord && (
                <span
                  className="text-xs text-[#4a4a4a] flex items-center gap-1.5"
                  style={{ background: 'rgba(15,82,56,0.06)', padding: '0.15rem 0.6rem', borderRadius: 9999 }}
                >
                  <Sun size={10} style={{ color: '#0f5238' }} />
                  {inheritedRecord.cultivo || '—'} · {[inheritedRecord.municipio, inheritedRecord.departamento].filter(Boolean).join(', ') || 'Sin ubicación'}
                  {fechaSiembra && ` · Siembra: ${fechaSiembra.toLocaleDateString('es-CO')}`}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════ CONTROL BAR ═══════════ */}
        <ControlBar
          selectedDept={selectedDept}
          onDeptChange={handleDeptChange}
          selectedCultivo={selectedCultivo}
          onCultivoChange={setSelectedCultivo}
          selectedFecha={selectedFecha}
          onFechaChange={setSelectedFecha}
          onClear={handleClearAll}
          onExecute={handleExecute}
          loading={isLoading}
        />

        {/* ═══════════ BENTO GRID ═══════════ */}
        <BentoGrid>
          {/* ── LOADING / SIMULATING — spinner (siempre primero para evitar blank) ── */}
          {isLoading && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex items-center justify-center py-8 gap-3 text-[#4a4a4a]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">
                  {estado === 'SIMULATING'
                    ? 'Recalculando proyección con escenario...'
                    : 'Calculando proyección estacional...'}
                </span>
              </div>
            </BentoCard>
          )}

          {/* ── STATE: IDLE — empty state (solo cuando no está cargando ni proyectado) ── */}
          {!isLoading && !isProjected && !queryCoords && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(26,141,90,0.12), rgba(15,82,56,0.06))' }}
                >
                  <Sprout size={30} style={{ color: '#0f5238' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1C1A] mb-1.5">Aún no hay análisis de riesgo</h3>
                  <p className="text-xs text-[#6b7280] max-w-md mx-auto leading-relaxed">
                    Selecciona un departamento del Caribe en el mapa, ajusta el cultivo y la fecha de
                    siembra, y presiona <strong style={{ color: '#0f5238' }}>Ejecutar</strong> para
                    obtener la <strong style={{ color: '#ba1a1a' }}>predicción de riesgo de inundación y
                    sequía</strong>. La planificación estacional aparece como sección complementaria.
                  </p>
                </div>
              </div>
            </BentoCard>
          )}

          {/* ═══════════ PRIMARY: Modelo Predictivo de Riesgos ═══════════ */}
          {queryCoords && (
            <>
              <div className="ia-section ia-section--primary">
                <div className="ia-section-text">
                  <span className="ia-section-eyebrow"><ShieldAlert size={13} /> Predicción de riesgo</span>
                  <h2 className="ia-section-title">Modelo Predictivo de Riesgos</h2>
                  <p className="ia-section-subtitle">
                    Probabilidad de inundación y sequía estimada por el modelo ML (RiskClassifier)
                    para la ubicación y fecha seleccionadas.
                  </p>
                </div>
              </div>

              <ResultsErrorBoundary label="MLRiskPanel">
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <MLRiskPanel
                    lat={queryCoords.lat}
                    lon={queryCoords.lng}
                    year={CURRENT_YEAR}
                    month={CURRENT_MONTH}
                    onRiskData={handleRiskData}
                  />
                </BentoCard>
              </ResultsErrorBoundary>

              <AnimatePresence>
                {(riskData.flood || riskData.drought) && (
                  <ResultsErrorBoundary label="PlantabilityPanel">
                    <PlantabilityPanel
                      flood={riskData.flood}
                      drought={riskData.drought}
                      cultivo={selectedCultivo || null}
                      fecha={selectedFecha || null}
                    />
                  </ResultsErrorBoundary>
                )}
              </AnimatePresence>
            </>
          )}

          {/* ═══════════ SECONDARY: Planificación Estacional (colapsable) ═══════════ */}
          {isProjected && !isLoading && (
            <>
              <div className="ia-section ia-section--secondary">
                <div className="ia-section-text">
                  <span className="ia-section-eyebrow"><CalendarRange size={13} /> Apoyo a la planificación</span>
                  <h2 className="ia-section-title">Planificación Estacional</h2>
                  <p className="ia-section-subtitle">
                    Proyección climática estacional, simulación de escenarios y mitigación.
                    Es apoyo a la planificación, no la predicción de riesgo principal.
                  </p>
                </div>
                <button
                  type="button"
                  className="ia-section-toggle"
                  aria-expanded={seasonalOpen}
                  onClick={() => setSeasonalOpen((o) => !o)}
                >
                  {seasonalOpen ? 'Ocultar' : 'Mostrar'}
                  <ChevronDown size={15} className="ia-section-chevron" />
                </button>
              </div>

              {seasonalOpen && (
                <>
              {/* ROW 1: MonthlyProjectionTabs + ClimateRiskPanel */}
              <ResultsErrorBoundary label="Proyección Estacional">
                <BentoCard span={{ col: 8, row: 1 }} variant="default" title="Proyección Estacional" icon={Search}>
                  <MonthlyProjectionTabs
                    proyeccion={proyeccion6M}
                    mejorMes={proyeccion6M.mejor_mes}
                    mejorCultivo={proyeccion6M.mejor_cultivo}
                    loading={false}
                  />
                </BentoCard>
              </ResultsErrorBoundary>

              <ResultsErrorBoundary label="ClimateRiskPanel">
                <BentoCard span={{ col: 4, row: 1 }} variant="default">
                  <ClimateRiskPanel proyeccion={proyeccion6M} />
                </BentoCard>
              </ResultsErrorBoundary>

              {/* ROW 2: SimulationSection */}
              {proyeccion6M && (
                <ResultsErrorBoundary label="Simulación de Fenómenos">
                  <BentoCard span={{ col: 12, row: 1 }} variant="default" title="Simulación de Fenómenos" icon={Search}>
                    <SimulationSection proyeccion={proyeccion6M} />
                  </BentoCard>
                </ResultsErrorBoundary>
              )}

              {/* ROW 3: ScenarioSimulator */}
              <ResultsErrorBoundary label="Simulador de Escenarios">
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <ScenarioSimulator
                    precipDeltaPct={precipDeltaPct}
                    tempDeltaC={tempDeltaC}
                    npkSim={npkSim}
                    riegoSim={riegoSim}
                    onPrecipChange={handlePrecipChange}
                    onTempChange={handleTempChange}
                    onNpkChange={setNpkSim}
                    onRiegoChange={setRiegoSim}
                    stale={predStale}
                    loading={loadingProyeccion}
                    onSimular={handleSimularContramedida}
                  />
                </BentoCard>
              </ResultsErrorBoundary>

              {/* ROW 4.5: Comparar Escenarios Niño vs Normal */}
              {queryCoords && (
                <ResultsErrorBoundary label="Comparar Escenarios">
                  <BentoCard span={{ col: 12, row: 1 }} variant="default" title="Comparar Escenarios Niño vs Normal" icon={GitCompare}>
                    <div className="flex flex-col gap-3">
                      {!compareData ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-[#6b7280]">
                            Compara la proyección actual con un escenario de El Niño (sequía extendida + altas temperaturas).
                          </p>
                          <button
                            className="ia-generate-btn"
                            onClick={() => compararEscenarios(queryCoords.lat, queryCoords.lng, 6)}
                            disabled={loadingCompare}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {loadingCompare ? (
                              <><Loader2 size={14} className="animate-spin" /> Cargando...</>
                            ) : (
                              <><GitCompare size={14} /> Comparar Escenarios</>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-[#6b7280]">
                              Comparación generada. Revisa las diferencias entre escenarios.
                            </p>
                            <div className="flex gap-2">
                              <button
                                className="ia-generate-btn"
                                onClick={() => compararEscenarios(queryCoords.lat, queryCoords.lng, 6)}
                                disabled={loadingCompare}
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                {loadingCompare ? (
                                  <><Loader2 size={14} className="animate-spin" /> Recargando...</>
                                ) : (
                                  <><GitCompare size={14} /> Recalcular</>
                                )}
                              </button>
                              <button
                                className="text-xs text-[#6b7280] hover:text-[#4a4a4a] transition-colors"
                                onClick={clearCompare}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Normal column */}
                            <div className="rounded-xl p-3" style={{ background: 'rgba(15,82,56,0.04)', border: '1px solid rgba(15,82,56,0.1)' }}>
                              <h4 className="text-xs font-bold text-[#0f5238] mb-2">🌤 Normal</h4>
                              <GrowthStressChart proyeccion={{ meses: compareData.normal?.meses || [] }} />
                            </div>
                            {/* Niño column */}
                            <div className="rounded-xl p-3" style={{ background: 'rgba(186,26,26,0.04)', border: '1px solid rgba(186,26,26,0.1)' }}>
                              <h4 className="text-xs font-bold text-[#ba1a1a] mb-2">🔥 El Niño</h4>
                              <GrowthStressChart proyeccion={{ meses: compareData.nino?.meses || [] }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </BentoCard>
                </ResultsErrorBoundary>
              )}

              {/* ROW 5: GrowthStressChart + FeatureChart */}
              <ResultsErrorBoundary label="Gráficas de Crecimiento">
                <BentoCard span={{ col: 6, row: 1 }} variant="default">
                  <GrowthStressChart proyeccion={proyeccion6M} />
                </BentoCard>
                <BentoCard span={{ col: 6, row: 1 }} variant="default">
                  <FeatureChart factors={featureFactors} />
                </BentoCard>
              </ResultsErrorBoundary>

              {/* ROW 5: MitigationActions */}
              <ResultsErrorBoundary label="Mitigación">
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <MitigationActions proyeccion={proyeccion6M} />
                </BentoCard>
              </ResultsErrorBoundary>
                </>
              )}
            </>
          )}
        </BentoGrid>

        {/* ── Clear projection ── */}
        {proyeccion6M && (
          <button
            onClick={handleClearAll}
            className="text-xs text-[#6b7280] mt-3 hover:text-[#4a4a4a] transition-colors"
          >
            Descartar proyección actual
          </button>
        )}
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
