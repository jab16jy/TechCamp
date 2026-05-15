import React from 'react';
import {
  SlidersHorizontal,
  Droplets,
  FlaskConical,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function SimulatorPanel({
  riego,
  npk,
  fechaSiembra,
  variedad,
  simulando,
  simResult,
  onRiegoChange,
  onNpkChange,
  onFechaChange,
  onVariedadChange,
  onSimular,
  onClearSim,
  onCompareToggle,
  compare,
}) {
  return (
    <div className="ia-card">
      <div className="ia-card-header">
        <SlidersHorizontal size={16} className="ia-card-icon" />
        <h2 className="ia-card-title">Simulador de Rendimiento</h2>
      </div>

      <div className="ia-form-group">
        <label className="ia-form-label">Fecha de Siembra</label>
        <input
          type="date"
          className="ia-input"
          value={fechaSiembra}
          onChange={(e) => onFechaChange(e.target.value)}
        />
      </div>
      <div className="ia-form-group">
        <label className="ia-form-label">Variedad de Semilla</label>
        <select
          className="ia-select"
          value={variedad}
          onChange={(e) => onVariedadChange(e.target.value)}
        >
          <option>Híbrido Premium Maíz A-21</option>
          <option>Bio-Resistente Soja G-90</option>
          <option>Variedad Tradicional</option>
        </select>
      </div>

      <div className="ia-slider-group">
        <label className="ia-slider-label">
          <Droplets size={14} style={{ color: '#3b82f6' }} />
          Ajuste de Riego
          <span className="ia-slider-val">{riego}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={riego}
          onChange={(e) => onRiegoChange(+e.target.value)}
          className="ia-slider ia-slider-blue"
        />
      </div>

      <div className="ia-slider-group">
        <label className="ia-slider-label">
          <FlaskConical size={14} style={{ color: '#10b981' }} />
          Fertilización NPK
          <span className="ia-slider-val">{npk} kg/ha</span>
        </label>
        <input
          type="range"
          min="0"
          max="250"
          value={npk}
          onChange={(e) => onNpkChange(+e.target.value)}
          className="ia-slider ia-slider-green"
        />
      </div>

      <button
        className="ia-btn-execute"
        onClick={onSimular}
        disabled={simulando}
      >
        {simulando ? (
          <Loader2 size={16} className="ia-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        {simulando ? 'Procesando modelo…' : 'Ejecutar Simulación Predictiva'}
      </button>

      {simResult && (
        <button
          className="ia-btn-ghost"
          onClick={onClearSim}
          style={{ marginTop: 4, justifyContent: 'center' }}
        >
          Restablecer valores en vivo
        </button>
      )}

      <div className="ia-compare-row">
        <label className="ia-compare-label">
          <span>Comparar Escenarios</span>
          <button
            className={`ia-toggle ${compare ? 'ia-toggle-on' : ''}`}
            onClick={() => onCompareToggle(!compare)}
            aria-pressed={compare}
          >
            <span className="ia-toggle-knob"></span>
          </button>
        </label>
        {compare && (
          <span className="ia-compare-hint">Escenario A vs B activo</span>
        )}
      </div>
    </div>
  );
}
