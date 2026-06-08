import {
  CheckCircle2, AlertCircle, AlertTriangle, BarChart3, Target, Crosshair, Activity, Leaf,
} from 'lucide-react';
import CropIcon from '../CropIcon/CropIcon';

const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const fmtPct = (val) => val != null ? `${(val * 100).toFixed(1)}%` : '—';
const fmtDec4 = (val) => val != null ? val.toFixed(4) : '—';

const SkeletonCard = () => (
  <div className="animate-pulse bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded bg-slate-200" />
      <div className="h-3 w-20 rounded bg-slate-200" />
    </div>
    <div className="h-7 w-16 rounded bg-slate-200" />
  </div>
);

const badgeConfig = {
  loading: {
    label: 'Cargando...',
    bg: 'bg-slate-200 text-slate-600',
    icon: null,
  },
  error: {
    label: 'Error de conexión',
    bg: 'bg-red-100 text-red-700',
    icon: <AlertCircle size={16} />,
  },
  loaded: {
    available: {
      labelReconstructed: 'Métricas reconstruidas',
      labelStable: 'Modelos Estables',
      bg: 'bg-[#2d6a4f]/10 text-[#2D5A27]',
      icon: <CheckCircle2 size={16} />,
    },
    empty: {
      label: 'Entrenamiento pendiente',
      bg: 'bg-amber-100 text-amber-800',
      icon: <AlertTriangle size={16} />,
    },
  },
};

const ModelMetricsTable = ({ metrics = [], modelMetrics = null, status = 'loaded' }) => {
  const hasMetrics = metrics.length > 0;

  const isAvailable = modelMetrics?.model_available !== false && hasMetrics;

  const badge =
    status === 'loading' ? badgeConfig.loading
    : status === 'error' ? badgeConfig.error
    : isAvailable
      ? {
          ...badgeConfig.loaded.available,
          label: modelMetrics?.metrics_reconstructed
            ? badgeConfig.loaded.available.labelReconstructed
            : badgeConfig.loaded.available.labelStable,
        }
      : badgeConfig.loaded.empty;

  const globalMetrics = [
    {
      label: 'Top-3 Accuracy',
      value: fmtPct(modelMetrics?.top3_accuracy),
      icon: <BarChart3 size={20} />,
      status: modelMetrics?.top3_accuracy >= 0.95 ? 'green' : modelMetrics?.top3_accuracy >= 0.85 ? 'amber' : 'neutral',
    },
    {
      label: 'Log Loss',
      value: fmtDec4(modelMetrics?.log_loss),
      icon: <Target size={20} />,
      status: modelMetrics?.log_loss == null ? 'neutral' : modelMetrics.log_loss < 0.5 ? 'green' : modelMetrics.log_loss < 1.0 ? 'amber' : 'red',
    },
    {
      label: 'Brier Score',
      value: fmtDec4(modelMetrics?.brier_score),
      icon: <Crosshair size={20} />,
      status: modelMetrics?.brier_score < 0.05 ? 'green' : modelMetrics?.brier_score < 0.1 ? 'amber' : 'red',
    },
    {
      label: 'ROC AUC',
      value: fmtPct(modelMetrics?.roc_auc_ovr),
      icon: <Activity size={20} />,
      status: modelMetrics?.roc_auc_ovr == null ? 'neutral' : modelMetrics.roc_auc_ovr >= 0.95 ? 'green' : modelMetrics.roc_auc_ovr >= 0.85 ? 'amber' : 'red',
    },
    {
      label: 'NDVI Source',
      value: modelMetrics?.ndvi_source === 'empirical' ? 'Empírico' : modelMetrics?.ndvi_source === 'synthetic_fallback' ? 'Sintético' : '—',
      icon: <Leaf size={20} />,
      status: modelMetrics?.ndvi_source === 'empirical' ? 'green' : modelMetrics?.ndvi_source === 'synthetic_fallback' ? 'amber' : 'neutral',
      isBadge: true,
    },
    {
      label: 'Accuracy Global',
      value: fmtPct(modelMetrics?.accuracy),
      icon: <CheckCircle2 size={20} />,
      status: modelMetrics?.accuracy >= 0.85 ? 'green' : modelMetrics?.accuracy >= 0.7 ? 'amber' : 'neutral',
    },
  ];

  const statusColors = {
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    neutral: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  const renderGrid = () => {
    if (status === 'loading') {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            Error al cargar métricas del modelo. Verifica que el backend esté disponible.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {globalMetrics.map((m, i) => (
          <div key={i} className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={m.status === 'green' ? 'text-emerald-600' : m.status === 'amber' ? 'text-amber-600' : m.status === 'red' ? 'text-red-500' : 'text-[#2D5A27]'}>
                {m.icon}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
            </div>
            {m.isBadge ? (
              <span className={`self-start px-3 py-1 rounded-full text-sm font-bold border ${statusColors[m.status]}`}>
                {m.value}
              </span>
            ) : (
              <span className={`text-2xl font-bold ${m.status === 'green' ? 'text-emerald-700' : m.status === 'amber' ? 'text-amber-700' : m.status === 'red' ? 'text-red-600' : 'text-[#2D5A27]'}`}>
                {m.value}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTableBody = () => {
    if (status === 'loading') {
      return (
        <tr>
          <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
            Cargando métricas por cultivo...
          </td>
        </tr>
      );
    }

    if (status === 'error') {
      return (
        <tr>
          <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
            No se pudieron cargar las métricas. Revisa la conexión con el backend.
          </td>
        </tr>
      );
    }

    if (!hasMetrics) {
      return (
        <tr>
          <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
            No hay métricas disponibles. El modelo necesita ser entrenado.
          </td>
        </tr>
      );
    }

    return metrics.map((item, idx) => (
      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
        <td className="py-4 flex items-center gap-3">
          <CropIcon type={item.icon} size={28} />
          <span className="font-bold text-slate-800">{item.cultivo}</span>
        </td>
        <td className="py-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#2D5A27]">
            <BarChart3 size={14} /> {item.accuracy}
          </span>
        </td>
        <td className="py-4 font-medium text-slate-700">{item.f1}</td>
        <td className="py-4 font-medium text-slate-600">{item.errorRate}</td>
        <td className="py-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            item.confianza.includes('Alta') ? 'bg-[#2D5A27]/10 text-[#2D5A27]' :
            item.confianza.includes('Media') ? 'bg-amber-100 text-amber-800' :
            'bg-slate-200 text-slate-700'
          }`}>
            {item.confianza}
          </span>
        </td>
      </tr>
    ));
  };

  return (
  <div className={`${glassPanel} p-6 overflow-hidden relative`}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-bold text-[#2D5A27] mb-1">Métricas de Modelo Predictivo</h3>
        <p className="text-sm text-slate-600">Rendimiento de los algoritmos por tipo de cultivo</p>
      </div>
      <div className={`${badge.bg} px-4 py-1.5 rounded-full flex items-center gap-2`}>
        {badge.icon}
        <span className="text-sm font-bold">{badge.label}</span>
      </div>
    </div>

    {renderGrid()}

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/60">
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cultivo</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Precisión (Accuracy)</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">F1-Score</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Error</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Confianza del Modelo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {renderTableBody()}
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default ModelMetricsTable;
