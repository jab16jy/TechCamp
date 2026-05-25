import { AlertTriangle, CheckCircle2, Info, Droplets, Thermometer, MapPin } from 'lucide-react';

const STATUS_MAP = {
  critico: { icon: AlertTriangle, color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)', border: 'rgba(186,26,26,0.35)', label: 'Critico' },
  alto: { icon: AlertTriangle, color: '#b8860b', bg: 'rgba(184,134,11,0.08)', border: 'rgba(184,134,11,0.3)', label: 'Alto' },
  moderado: { icon: Info, color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)', label: 'Moderado' },
  ok: { icon: CheckCircle2, color: '#0f5238', bg: 'rgba(15,82,56,0.06)', border: 'rgba(15,82,56,0.15)', label: 'Normal' },
  sin_datos: { icon: Info, color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.12)', label: 'Sin datos' },
};

export default function SensorMicroGrid({
  sensores,
  selectedSensorId,
  onSelect,
  riskStatus,
  sensorRiskMap,
  sensoresEnRiesgo,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-3 text-[#4a4a4a]">
        <div className="animate-spin w-5 h-5 border-2 border-[#0f5238] border-t-transparent rounded-full" />
        <span className="text-xs">Escaneando sensores...</span>
      </div>
    );
  }

  if (!sensores.length) {
    return (
      <div className="text-center py-6">
        <AlertTriangle size={24} className="mx-auto mb-2" style={{ color: '#6b7280', opacity: 0.5 }} />
        <p className="text-xs text-[#6b7280]">Sin sensores conectados</p>
      </div>
    );
  }

  const selectedSensor = sensores.find((s) => s.id === selectedSensorId);
  const isCritico = sensoresEnRiesgo.length > 0;

  return (
    <div className="space-y-3">
      {/* KPI Summary row */}
      {selectedSensor && (
        <div
          className="flex items-center gap-4 p-3 rounded-xl"
          style={{
            background: riskStatus === 'critico' ? 'rgba(186,26,26,0.06)' :
                        riskStatus === 'alto' ? 'rgba(184,134,11,0.06)' :
                        'rgba(15,82,56,0.06)',
            border: `1.5px solid ${
              riskStatus === 'critico' ? 'rgba(186,26,26,0.2)' :
              riskStatus === 'alto' ? 'rgba(184,134,11,0.15)' :
              'rgba(15,82,56,0.15)'
            }`,
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-[#1A1C1A]">
                {selectedSensor.nodo_id || selectedSensor.id?.slice(0, 8)}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{
                  color: STATUS_MAP[riskStatus]?.color || '#6b7280',
                  background: STATUS_MAP[riskStatus]?.bg || 'rgba(107,114,128,0.08)',
                }}
              >
                {STATUS_MAP[riskStatus]?.label || 'Sin datos'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#4a4a4a]">
              <span className="flex items-center gap-1">
                <Droplets size={12} style={{ color: '#2563eb' }} />
                <span className="font-semibold">{selectedSensor.ultima_lectura?.humedad ?? '—'}%</span>
              </span>
              <span className="flex items-center gap-1">
                <Thermometer size={12} style={{ color: '#ba1a1a' }} />
                <span className="font-semibold">{selectedSensor.ultima_lectura?.temperatura ?? '—'}°C</span>
              </span>
              {selectedSensor.lat && (
                <span className="flex items-center gap-1 text-[#6b7280]">
                  <MapPin size={10} />
                  {selectedSensor.lat.toFixed(3)}, {selectedSensor.lng?.toFixed(3)}
                </span>
              )}
            </div>
          </div>
          {isCritico && (
            <div
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(186,26,26,0.1)', color: '#ba1a1a' }}
            >
              <AlertTriangle size={11} />
              {sensoresEnRiesgo.length} en riesgo
            </div>
          )}
        </div>
      )}

      {/* Micro cards grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {sensores.map((sensor) => {
          const risk = sensorRiskMap[sensor.id] || 'sin_datos';
          const cfg = STATUS_MAP[risk] || STATUS_MAP.sin_datos;
          const IconComp = cfg.icon;
          const isSelected = sensor.id === selectedSensorId;
          const hasAlert = risk === 'critico' || risk === 'alto';

          return (
            <button
              key={sensor.id}
              onClick={() => onSelect(sensor.id)}
              className="relative text-left p-2 rounded-xl transition-all duration-200"
              style={{
                background: isSelected ? 'rgba(15,82,56,0.08)' : cfg.bg,
                border: isSelected
                  ? '1.5px solid rgba(15,82,56,0.35)'
                  : `1px solid ${cfg.border}`,
                boxShadow: hasAlert ? '0 0 0 1px rgba(186,26,26,0.1)' : 'none',
              }}
            >
              {hasAlert && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#ba1a1a', animation: 'pulse-critical 1.5s infinite' }}
                />
              )}
              <div className="flex items-center gap-1 mb-1">
                <IconComp size={11} color={cfg.color} />
                <span className="text-[10px] font-semibold text-[#1A1C1A] truncate">
                  {sensor.nodo_id || sensor.id?.slice(0, 6)}
                </span>
              </div>
              <div className="text-lg font-bold text-[#1A1C1A] leading-none">
                {sensor.ultima_lectura?.humedad ?? '—'}<span className="text-[10px] font-normal text-[#6b7280]">%</span>
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: cfg.color }}>
                {cfg.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}