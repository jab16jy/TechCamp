import { CheckCircle2, BarChart3 } from 'lucide-react';
import CropIcon from '../CropIcon/CropIcon';

const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const ModelMetricsTable = ({ metrics }) => (
  <div className={`${glassPanel} p-6 overflow-hidden relative`}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-bold text-[#2D5A27] mb-1">Métricas de Modelo Predictivo</h3>
        <p className="text-sm text-slate-600">Rendimiento de los algoritmos por tipo de cultivo</p>
      </div>
      <div className="bg-[#2d6a4f]/10 text-[#2D5A27] px-4 py-1.5 rounded-full flex items-center gap-2">
        <CheckCircle2 size={16} />
        <span className="text-sm font-bold">Modelos Estables</span>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/60">
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cultivo</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Precisión (Accuracy)</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">F1-Score</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Error Medio (MAE)</th>
            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Confianza del Modelo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {metrics.map((item, idx) => (
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
              <td className="py-4 font-medium text-slate-600">{item.mae}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ModelMetricsTable;
