import { RefreshCw } from 'lucide-react';

const DashboardHeader = ({ title, subtitle, onRefresh }) => (
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-3xl font-bold text-[#0f5238] tracking-tight">{title}</h2>
      <p className="text-sm text-slate-700 mt-1 font-medium">{subtitle}</p>
    </div>
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-white/40 text-[#0f5238] text-sm font-bold transition-all shadow-sm"
    >
      <RefreshCw size={16} /> Actualizar
    </button>
  </div>
);

export default DashboardHeader;
