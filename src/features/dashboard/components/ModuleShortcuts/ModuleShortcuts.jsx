const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const colorMap = {
  emerald: { bg: 'bg-[#0f5238]/10', border: 'border-[#0f5238]/20', text: 'text-[#0f5238]', dot: 'bg-[#0f5238]' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const ModuleShortcuts = ({ modules }) => (
  <div className={`${glassPanel} p-6`}>
    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-5">Módulos del Sistema</p>
    <div className="grid grid-cols-2 gap-4">
      {modules.map((mod) => {
        const c = colorMap[mod.color];
        return (
          <button
            key={mod.label}
            onClick={mod.onClick}
            className="flex items-start gap-3 p-4 rounded-2xl text-left border border-white/40 bg-white transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <span className={`shrink-0 mt-0.5 p-2 rounded-full ${c.bg} ${c.text}`}>{mod.icon}</span>
            <div>
              <p className="text-sm font-bold text-slate-800">{mod.label}</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{mod.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default ModuleShortcuts;
