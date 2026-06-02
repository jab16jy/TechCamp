import { Calendar, TrendingUp, AlertCircle, Sprout, CloudRain, Thermometer } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function OptimalWindowCard({ proyeccion }) {
  const bestWindow = proyeccion?.best_window;

  // ── No window found ──
  if (!bestWindow || (!bestWindow.ventana_inicio && !bestWindow.fecha_inicio && !bestWindow.start)) {
    const factoresLimitantes = proyeccion?.factores_limitantes || [];
    const nearestWindow = proyeccion?.nearest_window;

    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.25)',
          animation: 'fade-in-up 0.4s ease',
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(184,134,11,0.1)' }}
          >
            <AlertCircle size={18} color="#b8860b" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1A1C1A]">Ventana de Siembra</h2>
            <p className="text-xs text-[#b8860b] font-semibold mt-0.5">
              No se encontró ventana óptima en el período proyectado
            </p>
          </div>
        </div>

        <p className="text-xs text-[#6b7280] mb-3">
          Ninguna ventana de 7 días en los próximos 60 días cumple con los criterios
          agronómicos mínimos para una siembra segura.
        </p>

        {/* Nearest window suggestion */}
        {nearestWindow && (
          <div
            className="p-3 rounded-xl mb-3"
            style={{ background: 'rgba(184,134,11,0.04)', border: '1px solid rgba(184,134,11,0.12)' }}
          >
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase mb-1">Ventana más cercana</p>
            <p className="text-xs font-bold text-[#1A1C1A]">
              {formatDate(nearestWindow.ventana_inicio || nearestWindow.fecha_inicio || nearestWindow.start)} — {formatDate(nearestWindow.ventana_fin || nearestWindow.fecha_fin || nearestWindow.end)}
            </p>
            <p className="text-[10px] text-[#6b7280] mt-0.5">
              Confianza reducida: {nearestWindow.confianza || nearestWindow.confidence || '<50%'}
            </p>
          </div>
        )}

        {/* Limiting factors */}
        {factoresLimitantes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase mb-1.5">Factores limitantes</p>
            <div className="space-y-1">
              {factoresLimitantes.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'rgba(186,26,26,0.03)', border: '1px solid rgba(186,26,26,0.08)' }}
                >
                  {f.factor?.includes('temp') || f.tipo === 'temperatura' ? (
                    <Thermometer size={12} color="#ba1a1a" />
                  ) : f.factor?.includes('precip') || f.tipo === 'precipitacion' ? (
                    <CloudRain size={12} color="#2563eb" />
                  ) : f.factor?.includes('humedad') || f.tipo === 'humedad' ? (
                    <Sprout size={12} color="#b8860b" />
                  ) : (
                    <AlertCircle size={12} color="#6b7280" />
                  )}
                  <span className="text-[#4a4a4a]">{f.descripcion || f.mensaje || f.factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Window found ──
  const inicio = bestWindow.ventana_inicio || bestWindow.fecha_inicio || bestWindow.start;
  const fin = bestWindow.ventana_fin || bestWindow.fecha_fin || bestWindow.end;
  const confianza = bestWindow.confianza || bestWindow.confidence || 0;
  const justificacion = bestWindow.justificacion || bestWindow.rationale || '';
  const confianzaPct = Math.round(Number(confianza)) || 0;

  const confColor = confianzaPct >= 80 ? '#0f5238'
    : confianzaPct >= 60 ? '#2563eb'
    : confianzaPct >= 40 ? '#b8860b'
    : '#ba1a1a';

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.25)',
        animation: 'fade-in-up 0.4s ease',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(15,82,56,0.08)' }}
        >
          <Calendar size={18} color="#0f5238" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1A1C1A]">Ventana Óptima de Siembra</h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Período de 7 días con condiciones climáticas favorables para la siembra
          </p>
        </div>
      </div>

      {/* Date range */}
      <div
        className="flex items-center justify-between p-4 rounded-xl mb-4"
        style={{ background: 'rgba(15,82,56,0.04)', border: '1px solid rgba(15,82,56,0.1)' }}
      >
        <div className="text-center flex-1">
          <p className="text-[10px] text-[#6b7280] uppercase font-semibold">Inicio</p>
          <p className="text-sm font-extrabold text-[#1A1C1A] mt-0.5">
            {formatDate(inicio) || '—'}
          </p>
        </div>
        <div className="px-3">
          <div className="w-8 h-px" style={{ background: 'rgba(0,0,0,0.15)' }} />
        </div>
        <div className="text-center flex-1">
          <p className="text-[10px] text-[#6b7280] uppercase font-semibold">Fin</p>
          <p className="text-sm font-extrabold text-[#1A1C1A] mt-0.5">
            {formatDate(fin) || '—'}
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-3 mb-3">
        <TrendingUp size={14} color={confColor} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-semibold text-[#1A1C1A]">Nivel de Confianza</span>
            <span className="text-xs font-extrabold" style={{ color: confColor }}>
              {confianzaPct}%
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, confianzaPct)}%`,
                background: confColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Justification */}
      {justificacion && (
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: 'rgba(15,82,56,0.03)', border: '1px solid rgba(15,82,56,0.08)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Sprout size={12} color="#0f5238" />
            <span className="font-semibold text-[#0f5238]">Justificación Agronómica</span>
          </div>
          <p className="text-[#4a4a4a] leading-relaxed">{justificacion}</p>
        </div>
      )}
    </div>
  );
}
