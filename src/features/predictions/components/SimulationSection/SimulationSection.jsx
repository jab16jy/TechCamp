import {
  CloudRain, Sun, CloudLightning, Thermometer, Cloud, AlertTriangle,
} from 'lucide-react';
import './SimulationSection.css';

const THRESHOLDS = {
  FLOOD: { precip: 200 },
  DROUGHT: { precip: 30 },
  LIGHTNING: { temp: 32, hum: 75 },
  CRITICAL_DROUGHT: { precip: 10 },
  CRITICAL_LIGHTNING: { temp: 35, hum: 80 },
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getMonthIndex(monthName) {
  const idx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === monthName?.toLowerCase()
  );
  return idx >= 0 ? idx + 1 : null;
}

function computeSeverity(threshold, mes) {
  if (!mes || typeof mes.precipitacion !== 'number') return 'moderada';
  if (threshold === 'flood') {
    return mes.precipitacion > 300 ? 'crítica' : 'alta';
  }
  if (threshold === 'drought') {
    return mes.precipitacion < THRESHOLDS.CRITICAL_DROUGHT.precip ? 'crítica' : 'moderada';
  }
  if (threshold === 'lightning') {
    if (typeof mes.temperatura !== 'number' || typeof mes.humedad !== 'number') return 'moderada';
    return (mes.temperatura > THRESHOLDS.CRITICAL_LIGHTNING.temp && mes.humedad > THRESHOLDS.CRITICAL_LIGHTNING.hum)
      ? 'alta'
      : 'moderada';
  }
  return 'moderada';
}

function getOverallSeverity(severities) {
  if (severities.includes('crítica')) return { label: 'Crítica', className: 'ss-severity--critica' };
  if (severities.includes('alta')) return { label: 'Alta', className: 'ss-severity--alta' };
  if (severities.includes('moderada')) return { label: 'Moderada', className: 'ss-severity--moderada' };
  return { label: 'Baja', className: 'ss-severity--baja' };
}

function RiskIcon({ icon: Icon, severity }) {
  const colorMap = {
    crítica: '#ba1a1a',
    alta: '#d97706',
    moderada: '#b8860b',
    niño: '#2563eb',
    niña: '#0f5238',
  };
  const bgMap = {
    crítica: 'rgba(186,26,26,0.1)',
    alta: 'rgba(217,119,6,0.1)',
    moderada: 'rgba(184,134,11,0.08)',
    niño: 'rgba(37,99,235,0.1)',
    niña: 'rgba(15,82,56,0.1)',
  };
  const key = severity || 'moderada';
  return (
    <div
      className="ss-risk-icon"
      style={{ background: bgMap[key] || bgMap.moderada, color: colorMap[key] || colorMap.moderada }}
    >
      <Icon size={24} />
    </div>
  );
}

