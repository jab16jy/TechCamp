/* eslint-disable react/prop-types */
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Droplets, ShieldAlert, Sun } from 'lucide-react';
import { BentoCard } from '@shared/ui/BentoGrid';

// ── Risk logic ─────────────────────────────────────────────────────────────

const RISK_RANK = {
  critico: 4,
  alto: 3,
  medio: 2,
  bajo: 1,
};

const SEMAPHORE = {
  danger: {
    color: '#ba1a1a',
    icon: ShieldAlert,
    label: 'No recomendado para siembra',
    variant: 'critical',
  },
  warning: {
    color: '#d97706',
    icon: AlertTriangle,
    label: 'Sembrar solo con mitigación',
    variant: 'highlight',
  },
  ok: {
    color: '#0f5238',
    icon: CheckCircle2,
    label: 'Condiciones favorables para siembra',
    variant: 'default',
  },
};

function rank(risk) {
  return RISK_RANK[risk?.risk_level] || 0;
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return '—';
  return `${Math.round(Number(value) * 100)}%`;
}

function calcDecision(flood, drought) {
  if (!flood && !drought) return null;

  const floodRank = rank(flood);
  const droughtRank = rank(drought);
  const maxRank = Math.max(floodRank, droughtRank);

  if (floodRank >= 3 && droughtRank >= 3) {
    return {
      level: 'danger',
      driver: 'doble',
      title: 'Riesgo compuesto: agua insuficiente y exceso hídrico',
      tip: 'No inicie siembra sin validación de campo. La combinación de sequía e inundación altas indica inestabilidad climática: priorice monitoreo, drenaje y disponibilidad de riego antes de invertir.',
    };
  }

  if (maxRank >= 4) {
    const isDrought = droughtRank >= floodRank;
    return {
      level: 'danger',
      driver: isDrought ? 'sequia' : 'inundacion',
      title: isDrought ? 'Déficit hídrico crítico' : 'Anegamiento crítico',
      tip: isDrought
        ? 'No inicie siembra sin fuente de riego confirmada, cobertura de suelo y plan de emergencia hídrica.'
        : 'No prepare surcos ni haga trasplante hasta confirmar drenaje funcional y reducción del riesgo de encharcamiento.',
    };
  }

  if (maxRank >= 3) {
    const isDrought = droughtRank >= floodRank;
    return {
      level: 'warning',
      driver: isDrought ? 'sequia' : 'inundacion',
      title: isDrought ? 'Sequía alta: siembra condicionada' : 'Inundación alta: siembra condicionada',
      tip: isDrought
        ? 'Puede avanzar solo si cuenta con riego, cobertura/mulch y seguimiento semanal de humedad.'
        : 'Puede avanzar solo si existen drenajes, camas elevadas o capacidad de evacuar exceso de agua.',
    };
  }

  if (maxRank >= 2) {
    return {
      level: 'warning',
      driver: floodRank >= droughtRank ? 'inundacion' : 'sequia',
      title: 'Riesgo moderado manejable',
      tip: 'La siembra es viable, pero debe tener monitoreo semanal y una acción de contingencia lista.',
    };
  }

  return {
    level: 'ok',
    driver: 'estable',
    title: 'Ventana favorable',
    tip: 'Condiciones adecuadas para continuar con la planificación agronómica y el calendario fenológico.',
  };
}

function cropSpecificNote(cultivo, driver) {
  if (!cultivo) return null;

  const crop = cultivo.toLowerCase();
  if (driver === 'sequia') {
    if (crop.includes('yuca')) return 'Yuca tolera mejor el estrés hídrico, pero igual conviene proteger el establecimiento inicial.';
    if (crop.includes('maiz') || crop.includes('maíz')) return 'Maíz es sensible en floración: no arranque sin humedad suficiente en suelo.';
    if (crop.includes('arroz')) return 'Arroz exige disponibilidad hídrica estable; valide fuente de agua antes de trasplante.';
  }

  if (driver === 'inundacion') {
    if (crop.includes('yuca')) return 'Yuca no tolera bien el encharcamiento prolongado; priorice suelos con buen drenaje.';
    if (crop.includes('maiz') || crop.includes('maíz')) return 'Maíz requiere evitar encharcamiento temprano para proteger emergencia y raíces.';
    if (crop.includes('arroz')) return 'Arroz tolera lámina de agua, pero el exceso sin manejo aumenta riesgo sanitario.';
  }

  return null;
}

function DriverIcon({ driver, color }) {
  if (driver === 'sequia') return <Sun size={15} style={{ color }} />;
  if (driver === 'inundacion') return <Droplets size={15} style={{ color }} />;
  if (driver === 'doble') {
    return (
      <span className="flex items-center gap-1">
        <Sun size={14} style={{ color }} />
        <Droplets size={14} style={{ color }} />
      </span>
    );
  }
  return <CheckCircle2 size={15} style={{ color }} />;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const CARD_INNER_STYLE = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '0.25rem 0',
};

// ── Component ──────────────────────────────────────────────────────────────

export default function PlantabilityPanel({ flood, drought, cultivo, fecha }) {
  const decision = calcDecision(flood, drought);

  if (!decision) return null;

  const config = SEMAPHORE[decision.level];
  const Icon = config.icon;
  const cropNote = cropSpecificNote(cultivo, decision.driver);

  const formattedFecha = fecha
    ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const subtitleParts = [cultivo, formattedFecha].filter(Boolean);

  return (
    <BentoCard span={{ col: 12, row: 1 }} variant={config.variant}>
      <motion.div layout style={CARD_INNER_STYLE}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: config.color,
            color: 'white',
            flexShrink: 0,
            marginTop: 2,
            boxShadow: `0 0 0 5px ${config.color}22`,
          }}
        >
          <Icon size={22} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#1A1C1A',
                margin: 0,
              }}
            >
              {config.label}
            </h3>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ color: config.color, background: `${config.color}16` }}
            >
              <DriverIcon driver={decision.driver} color={config.color} />
              {decision.title}
            </span>
          </div>

          {subtitleParts.length > 0 && (
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.25rem 0 0.55rem',
              }}
            >
              {subtitleParts.join(' · ')}
            </p>
          )}

          <p
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.82rem',
              color: '#4a4a4a',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {decision.tip}
          </p>

          {cropNote && (
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.78rem',
                color: '#6b7280',
                margin: '0.45rem 0 0',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: '#1A1C1A' }}>Nota por cultivo:</strong> {cropNote}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {flood && (
              <span className="text-[11px] rounded-full px-2 py-1" style={{ background: 'rgba(37,99,235,0.08)', color: '#1d4ed8' }}>
                Inundación {formatPercent(flood.probability)}
              </span>
            )}
            {drought && (
              <span className="text-[11px] rounded-full px-2 py-1" style={{ background: 'rgba(186,26,26,0.08)', color: '#ba1a1a' }}>
                Sequía {formatPercent(drought.probability)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </BentoCard>
  );
}
