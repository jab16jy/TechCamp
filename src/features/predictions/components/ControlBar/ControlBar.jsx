import { motion } from 'framer-motion';
import { MapPin, Building2, CalendarRange, Play, RotateCcw, Loader2, CloudRain, Thermometer, FlaskConical } from 'lucide-react';
import { MUNICIPIOS_REFERENCIA } from '@shared/services/api';
import DeptMap from './DeptMap';

// ── Constants ──────────────────────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ── Component ──────────────────────────────────────────────────────────────

export default function ControlBar({
  selectedDept,
  onDeptChange,
  selectedMunicipio,
  onMunicipioChange,
  selectedMes,
  onMesChange,
  precipDelta,
  onPrecipChange,
  tempDelta,
  onTempChange,
  onClear,
  onExecute,
  loading,
}) {
  const hasScenario = Number(precipDelta) !== 0 || Number(tempDelta) !== 0;
  const hasSelection = selectedDept || selectedMunicipio || hasScenario;
  const canExecute = !!selectedDept && !loading;

  // Municipios available for the chosen department (reference centroids).
  const municipios = selectedDept
    ? MUNICIPIOS_REFERENCIA.filter((m) => m.departamento === selectedDept)
    : [];

  const fmtDelta = (v, unit) => `${Number(v) > 0 ? '+' : ''}${v}${unit}`;

  return (
    <motion.section
      className="cb-panel"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Left: interactive map ── */}
      <div className="cb-map-col">
        <div className="cb-section-label">
          <MapPin size={13} />
          Departamento
          {loading && <span className="cb-pulse-dot" />}
        </div>
        <DeptMap selectedDept={selectedDept} onDeptChange={onDeptChange} />
      </div>

      {/* ── Right: controls ── */}
      <div className="cb-controls-col">
        <div>
          <h2 className="cb-title">Configurar consulta</h2>
          <p className="cb-subtitle">
            Elige un departamento (y opcionalmente un municipio) y el mes a evaluar.
            Puedes simular un escenario de clima antes de ejecutar.
          </p>
        </div>

        {/* Municipio selector (depends on department) */}
        <div className="cb-field">
          <label className="bento-field-label" htmlFor="cb-municipio">
            <Building2 size={13} />
            Municipio <span className="cb-optional">(opcional)</span>
          </label>
          <select
            id="cb-municipio"
            className="bento-field-input"
            value={selectedMunicipio || ''}
            onChange={(e) => onMunicipioChange(e.target.value)}
            disabled={!selectedDept || municipios.length === 0}
          >
            <option value="">
              {selectedDept ? 'Todo el departamento (centroide)' : 'Elige un departamento primero'}
            </option>
            {municipios.map((m) => (
              <option key={m.id} value={m.nombre}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {/* Month to evaluate */}
        <div className="cb-field">
          <label className="bento-field-label" htmlFor="cb-mes">
            <CalendarRange size={13} />
            Mes a evaluar
          </label>
          <select
            id="cb-mes"
            className="bento-field-input"
            value={selectedMes}
            onChange={(e) => onMesChange(Number(e.target.value))}
          >
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Climate scenario (simulation) */}
        <div className="cb-scenario">
          <div className="cb-section-label" style={{ marginBottom: 6 }}>
            <FlaskConical size={13} />
            Escenario climático <span className="cb-optional">(simulación)</span>
          </div>

          <div className="cb-slider-row">
            <label className="cb-slider-label" htmlFor="cb-precip">
              <CloudRain size={12} /> Lluvia
              <strong className="cb-slider-val">{fmtDelta(precipDelta, '%')}</strong>
            </label>
            <input
              id="cb-precip"
              type="range"
              min={-100}
              max={300}
              step={10}
              value={precipDelta}
              onChange={(e) => onPrecipChange(Number(e.target.value))}
              className="cb-slider"
            />
          </div>

          <div className="cb-slider-row">
            <label className="cb-slider-label" htmlFor="cb-temp">
              <Thermometer size={12} /> Temperatura
              <strong className="cb-slider-val">{fmtDelta(tempDelta, '°C')}</strong>
            </label>
            <input
              id="cb-temp"
              type="range"
              min={-5}
              max={5}
              step={0.5}
              value={tempDelta}
              onChange={(e) => onTempChange(Number(e.target.value))}
              className="cb-slider"
            />
          </div>

          {hasScenario && (
            <button
              type="button"
              className="cb-scenario-reset"
              onClick={() => { onPrecipChange(0); onTempChange(0); }}
            >
              Restablecer escenario
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="cb-actions">
          <button
            className="cb-btn-execute"
            onClick={onExecute}
            disabled={!canExecute}
          >
            {loading ? (
              <><Loader2 size={15} className="cb-spin" /> Calculando…</>
            ) : (
              <><Play size={15} fill="currentColor" /> Ejecutar</>
            )}
          </button>

          {hasSelection && (
            <button className="cb-btn-clear" onClick={onClear} title="Limpiar selección">
              <RotateCcw size={14} /> Limpiar
            </button>
          )}
        </div>

        {!selectedDept && (
          <p className="cb-hint">
            👆 Selecciona un departamento para habilitar el botón.
          </p>
        )}
      </div>
    </motion.section>
  );
}
