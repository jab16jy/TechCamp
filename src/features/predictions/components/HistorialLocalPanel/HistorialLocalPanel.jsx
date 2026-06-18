/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import {
  Droplets, Sun, Users, Home, Wheat, HeartPulse, MapPin, FileText,
  AlertTriangle, Inbox, Database,
} from 'lucide-react';
import { BentoCard } from '@shared/ui/BentoGrid';
import useHistorialEventos from '@features/predictions/hooks/useHistorialEventos';

// ── Palette (consistent with the risk dashboard) ────────────────────────────
const FLOOD = '#1d6fa5';
const DROUGHT = '#b8860b';
const DEATH = '#ba1a1a';
const INK = '#0f5238';

const TYPE_CONFIG = {
  inundacion: { label: 'Inundación', color: FLOOD, Icon: Droplets },
  sequia: { label: 'Sequía', color: DROUGHT, Icon: Sun },
};

// ── Formatting (transparency: null = not reported → '—', a real 0 shows) ─────
const hasValue = (v) => v !== null && v !== undefined && Number.isFinite(Number(v));
const fmtInt = (v) => (hasValue(v) ? Math.round(Number(v)).toLocaleString('es-CO') : null);
const fmtNum = (v) => {
  if (!hasValue(v)) return null;
  const n = Number(v);
  return (Number.isInteger(n) ? n : Number(n.toFixed(1))).toLocaleString('es-CO');
};
const sumHomes = (e) =>
  hasValue(e.viviendas_destruidas) || hasValue(e.viviendas_averiadas)
    ? fmtInt((Number(e.viviendas_destruidas) || 0) + (Number(e.viviendas_averiadas) || 0))
    : null;
const yearOf = (iso) => (iso ? iso.slice(0, 4) : '');
const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};
const typeConfig = (t) => TYPE_CONFIG[t] || { label: t, color: INK, Icon: Database };

