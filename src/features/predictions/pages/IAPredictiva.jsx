import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Settings2, Search, Sun } from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useAppStore from '@shared/store';
import usePrediccion from '@features/predictions/hooks/usePrediccion';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import QueryConfigModal from '@features/predictions/components/QueryConfigModal/QueryConfigModal';
import ScenarioSimulator from '@features/predictions/components/ScenarioSimulator/ScenarioSimulator';
import GrowthStressChart from '@features/predictions/components/ScenarioSimulator/GrowthStressChart';
import MonthlyProjectionTabs from '@features/predictions/components/MonthlyProjectionTabs/MonthlyProjectionTabs';
import FeatureChart from '@features/predictions/components/FeatureChart/FeatureChart';
import ClimateRiskPanel from '@features/predictions/components/ClimateRiskPanel/ClimateRiskPanel';
import MitigationActions from '@features/predictions/components/MitigationActions/MitigationActions';
import './IAPredictiva.css';

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
    fechaSiembra, selectedAnalysisData,
    setNpkSim, setRiegoSim,
    simularEscenario, selectAnalysis, handleManualQuery, clearProyeccion,
  } = predHook;

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

  const handleClearAll = useCallback(() => {
    clearProyeccion();
    setSelectedAnalysisId(null);
    setQueryCoords(null);
    setPrecipDeltaPctState(0);
    setTempDeltaCState(0);
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
                <span className="ia-title-light"> — Riesgos y Mitigación</span>
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
              Proyecciones climáticas con simulación de escenarios, detección de riesgos
              y recomendaciones de mitigación para cultivos del Caribe colombiano.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="ia-badge-mode">NASA POWER + OpenMeteo + LSTM</span>
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
                    y el análisis de riesgos.
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
              {/* ROW 1: MonthlyProjectionTabs (col-8) + ClimateRiskPanel (col-4) */}
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

              {/* ROW 2: ScenarioSimulator (col-12) */}
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

              {/* ROW 3: GrowthStressChart (col-6) + FeatureChart (col-6) */}
              <BentoCard span={{ col: 6, row: 1 }} variant="default">
                <GrowthStressChart proyeccion={proyeccion6M} />
              </BentoCard>

              <BentoCard span={{ col: 6, row: 1 }} variant="default">
                <FeatureChart factors={featureFactors} />
              </BentoCard>

              {/* ROW 4: MitigationActions (col-12) */}
              <BentoCard span={{ col: 12, row: 1 }} variant="default">
                <MitigationActions proyeccion={proyeccion6M} />
              </BentoCard>
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
