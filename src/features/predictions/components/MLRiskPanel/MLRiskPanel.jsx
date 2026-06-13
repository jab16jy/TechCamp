import { useEffect } from 'react';
import { Droplets, Sun, Activity } from 'lucide-react';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import useRiesgoClimatico from '@features/predictions/hooks/useRiesgoClimatico';

// ── Constants ──────────────────────────────────────────────────────────────

const RISK_COLOR = {
  ALTO: '#ba1a1a',
  MEDIO: '#b8860b',
  BAJO: '#0f5238',
};

const RISK_VARIANT = {
  ALTO: 'critical',
  MEDIO: 'highlight',
  BAJO: 'default',
};

const GLASS_STYLE = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 16,
  padding: '1rem',
};

// ── Sub-components ─────────────────────────────────────────────────────────

function ProbabilityBar({ probability, color }) {
  return (
    <svg width="100%" height="8" style={{ borderRadius: 4, display: 'block' }}>
      <rect width="100%" height="8" fill="rgba(0,0,0,0.1)" rx="4" />
      <rect width={`${(probability * 100).toFixed(1)}%`} height="8" fill={color} rx="4" />
    </svg>
  );
}

function ModelBadge({ modelUsed }) {
  const label = modelUsed === 'ml' ? 'Modelo ML' : 'Heuristico';
  const badgeStyle = {
    fontSize: 10,
    padding: '0.15rem 0.5rem',
    borderRadius: 9999,
    background: modelUsed === 'ml' ? 'rgba(15,82,56,0.1)' : 'rgba(184,134,11,0.1)',
    color: modelUsed === 'ml' ? '#0f5238' : '#b8860b',
    fontWeight: 600,
    display: 'inline-block',
  };
  return <span style={badgeStyle}>{label}</span>;
}

function RiskCard({ title, Icon, data, span }) {
  if (!data) return null;

  const color = RISK_COLOR[data.risk_level] || RISK_COLOR.BAJO;
  const variant = RISK_VARIANT[data.risk_level] || 'default';
  const pct = (data.probability * 100).toFixed(0);

  return (
    <BentoCard span={span} variant={variant}>
      <div style={GLASS_STYLE}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color }} />
            <span className="text-sm font-bold text-[#1A1C1A]">{title}</span>
          </div>
          <ModelBadge modelUsed={data.model_used} />
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold" style={{ color, lineHeight: 1 }}>
            {pct}%
          </span>
          <span className="text-xs text-[#6b7280] mb-1">probabilidad</span>
        </div>

        <div className="mb-2">
          <ProbabilityBar probability={data.probability} color={color} />
        </div>

        <div
          className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
          style={{ background: `${color}18`, color }}
        >
          Riesgo {data.risk_level}
        </div>
      </div>
    </BentoCard>
  );
}

function ShimmerCard({ span }) {
  return (
    <BentoCard span={span} variant="default">
      <div style={{ ...GLASS_STYLE, animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ height: 14, width: '55%', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 32, width: '35%', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 8, width: '100%', background: 'rgba(0,0,0,0.08)', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 20, width: '30%', background: 'rgba(0,0,0,0.08)', borderRadius: 9999 }} />
      </div>
    </BentoCard>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MLRiskPanel({ lat, lon, year, month }) {
  const { flood, drought, loading, error, fetchRisk } = useRiesgoClimatico();

  const hasCoords = lat != null && lon != null && year != null && month != null;

  useEffect(() => {
    if (hasCoords) {
      fetchRisk(lat, lon, year, month);
    }
  }, [lat, lon, year, month, hasCoords, fetchRisk]);

  if (!hasCoords) return null;

  return (
    <section style={{ marginTop: '1rem' }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} style={{ color: '#0f5238' }} />
        <h2 className="text-sm font-bold text-[#1A1C1A]">Prediccion de Riesgo Climatico — ML</h2>
      </div>

      {error && (
        <div
          className="text-xs text-[#ba1a1a] rounded-xl px-3 py-2 mb-3"
          style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)' }}
        >
          {error}
        </div>
      )}

      <BentoGrid>
        {loading ? (
          <>
            <ShimmerCard span={{ col: 6, row: 1 }} />
            <ShimmerCard span={{ col: 6, row: 1 }} />
          </>
        ) : (
          <>
            <RiskCard
              title="Riesgo de Inundacion"
              Icon={Droplets}
              data={flood}
              span={{ col: 6, row: 1 }}
            />
            <RiskCard
              title="Riesgo de Sequia"
              Icon={Sun}
              data={drought}
              span={{ col: 6, row: 1 }}
            />
          </>
        )}
      </BentoGrid>
    </section>
  );
}
