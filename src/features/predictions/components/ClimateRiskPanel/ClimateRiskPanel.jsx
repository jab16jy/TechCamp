import {
  AlertTriangle, Thermometer, Droplets, Shield, Cloud, Bug,
  Bell, Calendar,
} from 'lucide-react';

const SEVERIDAD_CONFIG = {
  critico: { color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)', border: 'rgba(186,26,26,0.2)' },
  alto: { color: '#b8860b', bg: 'rgba(184,134,11,0.08)', border: 'rgba(184,134,11,0.15)' },
  moderado: { color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.15)' },
};

const TIPO_ICON = {
  fenomeno_nino: Thermometer,
  fenomeno_nina: Cloud,
  tendencia_calida: Thermometer,
  fitosanitario: Bug,
  estres_hidrico: Droplets,
  estres_termico: Thermometer,
};

export default function ClimateRiskPanel({ proyeccion }) {
  if (!proyeccion) return null;

  const patrones = proyeccion.alertas_patrones || [];
  const globales = proyeccion.alertas_globales || [];
  const allAlerts = [...patrones, ...globales];

  if (allAlerts.length === 0) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} style={{ color: '#0f5238' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Riesgos Climaticos Proyectados</h2>
        </div>
        <p className="text-xs text-[#6b7280]">No se detectaron riesgos climaticos significativos en la proyeccion actual.</p>
      </div>
    );
  }

  const hasNino = patrones.some((p) => p.tipo === 'fenomeno_nino');
  const hasNina = patrones.some((p) => p.tipo === 'fenomeno_nina');

  return (
    <section>
      {/* Banner Macro */}
      {(hasNino || hasNina) && (
        <div
          className="rounded-2xl p-4 mb-3 flex items-center gap-3"
          style={{
            background: hasNino ? 'rgba(186,26,26,0.08)' : 'rgba(37,99,235,0.08)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${hasNino ? 'rgba(186,26,26,0.3)' : 'rgba(37,99,235,0.3)'}`,
          }}
        >
          <AlertTriangle size={24} style={{ color: hasNino ? '#ba1a1a' : '#2563eb' }} />
          <div>
            <h3 className="text-sm font-bold" style={{ color: hasNino ? '#ba1a1a' : '#2563eb' }}>
              Estado: Alerta de {hasNino ? 'El Niño — Fase de Sequia Extrema' : 'La Niña — Fase de Exceso Hidrico'}
            </h3>
            <p className="text-xs text-[#4a4a4a] mt-0.5">
              {hasNino
                ? 'Se recomienda preparar sistemas de riego suplementario. Evaluar cultivos tolerantes a sequia.'
                : 'Se recomienda preparar sistemas de drenaje. Monitorear riesgos fungicos.'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} style={{ color: '#ba1a1a' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Alertas Climaticas Proyectadas</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(186,26,26,0.08)', color: '#ba1a1a' }}>
            {allAlerts.length} alerta{allAlerts.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          {allAlerts.map((a, i) => {
            const sev = SEVERIDAD_CONFIG[a.severidad] || SEVERIDAD_CONFIG.moderado;
            const IconComp = TIPO_ICON[a.tipo] || AlertTriangle;
            return (
              <div
                key={i}
                className="p-3 rounded-xl flex items-start gap-3"
                style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: sev.bg }}>
                  <IconComp size={14} color={sev.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: sev.color }}>
                      {a.severidad.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#6b7280]">{a.tipo.replace(/_/g, ' ')}</span>
                    {a.mes && (
                      <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                        <Calendar size={9} /> Mes {a.mes}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4a4a4a] leading-relaxed">{a.mensaje}</p>
                  {a.cultivo_afectado && (
                    <span className="text-[10px] text-[#6b7280] mt-0.5 block">
                      Cultivo afectado: {a.cultivo_afectado}
                    </span>
                  )}
                  {a.accion && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: '#0f5238' }}>
                      Accion recomendada: {a.accion}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
