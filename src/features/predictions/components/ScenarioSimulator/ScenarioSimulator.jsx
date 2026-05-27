import { Loader2, Sparkles, Droplets, Leaf, CloudRain, Thermometer } from 'lucide-react';

export default function ScenarioSimulator({
  precipDeltaPct = 0,
  tempDeltaC = 0,
  npkSim = 120,
  riegoSim = 75,
  onPrecipChange,
  onTempChange,
  onNpkChange,
  onRiegoChange,
  stale = false,
  loading = false,
  onSimular,
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(15,82,56,0.08)' }}
          >
            <Sparkles size={14} color="#0f5238" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1C1A]">Simulador de Escenarios</h2>
        </div>
        {stale && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(184,134,11,0.1)', color: '#b8860b' }}
          >
            Modificado
          </span>
        )}
      </div>

      <p className="text-xs text-[#6b7280] mb-4">
        Ajusta las variables agronómicas y climáticas para simular escenarios what-if.
        Cada ajuste recalcula la proyección de crecimiento y estrés del cultivo.
      </p>

      {/* Slider grid: 2×2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Riego */}
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={13} color="#2563eb" />
            <label className="text-[11px] font-semibold text-[#1A1C1A]">Riego Suplementario</label>
          </div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-extrabold" style={{ color: '#2563eb' }}>{riegoSim}%</span>
          </div>
          <input
            type="range" min="0" max="100" value={riegoSim}
            onChange={(e) => onRiegoChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb', background: 'rgba(37,99,235,0.15)' }}
          />
          <div className="flex justify-between text-[10px] text-[#6b7280] mt-0.5">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* NPK */}
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(15,82,56,0.05)', border: '1px solid rgba(15,82,56,0.1)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Leaf size={13} color="#0f5238" />
            <label className="text-[11px] font-semibold text-[#1A1C1A]">Fertilización NPK</label>
          </div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-extrabold" style={{ color: '#0f5238' }}>{npkSim} kg/ha</span>
          </div>
          <input
            type="range" min="0" max="250" value={npkSim}
            onChange={(e) => onNpkChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#0f5238', background: 'rgba(15,82,56,0.15)' }}
          />
          <div className="flex justify-between text-[10px] text-[#6b7280] mt-0.5">
            <span>0</span>
            <span>250</span>
          </div>
        </div>

        {/* Precipitación Δ */}
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CloudRain size={13} color="#06b6d4" />
            <label className="text-[11px] font-semibold text-[#1A1C1A]">Precipitación Δ</label>
          </div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-extrabold" style={{ color: '#06b6d4' }}>
              {precipDeltaPct > 0 ? '+' : ''}{precipDeltaPct}%
            </span>
          </div>
          <input
            type="range" min="-50" max="50" value={precipDeltaPct}
            onChange={(e) => onPrecipChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#06b6d4', background: 'rgba(6,182,212,0.15)' }}
          />
          <div className="flex justify-between text-[10px] text-[#6b7280] mt-0.5">
            <span>-50%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Temperatura Δ */}
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(186,26,26,0.04)', border: '1px solid rgba(186,26,26,0.1)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Thermometer size={13} color="#ba1a1a" />
            <label className="text-[11px] font-semibold text-[#1A1C1A]">Temperatura Δ</label>
          </div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-extrabold" style={{ color: '#ba1a1a' }}>
              {tempDeltaC > 0 ? '+' : ''}{tempDeltaC}°C
            </span>
          </div>
          <input
            type="range" min="-5" max="5" step="0.5" value={tempDeltaC}
            onChange={(e) => onTempChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#ba1a1a', background: 'rgba(186,26,26,0.15)' }}
          />
          <div className="flex justify-between text-[10px] text-[#6b7280] mt-0.5">
            <span>-5°C</span>
            <span>+5°C</span>
          </div>
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={onSimular}
        disabled={!stale || loading}
        className="ia-generate-btn w-full justify-center"
        style={{ opacity: (!stale || loading) ? 0.5 : 1 }}
      >
        {loading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
        {loading ? 'Recalculando proyección...' : 'Aplicar y Recalcular'}
      </button>
    </div>
  );
}
