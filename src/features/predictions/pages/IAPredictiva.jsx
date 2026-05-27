import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Loader2, Sparkles, Settings2,
  Search, Droplets, Shield, Eye,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import usePlanRiegoActivo from '@features/predictions/hooks/usePlanRiegoActivo';
import BentoGrid from '@features/predictions/components/BentoGrid/BentoGrid';
import BentoCard from '@features/predictions/components/BentoGrid/BentoCard';
import QueryConfigModal from '@features/predictions/components/QueryConfigModal/QueryConfigModal';
import SensorMicroGrid from '@features/predictions/components/SensorMicroGrid/SensorMicroGrid';
import FenologiaTimeline from '@features/predictions/components/FenologiaTimeline/FenologiaTimeline';
import MonthlyProjectionTabs from '@features/predictions/components/MonthlyProjectionTabs/MonthlyProjectionTabs';
import MitigationSimulator from '@features/predictions/components/MitigationSimulator/MitigationSimulator';
import FeatureChart from '@features/predictions/components/FeatureChart/FeatureChart';
import ClimateRiskPanel from '@features/predictions/components/ClimateRiskPanel/ClimateRiskPanel';
import PlanVisualizationCard from '@features/predictions/components/PlanVisualizationCard/PlanVisualizationCard';
import StressReductionChart from '@features/predictions/components/StressReductionChart/StressReductionChart';
import ExportPlanButton from '@features/predictions/components/ExportPlanButton/ExportPlanButton';
import './IAPredictiva.css';

