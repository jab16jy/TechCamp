import { Thermometer, Droplets, Shield, Sprout, ChevronRight } from 'lucide-react';

const SEVERIDAD_LABEL = {
  baja: 'Baja',
  moderada: 'Moderada',
  alta: 'Alta',
  extrema: 'Extrema',
};

function getSeveridad(proyeccion) {
  // Derive severity from temperature and precipitation data
  const meses = proyeccion?.meses || [];
  const temps = meses.map((m) => m.temperatura || 0).filter((t) => t > 0);
  const precips = meses.map((m) => m.precipitacion || 0).filter((p) => p > 0);
  const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 30;
  const totalPrecip = precips.length ? precips.reduce((a, b) => a + b, 0) : 10;

  if (avgTemp >= 38 && totalPrecip < 5) return 'extrema';
  if (avgTemp >= 35 && totalPrecip < 10) return 'alta';
  if (avgTemp >= 33 && totalPrecip < 15) return 'moderada';
  return 'baja';
}

export default function NinoPanel({ proyeccion }) {
  if (!proyeccion) return null;

  const patrones = proyeccion.alertas_patrones || [];
  const tieneNino = patrones.some((p) => p.tipo === 'fenomeno_nino');
  if (!tieneNino) return null;

  const severidad = getSeveridad(proyeccion);
  const meses = proyeccion.meses || [];
  const temps = meses.map((m) => m.temperatura || 0).filter((t) => t > 0);
  const tempActual = temps[0] || 0;
  const tempProyectada = temps.length > 1 ? Math.max(...temps) : tempActual;
  const precipTotal = meses.reduce((a, m) => a + (m.precipitacion || 0), 0);

  const sevColor = severidad === 'extrema' ? '#ba1a1a'
    : severidad === 'alta' ? '#b8860b'
    : severidad === 'moderada' ? '#2563eb'
    : '#0f5238';

  const acciones = [
    {
      icon: Shield,
      label: 'Riego Crítico',
      desc: 'Activar sistema de riego inmediato. Priorizar cultivos en etapa de floración.',
      color: '#ba1a1a',
    },
    {
      icon: Sprout,
      label: 'Cobertura Mulch',
      desc: 'Aplicar cobertura vegetal en toda la parcela para retención de humedad.',
      color: '#b8860b',
    },
    {
      icon: Sprout,
      label: 'Cultivos Tolerantes',
      desc: 'Considerar cambio a Yuca, Sorgo o variedades tolerantes a sequía.',
      color: '#0f5238',
    },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(186,26,26,0.25)',
        animation: 'fade-in-up 0.4s ease',
      }}
    >
      {/* Header with thermometer glow */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(186,26,26,0.1)',
            boxShadow: '0 0 20px rgba(186,26,26,0.3)',
          }}
        >
          <Thermometer size={24} color="#ba1a1a" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#ba1a1a]">
            Alerta de Sequía Extrema
          </h2>
          <p className="text-xs text-[#4a4a4a] mt-0.5 leading-relaxed">
            Condiciones de El Niño detectadas. Temperaturas elevadas y precipitación
            bajo umbral crítico en el período proyectado.
          </p>
        </div>
      </div>

      {/* Severity indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase font-bold text-[#6b7280]">Severidad:</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `rgba(186,26,26,0.1)`, color: sevColor }}
        >
          {SEVERIDAD_LABEL[severidad] || severidad}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div
          className="p-2 rounded-xl text-center"
          style={{ background: 'rgba(186,26,26,0.05)', border: '1px solid rgba(186,26,26,0.1)' }}
        >
          <Thermometer size={14} color="#ba1a1a" className="mx-auto mb-0.5" />
          <p className="text-lg font-extrabold text-[#1A1C1A]">{tempActual.toFixed(1)}°</p>
          <p className="text-[9px] text-[#6b7280]">Temp. Actual</p>
        </div>
        <div
          className="p-2 rounded-xl text-center"
          style={{ background: 'rgba(186,26,26,0.05)', border: '1px solid rgba(186,26,26,0.1)' }}
        >
          <Thermometer size={14} color="#b8860b" className="mx-auto mb-0.5" />
          <p className="text-lg font-extrabold text-[#1A1C1A]">{tempProyectada.toFixed(1)}°</p>
          <p className="text-[9px] text-[#6b7280]">Temp. Proy.</p>
        </div>
        <div
          className="p-2 rounded-xl text-center"
          style={{ background: 'rgba(186,26,26,0.05)', border: '1px solid rgba(186,26,26,0.1)' }}
        >
          <Droplets size={14} color="#ba1a1a" className="mx-auto mb-0.5" />
          <p className="text-lg font-extrabold text-[#1A1C1A]">{precipTotal.toFixed(0)}mm</p>
          <p className="text-[9px] text-[#6b7280]">Precip. Total</p>
        </div>
      </div>

      {/* Precip alert */}
      {precipTotal < 10 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
          style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)' }}
        >
          <Droplets size={14} color="#ba1a1a" />
          <span className="font-semibold text-[#ba1a1a]">
            Precipitación acumulada por debajo de 10 mm — déficit hídrico severo
          </span>
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
              style={{ background: `rgba(186,26,26,0.08)` }}
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
