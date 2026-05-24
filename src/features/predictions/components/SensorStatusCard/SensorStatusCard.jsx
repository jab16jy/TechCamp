import { Droplets, Thermometer, MapPin, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import useAppStore from '@shared/store';

const STATUS_MAP = {
  critico: { icon: AlertTriangle, color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)', label: 'Critico' },
  alto: { icon: AlertTriangle, color: '#b8860b', bg: 'rgba(184,134,11,0.08)', label: 'Alto' },
  moderado: { icon: Info, color: '#2563eb', bg: 'rgba(37,99,235,0.08)', label: 'Moderado' },
  ok: { icon: CheckCircle2, color: '#0f5238', bg: 'rgba(15,82,56,0.08)', label: 'Normal' },
  sin_datos: { icon: Info, color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: 'Sin datos' },
};

export default function SensorStatusCard({ sensor, riskStatus, isSelected, onSelect }) {
  const statusConfig = STATUS_MAP[riskStatus] || STATUS_MAP.sin_datos;
  const IconComponent = statusConfig.icon;
  const lectura = sensor.ultima_lectura;
  const isCritico = riskStatus === 'critico' || riskStatus === 'alto';

  return (
    <button
      type="button"
      onClick={() => onSelect(sensor.id)}
      className="relative w-full text-left rounded-2xl p-4 transition-all duration-300 cursor-pointer"
      style={{
        background: isSelected
          ? 'rgba(15,82,56,0.08)'
          : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: isSelected
          ? '2px solid #0f5238'
          : '1px solid rgba(255,255,255,0.25)',
        transform: isCritico ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {isCritico && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{
            background: '#ba1a1a',
            animation: 'pulse-critical 1.5s infinite',
          }}
        />
      )}

      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: statusConfig.bg }}
        >
          <IconComponent size={16} color={statusConfig.color} />
        </div>
        <div>
          <span className="text-sm font-semibold text-[#1A1C1A] blocking">
            {sensor.nodo_id || sensor.id?.slice(0, 8)}
          </span>
          <span
            className="text-xs ml-2 px-1.5 py-0.5 rounded-full"
            style={{ background: statusConfig.bg, color: statusConfig.color }}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#4a4a4a]">
        <div className="flex items-center gap-1">
          <Droplets size={12} />
          <span>{lectura?.humedad ?? '—'}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Thermometer size={12} />
          <span>{lectura?.temperatura ?? '—'}°C</span>
        </div>
        {sensor.lat && (
          <div className="flex items-center gap-1 col-span-2">
            <MapPin size={12} />
            <span className="truncate">
              {sensor.lat.toFixed(4)}, {sensor.lng?.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
