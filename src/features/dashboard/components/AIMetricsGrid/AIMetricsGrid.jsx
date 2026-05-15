import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  emerald: { bg: 'bg-[#0f5238]/10', border: 'border-[#0f5238]/20', text: 'text-[#0f5238]', dot: 'bg-[#0f5238]' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
});

const MiniSparkline = ({ data, color = '#10b981' }) => {
  const w = 60, h = 22;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 0.001)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
};

const AIMetricsGrid = ({ metrics, sparkData }) => {
  const sparkColors = { emerald: '#0f5238', blue: '#3b82f6', purple: '#8b5cf6', amber: '#f59e0b' };
  const sparkSeries = [sparkData.acc, sparkData.lat, sparkData.proc, [1, 2, 1, 3, 2, 3]];

  return (
    <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m, i) => {
        const c = colorMap[m.color];
        return (
          <div key={i} className={`${glassPanel} p-5`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-full ${c.bg} ${c.text}`}>{m.icon}</div>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${m.up ? 'bg-[#0f5238]/10 text-[#0f5238]' : 'bg-red-100 text-red-700'}`}>
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {m.delta}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 leading-none">{m.value}</p>
            <p className="text-sm text-slate-600 mt-2 font-medium">{m.label}</p>
            <div className="mt-3 opacity-80">
              <MiniSparkline data={sparkSeries[i]} color={sparkColors[m.color]} />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default AIMetricsGrid;
