import { useState } from 'react';
import { Calendar, Thermometer, CloudRain, Droplets, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

function AnomalyBadge({ current, historical, unit = '' }) {
  if (!historical) return null;
  const diff = current - historical;
  if (Math.abs(diff) < 0.3) return null;
  const isUp = diff > 0;
  return (
    <span className="text-[10px] font-semibold ml-1" style={{ color: isUp ? '#ba1a1a' : '#2563eb' }}>
      {isUp ? '↑' : '↓'}{Math.abs(diff).toFixed(1)}{unit}
    </span>
  );
}

const TAB_ICONS = {
  temp: Thermometer,
  precip: CloudRain,
  hum: Droplets,
  ndvi: Target,
};

export default function MonthlyProjectionTabs({ proyeccion, mejorMes, mejorCultivo, loading }) {
  // ── Debug: log proyeccion shape to diagnose data pipeline ──
  console.debug('[MonthlyProjectionTabs] proyeccion:', proyeccion);
  console.debug('[MonthlyProjectionTabs] meses:', proyeccion?.meses);
  if (proyeccion?.meses?.length) {
    console.debug('[MonthlyProjectionTabs] first mes shape:', proyeccion.meses[0]);
  }

  const [activeTab, setActiveTab] = useState('overview');
  const [scrollIndex, setScrollIndex] = useState(0);

  if (loading) {
    return (
      <div className="bento-card-skeleton">
        <div className="animate-spin w-5 h-5 border-2 border-[#0f5238] border-t-transparent rounded-full mx-auto" />
        <span className="text-xs text-[#6b7280] mt-2 block">Calculando proyeccion...</span>
      </div>
    );
  }

  if (!proyeccion?.meses?.length) return null;

  const meses = proyeccion.meses;
  const visibleCount = typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 4;
  const maxScroll = Math.max(0, meses.length - visibleCount);

  const scrollPrev = () => setScrollIndex((i) => Math.max(0, i - 1));
  const scrollNext = () => setScrollIndex((i) => Math.min(maxScroll, i + 1));

  const tabs = [
    { key: 'overview', label: 'Vista General' },
    { key: 'temp', label: 'Temperatura' },
    { key: 'precip', label: 'Precipitacion' },
    { key: 'hum', label: 'Humedad' },
    { key: 'crop', label: 'Cultivos' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab selector */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab.key ? 'rgba(15,82,56,0.1)' : 'transparent',
              color: activeTab === tab.key ? '#0f5238' : '#6b7280',
              border: activeTab === tab.key ? '1px solid rgba(15,82,56,0.2)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {activeTab === 'overview' && (
        <div className="flex-1 relative">
          {/* Scroll controls */}
          {meses.length > visibleCount && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
              <button
                onClick={scrollPrev}
                disabled={scrollIndex === 0}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-white/80 shadow-md"
                style={{ opacity: scrollIndex === 0 ? 0.3 : 1 }}
              >
                <ChevronLeft size={12} color="#1A1C1A" />
              </button>
            </div>
          )}
          {meses.length > visibleCount && (
            <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10">
              <button
                onClick={scrollNext}
                disabled={scrollIndex >= maxScroll}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-white/80 shadow-md"
                style={{ opacity: scrollIndex >= maxScroll ? 0.3 : 1 }}
              >
                <ChevronRight size={12} color="#1A1C1A" />
              </button>
            </div>
          )}

          <div className="flex gap-2 overflow-hidden" style={{ padding: '0 20px' }}>
            {meses.slice(scrollIndex, scrollIndex + visibleCount).map((mes, i) => {
              const isBest = mes.month === mejorMes;
              return (
                <div
                  key={scrollIndex + i}
                  className="flex-1 rounded-xl p-3 transition-all"
                  style={{
                    background: isBest ? 'rgba(15,82,56,0.06)' : 'rgba(255,255,255,0.4)',
                    border: isBest ? '1.5px solid rgba(15,82,56,0.2)' : '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#1A1C1A]">{mes.month}</span>
                    {isBest && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(15,82,56,0.1)', color: '#0f5238' }}>
                        Optimo
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-[#4a4a4a]">
                      <span className="flex items-center gap-1"><Thermometer size={10} /> Temp</span>
                      <span className="font-semibold">{mes.temperatura}°C</span>
                    </div>
                    <div className="flex justify-between text-[#4a4a4a]">
                      <span className="flex items-center gap-1"><CloudRain size={10} /> Prec</span>
                      <span className="font-semibold">{mes.precipitacion}mm</span>
                    </div>
                    <div className="flex justify-between text-[#4a4a4a]">
                      <span className="flex items-center gap-1"><Droplets size={10} /> Hum</span>
                      <span className="font-semibold">{mes.humedad}%</span>
                    </div>
                    <div className="flex justify-between text-[#4a4a4a]">
                      <span className="flex items-center gap-1"><Target size={10} /> NDVI</span>
                      <span className="font-semibold">{mes.ndvi_estimado}</span>
                    </div>
                    {mes.etapa_fenologica && (
                      <div className="text-[#0f5238] font-semibold capitalize pt-1 border-t border-[rgba(0,0,0,0.05)]">
                        {mes.etapa_fenologica.replace('-', ' ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-[#9ca3af] mt-2 text-center">
            {proyeccion.fuente}
          </div>
        </div>
      )}

      {activeTab === 'temp' && (
        <div className="space-y-2 flex-1">
          {meses.map((mes, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-semibold w-12 text-[#1A1C1A]">{mes.month}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(186,26,26,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (mes.temperatura / 40) * 100)}%`,
                    background: 'linear-gradient(90deg, rgba(186,26,26,0.3), #ba1a1a)',
                  }}
                />
              </div>
              <span className="text-xs font-semibold w-16 text-right text-[#4a4a4a]">{mes.temperatura}°C</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'precip' && (
        <div className="space-y-2 flex-1">
          {meses.map((mes, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-semibold w-12 text-[#1A1C1A]">{mes.month}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(37,99,235,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (mes.precipitacion / 250) * 100)}%`,
                    background: 'linear-gradient(90deg, rgba(37,99,235,0.3), #2563eb)',
                  }}
                />
              </div>
              <span className="text-xs font-semibold w-16 text-right text-[#4a4a4a]">{mes.precipitacion}mm</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'hum' && (
        <div className="space-y-2 flex-1">
          {meses.map((mes, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-semibold w-12 text-[#1A1C1A]">{mes.month}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(15,82,56,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, mes.humedad)}%`,
                    background: 'linear-gradient(90deg, rgba(15,82,56,0.3), #0f5238)',
                  }}
                />
              </div>
              <span className="text-xs font-semibold w-16 text-right text-[#4a4a4a]">{mes.humedad}%</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'crop' && (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {meses.map((mes, i) => (
            <div key={i} className="p-2.5 rounded-xl" style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'transparent' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#1A1C1A]">{mes.month}</span>
                {mes.month === mejorMes && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(15,82,56,0.1)', color: '#0f5238' }}>
                    Optimo
                  </span>
                )}
              </div>
              {mes.cultivos_recomendados?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {mes.cultivos_recomendados.slice(0, 3).map((c, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: c.riesgo === 'bajo' ? 'rgba(15,82,56,0.08)' : c.riesgo === 'medio' ? 'rgba(184,134,11,0.08)' : 'rgba(186,26,26,0.08)',
                        color: c.riesgo === 'bajo' ? '#0f5238' : c.riesgo === 'medio' ? '#b8860b' : '#ba1a1a',
                      }}
                    >
                      {c.emoji} {c.cultivo} {c.score}%
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-[#9ca3af]">Sin datos</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}