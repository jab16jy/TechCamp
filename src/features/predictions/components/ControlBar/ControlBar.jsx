import { motion } from 'framer-motion';
import { MapPin, Sprout, Calendar, Play, RotateCcw, Loader2 } from 'lucide-react';
import DeptMap from './DeptMap';

// ── Constants ──────────────────────────────────────────────────────────────

const CULTIVOS = [
  'Maiz', 'Yuca', 'Arroz', 'Frijol', 'Platano', 'Name',
  'Cacao', 'Algodón', 'Sorgo', 'Palma Aceitera', 'Mango', 'Ají',
];

// ── Component ──────────────────────────────────────────────────────────────

export default function ControlBar({
  selectedDept,
  onDeptChange,
  selectedCultivo,
  onCultivoChange,
  selectedFecha,
  onFechaChange,
  onClear,
  onExecute,
  loading,
}) {
  const hasSelection = selectedDept || selectedCultivo || selectedFecha;
  const canExecute = !!selectedDept && !loading;

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
            Elige un departamento en el mapa, define cultivo y fecha de siembra,
            y ejecuta la proyección climática.
          </p>
        </div>

        {/* Crop selector */}
        <div className="cb-field">
          <label className="bento-field-label" htmlFor="cb-cultivo">
            <Sprout size={13} />
            Cultivo
          </label>
          <select
            id="cb-cultivo"
            className="bento-field-input"
            value={selectedCultivo || ''}
            onChange={(e) => onCultivoChange(e.target.value)}
          >
            <option value="">Maíz (por defecto)</option>
            {CULTIVOS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div className="cb-field">
          <label className="bento-field-label" htmlFor="cb-fecha">
            <Calendar size={13} />
            Fecha de siembra <span className="cb-optional">(opcional)</span>
          </label>
          <input
            id="cb-fecha"
            type="date"
            className="bento-field-input"
            value={selectedFecha || ''}
            onChange={(e) => onFechaChange(e.target.value)}
          />
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
              <><Play size={15} fill="currentColor" /> Ejecutar proyección</>
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
