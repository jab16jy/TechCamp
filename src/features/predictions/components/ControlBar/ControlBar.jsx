import { motion } from 'framer-motion';

// ── Constants ──────────────────────────────────────────────────────────────

const DEPARTAMENTOS = [
  'Atlántico',
  'Bolívar',
  'Córdoba',
  'Magdalena',
  'Cesar',
  'La Guajira',
  'Sucre',
  'San Andrés',
];

const CULTIVOS = [
  'Maiz',
  'Yuca',
  'Arroz',
  'Frijol',
  'Platano',
  'Name',
  'Cacao',
  'Algodón',
  'Sorgo',
  'Palma Aceitera',
  'Mango',
  'Ají',
];

const BAR_STYLE = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(18px)',
  borderBottom: '1px solid rgba(0,0,0,0.07)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  width: '100%',
};

const PULSE_DOT_STYLE = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: '#0f5238',
  animation: 'pulse-critical 1.2s ease-in-out infinite',
  display: 'inline-block',
  marginLeft: 6,
  verticalAlign: 'middle',
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ControlBar({
  selectedDept,
  onDeptChange,
  selectedCultivo,
  onCultivoChange,
  selectedFecha,
  onFechaChange,
  onClear,
  loading,
}) {
  const hasSelection = selectedDept || selectedCultivo || selectedFecha;

  return (
    <motion.div
      style={BAR_STYLE}
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1rem',
          padding: '0.75rem 1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Dept selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 180px' }}>
          <label className="bento-field-label" htmlFor="cb-dept">
            Departamento
            {loading && <span style={PULSE_DOT_STYLE} />}
          </label>
          <select
            id="cb-dept"
            className="bento-field-input"
            value={selectedDept || ''}
            onChange={(e) => onDeptChange(e.target.value || null)}
          >
            <option value="">Seleccionar departamento...</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Crop selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
          <label className="bento-field-label" htmlFor="cb-cultivo">
            Cultivo
          </label>
          <select
            id="cb-cultivo"
            className="bento-field-input"
            value={selectedCultivo || ''}
            onChange={(e) => onCultivoChange(e.target.value)}
          >
            <option value="">Seleccionar cultivo...</option>
            {CULTIVOS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
          <label className="bento-field-label" htmlFor="cb-fecha">
            Fecha de siembra
          </label>
          <input
            id="cb-fecha"
            type="date"
            className="bento-field-input"
            value={selectedFecha || ''}
            onChange={(e) => onFechaChange(e.target.value)}
          />
        </div>

        {/* Clear button — only when something is selected */}
        {hasSelection && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 1 }}>
            <button
              className="bento-btn-secondary"
              onClick={onClear}
              style={{ whiteSpace: 'nowrap', height: 34 }}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
