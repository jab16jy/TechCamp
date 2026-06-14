import { motion } from 'framer-motion';
import { BentoCard } from '@shared/ui/BentoGrid';

// ── Plantability logic ─────────────────────────────────────────────────────

function calcPlantability(flood, drought) {
  if (!flood && !drought) return null;
  const floodLevel = flood?.risk_level;
  const droughtLevel = drought?.risk_level;
  if (floodLevel === 'critico' || droughtLevel === 'critico') return 'danger';
  if (floodLevel === 'alto' || droughtLevel === 'alto') return 'warning';
  return 'ok';
}

// ── Static tips map ────────────────────────────────────────────────────────

const TIPS = {
  danger: {
    flood: 'Evite preparar surcos — riesgo critico de anegamiento en los proximos meses.',
    drought: 'Deficit hidrico severo previsto — no inicie siembra sin sistema de riego establecido.',
  },
  warning: {
    Maiz:   'Considere variedades tolerantes a estres hidrico. Aumente espaciado entre surcos 15 cm.',
    Arroz:  'Verifique disponibilidad hidrica antes de trasplante. Monitoree NDVI semanal.',
    Yuca:   'Yuca tolera sequia moderada. Evite suelos encharcados si hay riesgo de inundacion.',
    default: 'Monitoree precipitacion semanal. Tenga plan de contingencia para riego o drenaje.',
  },
  ok: {
    default: 'Condiciones adecuadas. Siga el calendario fenologico del cultivo seleccionado.',
  },
};

// ── Semaphore config ───────────────────────────────────────────────────────

const SEMAPHORE = {
  danger:  { color: '#ba1a1a', label: 'No recomendado para siembra' },
  warning: { color: '#d97706', label: 'Riesgo moderado — planificar mitigacion' },
  ok:      { color: '#0f5238', label: 'Condiciones favorables para siembra' },
};

// ── Tip resolver ───────────────────────────────────────────────────────────

function resolveTip(level, flood, drought, cultivo) {
  if (level === 'danger') {
    const isDrought = drought?.risk_level === 'critico';
    return isDrought ? TIPS.danger.drought : TIPS.danger.flood;
  }
  if (level === 'warning') {
    return TIPS.warning[cultivo] || TIPS.warning.default;
  }
  return TIPS.ok.default;
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
  const level = calcPlantability(flood, drought);

  if (!level) return null;

  const { color, label } = SEMAPHORE[level];
  const tip = resolveTip(level, flood, drought, cultivo);

  const formattedFecha = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const subtitleParts = [cultivo, formattedFecha].filter(Boolean);

  return (
    <BentoCard
      span={{ col: 12, row: 1 }}
      variant={level === 'danger' ? 'critical' : level === 'warning' ? 'highlight' : 'default'}
    >
      <motion.div layout style={CARD_INNER_STYLE}>
        {/* Semaphore circle */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            marginTop: 2,
            boxShadow: `0 0 0 4px ${color}22`,
          }}
        />

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#1A1C1A',
              margin: '0 0 0.2rem',
            }}
          >
            {label}
          </h3>

          {subtitleParts.length > 0 && (
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0 0 0.5rem',
              }}
            >
              {subtitleParts.join(' · ')}
            </p>
          )}

          <p
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.8rem',
              color: '#4a4a4a',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {tip}
          </p>
        </div>
      </motion.div>
    </BentoCard>
  );
}