const IAPredictiva = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const {
    sensores, selectedSensorId, selectedSensor,
    loadingScan, riskStatus, sensorRiskMap, sensoresEnRiesgo,
    plan, generandoPlan, previewActive, umbrales, historialPlanes,
    selectedAnalysisId, fechaSiembra, etapaFenologica, proyeccion6M,
    loadingProyeccion, analisisConCoordenadas, inheritedRecord,
    selectedAnalysisData,
    npkSim, riegoSim, stale, setNpkSim, setRiegoSim,
    handleSelectSensor, handleGenerarPlan, togglePreview,
    handleExportarTareas, handleClearPlan,
    handleSelectAnalysis, handleManualQuery, handleSimularContramedida, handleClearProyeccion,
  } = usePlanRiegoActivo();

  const [queryModalOpen, setQueryModalOpen] = useState(false);

  if (!authorized) return null;

  const isCritico = riskStatus === 'critico' || riskStatus === 'alto';

  // Query config handler — connects the modal to the backend
  const handleQueryApply = ({ lat, lng, cultivo, fechaSiembra, source, analysisId }) => {
    if (source === 'analysis' && lat && lng) {
      // Analisis pre-seleccionado → disparar proyeccion con sus datos
      handleManualQuery({ lat, lng, cultivo, fechaSiembra, source, analysisId });
      setQueryModalOpen(false);
      return;
    }
    // Manual query desde los campos del formulario
    if (lat && lng) {
      handleManualQuery({ lat, lng, cultivo, fechaSiembra, source });
    }
    setQueryModalOpen(false);
  };

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        {/* ——— HEADER ——— */}
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
              Proyecciones climaticas (NASA POWER + OpenMeteo) con sensores IoT en tiempo real.
              Anticipa riesgos, recomienda cultivos y genera planes de mitigacion.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="ia-badge-mode">NASA POWER + OpenMeteo + IoT</span>
              {isCritico && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(186,26,26,0.1)', color: '#ba1a1a' }}>
                  <AlertTriangle size={11} />
                  Riesgo Critico
                </span>
              )}
              {selectedAnalysisId && inheritedRecord && (
                <span className="text-xs text-[#4a4a4a] flex items-center gap-1.5"
                  style={{ background: 'rgba(15,82,56,0.06)', padding: '0.15rem 0.6rem', borderRadius: 9999 }}>
                  <Eye size={10} style={{ color: '#0f5238' }} />
                  {inheritedRecord.cultivo || '—'} · {[inheritedRecord.municipio, inheritedRecord.departamento].filter(Boolean).join(', ') || 'Sin ubicacion'}
                  {fechaSiembra && ` · Siembra: ${fechaSiembra.toLocaleDateString('es-CO')}`}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ——— QUERY CONFIG MODAL ——— */}
        <QueryConfigModal
          isOpen={queryModalOpen}
          onClose={() => setQueryModalOpen(false)}
          onApply={handleQueryApply}
          analisis={analisisConCoordenadas}
          selectedAnalysisId={selectedAnalysisId}
          onSelectAnalysis={(id) => { handleSelectAnalysis(id); }}
          loading={loadingProyeccion}
          analysisData={selectedAnalysisData}
        />

        {/* ——— BENTO GRID ——— */}
        <BentoGrid>
          {/* ——— ROW 1: CRITICAL KPIs ——— */}
          <BentoCard
            span={{ col: 12, row: 1 }}
            variant={isCritico ? 'critical' : 'default'}
            title="Riesgos Activos y Sensores IoT"
            icon={Search}
            badge={sensoresEnRiesgo.length > 0 ? `${sensoresEnRiesgo.length} alerta${sensoresEnRiesgo.length > 1 ? 's' : ''}` : undefined}
          >
            <SensorMicroGrid
              sensores={sensores}
              selectedSensorId={selectedSensorId}
              onSelect={handleSelectSensor}
              riskStatus={riskStatus}
              sensorRiskMap={sensorRiskMap}
              sensoresEnRiesgo={sensoresEnRiesgo}
              loading={loadingScan}
            />

            {/* Critical action banner */}
            {isCritico && !plan && !generandoPlan && (
              <div className="ia-action-banner">
                <AlertTriangle size={18} style={{ color: '#ba1a1a' }} />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#1A1C1A]">Riesgo de Deficit Critico Detectado</h3>
                  <p className="text-xs text-[#6b7280]">
                    Humedad bajo umbral. Se recomienda generar un plan de riego.
                  </p>
                </div>
                <button className="ia-generate-btn" onClick={handleGenerarPlan}>
                  <Shield size={14} /> Generar Plan
                </button>
              </div>
            )}
          </BentoCard>

          {/* ——— ROW 2: FENOLOGIA + PROYECCION ——— */}
          {etapaFenologica && (
            <BentoCard
              span={{ col: 12, row: 1 }}
              variant="highlight"
              title="Estado Fenologico"
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

          {/* ——— ROW 3: PROYECCION TABS ——— */}
          {proyeccion6M && (
            <BentoCard
              span={{ col: 8, row: 1 }}
              variant="default"
              title="Proyeccion Estacional"
              icon={Droplets}
            >
              <MonthlyProjectionTabs
                proyeccion={proyeccion6M}
                mejorMes={proyeccion6M.mejor_mes}
                mejorCultivo={proyeccion6M.mejor_cultivo}
                loading={false}
              />
            </BentoCard>
          )}

          {/* ——— ROW 3: CLIMATE RISK (side) ——— */}
          {proyeccion6M && (
            <BentoCard
              span={{ col: 4, row: 1 }}
              variant="default"
            >
              <ClimateRiskPanel proyeccion={proyeccion6M} />
            </BentoCard>
          )}

          {/* Loading state */}
          {loadingProyeccion && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex items-center justify-center py-8 gap-3 text-[#4a4a4a]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Calculando proyeccion estacional...</span>
              </div>
            </BentoCard>
          )}

          {/* Empty state — prompt user to configure */}
          {!loadingProyeccion && !selectedAnalysisId && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(15,82,56,0.08)' }}>
                  <Settings2 size={28} style={{ color: '#0f5238', opacity: 0.6 }} />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-[#1A1C1A] mb-1">Configura tu Consulta</h3>
                  <p className="text-xs text-[#6b7280] max-w-md">
                    Define lote, cultivo y fecha de siembra para generar la proyeccion estacional
                    y el estado fenologico del cultivo.
                  </p>
                </div>
                <button
                  className="ia-generate-btn mt-2"
                  onClick={() => setQueryModalOpen(true)}
                >
                  <Settings2 size={15} /> Configurar Consulta
                </button>
              </div>
            </BentoCard>
          )}

          {/* ——— ROW 4: SIMULATOR + XAI side by side ——— */}
          {proyeccion6M && (
            <BentoCard span={{ col: 6, row: 1 }} variant="default">
              <MitigationSimulator
                npkSim={npkSim}
                riegoSim={riegoSim}
                stale={stale}
                loading={loadingProyeccion}
                onNpkChange={setNpkSim}
                onRiegoChange={setRiegoSim}
                onSimular={handleSimularContramedida}
              />
            </BentoCard>
          )}

          {proyeccion6M && (
            <BentoCard span={{ col: 6, row: 1 }} variant="default">
              <FeatureChart
                factors={
                  proyeccion6M.meses?.[0]?.cultivos_recomendados?.[0]?.factor_weights || []
                }
              />
            </BentoCard>
          )}

          {/* ——— ROW 5: PLAN (conditional) ——— */}
          {plan && (
            <BentoCard span={{ col: 12, row: 1 }} variant="highlight">
              <PlanVisualizationCard
                plan={plan}
                previewActive={previewActive}
                onTogglePreview={togglePreview}
                onExport={handleExportarTareas}
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

          {/* ——— EXPORT ——— */}
          {proyeccion6M && (
            <div className="flex justify-end mt-1" style={{ gridColumn: 'span 12' }}>
              <ExportPlanButton
                proyeccion={proyeccion6M}
                plan={plan}
                disabled={!proyeccion6M}
              />
            </div>
          )}

          {/* ——— GENERANDO PLAN LOADING ——— */}
          {generandoPlan && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex items-center justify-center py-8 gap-3 text-[#4a4a4a]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Generando plan de riego optimizado...</span>
              </div>
            </BentoCard>
          )}

          {/* ——— PLAN HISTORY ——— */}
          {historialPlanes.length > 0 && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default" title="Historial de Planes" icon={Shield}>
              <div className="space-y-2">
                {historialPlanes.map((p) => (
                  <div key={p.plan_id} className="flex items-center justify-between p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)' }}>
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

          {/* ——— MONITOREO NORMAL ——— */}
          {!isCritico && !loadingScan && !plan && !generandoPlan && selectedSensor && !proyeccion6M && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(15,82,56,0.08)' }}>
                  <Sparkles size={24} style={{ color: '#0f5238', opacity: 0.6 }} />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-[#1A1C1A] mb-1">Monitoreo Activo</h3>
                  <p className="text-xs text-[#6b7280]">Niveles de humedad dentro de rangos aceptables.</p>
                </div>
              </div>
            </BentoCard>
          )}
        </BentoGrid>

        {/* Clear plan link */}
        {plan && (
          <button onClick={handleClearPlan} className="text-xs text-[#6b7280] mt-2 hover:text-[#4a4a4a] transition-colors">
            Descartar plan actual
          </button>
        )}
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;