/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { Activity, AlertTriangle, CalendarDays, Droplets, Info, MapPin, ShieldCheck, Sun } from 'lucide-react';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import useRiesgoClimatico from '@features/predictions/hooks/useRiesgoClimatico';

// ── Constants ──────────────────────────────────────────────────────────────

const RISK_LEVEL = {
  critico: { label: 'Crítico', color: '#ba1a1a', variant: 'critical', rank: 4 },
  alto: { label: 'Alto', color: '#b8860b', variant: 'highlight', rank: 3 },
  medio: { label: 'Medio', color: '#d97706', variant: 'highlight', rank: 2 },
  bajo: { label: 'Bajo', color: '#0f5238', variant: 'default', rank: 1 },
};

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const GLASS_STYLE = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 16,
  padding: '1rem',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getRiskConfig(level) {
  return RISK_LEVEL[level] || RISK_LEVEL.bajo;
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return '—';
  return `${Math.round(Number(value) * 100)}%`;
}

function getDominantRisk(flood, drought) {
  const items = [
    flood && { key: 'inundacion', label: 'Inundación', data: flood },
    drought && { key: 'sequia', label: 'Sequía', data: drought },
  ].filter(Boolean);

  if (!items.length) return null;

  return items.sort((a, b) => {
    const rankDiff = getRiskConfig(b.data.risk_level).rank - getRiskConfig(a.data.risk_level).rank;
    if (rankDiff !== 0) return rankDiff;
    return (b.data.probability || 0) - (a.data.probability || 0);
  })[0];
}

function getDecisionSummary(flood, drought) {
  const dominant = getDominantRisk(flood, drought);
  if (!dominant) {
    return {
      level: 'bajo',
      title: 'Sin lectura de riesgo disponible',
      action: 'Verifique ubicación, fecha y disponibilidad del modelo antes de tomar decisiones.',
      eyebrow: 'Decisión pendiente',
    };
  }

  const floodRank = flood ? getRiskConfig(flood.risk_level).rank : 0;
  const droughtRank = drought ? getRiskConfig(drought.risk_level).rank : 0;
  const maxRank = Math.max(floodRank, droughtRank);

  if (maxRank >= 4) {
    return {
      level: 'critico',
      title: 'No recomendado para siembra',
      action: `Riesgo dominante: ${dominant.label.toLowerCase()} (${formatPercent(dominant.data.probability)}). Requiere mitigación técnica antes de avanzar.`,
      eyebrow: 'Decisión crítica',
    };
  }

  if (maxRank >= 3) {
    return {
      level: 'alto',
      title: 'Sembrar solo con mitigación',
      action: `Riesgo dominante: ${dominant.label.toLowerCase()} (${formatPercent(dominant.data.probability)}). Prepare drenaje, riego o monitoreo según el caso.`,
      eyebrow: 'Decisión condicionada',
    };
  }

  if (maxRank >= 2) {
    return {
      level: 'medio',
      title: 'Riesgo manejable con seguimiento',
      action: `Riesgo dominante: ${dominant.label.toLowerCase()} (${formatPercent(dominant.data.probability)}). Mantenga monitoreo semanal y plan de contingencia.`,
      eyebrow: 'Decisión viable con control',
    };
  }

  return {
    level: 'bajo',
    title: 'Condición favorable',
    action: `Riesgo dominante bajo: ${dominant.label.toLowerCase()} (${formatPercent(dominant.data.probability)}). Continúe con planificación agronómica normal.`,
    eyebrow: 'Decisión favorable',
  };
}

