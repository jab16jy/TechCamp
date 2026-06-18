/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import {
  History, AlertTriangle, Droplets, Sun, Users, Home, Wheat, HeartPulse,
  CalendarRange, MapPin, FileText, Database, Inbox,
} from 'lucide-react';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import useHistorialEventos from '@features/predictions/hooks/useHistorialEventos';

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  inundacion: { label: 'Inundación', color: '#1d6fa5', Icon: Droplets },
  sequia: { label: 'Sequía', color: '#b8860b', Icon: Sun },
};

const GLASS_STYLE = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 16,
  padding: '1rem',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function typeConfig(tipo) {
  return TYPE_CONFIG[tipo] || { label: tipo, color: '#0f5238', Icon: History };
}

// Source reported the value (incl. a real 0) → show it. Null/undefined → hide.
function hasValue(v) {
  return v !== null && v !== undefined && Number.isFinite(Number(v));
}

function fmtInt(v) {
  return hasValue(v) ? Math.round(Number(v)).toLocaleString('es-CO') : null;
}

function fmtNum(v) {
  if (!hasValue(v)) return null;
  const n = Number(v);
  return (Number.isInteger(n) ? n : n.toFixed(1)).toLocaleString('es-CO');
}

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatChip({ Icon, label, value, color = '#0f5238' }) {
  if (value == null) return null;
  return (
    <span className="rounded-xl px-3 py-2 bg-white/55 border border-white/45 flex items-center gap-1.5 text-xs text-[#4a4a4a]">
      <Icon size={13} style={{ color }} />
      <strong className="text-[#1A1C1A]">{value}</strong>
      <span className="text-[#6b7280]">{label}</span>
    </span>
  );
}

