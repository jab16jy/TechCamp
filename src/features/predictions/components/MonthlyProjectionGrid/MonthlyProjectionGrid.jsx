import { Calendar, Thermometer, CloudRain, Droplets, TrendingUp, Target } from 'lucide-react';

function AnomalyBadge({ current, historical, unit = '' }) {
  if (!historical) return null;
  const diff = current - historical;
  if (Math.abs(diff) < 0.3) return null;
  const isUp = diff > 0;
  return (
    <span
      className="text-[10px] font-semibold ml-1"
      style={{ color: isUp ? '#ba1a1a' : '#2563eb' }}
    >
      {isUp ? '↑' : '↓'}{Math.abs(diff).toFixed(1)}{unit}
    </span>
  );
}

export default function MonthlyProjectionGrid({ proyeccion, mejorMes, mejorCultivo, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)' }}>
        <div className="animate-spin w-6 h-6 border-2 border-[#0f5238] border-t-transparent rounded-full mx-auto mb-2" />
        <span className="text-sm text-[#6b7280]">Cargando proyeccion estacional...</span>
      </div>
    );
  }

  if (!proyeccion?.meses?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#1A1C1A] flex items-center gap-2">
          <TrendingUp size={16} />
          Proyeccion 6 Meses
        </h2>
        <span className="text-xs text-[#6b7280]">
          {proyeccion.fuente}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {proyeccion.meses.map((mes, i) => {
          const isBest = mes.month === mejorMes;
          return (
            <div
              key={i}
              className="rounded-xl p-2.5 transition-all"
              style={{
                background: isBest ? 'rgba(15,82,56,0.06)' : 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                border: isBest ? '1.5px solid rgba(15,82,56,0.25)' : '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Calendar size={11} style={{ color: isBest ? '#0f5238' : '#6b7280' }} />
                  <span className="text-xs font-bold text-[#1A1C1A]">{mes.month}</span>
                </div>
                {isBest && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(15,82,56,0.1)', color: '#0f5238' }}>
                    Optimo
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-[#4a4a4a]">
                  <span className="flex items-center gap-1"><Thermometer size={10} /> Temp</span>
                  <span className="font-semibold">{mes.temperatura}°C</span>
                </div>
                <div className="flex items-center justify-between text-[#4a4a4a]">
                  <span className="flex items-center gap-1"><CloudRain size={10} /> Prec</span>
                  <span className="font-semibold">{mes.precipitacion} mm</span>
                </div>
                <div className="flex items-center justify-between text-[#4a4a4a]">
                  <span className="flex items-center gap-1"><Droplets size={10} /> Hum</span>
                  <span className="font-semibold">{mes.humedad}%</span>
                </div>
                <div className="flex items-center justify-between text-[#4a4a4a]">
                  <span className="flex items-center gap-1"><Target size={10} /> NDVI</span>
                  <span className="font-semibold">{mes.ndvi_estimado}</span>
                </div>
                {mes.etapa_fenologica && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Etapa</span>
                    <span className="text-[#0f5238] font-semibold capitalize">{mes.etapa_fenologica.replace('-', ' ')}</span>
                  </div>
                )}
              </div>

              {mes.cultivos_recomendados?.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-[rgba(0,0,0,0.05)]">
                  <span className="text-[9px] text-[#6b7280] block mb-0.5">Cultivos:</span>
                  {mes.cultivos_recomendados.slice(0, 2).map((c, j) => (
                    <div key={j} className="flex items-center justify-between text-[10px]">
                      <span>{c.emoji} {c.cultivo}</span>
                      <span className="font-semibold" style={{ color: c.riesgo === 'bajo' ? '#0f5238' : c.riesgo === 'medio' ? '#b8860b' : '#ba1a1a' }}>
                        {c.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