function RiskCard({ icon, title, months, severities, riskKey, alertas }) {
  const hasAlertas = alertas && alertas.length > 0;
  const activeMonths = months.filter(Boolean);
  const overall = getOverallSeverity(severities);
  const hasData = activeMonths.length > 0 || hasAlertas;

  if (!hasData) {
    return (
      <div className="ss-card ss-card--empty">
        <div className="ss-card-header">
          <RiskIcon icon={icon} severity="baja" />
          <span className="ss-card-title">{title}</span>
        </div>
        <p className="ss-empty-text">Sin riesgo detectado</p>
      </div>
    );
  }

  return (
    <div className={`ss-card ${overall.className}`}>
      <div className="ss-card-header">
        <RiskIcon icon={icon} severity={riskKey === 'nino' ? 'niño' : riskKey === 'nina' ? 'niña' : severities[0]} />
        <div className="ss-card-title-row">
          <span className="ss-card-title">{title}</span>
          <span className={`ss-severity-badge ${overall.className}`}>{overall.label}</span>
        </div>
      </div>
      {hasAlertas ? (
        <div className="ss-card-body">
          {alertas.map((a, i) => (
            <div key={i} className="ss-alerta-item">
              <span className="ss-alerta-desc">{a.descripcion || a.tipo || ''}</span>
              {a.meses_afectados?.length > 0 && (
                <span className="ss-alerta-meses">{a.meses_afectados.join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="ss-card-body">
          <span className="ss-month-count">
            {activeMonths.length} {activeMonths.length === 1 ? 'mes afectado' : 'meses afectados'}
          </span>
          <span className="ss-month-list">{activeMonths.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

export default function SimulationSection({ proyeccion }) {
  if (!proyeccion?.meses?.length) {
    return (
      <div className="ss-empty-state">
        <AlertTriangle size={32} className="ss-empty-icon" />
        <p>No hay datos de proyección disponibles para simular fenómenos climáticos.</p>
      </div>
    );
  }

  const meses = proyeccion.meses || [];
  const alertasPatrones = proyeccion.alertas_patrones || [];

  // 1. Inundaciones: precipitacion > 200mm
  const floodMonths = meses
    .filter((m) => m && typeof m.precipitacion === 'number' && m.precipitacion > THRESHOLDS.FLOOD.precip)
    .map((m) => ({ name: m.month || '', severity: computeSeverity('flood', m) }));

  // 2. Sequías: precipitacion < 30mm
  const droughtMonths = meses
    .filter((m) => m && typeof m.precipitacion === 'number' && m.precipitacion < THRESHOLDS.DROUGHT.precip)
    .map((m) => ({ name: m.month || '', severity: computeSeverity('drought', m) }));

  // 3. Tormentas eléctricas: temp > 32°C AND humedad > 75%
  const lightningMonths = meses
    .filter((m) => m && typeof m.temperatura === 'number' && typeof m.humedad === 'number' && m.temperatura > THRESHOLDS.LIGHTNING.temp && m.humedad > THRESHOLDS.LIGHTNING.hum)
    .map((m) => ({ name: m.month || '', severity: computeSeverity('lightning', m) }));

  // 4. Fenómenos Niño/Niña from alertas_patrones
  const ninoAlertas = (alertasPatrones || []).filter(
    (a) => a && (a.fenomeno_nino || (a.tipo && typeof a.tipo === 'string' && a.tipo.toLowerCase().includes('nino')))
  );
  const ninaAlertas = (alertasPatrones || []).filter(
    (a) => a && (a.fenomeno_nina || (a.tipo && typeof a.tipo === 'string' && a.tipo.toLowerCase().includes('nina')))
  );

  const allEmpty =
    floodMonths.length === 0 &&
    droughtMonths.length === 0 &&
    lightningMonths.length === 0 &&
    ninoAlertas.length === 0 &&
    ninaAlertas.length === 0;

  if (allEmpty) {
    return (
      <div className="ss-empty-state">
        <AlertTriangle size={32} className="ss-empty-icon" />
        <p>No se detectaron fenómenos climáticos extremos en la proyección actual.</p>
      </div>
    );
  }

  return (
    <div className="ss-grid">
      <RiskCard
        icon={CloudRain}
        title="Inundaciones"
        months={floodMonths.map((m) => m.name)}
        severities={floodMonths.map((m) => m.severity)}
        riskKey="flood"
        alertas={null}
      />
      <RiskCard
        icon={Sun}
        title="Sequías"
        months={droughtMonths.map((m) => m.name)}
        severities={droughtMonths.map((m) => m.severity)}
        riskKey="drought"
        alertas={null}
      />
      <RiskCard
        icon={CloudLightning}
        title="Tormentas Eléctricas"
        months={lightningMonths.map((m) => m.name)}
        severities={lightningMonths.map((m) => m.severity)}
        riskKey="lightning"
        alertas={null}
      />
      <RiskCard
        icon={ninoAlertas.length > 0 ? Thermometer : Cloud}
        title={ninoAlertas.length > 0 && ninaAlertas.length > 0 ? 'Niño / Niña' : ninoAlertas.length > 0 ? 'Fenómeno Niño' : 'Fenómeno Niña'}
        months={[]}
        severities={['moderada']}
        riskKey={ninoAlertas.length > 0 ? 'nino' : 'nina'}
        alertas={[...ninoAlertas, ...ninaAlertas]}
      />
    </div>
  );
}
