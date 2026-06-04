import { useState } from 'react';
import { AlertTriangle, Thermometer, Droplets, Bug, Cloud, Shield } from 'lucide-react';
import './MitigationActions.css';

const TIPO_ICON = {
  fenomeno_nino: Thermometer,
  fenomeno_nina: Cloud,
  tendencia_calida: Thermometer,
  fitosanitario: Bug,
  estres_hidrico: Droplets,
  estres_termico: Thermometer,
};

const SEVERIDAD_CONFIG = {
  critico: { color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)', border: 'rgba(186,26,26,0.2)' },
  alto: { color: '#b8860b', bg: 'rgba(184,134,11,0.08)', border: 'rgba(184,134,11,0.15)' },
  moderado: { color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.15)' },
};

export default function MitigationActions({ proyeccion }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!proyeccion) return null;

  const allAlerts = [
    ...(proyeccion.alertas_globales || []),
    ...(proyeccion.alertas_patrones || []),
  ];

  const relevantAlerts = allAlerts.filter(
    (a) => a.severidad === 'critico' || a.severidad === 'alto',
  );

  // ── Empty state ──
  if (relevantAlerts.length === 0) {
    return (
      <div className="mitigation-container">
        <div className="mitigation-header">
          <Shield size={16} style={{ color: '#0f5238' }} />
          <h2>Riesgos Detectados</h2>
        </div>
        <div className="mitigation-empty">
          <div className="mitigation-empty-icon">
            <Shield size={24} style={{ color: '#0f5238', opacity: 0.6 }} />
          </div>
          <h3>Sin riesgos detectados en la proyección actual</h3>
          <p>No se encontraron alertas críticas o de alto riesgo en los datos proyectados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mitigation-container">
      <div className="mitigation-header">
        <Shield size={16} style={{ color: '#0f5238' }} />
        <h2>Riesgos Detectados</h2>
        <span className="mitigation-count">{relevantAlerts.length}</span>
      </div>

      <div className="mitigation-grid">
        {relevantAlerts.map((a, i) => {
          const sev = SEVERIDAD_CONFIG[a.severidad] || SEVERIDAD_CONFIG.moderado;
          const IconComp = TIPO_ICON[a.tipo] || AlertTriangle;
          const isExpanded = expandedIndex === i;

          return (
            <div
              key={i}
              className="mitigation-card"
              style={{ borderLeftColor: sev.color }}
            >
              <div className="mitigation-card-header">
                <div className="mitigation-card-icon" style={{ background: sev.bg }}>
                  <IconComp size={14} color={sev.color} />
                </div>
                <div className="mitigation-card-info">
                  <div className="mitigation-card-tags">
                    <span className="mitigation-severity" style={{ color: sev.color }}>
                      {a.severidad.toUpperCase()}
                    </span>
                    <span className="mitigation-tipo">{a.tipo.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="mitigation-message">{a.mensaje}</p>
                  {a.cultivo_afectado && (
                    <span className="mitigation-cultivo">Cultivo afectado: {a.cultivo_afectado}</span>
                  )}
                </div>
              </div>

              {a.accion && (
                <div className="mitigation-card-action">
                  <button
                    className="mitigation-action-btn"
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  >
                    {isExpanded ? 'Ocultar' : 'Cómo Afrontarlo'}
                  </button>
                  {isExpanded && (
                    <div className="mitigation-action-detail">
                      {a.accion}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
