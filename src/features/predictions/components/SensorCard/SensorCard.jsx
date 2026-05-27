import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const RIESGO_CONFIG = {
  critico:   { color: '#ba1a1a', bg: 'rgba(186,26,26,0.1)', border: 'rgba(186,26,26,0.25)', label: 'Crítico' },
  alto:      { color: '#b8860b', bg: 'rgba(184,134,11,0.1)',  border: 'rgba(184,134,11,0.2)',  label: 'Alto' },
  moderado:  { color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.15)',  label: 'Moderado' },
  ok:        { color: '#0f5238', bg: 'rgba(15,82,56,0.08)',   border: 'rgba(15,82,56,0.12)',   label: 'Normal' },
  sin_datos: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.1)', label: 'Sin datos' },
};

const PULSO_RIESGOS = ['critico', 'alto'];

export default function SensorCard({
  tipo,
  valor,
  unidad,
  umbral,
  riesgo = 'sin_datos',
  icono: IconoComponente,
  seleccionado = false,
  onClick,
}) {
  const cfg = RIESGO_CONFIG[riesgo] || RIESGO_CONFIG.sin_datos;
  const conPulso = PULSO_RIESGOS.includes(riesgo);
  const valorStr = valor != null ? `${valor}${unidad ? ' ' + unidad : ''}` : '—';
  const pctUmbral = umbral > 0 ? Math.min(100, Math.round(((valor ?? 0) / umbral) * 100)) : 0;

  // Bar color: green if ok, amber near threshold, red above
  let barColor = '#0f5238';
  if (riesgo === 'critico') barColor = '#ba1a1a';
  else if (riesgo === 'alto') barColor = '#b8860b';
  else if (riesgo === 'moderado') barColor = '#2563eb';

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full text-left rounded-2xl p-4 transition-all duration-300"
      style={{
        background: seleccionado
          ? 'rgba(15,82,56,0.06)'
          : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: seleccionado
          ? '2px solid #0f5238'
          : `1px solid ${cfg.border}`,
        animation: 'fade-in-up 0.3s ease',
      }}
    >
      {/* Pulse dot for critical / high */}
      {conPulso && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{
            background: cfg.color,
            animation: 'pulse-critical 1.5s infinite',
          }}
        />
      )}

      {/* Header: icon + label */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bg }}
        >
          {IconoComponente ? (
            <IconoComponente size={18} color={cfg.color} />
          ) : (
            <Info size={18} color={cfg.color} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[#1A1C1A] leading-tight line-clamp-1">
            {tipo}
          </p>
          <span
            className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Value display */}
      <p
        className="text-2xl font-extrabold tracking-tight mt-1"
        style={{ color: cfg.color, fontFamily: 'Manrope, sans-serif' }}
      >
        {valorStr}
      </p>

      {/* Threshold indicator bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-[#6b7280]">
            Umbral
          </span>
          <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
            {pctUmbral}%
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctUmbral}%`,
              background: barColor,
            }}
          />
        </div>
      </div>

      {/* Risk icon overlay for critical */}
      {riesgo === 'critico' && (
        <div className="flex items-center gap-1 mt-2">
          <AlertTriangle size={12} color="#ba1a1a" />
          <span className="text-[10px] font-semibold text-[#ba1a1a]">
            Atención requerida
          </span>
        </div>
      )}

      {riesgo === 'ok' && (
        <div className="flex items-center gap-1 mt-2">
          <CheckCircle2 size={12} color="#0f5238" />
          <span className="text-[10px] font-semibold text-[#0f5238]">
            Dentro de parámetros normales
          </span>
        </div>
      )}
    </button>
  );
}
