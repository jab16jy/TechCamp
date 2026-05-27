import { useState, useMemo, useCallback } from 'react';
import {
  Droplets, Thermometer, Wind, CloudRain, Leaf, Sprout, Activity,
} from 'lucide-react';
import useSensores from '@features/predictions/hooks/useSensores';
import SensorCard from '@features/predictions/components/SensorCard/SensorCard';

// ── Per-type sensor definitions ──
const SENSOR_TYPE_DEFS = [
  { tipo: 'Humedad Suelo',     icon: Droplets,    unidad: '%',    key: 'humedad',             umbralDefault: 30, category: 'humedad_suelo' },
  { tipo: 'Temperatura',       icon: Thermometer, unidad: '°C',   key: 'temperatura',         umbralDefault: 35, category: 'temperatura' },
  { tipo: 'Viento',            icon: Wind,        unidad: 'km/h', key: 'viento_kmh',          umbralDefault: 30, category: 'viento' },
  { tipo: 'Pluviometría',      icon: CloudRain,   unidad: 'mm',   key: 'pluviometria_mm',     umbralDefault: 50, category: 'pluviometro' },
  { tipo: 'Humectación Hoja',  icon: Leaf,        unidad: '%',    key: 'humectacion_hoja_pct', umbralDefault: 70, category: 'humectacion_hoja' },
  { tipo: 'NDVI',              icon: Sprout,      unidad: '',     key: 'ndvi',                umbralDefault: 0.5, category: 'ndvi' },
];

// ── Risk thresholds (aligned with useSensores) ──
const VIENTO_CRITICO = 50;
const VIENTO_ALTO = 30;
const PLUV_CRITICO = 80;
const PLUV_ALTO = 50;
const HUMECT_FUNGUS = 90;
const HUMECT_ALTO = 70;
const TEMP_CRITICA = 38;
const TEMP_ALTA = 32;

function computeRisk(category, valor, umbrales, cultivo) {
  if (valor == null) return 'sin_datos';

  switch (category) {
    case 'humedad_suelo': {
      const cultivoKey = (cultivo || 'Maiz').replace(/_/g, ' ');
      const umbral = umbrales[cultivoKey] || 20;
      if (valor < umbral * 0.5) return 'critico';
      if (valor < umbral * 0.7) return 'alto';
      if (valor < umbral) return 'moderado';
      return 'ok';
    }
    case 'temperatura':
      if (valor >= TEMP_CRITICA) return 'critico';
      if (valor >= TEMP_ALTA) return 'alto';
      return 'ok';
    case 'viento':
      if (valor >= VIENTO_CRITICO) return 'critico';
      if (valor >= VIENTO_ALTO) return 'alto';
      return 'ok';
    case 'pluviometro':
      if (valor >= PLUV_CRITICO) return 'critico';
      if (valor >= PLUV_ALTO) return 'alto';
      return 'ok';
    case 'humectacion_hoja':
      if (valor >= HUMECT_FUNGUS) return 'critico';
      if (valor >= HUMECT_ALTO) return 'moderado';
      return 'ok';
    case 'ndvi':
      if (valor <= 0.2) return 'critico';
      if (valor <= 0.4) return 'alto';
      if (valor <= 0.5) return 'moderado';
      return 'ok';
    default:
      return 'sin_datos';
  }
}

export default function SensorDashboard() {
  const {
    sensores, selectedSensor, sensoresEnRiesgo, loading, umbrales, selectedSensorId,
  } = useSensores();

  const [selectedCategory, setSelectedCategory] = useState(null);

  // ── Build per-type data from selected sensor ──
  const sensorCards = useMemo(() => {
    const lectura = selectedSensor?.ultima_lectura || {};
    const cultivo = selectedSensor?.cultivo || 'Maiz';

    return SENSOR_TYPE_DEFS.map((def) => {
      const raw = lectura[def.key];
      // Round to reasonable precision
      const valor = raw != null
        ? (def.key === 'ndvi' ? Number(raw.toFixed(3)) : Number(raw.toFixed(1)))
        : null;
      const riesgo = computeRisk(def.category, raw, umbrales, cultivo);

      return {
        ...def,
        valor,
        riesgo,
      };
    });
  }, [selectedSensor, umbrales]);

  // ── Summary counts ──
  const summary = useMemo(() => {
    const activos = sensores.length;
    const enRiesgo = sensoresEnRiesgo.length;
    return { activos, enRiesgo };
  }, [sensores, sensoresEnRiesgo]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} style={{ color: '#6b7280' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Estación de Sensores IoT</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(0,0,0,0.03)', height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (!sensores.length) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} style={{ color: '#6b7280' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Estación de Sensores IoT</h2>
        </div>
        <p className="text-xs text-[#6b7280]">No hay sensores disponibles. Conecta dispositivos IoT para iniciar el monitoreo.</p>
      </div>
    );
  }

  const handleSelectCard = useCallback((category) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }, []);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,82,56,0.08)' }}>
            <Activity size={14} color="#0f5238" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1C1A]">Estación de Sensores IoT</h2>
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl text-xs"
        style={{
          background: 'rgba(15,82,56,0.04)',
          border: '1px solid rgba(15,82,56,0.08)',
        }}
      >
        <span className="font-semibold text-[#1A1C1A]">
          {summary.activos} sensor{summary.activos !== 1 ? 'es' : ''} activo{summary.activos !== 1 ? 's' : ''}
        </span>
        <span className="text-[#6b7280]">·</span>
        <span
          className="font-semibold"
          style={{ color: summary.enRiesgo > 0 ? '#ba1a1a' : '#0f5238' }}
        >
          {summary.enRiesgo > 0
            ? `${summary.enRiesgo} en riesgo`
            : 'Todos operativos'}
        </span>
        {selectedSensor && (
          <>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#6b7280] truncate">
              Sensor activo: {selectedSensor.nodo_id || String(selectedSensor.id).slice(0, 8)}
            </span>
          </>
        )}
      </div>

      {/* 3×2 grid of sensor type cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sensorCards.map((card) => (
          <SensorCard
            key={card.category}
            tipo={card.tipo}
            icono={card.icon}
            valor={card.valor}
            unidad={card.unidad}
            umbral={card.umbralDefault}
            riesgo={card.riesgo}
            seleccionado={selectedCategory === card.category}
            onClick={() => handleSelectCard(card.category)}
          />
        ))}
      </div>
    </div>
  );
}
