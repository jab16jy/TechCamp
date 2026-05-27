import { useMemo } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const CHART_W = 500;
const CHART_H = 220;
const PAD_L = 50;
const PAD_R = 50;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

export default function GrowthStressChart({ proyeccion }) {
  const meses = proyeccion?.meses || [];

  // ── Build data points ──
  const points = useMemo(() => {
    if (!meses.length) return null;

    return meses.map((m, i) => {
      // Derive growth from first crop score, or estimate from position
      const cropScore = m.cultivos_recomendados?.[0]?.score;
      const growth = cropScore != null
        ? cropScore
        : Math.max(20, 100 - i * 10);

      // Derive stress from temperature and precipitation anomalies relative to ideal
      const tempAnomaly = Math.abs((m.temperatura || 28) - 28);
      const precipAnomaly = Math.max(0, 80 - (m.precipitacion || 80));
      const stressTermico = Math.min(100, Math.round(tempAnomaly * 15));
      const stressHidrico = Math.min(100, Math.round(precipAnomaly * 1.2));

      return {
        month: m.month_num || i + 1,
        growth: Math.max(0, Math.min(100, growth)),
        stressTermico: Math.max(0, stressTermico),
        stressHidrico: Math.max(0, Math.min(100, stressHidrico)),
      };
    });
  }, [meses]);

  if (!points) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} color="#6b7280" />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Crecimiento vs Estrés</h2>
        </div>
        <p className="text-xs text-[#6b7280] italic">Sin datos de proyección disponibles.</p>
      </div>
    );
  }

  // ── Scales ──
  const xScale = (i) => PAD_L + (i / Math.max(1, points.length - 1)) * PLOT_W;
  const growthScale = (v) => PAD_T + PLOT_H - (v / 100) * PLOT_H;
  const stressScale = (v) => PAD_T + PLOT_H - (v / 100) * PLOT_H;

  // ── Build paths ──
  const growthPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${growthScale(p.growth).toFixed(1)}`).join(' ');
  const stressTermicoPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${stressScale(p.stressTermico).toFixed(1)}`).join(' ');
  const stressHidricoPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${stressScale(p.stressHidrico).toFixed(1)}`).join(' ');

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,82,56,0.08)' }}>
          <TrendingUp size={14} color="#0f5238" />
        </div>
        <h2 className="text-sm font-bold text-[#1A1C1A]">Crecimiento vs Estrés</h2>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          style={{ width: '100%', minWidth: 360, height: 'auto' }}
          className="font-sans"
        >
          {/* Grid lines */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD_L} y1={growthScale(t)} x2={CHART_W - PAD_R} y2={growthScale(t)}
                stroke="rgba(0,0,0,0.05)" strokeWidth="1"
              />
              <text
                x={PAD_L - 6} y={growthScale(t) + 4}
                textAnchor="end" fontSize="9" fill="#6b7280"
              >
                {t}
              </text>
            </g>
          ))}

          {/* Plot area border */}
          <rect
            x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H}
            fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" rx="4"
          />

          {/* Growth line (green) */}
          <path
            d={growthPath}
            fill="none" stroke="#0f5238" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />

          {/* Thermal stress line (red) */}
          <path
            d={stressTermicoPath}
            fill="none" stroke="#ba1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="5 3"
          />

          {/* Hydric stress line (amber) */}
          <path
            d={stressHidricoPath}
            fill="none" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="3 3"
          />

          {/* Data point dots */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Growth dot */}
              <circle cx={xScale(i)} cy={growthScale(p.growth)} r="3" fill="#0f5238" />
              {/* Thermal stress dot */}
              <circle cx={xScale(i)} cy={stressScale(p.stressTermico)} r="2.5" fill="#ba1a1a" />
              {/* Hydric stress dot */}
              <circle cx={xScale(i)} cy={stressScale(p.stressHidrico)} r="2.5" fill="#b8860b" />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={xScale(i)} y={CHART_H - PAD_B + 16}
              textAnchor="middle" fontSize="9" fill="#6b7280"
            >
              Mes {p.month}
            </text>
          ))}

          {/* Y-axis label (left) */}
          <text
            x={10} y={CHART_H / 2}
            textAnchor="middle" fontSize="8" fill="#0f5238"
            transform={`rotate(-90, 10, ${CHART_H / 2})`}
          >
            Crecimiento %
          </text>

          {/* Y-axis label (right) */}
          <text
            x={CHART_W - 10} y={CHART_H / 2}
            textAnchor="middle" fontSize="8" fill="#ba1a1a"
            transform={`rotate(90, ${CHART_W - 10}, ${CHART_H / 2})`}
          >
            Índice Estrés
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full" style={{ background: '#0f5238' }} />
          <span className="text-[10px] text-[#6b7280]">Crecimiento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full" style={{ background: '#ba1a1a', borderStyle: 'dashed' }} />
          <span className="text-[10px] text-[#6b7280]">Estrés Térmico</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full" style={{ background: '#b8860b', borderStyle: 'dashed' }} />
          <span className="text-[10px] text-[#6b7280]">Estrés Hídrico</span>
        </div>
      </div>

      {/* Stress summary */}
      {points.length > 0 && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(186,26,26,0.03)', border: '1px solid rgba(186,26,26,0.08)' }}>
          <AlertTriangle size={12} color="#b8860b" />
          <span className="text-[#6b7280]">
            Estrés compuesto promedio:{' '}
            <span className="font-semibold text-[#1A1C1A]">
              {Math.round(points.reduce((a, p) => a + (p.stressTermico + p.stressHidrico) / 2, 0) / points.length)}%
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
