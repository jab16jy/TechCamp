import { Thermometer, Cloud, Droplets, Leaf } from 'lucide-react';

const PRESETS = [
  {
    id: 'nino',
    label: 'El Niño',
    icon: Thermometer,
    desc: 'Sequía extrema: baja precipitación, altas temperaturas',
    color: '#ba1a1a',
    bg: 'rgba(186,26,26,0.06)',
    values: {
      precipDeltaPct: -30,
      tempDeltaC: 3,
      npkOverride: 140,
      riegoOverride: 90,
    },
  },
  {
    id: 'nina',
    label: 'La Niña',
    icon: Cloud,
    desc: 'Exceso hídrico: alta precipitación, humedad elevada',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.06)',
    values: {
      precipDeltaPct: 40,
      tempDeltaC: -1.5,
      npkOverride: 100,
      riegoOverride: 40,
    },
  },
  {
    id: 'normal',
    label: 'Normal',
    icon: Leaf,
    desc: 'Condiciones climáticas promedio de la región Caribe',
    color: '#0f5238',
    bg: 'rgba(15,82,56,0.06)',
    values: {
      precipDeltaPct: 0,
      tempDeltaC: 0,
      npkOverride: 120,
      riegoOverride: 75,
    },
  },
];

export default function ScenarioSelector({ onSelectPreset }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Droplets size={14} color="#6b7280" />
        <h3 className="text-xs font-bold text-[#1A1C1A]">Presets Climáticos</h3>
      </div>

      <div className="space-y-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset?.(preset.values)}
            className="w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200"
            style={{
              background: preset.bg,
              border: `1px solid rgba(0,0,0,0.05)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.06)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `rgba(255,255,255,0.5)` }}
            >
              <preset.icon size={15} color={preset.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A1C1A]">{preset.label}</p>
              <p className="text-[10px] text-[#6b7280] leading-snug line-clamp-2">{preset.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
