// ============================================================
// DashboardInvestigador.jsx — Hub de Actualizaciones AgroCaribe IA
// Layout: Bento-Grid responsive de alta densidad informativa
// ============================================================
import { motion } from 'framer-motion';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useDashboard from '@features/dashboard/hooks/useDashboard';

// ── Componentes extraídos ──
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import AIMetricsGrid from '../components/AIMetricsGrid/AIMetricsGrid';
import ModelMetricsTable from '../components/ModelMetricsTable/ModelMetricsTable';
import WeatherWidget from '../components/WeatherWidget/WeatherWidget';
import FieldUpdatesFeed from '../components/FieldUpdatesFeed/FieldUpdatesFeed';
import WeeklySummary from '../components/WeeklySummary/WeeklySummary';
import ModuleShortcuts from '../components/ModuleShortcuts/ModuleShortcuts';

const DashboardInvestigador = () => {
  const authorized = useAuthGuard('investigador');
  const {
    timestamp,
    refreshTimestamp,
    moduleShortcuts,
    weeklyStats,
    FIELD_UPDATES,
    AI_METRICS,
    WEATHER,
    MODEL_METRICS,
    SPARK_DATA,
    modelMetrics,
    navigate,
  } = useDashboard();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="dashboard">
      <div className="relative min-h-full w-full font-sans" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="relative z-10 p-6 space-y-6">
          <DashboardHeader
            title="Centro de Inteligencia"
            subtitle={`Última sincronización: ${timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · Turbaco, Bolívar`}
            onRefresh={refreshTimestamp}
          />

          <AIMetricsGrid metrics={AI_METRICS} sparkData={SPARK_DATA} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }} className="lg:col-span-2 space-y-6">
              <ModelMetricsTable metrics={MODEL_METRICS} modelMetrics={modelMetrics} />
              <WeatherWidget weather={WEATHER} />
            </motion.div>
            <FieldUpdatesFeed updates={FIELD_UPDATES} onViewAll={moduleShortcuts.find(m => m.path === '/investigador/sensores')?.onClick} />
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklySummary stats={weeklyStats} onGenerateReport={() => navigate('/investigador/reportes')} />
            <ModuleShortcuts modules={moduleShortcuts} />
          </motion.div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default DashboardInvestigador;
