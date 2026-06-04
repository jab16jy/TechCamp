import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Loader2, Sparkles, Settings2,
  Search, Shield, Thermometer, CloudRain, Sun,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useAppStore from '@shared/store';
import useSensores from '@features/predictions/hooks/useSensores';
import usePrediccion from '@features/predictions/hooks/usePrediccion';
import usePlanRiego from '@features/predictions/hooks/usePlanRiego';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import QueryConfigModal from '@features/predictions/components/QueryConfigModal/QueryConfigModal';
import SensorDashboard from '@features/predictions/components/SensorDashboard/SensorDashboard';
import NinoPanel from '@features/predictions/components/NinoPanel/NinoPanel';
import NinaPanel from '@features/predictions/components/NinaPanel/NinaPanel';
import ScenarioSimulator from '@features/predictions/components/ScenarioSimulator/ScenarioSimulator';
import ScenarioSelector from '@features/predictions/components/ScenarioSimulator/ScenarioSelector';
import GrowthStressChart from '@features/predictions/components/ScenarioSimulator/GrowthStressChart';
import OptimalWindowCard from '@features/predictions/components/OptimalWindowCard/OptimalWindowCard';
import FenologiaTimeline from '@features/predictions/components/FenologiaTimeline/FenologiaTimeline';
import MonthlyProjectionTabs from '@features/predictions/components/MonthlyProjectionTabs/MonthlyProjectionTabs';
import FeatureChart from '@features/predictions/components/FeatureChart/FeatureChart';
import ClimateRiskPanel from '@features/predictions/components/ClimateRiskPanel/ClimateRiskPanel';
import PlanVisualizationCard from '@features/predictions/components/PlanVisualizationCard/PlanVisualizationCard';
import StressReductionChart from '@features/predictions/components/StressReductionChart/StressReductionChart';
import ExportPlanButton from '@features/predictions/components/ExportPlanButton/ExportPlanButton';
import './IAPredictiva.css';

// ── Feature flag ──
const USE_NEW_HOOKS = import.meta.env.VITE_USE_NEW_PREDICTION_HOOKS === 'true';

