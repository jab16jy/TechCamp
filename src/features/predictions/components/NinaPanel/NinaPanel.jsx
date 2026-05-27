import { Cloud, Droplets, Bug, Shield, ChevronRight, Sprout } from 'lucide-react';

const SEVERIDAD_LABEL = {
  baja: 'Baja',
  moderada: 'Moderada',
  alta: 'Alta',
  extrema: 'Extrema',
};

function getSeveridad(proyeccion) {
  const meses = proyeccion?.meses || [];
  const hums = meses.map((m) => m.humedad || 0).filter((h) => h > 0);
  const avgHum = hums.length ? hums.reduce((a, b) => a + b, 0) / hums.length : 70;
  const precips = meses.map((m) => m.precipitacion || 0).filter((p) => p > 0);
  const totalPrecip = precips.length ? precips.reduce((a, b) => a + b, 0) : 50;

  if (avgHum >= 90 && totalPrecip > 150) return 'extrema';
  if (avgHum >= 85 && totalPrecip > 100) return 'alta';
  if (avgHum >= 80) return 'moderada';
  return 'baja';
}

export default function NinaPanel({ proyeccion }) {
  if (!proyeccion) return null;

  const patrones = proyeccion.alertas_patrones || [];
  const tieneNina = patrones.some((p) => p.tipo === 'fenomeno_nina');
  if (!tieneNina) return null;

  const severidad = getSeveridad(proyeccion);
  const meses = proyeccion.meses || [];
  const hums = meses.map((m) => m.humedad || 0).filter((h) => h > 0);
  const humActual = hums[0] || 0;
  const humMax = hums.length > 1 ? Math.max(...hums) : humActual;
  const precipTotal = meses.reduce((a, m) => a + (m.precipitacion || 0), 0);

  // NDVI tracking — use first available
  const ndvi = meses.find((m) => m.ndvi_estimado != null)?.ndvi_estimado;

  const sevColor = severidad === 'extrema' ? '#ba1a1a'
    : severidad === 'alta' ? '#2563eb'
    : severidad === 'moderada' ? '#b8860b'
    : '#0f5238';

  const riesgosHongos = [
    { nombre: 'Pudrición del Cogollo', cultivo: 'Palma Aceitera', color: '#ba1a1a' },
    { nombre: 'Roya del Café', cultivo: 'Café', color: '#b8860b' },
    { nombre: 'Tizón Tardío', cultivo: 'Papa, Tomate', color: '#2563eb' },
  ];

  const acciones = [
    {
      icon: Droplets,
      label: 'Drenaje',
      desc: 'Activar canales de drenaje. Verificar pendientes y sistemas de evacuación de agua.',
      color: '#2563eb',
    },
    {
      icon: Shield,
      label: 'Fungicida Preventivo',
      desc: 'Aplicar fungicida de amplio espectro en etapa vegetativa. Priorizar zonas con humedad >85%.',
      color: '#ba1a1a',
    },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(37,99,235,0.25)',
        animation: 'fade-in-up 0.4s ease',
      }}
    >
      {/* Header with cloud icon and blue glow */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(37,99,235,0.1)',
            boxShadow: '0 0 20px rgba(37,99,235,0.3)',
          }}
        >
          <Cloud size={24} color="#2563eb" />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: '#2563eb' }}>
            Alerta de Exceso Hídrico
          </h2>
          <p className="text-xs text-[#4a4a4a] mt-0.5 leading-relaxed">
            Condiciones de La Niña detectadas. Humedad relativa superior al 85% y
            saturación de suelo en el período proyectado.
          </p>
        </div>
      </div>

      {/* Severity */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase font-bold text-[#6b7280]">Severidad:</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(37,99,235,0.1)', color: sevColor }}
        >
          {SEVERIDAD_LABEL[severidad] || severidad}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div
          className="p-2 rounded-xl text-center"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}
        >
          <Droplets size={14} color="#2563eb" className="mx-auto mb-0.5" />
          <p className="text-lg font-extrabold text-[#1A1C1A]">{humActual.toFixed(1)}%</p>
          <p className="text-[9px] text-[#6b7280]">Humedad</p>
        </div>
        <div
          className="p-2 rounded-xl text-center"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}
        >
          <Droplets size={14} color="#2563eb" className="mx-auto mb-0.5" />
          <p className="text-lg font-extrabold text-[#1A1C1A]">{precipTotal.toFixed(0)}mm</p>
          <p className="text-[9px] text-[#6b7280]">Precip.</p>
        </div>
        <div
          className="p-2 rounded-xl text-center"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}
        >
          <Sprout size={14} color="#0f5238" className="mx-auto mb-0.5" />
          <p className="text-lg font-extrabold text-[#1A1C1A]">{ndvi != null ? ndvi.toFixed(2) : '—'}</p>
          <p className="text-[9px] text-[#6b7280]">NDVI</p>
        </div>
      </div>

      {/* Humidity >85% alert */}
      {humMax >= 85 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
          style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}
        >
          <Droplets size={14} color="#2563eb" />
          <span className="font-semibold" style={{ color: '#2563eb' }}>
            Humedad superior al 85% — suelo potencialmente saturado
          </span>
        </div>
      )}

      {/* Fungus risk alerts */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Bug size={12} color="#ba1a1a" />
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">
            Riesgos Fúngicos Detectados
          </p>
        </div>
        <div className="space-y-1.5">
          {riesgosHongos.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(186,26,26,0.04)', border: `1px solid rgba(186,26,26,0.1)` }}
            >
              <span className="font-semibold text-[#1A1C1A]">{r.nombre}</span>
              <span className="text-[10px] text-[#6b7280]">{r.cultivo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NDVI tracking */}
      {ndvi != null && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
          style={{ background: 'rgba(15,82,56,0.04)', border: '1px solid rgba(15,82,56,0.1)' }}
        >
          <Sprout size={14} color="#0f5238" />
          <div>
            <span className="font-semibold text-[#0f5238]">NDVI: {ndvi.toFixed(2)}</span>
            <span className="text-[#6b7280] ml-1">
              {ndvi >= 0.6 ? '— Vigor vegetativo alto' : ndvi >= 0.4 ? '— Vigor moderado' : '— Vigor bajo'}
            </span>
          </div>
        </div>
      )}

      {/* Action cards */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">
          Acciones Recomendadas
        </p>
        {acciones.map((acc, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `rgba(37,99,235,0.08)` }}
            >
              <acc.icon size={14} color={acc.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1A1C1A]">{acc.label}</p>
              <p className="text-[10px] text-[#6b7280] line-clamp-2">{acc.desc}</p>
            </div>
            <ChevronRight size={14} color="#6b7280" />
          </div>
        ))}
      </div>
    </div>
  );
}