function sourceLabel(meta, flood, drought) {
  if (meta?.mensaje) return 'Heurístico de respaldo';
  const usedHeuristic = [flood, drought].some((r) => r?.model_used === 'heuristic');
  if (usedHeuristic) return 'Heurístico de respaldo';
  if (meta?.modelo_disponible) return 'RiskClassifier ML';
  return 'Modelo no confirmado';
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProbabilityBar({ probability, color }) {
  const width = Math.max(0, Math.min(100, Number(probability || 0) * 100));
  return (
    <svg width="100%" height="8" style={{ borderRadius: 4, display: 'block' }}>
      <rect width="100%" height="8" fill="rgba(0,0,0,0.1)" rx="4" />
      <rect width={`${width.toFixed(1)}%`} height="8" fill={color} rx="4" />
    </svg>
  );
}

function ModelBadge({ modelUsed }) {
  const isML = modelUsed === 'ml';
  const label = isML ? 'Modelo ML' : 'Heurístico';
  return (
    <span
      className="text-[10px] font-semibold rounded-full inline-block"
      style={{
        padding: '0.15rem 0.5rem',
        background: isML ? 'rgba(15,82,56,0.1)' : 'rgba(184,134,11,0.1)',
        color: isML ? '#0f5238' : '#b8860b',
      }}
    >
      {label}
    </span>
  );
}

function DecisionSummaryCard({ flood, drought, meta }) {
  const decision = getDecisionSummary(flood, drought);
  const config = getRiskConfig(decision.level);

  return (
    <BentoCard span={{ col: 12, row: 1 }} variant={config.variant}>
      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        style={{
          ...GLASS_STYLE,
          background: `linear-gradient(135deg, ${config.color}14, rgba(255,255,255,0.58))`,
          border: `1px solid ${config.color}26`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${config.color}18`, color: config.color }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: config.color }}>
              {decision.eyebrow}
            </p>
            <h3 className="text-xl font-bold text-[#1A1C1A] mt-1">{decision.title}</h3>
            <p className="text-sm text-[#4a4a4a] mt-1 leading-relaxed max-w-3xl">{decision.action}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#4a4a4a] min-w-[260px]">
          <span className="rounded-xl px-3 py-2 bg-white/50 border border-white/40 flex items-center gap-1.5">
            <Activity size={13} style={{ color: config.color }} />
            {sourceLabel(meta, flood, drought)}
          </span>
          <span className="rounded-xl px-3 py-2 bg-white/50 border border-white/40 flex items-center gap-1.5">
            <CalendarDays size={13} style={{ color: '#0f5238' }} />
            {MONTH_NAMES[(meta?.month || 1) - 1]} {meta?.year || ''}
          </span>
          <span className="rounded-xl px-3 py-2 bg-white/50 border border-white/40 flex items-center gap-1.5">
            <MapPin size={13} style={{ color: '#0f5238' }} />
            {Number.isFinite(Number(meta?.lat)) ? Number(meta.lat).toFixed(2) : '—'},
            {' '}
            {Number.isFinite(Number(meta?.lon)) ? Number(meta.lon).toFixed(2) : '—'}
          </span>
        </div>
      </div>
    </BentoCard>
  );
}

function RiskCard({ title, Icon, data, span }) {
  if (!data) {
    return (
      <BentoCard span={span} variant="default">
        <div style={GLASS_STYLE} className="min-h-[132px] flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[#6b7280]">
            <Icon size={16} />
            <span className="text-sm font-bold text-[#1A1C1A]">{title}</span>
          </div>
          <p className="text-xs text-[#6b7280] mt-2">Sin lectura disponible para este riesgo.</p>
        </div>
      </BentoCard>
    );
  }

  const config = getRiskConfig(data.risk_level);
  const pct = formatPercent(data.probability);

  return (
    <BentoCard span={span} variant={config.variant}>
      <div style={GLASS_STYLE}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: config.color }} />
            <span className="text-sm font-bold text-[#1A1C1A]">{title}</span>
          </div>
          <ModelBadge modelUsed={data.model_used} />
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold" style={{ color: config.color, lineHeight: 1 }}>
            {pct}
          </span>
          <span className="text-xs text-[#6b7280] mb-1">probabilidad</span>
        </div>

        <div className="mb-2">
          <ProbabilityBar probability={data.probability} color={config.color} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div
            className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
            style={{ background: `${config.color}18`, color: config.color }}
          >
            Riesgo {config.label}
          </div>
          {data.confidence != null && (
            <span className="text-[11px] text-[#6b7280]">Confianza {formatPercent(data.confidence)}</span>
          )}
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

function FallbackNotice({ message }) {
  if (!message) return null;

  return (
    <div
      className="text-xs rounded-xl px-3 py-2 mb-3 flex items-start gap-2"
      style={{ background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.18)', color: '#75520a' }}
    >
      <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MLRiskPanel({ lat, lon, year, month, onRiskData }) {
  const { flood, drought, meta, loading, error, fetchRisk } = useRiesgoClimatico();

  const hasCoords = lat != null && lon != null && year != null && month != null;

  useEffect(() => {
    if (hasCoords) {
      fetchRisk(lat, lon, year, month);
    }
  }, [lat, lon, year, month, hasCoords, fetchRisk]);

  useEffect(() => {
    if (onRiskData && (flood !== null || drought !== null)) {
      onRiskData({ flood, drought });
    }
  }, [flood, drought, onRiskData]);

  if (!hasCoords) return null;

  return (
    <section style={{ marginTop: '1rem' }}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: '#0f5238' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Predicción de Riesgo Climático</h2>
        </div>
        <span className="text-[11px] text-[#6b7280]">
          Ventana evaluada: {MONTH_NAMES[(month || 1) - 1]} {year}
        </span>
      </div>

      {error && (
        <div
          className="text-xs text-[#ba1a1a] rounded-xl px-3 py-2 mb-3 flex items-start gap-2"
          style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)' }}
        >
          <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <FallbackNotice message={meta?.mensaje} />

      <BentoGrid>
        {loading ? (
          <>
            <ShimmerCard span={{ col: 12, row: 1 }} />
            <ShimmerCard span={{ col: 6, row: 1 }} />
            <ShimmerCard span={{ col: 6, row: 1 }} />
          </>
        ) : (
          <>
            <DecisionSummaryCard flood={flood} drought={drought} meta={meta || { lat, lon, year, month }} />
            <RiskCard
              title="Riesgo de Inundación"
              Icon={Droplets}
              data={flood}
              span={{ col: 6, row: 1 }}
            />
            <RiskCard
              title="Riesgo de Sequía"
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
