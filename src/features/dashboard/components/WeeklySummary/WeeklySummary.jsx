import { FileText } from 'lucide-react';

const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const WeeklySummary = ({ stats, onGenerateReport }) => (
  <div className={`${glassPanel} p-6`}>
    <div className="flex items-center justify-between mb-5">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Resumen Semanal</p>
      <span className="text-[10px] text-slate-600 font-bold bg-white/60 px-3 py-1 rounded-full shadow-sm border border-white/50">Semana 19</span>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="text-center p-4 rounded-2xl bg-white border border-white/40 shadow-sm">
          <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
          <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-wide leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
    <button
      onClick={onGenerateReport}
      className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] hover:shadow-lg hover:scale-[1.02] text-white text-sm font-bold transition-all"
    >
      <FileText size={16} /> Generar Reporte Semanal
    </button>
  </div>
);

export default WeeklySummary;
