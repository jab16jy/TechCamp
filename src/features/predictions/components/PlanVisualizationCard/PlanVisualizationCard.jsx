import {
  Calendar, Clock, Droplets, FlaskConical, Info, TrendingUp,
  Download, Eye, EyeOff, Shield,
} from 'lucide-react';

export default function PlanVisualizationCard({ plan, previewActive, onTogglePreview, onExport, planGenerado = true }) {
  if (!plan || !planGenerado) return null;

  const riesgoColor =
    plan.riesgo === 'critico' ? '#ba1a1a' : plan.riesgo === 'alto' ? '#b8860b' : '#0f5238';
  const riesgoBg =
    plan.riesgo === 'critico'
      ? 'rgba(186,26,26,0.08)'
      : plan.riesgo === 'alto'
        ? 'rgba(184,134,11,0.08)'
        : 'rgba(15,82,56,0.08)';

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-[#1A1C1A] flex items-center gap-2 mb-4">
        <Shield size={18} />
        Plan de Riego Optimizado
      </h2>

      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-[#6b7280]">
              {plan.sensor_nodo || plan.sensor_id} &middot; {plan.cultivo}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: riesgoBg, color: riesgoColor }}
              >
                Riesgo: {plan.riesgo.toUpperCase()}
              </span>
              <span className="text-xs text-[#6b7280]">
                Humedad: {plan.humedad_actual}% / Umbral: {plan.umbral_cultivo}%
              </span>
            </div>
          </div>
          <button
            onClick={onTogglePreview}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1"
            style={{
              background: previewActive ? 'rgba(15,82,56,0.1)' : 'rgba(107,114,128,0.1)',
              color: previewActive ? '#0f5238' : '#6b7280',
            }}
          >
            {previewActive ? <EyeOff size={12} /> : <Eye size={12} />}
            {previewActive ? 'Ocultar beneficio' : 'Previsualizar beneficio'}
          </button>
        </div>

        {/* Ventana de Aplicacion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(15,82,56,0.06)' }}>
            <Calendar size={16} style={{ color: '#0f5238' }} />
            <div>
              <span className="text-xs font-semibold text-[#1A1C1A]">Ventana de Aplicacion</span>
              <p className="text-xs text-[#4a4a4a] mt-0.5">
                {plan.ventana_inicio} — {plan.ventana_fin}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(184,134,11,0.06)' }}>
            <Clock size={16} style={{ color: '#b8860b' }} />
            <div>
              <span className="text-xs font-semibold text-[#1A1C1A]">Horario Optimo</span>
              <p className="text-xs text-[#4a4a4a] mt-0.5">
                {plan.horario_optimo}
                <br />
                <span className="text-[#6b7280]">Menor evaporacion</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.06)' }}>
            <Droplets size={16} style={{ color: '#2563eb' }} />
            <div>
              <span className="text-xs font-semibold text-[#1A1C1A]">Volumen Total</span>
              <p className="text-xs text-[#4a4a4a] mt-0.5">
                {plan.volumen_total_m3_ha} m³/ha
                <br />
                <span className="text-[#6b7280]">{plan.frecuencia_dias} dias de frecuencia</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dosificacion Variable */}
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <FlaskConical size={14} style={{ color: '#75584d' }} />
            <span className="text-xs font-semibold text-[#1A1C1A]">
              Dosificacion Variable &middot; Suelo {plan.textura_suelo}
            </span>
          </div>

          {plan.eventos && plan.eventos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {plan.eventos.map((evento, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl text-center"
                  style={{
                    background: i === 0 ? 'rgba(15,82,56,0.06)' : 'rgba(255,255,255,0.4)',
                    border: i === 0 ? '1px solid rgba(15,82,56,0.2)' : '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <span className="text-xs font-bold text-[#1A1C1A]">{evento.dia}</span>
                  <span className="block text-xs text-[#6b7280]">{evento.fecha}</span>
                  <span className="block text-sm font-bold text-[#0f5238] mt-1">
                    {evento.litros_ha} L/ha
                  </span>
                  <span className="block text-[10px] text-[#9ca3af]">{evento.hora}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6b7280] italic">Cronograma basado en volumen total y frecuencia.</p>
          )}
        </div>

        {/* XAI */}
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{ background: 'rgba(117,88,77,0.06)' }}
        >
          <Info size={14} style={{ color: '#75584d', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs text-[#4a4a4a] leading-relaxed">
            {plan.justificacion_xai}
          </p>
        </div>

        {/* ET0 info */}
        <div className="flex items-center gap-4 mt-3 text-xs text-[#6b7280]">
          <span className="flex items-center gap-1">
            <TrendingUp size={12} />
            ET₀: {plan.et0_mm_dia} mm/dia
          </span>
          <span>T media: {plan.temperatura_media}°C</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#0f5238' }}
        >
          <Download size={15} />
          Exportar Plan a Tareas
        </button>
      </div>
    </section>
  );
}
