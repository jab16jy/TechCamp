import React from 'react';
import {
  Bell,
  Droplets,
  Leaf,
  Brain,
  Satellite,
  Globe,
  Microscope,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';

const SEVERITY_ICON = {
  critico: ShieldAlert,
  alto: Thermometer,
  moderado: Droplets,
};

const SEVERITY_CLASS = {
  critico: 'ia-alert-red',
  alto: 'ia-alert-orange',
  moderado: 'ia-alert-green',
};

const ICON_MAP = {
  fitosanitario: Leaf,
  estres_hidrico: Droplets,
  estres_termico: Thermometer,
};

export default function AIAlertsPanel({ alerts = [] }) {
  if (alerts.length === 0) {
    return (
      <div className="ia-right-col">
        <div className="ia-card-header" style={{ marginBottom: 8 }}>
          <Bell size={16} className="ia-card-icon" />
          <h2 className="ia-card-title">Alertas de IA</h2>
        </div>
        <div className="ia-alert-card ia-alert-green">
          <div className="ia-alert-icon green">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="ia-alert-title">Sin alertas activas</h4>
            <p className="ia-alert-desc">
              Las condiciones proyectadas no presentan riesgos significativos en la ventana de 90 dias.
            </p>
          </div>
        </div>
        <DataSources />
      </div>
    );
  }

  return (
    <div className="ia-right-col">
      <div className="ia-card-header" style={{ marginBottom: 8 }}>
        <Bell size={16} className="ia-card-icon" />
        <h2 className="ia-card-title">Alertas de IA</h2>
      </div>

      {alerts.map((alert, i) => {
        const Icon = ICON_MAP[alert.tipo] || SEVERITY_ICON[alert.severidad] || Leaf;
        const cardClass = SEVERITY_CLASS[alert.severidad] || 'ia-alert-green';

        return (
          <div key={i} className={`ia-alert-card ${cardClass}`}>
            <div className={`ia-alert-icon ${alert.severidad === 'critico' ? 'red' : alert.severidad === 'alto' ? 'orange' : 'green'}`}>
              <Icon size={18} />
            </div>
            <div>
              <h4 className="ia-alert-title">
                {alert.enfermedad || (alert.tipo === 'estres_hidrico' ? 'Estres Hidrico' : alert.tipo === 'estres_termico' ? 'Estres Termico' : 'Alerta Fitosanitaria')}
              </h4>
              <p className="ia-alert-desc">{alert.mensaje}</p>
              {alert.cultivo_afectado && (
                <span className="ia-alert-crop">Cultivo: {alert.cultivo_afectado}</span>
              )}
            </div>
          </div>
        );
      })}

      <DataSources />
    </div>
  );
}

function DataSources() {
  return (
    <div className="ia-sources-card">
      <p className="ia-sources-title">Fuentes de datos</p>
      {[
        { icon: Satellite, name: 'Sentinel-2', desc: 'NDVI · Ultima imagen: hace 6h' },
        { icon: Globe, name: 'NASA POWER', desc: 'Clima historico y actual' },
        { icon: Microscope, name: 'Laboratorio', desc: 'Suelo · Calibracion: 24/05' },
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
  );
}
