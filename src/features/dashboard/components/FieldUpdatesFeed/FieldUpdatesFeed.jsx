import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const colorMap = {
  emerald: { bg: 'bg-[#0f5238]/10', border: 'border-[#0f5238]/20', text: 'text-[#0f5238]', dot: 'bg-[#0f5238]' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
});

const FieldUpdatesFeed = ({ updates, onViewAll }) => (
  <motion.div {...fadeUp(0.1)} className="h-full">
    <div className={`${glassPanel} p-0 overflow-hidden h-full flex flex-col`}>
      <div className="px-6 py-5 border-b border-white/40 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#0f5238] uppercase tracking-widest">Actualizaciones de Parcelas</p>
          <span className="w-2.5 h-2.5 rounded-full bg-[#0f5238] animate-pulse shadow-[0_0_8px_rgba(15,82,56,0.5)]" />
        </div>
        <p className="text-[11px] text-slate-600 mt-1 font-medium">Feed en tiempo real · Turbaco</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar-light divide-y divide-white/40">
        {updates.map((u) => {
          const c = colorMap[u.color];
          return (
            <div key={u.id} className="flex gap-4 px-6 py-4 hover:bg-white/60 transition-colors cursor-pointer group">
              <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${c.bg} ${c.text}`}>
                {u.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-[#0f5238] transition-colors">{u.lote}</p>
                  <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                    {u.status === 'ok' ? 'OK' : u.status === 'warn' ? 'AVISO' : 'ALERTA'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">{u.msg}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1.5">{u.time}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-4 border-t border-white/40 bg-white shrink-0">
        <button
          onClick={onViewAll}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#0f5238] text-xs font-bold transition-all shadow-sm border border-slate-100"
        >
          Ver todos los nodos <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </motion.div>
);

export default FieldUpdatesFeed;
