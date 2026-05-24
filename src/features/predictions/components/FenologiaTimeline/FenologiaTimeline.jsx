import { Sprout } from 'lucide-react';

const ETAPAS = [
  { key: 'germinacion', label: 'Germinacion', emoji: '🌱' },
  { key: 'desarrollo-vegetativo', label: 'Desarrollo', emoji: '🌿' },
  { key: 'floracion', label: 'Floracion', emoji: '🌼' },
  { key: 'llenado', label: 'Llenado', emoji: '🌽' },
  { key: 'maduracion', label: 'Maduracion', emoji: '🌾' },
];

export default function FenologiaTimeline({ etapaActual, diasDesdeSiembra, cicloDias, pctCompletado }) {
  const idxActual = ETAPAS.findIndex((e) => e.key === etapaActual);

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sprout size={16} style={{ color: '#0f5238' }} />
        <span className="text-sm font-bold text-[#1A1C1A]">Estado Fenologico</span>
        {diasDesdeSiembra != null && (
          <span className="text-xs text-[#6b7280] ml-auto">
            Dia {diasDesdeSiembra} de {cicloDias} · {pctCompletado}% completado
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full mb-3" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pctCompletado || 0}%`, background: 'linear-gradient(90deg, #2d6a4f, #0f5238)' }}
        />
      </div>

      {/* Stages */}
      <div className="flex items-center justify-between">
        {ETAPAS.map((e, i) => {
          const isPast = idxActual >= 0 && i < idxActual;
          const isCurrent = i === idxActual;
          const isFuture = idxActual >= 0 && i > idxActual;

          return (
            <div key={e.key} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              <span style={{ fontSize: '1.1rem', opacity: isFuture ? 0.3 : 1 }}>
                {e.emoji}
              </span>
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: isPast ? '#0f5238' : isCurrent ? '#0f5238' : 'rgba(0,0,0,0.15)',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(15,82,56,0.2)' : 'none',
                }}
              />
              <span
                className="text-[10px] font-semibold text-center"
                style={{ color: isCurrent ? '#0f5238' : isPast ? '#2d6a4f' : '#9ca3af' }}
              >
                {e.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
