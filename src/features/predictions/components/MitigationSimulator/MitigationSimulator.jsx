import { Loader2, Sparkles } from 'lucide-react';

export default function MitigationSimulator({
  npkSim, riegoSim, stale, loading,
  onNpkChange, onRiegoChange, onSimular,
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#1A1C1A]">Simulador de Mitigacion</h2>
        {stale && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(184,134,11,0.1)', color: '#b8860b' }}
          >
            Valores modificados
          </span>
        )}
      </div>

      <p className="text-xs text-[#6b7280] mb-3">
        Ajusta las variables de riego y fertilizacion para ver el impacto en las
        curvas de estres hidrico y proyeccion de crecimiento. Ambos sliders afectan
        el resultado de la simulacion en tiempo real al recalcular.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(37,99,235,0.06)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#1A1C1A]">Riego Suplementario</label>
            <span className="text-sm font-bold" style={{ color: '#2563eb' }}>{riegoSim}%</span>
          </div>
          <input
            type="range" min="0" max="100" value={riegoSim}
            onChange={(e) => onRiegoChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb', background: 'rgba(37,99,235,0.15)' }}
          />
          <div className="flex justify-between text-[10px] text-[#6b7280] mt-0.5">
            <span>0% (sin riego)</span>
            <span>100% (maximo)</span>
          </div>
        </div>

        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(15,82,56,0.06)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#1A1C1A]">Fertilizacion NPK</label>
            <span className="text-sm font-bold" style={{ color: '#0f5238' }}>{npkSim} kg/ha</span>
          </div>
          <input
            type="range" min="0" max="250" value={npkSim}
            onChange={(e) => onNpkChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#0f5238', background: 'rgba(15,82,56,0.15)' }}
          />
          <div className="flex justify-between text-[10px] text-[#6b7280] mt-0.5">
            <span>0 kg/ha</span>
            <span>250 kg/ha</span>
          </div>
        </div>
      </div>

      <button
        onClick={onSimular}
        disabled={!stale || loading}
        className="ia-generate-btn w-full justify-center"
        style={{ opacity: !stale ? 0.5 : 1 }}
      >
        {loading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
        {loading ? 'Recalculando proyeccion...' : 'Aplicar Contramedida y Recalcular'}
      </button>
    </div>
  );
}