// ── Signature element: annual frequency micro-chart ─────────────────────────
// Encodes *when* this place has been at risk — turns a flat list into a pattern.
function YearSparkline({ serie }) {
  if (!serie?.length) return null;
  const max = Math.max(...serie.map((s) => s.total), 1);
  const H = 56;

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height: H }} aria-hidden="true">
        {serie.map((s) => {
          const h = Math.max(3, (s.total / max) * H);
          const floodH = s.total ? (s.inundaciones / s.total) * h : 0;
          const droughtH = h - floodH;
          return (
            <div
              key={s.anio}
              className="flex-1 flex flex-col justify-end"
              style={{ minWidth: 3 }}
              title={`${s.anio}: ${s.total} evento(s) · ${s.inundaciones} inund. / ${s.sequias} seq.`}
            >
              {droughtH > 0 && (
                <div style={{ height: droughtH, background: DROUGHT, borderRadius: '2px 2px 0 0' }} />
              )}
              <div style={{ height: floodH, background: FLOOD, borderRadius: droughtH > 0 ? 0 : '2px 2px 0 0' }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-[#9ca3af] font-medium">
        <span>{serie[0].anio}</span>
        <span>eventos por año</span>
        <span>{serie[serie.length - 1].anio}</span>
      </div>
    </div>
  );
}

// ── Hero: the thesis tile ────────────────────────────────────────────────────
function HeroTile({ resumen, meta }) {
  const lugar = [meta?.municipio, meta?.departamento].filter(Boolean).join(' · ');
  const rango = resumen.rango_fechas;
  const total = resumen.total_eventos;
  const dom = resumen.inundaciones >= resumen.sequias
    ? { label: 'inundaciones', pct: Math.round((resumen.inundaciones / (total || 1)) * 100), color: FLOOD }
    : { label: 'sequías', pct: Math.round((resumen.sequias / (total || 1)) * 100), color: DROUGHT };

  return (
    <BentoCard span={{ col: 8, row: 1 }} variant="highlight">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: INK }}>
        {lugar || 'Región seleccionada'}
        {rango && (
          <span className="text-[#6b7280] font-semibold"> · {yearOf(rango.desde)}–{yearOf(rango.hasta)}</span>
        )}
      </p>

      <div className="flex items-end gap-2 mt-1 mb-3">
        <span className="text-4xl font-bold leading-none" style={{ color: '#1A1C1A' }}>
          {total.toLocaleString('es-CO')}
        </span>
        <span className="text-sm text-[#6b7280] mb-0.5">
          {total === 1 ? 'evento registrado' : 'eventos registrados'}
        </span>
      </div>

      <YearSparkline serie={resumen.serie_anual} />

      <p className="text-xs text-[#4a4a4a] mt-3 leading-relaxed">
        Las <strong style={{ color: dom.color }}>{dom.label}</strong> concentran el{' '}
        <strong>{dom.pct}%</strong> del registro histórico de esta zona.
      </p>
    </BentoCard>
  );
}

// ── Type split: flood vs drought proportion ──────────────────────────────────
function SplitRow({ Icon, label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 text-[#4a4a4a]">
          <Icon size={13} style={{ color }} /> {label}
        </span>
        <span className="font-bold text-[#1A1C1A]">{count.toLocaleString('es-CO')}</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(0,0,0,0.07)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function TypeSplitTile({ resumen }) {
  const total = resumen.inundaciones + resumen.sequias;
  return (
    <BentoCard span={{ col: 4, row: 1 }} variant="default">
      <div className="h-full flex flex-col justify-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
          Tipo de evento
        </span>
        <SplitRow Icon={Droplets} label="Inundaciones" count={resumen.inundaciones} total={total} color={FLOOD} />
        <SplitRow Icon={Sun} label="Sequías" count={resumen.sequias} total={total} color={DROUGHT} />
      </div>
    </BentoCard>
  );
}

// ── Impact stat tile — one figure per tile ────────────────────────────────────
function StatTile({ Icon, value, label, color = INK }) {
  return (
    <BentoCard span={{ col: 3, row: 1 }} variant="default">
      <div className="h-full flex flex-col justify-between" style={{ minHeight: 92 }}>
        <Icon size={16} style={{ color }} />
        <div className="mt-3">
          <div className="text-2xl font-bold leading-none" style={{ color: value == null ? '#9ca3af' : '#1A1C1A' }}>
            {value == null ? '—' : value}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-1">{label}</div>
        </div>
      </div>
    </BentoCard>
  );
}

// ── Recent event tile ─────────────────────────────────────────────────────────
function EventTile({ evento }) {
  const cfg = typeConfig(evento.tipo);
  const { Icon } = cfg;

  const metrics = [
    { Icon: Users, label: 'personas', value: fmtInt(evento.personas_afectadas), color: INK },
    { Icon: Users, label: 'familias', value: fmtInt(evento.familias_afectadas), color: INK },
    { Icon: Wheat, label: 'ha', value: fmtNum(evento.hectareas_afectadas), color: DROUGHT },
    { Icon: Home, label: 'viviendas', value: sumHomes(evento), color: INK },
    { Icon: HeartPulse, label: 'fallecidos', value: fmtInt(evento.fallecidos), color: DEATH },
  ].filter((m) => m.value != null);

  return (
    <BentoCard span={{ col: 6, row: 1 }} variant="default">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5"
            style={{ background: `${cfg.color}15`, color: cfg.color }}
          >
            <Icon size={13} /> {cfg.label}
          </span>
          <span className="text-[11px] font-medium text-[#6b7280]">{fmtFecha(evento.fecha)}</span>
        </div>

        {(evento.municipio || evento.departamento) && (
          <div className="flex items-center gap-1 text-xs text-[#4a4a4a] mb-2.5">
            <MapPin size={12} style={{ color: INK }} />
            {[evento.municipio, evento.departamento].filter(Boolean).join(', ')}
          </div>
        )}

        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2">
            {metrics.map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <m.Icon size={12} style={{ color: m.color, flexShrink: 0 }} />
                <strong className="text-[#1A1C1A]">{m.value}</strong>
                <span className="text-[#6b7280]">{m.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#9ca3af] italic mb-2">
            La fuente no reporta cifras de impacto para este evento.
          </p>
        )}

        {evento.comentarios && (
          <div className="flex items-start gap-1 text-[11px] text-[#6b7280] mb-2">
            <FileText size={11} style={{ marginTop: 2, flexShrink: 0 }} />
            <span className="line-clamp-2">{evento.comentarios}</span>
          </div>
        )}

        <span className="text-[10px] text-[#9ca3af] uppercase tracking-wide mt-auto">
          Fuente: {evento.fuente}
        </span>
      </div>
    </BentoCard>
  );
}

function ShimmerTile({ span }) {
  return (
    <BentoCard span={span} variant="default">
      <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ height: 12, width: '45%', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 28, width: '60%', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 8, width: '100%', background: 'rgba(0,0,0,0.08)', borderRadius: 4 }} />
      </div>
    </BentoCard>
  );
}

function NoticeTile({ Icon, color, children }) {
  return (
    <BentoCard span={{ col: 12, row: 1 }} variant="default">
      <div className="flex flex-col items-center gap-2 text-center py-6 text-sm" style={{ color: '#6b7280' }}>
        <Icon size={26} style={{ color }} />
        <span>{children}</span>
      </div>
    </BentoCard>
  );
}

// ── Main component — renders tiles straight into the parent BentoGrid ─────────
export default function HistorialLocalPanel({ lat, lon, municipio = null, eventType = null, limit = 8 }) {
  const { eventos, resumen, meta, loading, error, empty, fetchHistorial } = useHistorialEventos();

  const hasCoords = lat != null && lon != null;

  useEffect(() => {
    if (hasCoords) fetchHistorial(lat, lon, { eventType, municipio, limit });
  }, [lat, lon, municipio, eventType, limit, hasCoords, fetchHistorial]);

  if (!hasCoords) return null;

  if (error) {
    return <NoticeTile Icon={AlertTriangle} color={DEATH}>{error}</NoticeTile>;
  }

  if (empty) {
    return (
      <NoticeTile Icon={Inbox} color="#9ca3af">
        Sin registros históricos cercanos en las fuentes disponibles.
      </NoticeTile>
    );
  }

  if (loading || !resumen) {
    return (
      <>
        <ShimmerTile span={{ col: 8, row: 1 }} />
        <ShimmerTile span={{ col: 4, row: 1 }} />
        <ShimmerTile span={{ col: 6, row: 1 }} />
        <ShimmerTile span={{ col: 6, row: 1 }} />
      </>
    );
  }

  return (
    <>
      {/* Row 1 — thesis + composition */}
      <HeroTile resumen={resumen} meta={meta} />
      <TypeSplitTile resumen={resumen} />

      {/* Row 2 — human impact, one figure per tile */}
      <StatTile Icon={Users} value={fmtInt(resumen.personas_afectadas)} label="personas afectadas" />
      <StatTile Icon={Users} value={fmtInt(resumen.familias_afectadas)} label="familias afectadas" />
      <StatTile Icon={Wheat} value={fmtNum(resumen.hectareas_afectadas)} label="hectáreas" color={DROUGHT} />
      <StatTile Icon={HeartPulse} value={fmtInt(resumen.fallecidos)} label="fallecidos" color={DEATH} />

      {/* Row 3+ — most recent events */}
      {eventos.map((e, i) => (
        <EventTile key={`${e.fecha}-${e.fuente}-${i}`} evento={e} />
      ))}

      {meta?.total_disponibles > eventos.length && (
        <BentoCard span={{ col: 12, row: 1 }} variant="default">
          <p className="text-[11px] text-[#6b7280] text-center py-1">
            Mostrando los {eventos.length} eventos más recientes de{' '}
            {meta.total_disponibles.toLocaleString('es-CO')} registrados.
          </p>
        </BentoCard>
      )}
    </>
  );
}
