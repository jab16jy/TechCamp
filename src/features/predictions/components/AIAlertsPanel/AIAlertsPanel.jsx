import React from 'react';
import {
  Bell,
  Droplets,
  Leaf,
  Brain,
  Satellite,
  Globe,
  Microscope,
} from 'lucide-react';

export default function AIAlertsPanel() {
  return (
    <div className="ia-right-col">
      <div className="ia-card-header" style={{ marginBottom: 8 }}>
        <Bell size={16} className="ia-card-icon" />
        <h2 className="ia-card-title">Alertas de IA</h2>
      </div>

      <div className="ia-alert-card ia-alert-red">
        <div className="ia-alert-icon red">
          <Droplets size={18} />
        </div>
        <div>
          <h4 className="ia-alert-title">Estrés Hídrico</h4>
          <p className="ia-alert-desc">
            Sector B-12 en nivel crítico. Riego de emergencia recomendado en 24h.
          </p>
          <button className="ia-alert-action">Activar Riego →</button>
        </div>
      </div>

      <div className="ia-alert-card ia-alert-green">
        <div className="ia-alert-icon green">
          <Leaf size={18} />
        </div>
        <div>
          <h4 className="ia-alert-title">Ventana de Cosecha Óptima</h4>
          <p className="ia-alert-desc">
            Maduración máxima proyectada: 12–15 Noviembre.
          </p>
          <button className="ia-alert-action green">
            Ver Calendario →
          </button>
        </div>
      </div>

      <div className="ia-promo-card">
        <Brain size={40} className="ia-promo-bg-icon" />
        <h4 className="ia-promo-title">¿Optimizar fertilización?</h4>
        <p className="ia-promo-desc">
          La IA puede recalcular costos según precios actuales de mercado y salud del suelo.
        </p>
        <button className="ia-promo-btn">Ver Plan Optimizado</button>
      </div>

      {/* Data Sources */}
      <div className="ia-sources-card">
        <p className="ia-sources-title">Fuentes de datos</p>
        {[
          {
            icon: Satellite,
            name: 'Sentinel-2',
            desc: 'NDVI · Última imagen: hace 6h',
          },
          {
            icon: Globe,
            name: 'NASA POWER',
            desc: 'Clima histórico y actual',
          },
          {
            icon: Microscope,
            name: 'Laboratorio',
            desc: 'Suelo · Calibración: 24/05',
          },
        ].map((s) => (
          <div key={s.name} className="ia-source-row">
            <s.icon size={16} className="ia-source-icon" />
            <div>
              <p className="ia-source-name">{s.name}</p>
              <p className="ia-source-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