function SummaryCard({ resumen, meta }) {
  if (!resumen) return null;
  const r = resumen;
  const lugar = [meta?.municipio, meta?.departamento].filter(Boolean).join(', ');
  const rango = r.rango_fechas ? `${fmtFecha(r.rango_fechas.desde)} – ${fmtFecha(r.rango_fechas.hasta)}` : null;
  // Combine homes only when the source actually reported at least one figure.
  const viviendas = hasValue(r.viviendas_destruidas) || hasValue(r.viviendas_averiadas)
    ? fmtInt((Number(r.viviendas_destruidas) || 0) + (Number(r.viviendas_averiadas) || 0))
    : null;

  return (
    <BentoCard span={{ col: 12, row: 1 }} variant="default">
      <div style={{ ...GLASS_STYLE, background: 'linear-gradient(135deg, rgba(15,82,56,0.07), rgba(255,255,255,0.58))' }}>
        <div className="flex items-center gap-2 mb-3">
          <Database size={15} style={{ color: '#0f5238' }} />
          <span className="text-sm font-bold text-[#1A1C1A]">
            Resumen agregado{lugar ? ` · ${lugar}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatChip Icon={History} label="eventos" value={`${r.total_eventos}`} />
          <StatChip Icon={Droplets} label="inundaciones" value={`${r.inundaciones}`} color="#1d6fa5" />
          <StatChip Icon={Sun} label="sequías" value={`${r.sequias}`} color="#b8860b" />
          <StatChip Icon={Users} label="personas afectadas" value={fmtInt(r.personas_afectadas)} />
          <StatChip Icon={Users} label="familias" value={fmtInt(r.familias_afectadas)} />
          <StatChip Icon={Wheat} label="hectáreas" value={fmtNum(r.hectareas_afectadas)} color="#b8860b" />
          <StatChip Icon={Home} label="viviendas afectadas" value={viviendas} />
          <StatChip Icon={HeartPulse} label="fallecidos" value={fmtInt(r.fallecidos)} color="#ba1a1a" />
          {rango && <StatChip Icon={CalendarRange} label="" value={rango} />}
        </div>
      </div>
    </BentoCard>
  );
}

function EventCard({ evento }) {
  const cfg = typeConfig(evento.tipo);
  const { Icon } = cfg;

  const impacts = [
    { Icon: Users, label: 'personas', value: fmtInt(evento.personas_afectadas) },
    { Icon: Users, label: 'familias', value: fmtInt(evento.familias_afectadas) },
    { Icon: Wheat, label: 'ha', value: fmtNum(evento.hectareas_afectadas), color: '#b8860b' },
    { Icon: Home, label: 'viv. destr.', value: fmtInt(evento.viviendas_destruidas) },
    { Icon: Home, label: 'viv. aver.', value: fmtInt(evento.viviendas_averiadas) },
    { Icon: HeartPulse, label: 'fallecidos', value: fmtInt(evento.fallecidos), color: '#ba1a1a' },
    { Icon: HeartPulse, label: 'heridos', value: fmtInt(evento.heridos), color: '#ba1a1a' },
    { Icon: HeartPulse, label: 'desap.', value: fmtInt(evento.desaparecidos), color: '#ba1a1a' },
  ].filter((i) => i.value != null);

  return (
    <BentoCard span={{ col: 6, row: 1 }} variant="default">
      <div style={GLASS_STYLE}>
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <Icon size={15} style={{ color: cfg.color }} />
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${cfg.color}18`, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <span className="text-[11px] text-[#6b7280] flex items-center gap-1">
            <CalendarRange size={11} /> {fmtFecha(evento.fecha)}
          </span>
        </div>

        {(evento.municipio || evento.departamento) && (
          <div className="flex items-center gap-1 text-xs text-[#4a4a4a] mb-2">
            <MapPin size={12} style={{ color: '#0f5238' }} />
            {[evento.municipio, evento.departamento].filter(Boolean).join(', ')}
          </div>
        )}

        {impacts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {impacts.map((im, idx) => (
              <span
                key={idx}
                className="text-[11px] rounded-lg px-2 py-1 bg-white/55 border border-white/45 flex items-center gap-1 text-[#4a4a4a]"
              >
                <im.Icon size={11} style={{ color: im.color || '#0f5238' }} />
                <strong className="text-[#1A1C1A]">{im.value}</strong> {im.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#9ca3af] mb-2 italic">
            La fuente no reporta cifras de impacto para este evento.
          </p>
        )}

        {evento.comentarios && (
          <div className="flex items-start gap-1 text-[11px] text-[#6b7280] mb-1">
            <FileText size={11} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{evento.comentarios}</span>
          </div>
        )}

        <span className="text-[10px] text-[#9ca3af] uppercase tracking-wide">Fuente: {evento.fuente}</span>
      </div>
    </BentoCard>
  );
}

function ShimmerCard({ span }) {
  return (
    <BentoCard span={span} variant="default">
      <div style={{ ...GLASS_STYLE, animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ height: 14, width: '45%', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 10, width: '70%', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 10 }} />
        <div style={{ height: 24, width: '90%', background: 'rgba(0,0,0,0.08)', borderRadius: 8 }} />
      </div>
    </BentoCard>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function HistorialLocalPanel({ lat, lon, municipio = null, eventType = null, limit = 8 }) {
  const { eventos, resumen, meta, loading, error, empty, fetchHistorial } = useHistorialEventos();

  const hasCoords = lat != null && lon != null;

  useEffect(() => {
    if (hasCoords) {
      fetchHistorial(lat, lon, { eventType, municipio, limit });
    }
  }, [lat, lon, municipio, eventType, limit, hasCoords, fetchHistorial]);

  if (!hasCoords) return null;

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <History size={16} style={{ color: '#0f5238' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Historial local de eventos</h2>
        </div>
        <span className="text-[11px] text-[#6b7280]">
          Inundaciones y sequías registradas · UNGRD / HDX
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

      {!error && empty && (
        <div
          className="text-xs text-[#6b7280] rounded-xl px-4 py-6 flex flex-col items-center gap-2 text-center"
          style={{ ...GLASS_STYLE }}
        >
          <Inbox size={24} style={{ color: '#9ca3af' }} />
          <span>Sin registros históricos cercanos en las fuentes disponibles.</span>
        </div>
      )}

      {!error && !empty && (
        <BentoGrid>
          {loading ? (
            <>
              <ShimmerCard span={{ col: 12, row: 1 }} />
              <ShimmerCard span={{ col: 6, row: 1 }} />
              <ShimmerCard span={{ col: 6, row: 1 }} />
            </>
          ) : (
            <>
              <SummaryCard resumen={resumen} meta={meta} />
              {eventos.map((e, idx) => (
                <EventCard key={`${e.fecha}-${e.fuente}-${idx}`} evento={e} />
              ))}
              {meta?.total_disponibles > eventos.length && (
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <p className="text-[11px] text-[#6b7280] text-center py-1">
                    Mostrando los {eventos.length} eventos más recientes de {meta.total_disponibles} registrados.
                  </p>
                </BentoCard>
              )}
            </>
          )}
        </BentoGrid>
      )}
    </section>
  );
}
