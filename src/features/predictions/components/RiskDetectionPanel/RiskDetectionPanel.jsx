import { AlertTriangle, Search, Loader2 } from 'lucide-react';
import SensorStatusCard from '@features/predictions/components/SensorStatusCard/SensorStatusCard';

export default function RiskDetectionPanel({
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
      <div className="flex items-center justify-center py-12 gap-3 text-[#4a4a4a]">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Escaneando sensores IoT...</span>
      </div>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1A1C1A] flex items-center gap-2">
            <Search size={18} />
            Deteccion de Riesgos Activos
          </h2>
          <p className="text-xs text-[#6b7280] mt-1">
            {sensoresEnRiesgo.length > 0
              ? `${sensoresEnRiesgo.length} de ${sensores.length} sensores presentan riesgo hidrico`
              : `${sensores.length} sensores monitoreados — sin riesgos detectados`}
          </p>
        </div>

        {sensoresEnRiesgo.length > 0 && (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"
            style={{ background: 'rgba(186,26,26,0.1)', color: '#ba1a1a' }}
          >
            <AlertTriangle size={12} />
            {sensoresEnRiesgo.length} alerta{sensoresEnRiesgo.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {sensores.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: '#6b7280', opacity: 0.5 }} />
          <p className="text-sm text-[#6b7280]">No hay sensores disponibles</p>
          <p className="text-xs text-[#9ca3af] mt-1">Conecta sensores IoT para activar el monitoreo proactivo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sensores.map((sensor) => (
            <SensorStatusCard
              key={sensor.id}
              sensor={sensor}
              riskStatus={sensorRiskMap[sensor.id] || 'sin_datos'}
              isSelected={sensor.id === selectedSensorId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
