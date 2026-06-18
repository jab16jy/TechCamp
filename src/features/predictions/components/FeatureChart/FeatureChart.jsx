import { Target } from 'lucide-react';

const FACTOR_COLORS = {
  Precipitacion: '#2563eb',
  Temperatura: '#ba1a1a',
  Humedad: '#0f5238',
  'pH del Suelo': '#75584d',
  'Materia Organica': '#b8860b',
  NDVI: '#386a20',
};

export default function FeatureChart({ factors }) {
  if (!factors?.length) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} style={{ color: '#0f5238' }} />
          <h2 className="text-sm font-bold text-[#1A1C1A]">Factores considerados</h2>
        </div>
        <p className="text-xs text-[#6b7280] italic">Sin datos de factores disponibles. Genera una proyeccion primero.</p>
      </div>
    );
  }

  const sorted = [...factors].sort((a, b) => (b.porcentaje_impacto || 0) - (a.porcentaje_impacto || 0));
  const maxImpact = Math.max(...sorted.map((f) => f.porcentaje_impacto || 0), 1);

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Target size={16} style={{ color: '#0f5238' }} />
        <h2 className="text-sm font-bold text-[#1A1C1A]">Factores considerados</h2>
      </div>
      <p className="text-xs text-[#6b7280] mb-4">
        Contribucion ponderada de cada variable climatica y edafica en la recomendacion del cultivo
        optimo. Estos pesos provienen del motor de recomendacion estacional, no del modelo de riesgo.
      </p>

      <div className="space-y-2.5">
        {sorted.map((f) => {
          const pct = f.porcentaje_impacto || 0;
          const width = Math.max(2, (pct / maxImpact) * 100);
          const color = FACTOR_COLORS[f.factor] || '#6b7280';
          const scorePct = Math.round((f.score_parcial || 0) * 100);

          return (
            <div key={f.factor}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-[#1A1C1A]">{f.factor}</span>
                <span className="text-xs text-[#6b7280]">
                  Peso: {f.peso?.toFixed(2)} · Score: {scorePct}%
                </span>
              </div>
              <div className="w-full h-5 rounded-full relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${color}22, ${color})`,
                  }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[#9ca3af] mt-3">
        Justificacion tecnica: las barras muestran el porcentaje de impacto relativo de cada factor en la
        puntuacion final del cultivo recomendado por el motor de planificacion estacional.
      </p>
    </div>
  );
}
