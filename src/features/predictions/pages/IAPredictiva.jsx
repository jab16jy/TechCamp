import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Loader2, Sparkles, Shield, History,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import usePlanRiegoActivo from '@features/predictions/hooks/usePlanRiegoActivo';
import RiskDetectionPanel from '@features/predictions/components/RiskDetectionPanel/RiskDetectionPanel';
import PlanVisualizationCard from '@features/predictions/components/PlanVisualizationCard/PlanVisualizationCard';
import StressReductionChart from '@features/predictions/components/StressReductionChart/StressReductionChart';
import AnalisisSelector from '@features/predictions/components/AnalisisSelector/AnalisisSelector';
import FenologiaTimeline from '@features/predictions/components/FenologiaTimeline/FenologiaTimeline';
import MonthlyProjectionGrid from '@features/predictions/components/MonthlyProjectionGrid/MonthlyProjectionGrid';
import MitigationSimulator from '@features/predictions/components/MitigationSimulator/MitigationSimulator';
import FeatureChart from '@features/predictions/components/FeatureChart/FeatureChart';
import ClimateRiskPanel from '@features/predictions/components/ClimateRiskPanel/ClimateRiskPanel';
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
    npkSim, riegoSim, stale, setNpkSim, setRiegoSim,
    handleSelectSensor, handleGenerarPlan, togglePreview,
    handleExportarTareas, handleClearPlan,
    handleSelectAnalysis, handleSimularContramedida, handleClearProyeccion,
  } = usePlanRiegoActivo();

  const [analysisDropdownOpen, setAnalysisDropdownOpen] = useState(false);

  if (!authorized) return null;

  const isCritico = riskStatus === 'critico' || riskStatus === 'alto';

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        {/* HEADER */}
        <header className="ia-header">
          <div className="ia-header-left">
            <button className="ia-back-btn" onClick={() => navigate('/investigador/dashboard')}>
              <ArrowLeft size={14} />
              Volver al Dashboard
            </button>
            <h1 className="ia-title">
              IA Predictiva
              <span className="ia-title-light"> — DSS Integral</span>
            </h1>
            <p className="ia-page-intent">
              Sistema de Soporte a Decisiones que integra proyecciones climaticas (NASA POWER + OpenMeteo)
              con sensores IoT en tiempo real para anticipar riesgos, recomendar cultivos y generar
              planes de mitigacion activos.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="ia-badge-mode">NASA POWER + OpenMeteo + IoT</span>
              {isCritico && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(186,26,26,0.1)', color: '#ba1a1a' }}>
                  <AlertTriangle size={11} />
                  Riesgo de Deficit Critico Detectado
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="ia-content">
          {/* ================================================================ */}
          {/* SECCION 1: DSS PROACTIVO — Sensores + Plan de Riego             */}
          {/* ================================================================ */}
          <RiskDetectionPanel
            sensores={sensores}
            selectedSensorId={selectedSensorId}
            onSelect={handleSelectSensor}
            riskStatus={riskStatus}
            sensorRiskMap={sensorRiskMap}
            sensoresEnRiesgo={sensoresEnRiesgo}
            loading={loadingScan}
          />

          {selectedSensor && (
            <div className="ia-status-grid">
              <div className="ia-status-card" style={{
                borderColor: riskStatus === 'critico' ? 'rgba(186,26,26,0.3)' : riskStatus === 'alto' ? 'rgba(184,134,11,0.3)' : 'rgba(15,82,56,0.2)',
              }}>
                <span className="ia-status-label">
                  {selectedSensor.nodo_id || selectedSensor.id?.slice(0, 8)}
                </span>
                <div className="ia-status-row">
                  <span className="ia-status-value">{selectedSensor.ultima_lectura?.humedad ?? '—'}%</span>
                  <span className="ia-status-unit">Humedad suelo</span>
                </div>
                <span className="ia-status-badge" style={{
                  color: riskStatus === 'critico' ? '#ba1a1a' : riskStatus === 'alto' ? '#b8860b' : '#0f5238',
                  background: riskStatus === 'critico' ? 'rgba(186,26,26,0.08)' : riskStatus === 'alto' ? 'rgba(184,134,11,0.08)' : 'rgba(15,82,56,0.08)',
                }}>
                  {riskStatus === 'critico' ? 'Critico' : riskStatus === 'alto' ? 'Alto' : riskStatus === 'moderado' ? 'Monitoreo' : 'Normal'}
                </span>
              </div>
            </div>
          )}

          {isCritico && !plan && !generandoPlan && (
            <div className="ia-action-banner">
              <AlertTriangle size={20} style={{ color: '#ba1a1a' }} />
              <div>
                <h3 className="text-sm font-bold text-[#1A1C1A]">Riesgo de Deficit Critico Detectado</h3>
                <p className="text-xs text-[#6b7280]">
                  La humedad del suelo esta por debajo del umbral y la proyeccion climatica indica baja
                  probabilidad de lluvia. Se recomienda generar un plan de riego.
                </p>
              </div>
              <button className="ia-generate-btn" onClick={handleGenerarPlan}>
                <Shield size={15} /> Generar Plan de Riego
              </button>
            </div>
          )}

          {generandoPlan && (
            <div className="flex items-center justify-center py-8 gap-3 text-[#4a4a4a]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Generando plan de riego optimizado...</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECCION 2: HISTORIAL + PROYECCION 6 MESES + FENOLOGIA           */}
          {/* ================================================================ */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#1A1C1A] flex items-center gap-2">
                <History size={16} />
                Proyeccion Estacional desde Historial
              </h2>
              {selectedAnalysisId && (
                <button
                  onClick={handleClearProyeccion}
                  className="text-xs text-[#6b7280] hover:text-[#ba1a1a] transition-colors"
                >
                  Desvincular analisis
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <AnalisisSelector
                analisis={analisisConCoordenadas}
                selectedId={selectedAnalysisId}
                onSelect={handleSelectAnalysis}
                onClear={handleClearProyeccion}
                isOpen={analysisDropdownOpen}
                onToggle={() => setAnalysisDropdownOpen((p) => !p)}
              />

              {selectedAnalysisId && inheritedRecord && (
                <div className="text-xs text-[#4a4a4a] flex items-center gap-3 ml-2">
                  <span>{inheritedRecord.cultivo || '—'}</span>
                  <span className="text-[#6b7280]">|</span>
                  <span>{[inheritedRecord.municipio, inheritedRecord.departamento].filter(Boolean).join(', ') || '—'}</span>
                  {fechaSiembra && (
                    <>
                      <span className="text-[#6b7280]">|</span>
                      <span>Siembra: {fechaSiembra.toLocaleDateString('es-CO')}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {loadingProyeccion && (
              <div className="flex items-center justify-center py-6 gap-3 text-[#4a4a4a]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Calculando proyeccion 6 meses...</span>
              </div>
            )}

            {!loadingProyeccion && !selectedAnalysisId && (
              <p className="text-xs text-[#6b7280] mt-3">
                Selecciona un analisis del historial para cargar la proyeccion estacional de 6 meses con datos de NASA POWER y OpenMeteo.
              </p>
            )}
          </div>

          {!loadingProyeccion && proyeccion6M && etapaFenologica && (
            <FenologiaTimeline
              etapaActual={etapaFenologica.etapa}
              diasDesdeSiembra={etapaFenologica.diasDesdeSiembra}
              cicloDias={etapaFenologica.cicloDias}
              pctCompletado={etapaFenologica.pct}
            />
          )}

          {!loadingProyeccion && proyeccion6M && (
            <MonthlyProjectionGrid
              proyeccion={proyeccion6M}
              mejorMes={proyeccion6M.mejor_mes}
              mejorCultivo={proyeccion6M.mejor_cultivo}
              loading={false}
            />
          )}

          {/* ================================================================ */}
          {/* SECCION 3: MITIGATION SIMULATOR                                   */}
          {/* ================================================================ */}
          {proyeccion6M && (
            <>
              <MitigationSimulator
                npkSim={npkSim}
                riegoSim={riegoSim}
                stale={stale}
                loading={loadingProyeccion}
                onNpkChange={setNpkSim}
                onRiegoChange={setRiegoSim}
                onSimular={handleSimularContramedida}
              />

              <FeatureChart
                factors={
                  proyeccion6M.meses?.[0]?.cultivos_recomendados?.[0]?.factor_weights
                  || []
                }
              />

              <ClimateRiskPanel proyeccion={proyeccion6M} />

              <div className="flex justify-end mt-2">
                <ExportPlanButton
                  proyeccion={proyeccion6M}
                  plan={plan}
                  disabled={!proyeccion6M}
                />
              </div>
            </>
          )}

          {/* ================================================================ */}
          {/* PLAN + STRESS CHART                                             */}
          {/* ================================================================ */}
          {plan && (
            <>
              <PlanVisualizationCard
                plan={plan}
                previewActive={previewActive}
                onTogglePreview={togglePreview}
                onExport={handleExportarTareas}
              />
              <StressReductionChart plan={plan} previewActive={previewActive} sensorLectura={selectedSensor?.ultima_lectura} />
              <button onClick={handleClearPlan} className="text-xs text-[#6b7280] mt-2 hover:text-[#4a4a4a] transition-colors">
                Descartar plan actual
              </button>
            </>
          )}

          {!isCritico && !loadingScan && !plan && !generandoPlan && selectedSensor && !proyeccion6M && (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Sparkles size={32} className="mx-auto mb-3" style={{ color: '#0f5238', opacity: 0.6 }} />
              <h3 className="text-sm font-bold text-[#1A1C1A] mb-1">Monitoreo Activo</h3>
              <p className="text-xs text-[#6b7280]">
                Los niveles de humedad del sensor seleccionado estan dentro de los rangos aceptables.
              </p>
            </div>
          )}

          {historialPlanes.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-[#1A1C1A] flex items-center gap-2 mb-3">
                <History size={16} /> Historial de Planes Generados
              </h2>
              <div className="space-y-2">
                {historialPlanes.map((p) => (
                  <div key={p.plan_id} className="flex items-center justify-between p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
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
            </section>
          )}
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