const IAPredictiva = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const { historial } = useAppStore();

  // ── New specialized hooks ──
  const sensorHook = useSensores();
  const predHook = usePrediccion();
  const planHook = usePlanRiego();

  // ── Destructure for convenience ──
  const {
    proyeccion6M, loadingProyeccion, estado, npkSim, riegoSim, stale: predStale,
    fenologia, etapaFenologica, fechaSiembra, selectedAnalysisData,
    setNpkSim, setRiegoSim,
    fetchProyeccion, simularEscenario, selectAnalysis, handleManualQuery, clearProyeccion,
    marcarPlanListo,
  } = predHook;

  const {
    sensores, selectedSensorId, selectedSensor,
    sensoresEnRiesgo, riskStatus,
  } = sensorHook;

  const {
    plan, generandoPlan, previewActive, historialPlanes,
    generarPlan, togglePreview, exportarPlan, clearPlan,
  } = planHook;

  // ── Local state ──
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [queryCoords, setQueryCoords] = useState(null);
  const [precipDeltaPct, setPrecipDeltaPctState] = useState(0);
  const [tempDeltaC, setTempDeltaCState] = useState(0);

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

  // ── Climate pattern detection ──
  const showNino = proyeccion6M?.alertas_patrones?.some(
    (a) => a.tipo === 'fenomeno_nino',
  );
  const showNina = proyeccion6M?.alertas_patrones?.some(
    (a) => a.tipo === 'fenomeno_nina',
  );

  // ── Risk status for header ──
  const isCritico = riskStatus === 'critico' || riskStatus === 'alto';

  // ── Handlers ──
  const handleQueryApply = useCallback(({ lat, lng, cultivo, fechaSiembra, source }) => {
    if (source === 'analysis' && lat && lng) {
      setQueryCoords({ lat: Number(lat), lng: Number(lng) });
      setQueryModalOpen(false);
      return;
    }
    if (lat && lng) {
      setQueryCoords({ lat: Number(lat), lng: Number(lng) });
      handleManualQuery({ lat, lng, cultivo, fechaSiembra });
    }
    setQueryModalOpen(false);
  }, [handleManualQuery]);

  const handleSelectAnalysis = useCallback((id) => {
    setSelectedAnalysisId(id);
    selectAnalysis(id).then((result) => {
      if (result) {
        const analysis = analisisConCoordenadas.find((a) => a.id === id);
        if (analysis) {
          const lat = analysis.coordenadas?.lat ?? analysis.lat;
          const lng = analysis.coordenadas?.lng ?? analysis.lng;
          if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
            setQueryCoords({ lat: Number(lat), lng: Number(lng) });
          }
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

  const handleGenerarPlan = useCallback(async () => {
    const result = await generarPlan(selectedSensorId);
    if (result) marcarPlanListo();
  }, [generarPlan, selectedSensorId, marcarPlanListo]);

  const handleClearAll = useCallback(() => {
    clearProyeccion();
    clearPlan();
    setSelectedAnalysisId(null);
    setQueryCoords(null);
    setPrecipDeltaPctState(0);
    setTempDeltaCState(0);
  }, [clearProyeccion, clearPlan]);

  // ── Precip/temp setters that also trigger stale ──
  const handlePrecipChange = useCallback((v) => {
    setPrecipDeltaPctState(v);
    setNpkSim(npkSim); // trigger stale flag via usePrediccion
  }, [setNpkSim, npkSim]);

  const handleTempChange = useCallback((v) => {
    setTempDeltaCState(v);
    setRiegoSim(riegoSim); // trigger stale flag via usePrediccion
  }, [setRiegoSim, riegoSim]);

  const handleSelectPreset = useCallback((values) => {
    if (values.precipDeltaPct != null) setPrecipDeltaPctState(values.precipDeltaPct);
    if (values.tempDeltaC != null) setTempDeltaCState(values.tempDeltaC);
    if (values.npkOverride != null) setNpkSim(values.npkOverride);
    if (values.riegoOverride != null) setRiegoSim(values.riegoOverride);
  }, [setNpkSim, setRiegoSim]);

  // ── Derived: feature chart factors ──
  const featureFactors = useMemo(
    () => proyeccion6M?.meses?.[0]?.cultivos_recomendados?.[0]?.factor_weights || [],
    [proyeccion6M],
  );

  // ── Auth guard ──
  if (!authorized) return null;

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
                DSS Integral
                <span className="ia-title-light"> — IA Predictiva</span>
              </h1>
              <button
                className="ia-config-btn"
                onClick={() => setQueryModalOpen(true)}
                title="Configurar consulta"
              >
                <Settings2 size={16} />
              </button>
            </div>
            <p className="ia-page-intent">
              Proyecciones climáticas (NASA POWER + OpenMeteo + LSTM) con sensores IoT en tiempo real.
              Anticipa riesgos, recomienda cultivos y genera planes de mitigación.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="ia-badge-mode">NASA POWER + OpenMeteo + IoT + LSTM</span>
              {showNino && (
                <span
                  className="ia-badge-mode flex items-center gap-1"
                  style={{ background: 'rgba(186,26,26,0.08)', color: '#ba1a1a' }}
                >
                  <Thermometer size={11} />
                  Niño Activo
                </span>
              )}
              {showNina && (
                <span
                  className="ia-badge-mode flex items-center gap-1"
                  style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}
                >
                  <CloudRain size={11} />
                  Niña Activa
                </span>
              )}
              {isCritico && !showNino && !showNina && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(186,26,26,0.1)', color: '#ba1a1a' }}>
                  <AlertTriangle size={11} />
                  Riesgo Crítico
                </span>
              )}
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

        {/* ═══════════ QUERY CONFIG MODAL ═══════════ */}
        <QueryConfigModal
          isOpen={queryModalOpen}
          onClose={() => setQueryModalOpen(false)}
          onApply={handleQueryApply}
          analisis={analisisConCoordenadas}
          selectedAnalysisId={selectedAnalysisId}
          onSelectAnalysis={handleSelectAnalysis}
          loading={loadingProyeccion}
          analysisData={selectedAnalysisData}
        />

        {/* ═══════════ BENTO GRID ═══════════ */}
        <BentoGrid>
          {/* ── STATE: IDLE — empty state ── */}
          {estado === 'IDLE' && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(15,82,56,0.08)' }}>
                  <Settings2 size={28} style={{ color: '#0f5238', opacity: 0.6 }} />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-[#1A1C1A] mb-1">Configura tu Consulta</h3>
                  <p className="text-xs text-[#6b7280] max-w-md">
                    Define lote, cultivo y fecha de siembra para generar la proyección estacional
                    y el estado fenológico del cultivo.
                  </p>
                </div>
                <button className="ia-generate-btn mt-2" onClick={() => setQueryModalOpen(true)}>
                  <Settings2 size={15} /> Configurar Consulta
                </button>
              </div>
            </BentoCard>
          )}

          {/* ── STATE: LOADING / SIMULATING — spinner ── */}
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

          {/* ── STATE: PROJECTED / PLAN_READY — full dashboard ── */}
          {isProjected && (
            <>
              {/* ROW 1: SensorDashboard (col-span-8) + Niño/Niña panel (col-span-4) */}
              <BentoCard span={{ col: 8, row: 1 }} variant="default">
                <SensorDashboard />
              </BentoCard>

              {showNino && (
                <BentoCard span={{ col: 4, row: 1 }} variant="critical">
                  <NinoPanel proyeccion={proyeccion6M} />
                </BentoCard>
              )}

              {showNina && !showNino && (
                <BentoCard span={{ col: 4, row: 1 }} variant="highlight">
                  <NinaPanel proyeccion={proyeccion6M} />
                </BentoCard>
              )}

              {!showNino && !showNina && (
                /* Placeholder for alignment when no climate pattern */
                <BentoCard span={{ col: 4, row: 1 }} variant="default">
                  <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
                    <Sparkles size={20} style={{ color: '#386a20', opacity: 0.5 }} />
                    <p className="text-xs text-[#6b7280]">
                      Sin fenómenos climáticos extremos detectados
                    </p>
                  </div>
                </BentoCard>
              )}

              {/* ROW 2: MonthlyProjectionTabs + ClimateRiskPanel */}
              <BentoCard
                span={{ col: 8, row: 1 }}
                variant="default"
                title="Proyección Estacional"
                icon={Search}
              >
                <MonthlyProjectionTabs
                  proyeccion={proyeccion6M}
                  mejorMes={proyeccion6M.mejor_mes}
                  mejorCultivo={proyeccion6M.mejor_cultivo}
                  loading={false}
                />
              </BentoCard>

              <BentoCard span={{ col: 4, row: 1 }} variant="default">
                <ClimateRiskPanel proyeccion={proyeccion6M} />
              </BentoCard>

              {/* ROW 3: OptimalWindowCard (col-span-12) */}
              <BentoCard span={{ col: 12, row: 1 }} variant="highlight">
                <OptimalWindowCard proyeccion={proyeccion6M} />
              </BentoCard>

              {/* Critical action banner — trigger plan generation */}
              {isCritico && !plan && !generandoPlan && selectedSensorId && (
                <div className="ia-action-banner" style={{ gridColumn: 'span 12' }}>
                  <AlertTriangle size={18} style={{ color: '#ba1a1a' }} />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#1A1C1A]">
                      Riesgo de Déficit Crítico Detectado
                    </h3>
                    <p className="text-xs text-[#6b7280]">
                      Humedad bajo umbral. Se recomienda generar un plan de riego.
                    </p>
                  </div>
                  <button className="ia-generate-btn" onClick={handleGenerarPlan}>
                    <Shield size={14} /> Generar Plan
                  </button>
                </div>
              )}

              {/* ROW 4: ScenarioSimulator (col-span-8) + ScenarioSelector (col-span-4) */}
              <BentoCard span={{ col: 8, row: 1 }} variant="default">
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

              <BentoCard span={{ col: 4, row: 1 }} variant="default">
                <ScenarioSelector onSelectPreset={handleSelectPreset} />
              </BentoCard>

              {/* ROW 5: GrowthStressChart (col-span-6) + FeatureChart (col-span-6) */}
              <BentoCard span={{ col: 6, row: 1 }} variant="default">
                <GrowthStressChart proyeccion={proyeccion6M} />
              </BentoCard>

              <BentoCard span={{ col: 6, row: 1 }} variant="default">
                <FeatureChart factors={featureFactors} />
              </BentoCard>

              {/* ROW 6: FenologiaTimeline (col-span-12, conditional) */}
              {etapaFenologica && (
                <BentoCard
                  span={{ col: 12, row: 1 }}
                  variant="highlight"
                  title="Estado Fenológico"
                  icon={Sparkles}
                  badge={`${etapaFenologica.pct}% completado`}
                >
                  <FenologiaTimeline
                    etapaActual={etapaFenologica.etapa}
                    diasDesdeSiembra={etapaFenologica.diasDesdeSiembra}
                    cicloDias={etapaFenologica.cicloDias}
                    pctCompletado={etapaFenologica.pct}
                  />
                </BentoCard>
              )}

              {/* ═══════════ PLAN SECTION (conditional) ═══════════ */}
              {plan && (
                <BentoCard span={{ col: 12, row: 1 }} variant="highlight">
                  <PlanVisualizationCard
                    plan={plan}
                    previewActive={previewActive}
                    onTogglePreview={togglePreview}
                    onExport={exportarPlan}
                    planGenerado
                  />
                </BentoCard>
              )}

              {plan && (
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <StressReductionChart
                    plan={plan}
                    previewActive={previewActive}
                    sensorLectura={selectedSensor?.ultima_lectura}
                  />
                </BentoCard>
              )}

              {/* ═══════════ EXPORT ═══════════ */}
              <div className="flex justify-end mt-1" style={{ gridColumn: 'span 12' }}>
                <ExportPlanButton
                  proyeccion={proyeccion6M}
                  plan={plan}
                  disabled={!proyeccion6M}
                />
              </div>

              {/* ═══════════ GENERANDO PLAN LOADING ═══════════ */}
              {generandoPlan && (
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <div className="flex items-center justify-center py-8 gap-3 text-[#4a4a4a]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Generando plan de riego optimizado...</span>
                  </div>
                </BentoCard>
              )}

              {/* ═══════════ PLAN HISTORY ═══════════ */}
              {historialPlanes.length > 0 && (
                <BentoCard span={{ col: 12, row: 1 }} variant="default" title="Historial de Planes" icon={Shield}>
                  <div className="space-y-2">
                    {historialPlanes.map((p) => (
                      <div
                        key={p.plan_id}
                        className="flex items-center justify-between p-3 rounded-xl text-xs"
                        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        <div>
                          <span className="font-semibold text-[#1A1C1A]">{p.plan_id}</span>
                          <span className="ml-2 text-[#6b7280]">{p.cultivo} · {p.volumen_total_m3_ha} m³/ha</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(15,82,56,0.08)', color: '#0f5238' }}>
                          Generado
                        </span>
                      </div>
                    ))}
                  </div>
                </BentoCard>
              )}
            </>
          )}
        </BentoGrid>

        {/* ── Clear plan / projection ── */}
        {(plan || proyeccion6M) && (
          <button
            onClick={handleClearAll}
            className="text-xs text-[#6b7280] mt-3 hover:text-[#4a4a4a] transition-colors"
          >
            {plan ? 'Descartar plan y proyección actual' : 'Descartar proyección actual'}
          </button>
        )}
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
