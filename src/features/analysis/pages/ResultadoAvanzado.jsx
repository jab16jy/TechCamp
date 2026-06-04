import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import AdvancedResultHeader from '@features/analysis/components/AdvancedResultHeader/AdvancedResultHeader';
import SoilParameters from '@features/analysis/components/SoilParameters/SoilParameters';
import RecommendationsList from '@features/analysis/components/RecommendationsList/RecommendationsList';
import SimulationEngine from '@features/analysis/components/SimulationEngine/SimulationEngine';
import RadarChart from '@features/analysis/components/RadarChart/RadarChart';
import HeatMap from '@features/analysis/components/HeatMap/HeatMap';
import useResultadoAvanzado from '@features/analysis/hooks/useResultadoAvanzado';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import { Radar, BrainCircuit } from 'lucide-react';
import './ResultadoAvanzado.css';

// ── Data ──
const RADAR_DATA = [
  { label: 'N', actual: 0.78, objetivo: 0.85 },
  { label: 'P', actual: 0.62, objetivo: 0.80 },
  { label: 'K', actual: 0.91, objetivo: 0.75 },
  { label: 'pH', actual: 0.72, objetivo: 0.82 },
  { label: 'C.E.', actual: 0.55, objetivo: 0.65 },
  { label: 'M.O.', actual: 0.84, objetivo: 0.78 },
];

const PARAMS = [
  { key: 'N', label: 'Nitrógeno (N)', valor: 58, unit: 'mg/kg', pct: 77, status: 'ALTO', statusColor: 'text-amber-600 bg-amber-50 border-amber-200', barColor: 'from-amber-400 to-amber-600', icon: 'water_drop' },
  { key: 'P', label: 'Fósforo (P)', valor: 21, unit: 'mg/kg', pct: 52, status: 'ESTABLE', statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', barColor: 'from-emerald-400 to-emerald-600', icon: 'flare' },
  { key: 'K', label: 'Potasio (K)', valor: 195, unit: 'mg/kg', pct: 88, status: 'ÓPTIMO', statusColor: 'text-blue-600 bg-blue-50 border-blue-200', barColor: 'from-blue-400 to-blue-600', icon: 'bolt' },
];

const GAUGES = [
  { label: 'pH', valor: '6.2', sub: 'Acidez leve', icon: 'experiment', pct: 57, color: '#f59e0b' },
  { label: 'C.Eléctrica', valor: '1.8', unit: 'dS/m', sub: 'Salinidad óptima', icon: 'flash_on', pct: 45, color: '#3b82f6' },
  { label: 'Mat. Orgánica', valor: '3.5', unit: '%', sub: 'Excelente', icon: 'compost', pct: 70, color: '#10b981' },
];

const RECS = [
  { badge: 'HIDRO-ANALÍTICA', badgeClass: 'rec-badge-blue', iconBox: 'rec-icon-blue', icon: 'water_drop', title: 'Protocolo de Riego Diferenciado', desc: 'Optimizar balance hídrico (VPD 1.2 kPa). Incrementar flujo en zonas con alta conductividad eléctrica (>1.5 dS/m) para lixiviación controlada.', extra: '+12% biomasa', extraLabel: 'Eficacia estimada' },
  { badge: 'ALERTA PATÓGENA', badgeClass: 'rec-badge-red', iconBox: 'rec-icon-red', icon: 'pest_control', title: 'Intervención de Bio-Control', desc: 'Detección de estresores abióticos vinculados a H. hampei. Aplicar suspensión biológica (2.5L/ha) en sector noreste según mapa térmico.', alert: 'ACCIÓN REQUERIDA ANTES DE 48H' },
  { badge: 'AJUSTE QUÍMICO', badgeClass: 'rec-badge-green', iconBox: 'rec-icon-green', icon: 'science', title: 'Balance Nutricional NPK', desc: 'Aplicar fórmula NPK 15-15-15 quelatada. Reducción de urea en 5% para compensar pico de mineralización orgánica.', cta: 'Configurar Dosificación' },
];

const ResultadoAvanzado = () => {
  const authorized = useAuthGuard('investigador');
  const {
    rain,
    fert,
    pulse,
    handleRainChange,
    handleFertChange,
  } = useResultadoAvanzado();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="analisis">
      <div className="ra-root">

        <AdvancedResultHeader
          title="Calidad del Suelo"
          subtitle="Hacienda El Sol, Lote Norte"
          algoScore="94.2"
          pulse={pulse}
          onExportCSV={() => {}}
          onExportPDF={() => {}}
        />

        <BentoGrid>

          <BentoCard span={{ col: 5, row: 1 }} title="Radar Nutricional" icon={Radar}>
            <div className="ra-radar-wrap">
              <RadarChart data={RADAR_DATA} />
            </div>
          </BentoCard>

          <BentoCard span={{ col: 7, row: 1 }}>
            <SoilParameters params={PARAMS} gauges={GAUGES} />
          </BentoCard>

          <BentoCard span={{ col: 7, row: 1 }}>
            <div className="ra-heatmap-overlay-header">
              <div>
                <span className="ra-glass-badge">CAPA TÉCNICA: ISOLÍNEAS N-TOTAL</span>
                <h2 className="ra-heatmap-title">Mapa de Calor de Nutrientes</h2>
                <p className="ra-heatmap-sub">Distribución espacial · Parcela Lote Norte · Turbaco</p>
              </div>
              <button className="ra-btn-glass">
                <span className="material-symbols-outlined text-sm">open_in_full</span> Interactivo
              </button>
            </div>
            <div className="ra-heatmap-body">
              <HeatMap />
            </div>
          </BentoCard>

          <BentoCard span={{ col: 5, row: 1 }} title="Recomendaciones Especializadas del Laboratorio" icon={BrainCircuit}>
            <RecommendationsList recommendations={RECS} />
          </BentoCard>

        </BentoGrid>

        <SimulationEngine
          rain={rain}
          fert={fert}
          onRainChange={handleRainChange}
          onFertChange={handleFertChange}
        />

      </div>
    </ResearcherLayout>
  );
};

export default ResultadoAvanzado;
