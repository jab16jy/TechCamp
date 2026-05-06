import { useState, useEffect } from 'react';
import styles from './AnalysisForm.module.css';

/**
 * AnalysisForm — Reusable form for crop analysis.
 * @param {Object} data - Current form data.
 * @param {Function} onChange - Callback when a field changes.
 * @param {Array} municipalities - List of available municipalities.
 * @param {string} mode - "simple" (default) or "advanced".
 */
const AnalysisForm = ({ data, onChange, municipalities = [], mode = 'simple' }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

  useEffect(() => {
    if (municipalities.length > 0) {
      const uniqueDeps = [...new Set(municipalities.map(m => m.departamento))].sort();
      setDepartamentos(uniqueDeps);
    }
  }, [municipalities]);

  useEffect(() => {
    if (data.departamento) {
      const filtered = municipalities
        .filter(m => m.departamento === data.departamento)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setMunicipiosFiltrados(filtered);
    } else {
      setMunicipiosFiltrados([]);
    }
  }, [data.departamento, municipalities]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formGrid}>
        {/* Basic Fields */}
        <div className={styles.field}>
          <label>Departamento</label>
          <select 
            name="departamento" 
            value={data.departamento || ''} 
            onChange={handleInputChange} 
            required
          >
            <option value="">Selecciona departamento...</option>
            {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label>Municipio</label>
          <select 
            name="municipio" 
            value={data.municipio || ''} 
            onChange={handleInputChange} 
            required 
            disabled={!data.departamento}
          >
            <option value="">Selecciona municipio...</option>
            {municipiosFiltrados.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label>Tipo de Suelo</label>
          <select 
            name="tipo_suelo" 
            value={data.tipo_suelo || ''} 
            onChange={handleInputChange} 
            required
          >
            <option value="">Selecciona...</option>
            <option value="Franco-Arcilloso">Franco-Arcilloso</option>
            <option value="Arenoso">Arenoso</option>
            <option value="Limoso">Limoso</option>
            <option value="Arcilloso">Arcilloso</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Mes de Siembra</label>
          <select 
            name="mes_siembra" 
            value={data.mes_siembra || ''} 
            onChange={handleInputChange} 
            required
          >
            <option value="">Selecciona mes...</option>
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Área (hectáreas)</label>
          <input 
            type="number" 
            name="area_hectareas" 
            value={data.area_hectareas || ''} 
            onChange={handleInputChange} 
            placeholder="Ej: 10.5" 
            required 
            step="0.1"
          />
        </div>

        <div className={styles.field}>
          <label>Acceso a Riego</label>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleOption}>
              <input 
                type="radio" 
                name="acceso_riego" 
                value="true" 
                checked={data.acceso_riego === true || data.acceso_riego === 'true'} 
                onChange={() => onChange({ acceso_riego: true })}
              />
              <span>Sí</span>
            </label>
            <label className={styles.toggleOption}>
              <input 
                type="radio" 
                name="acceso_riego" 
                value="false" 
                checked={data.acceso_riego === false || data.acceso_riego === 'false'} 
                onChange={() => onChange({ acceso_riego: false })}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Advanced Fields */}
        {mode === 'advanced' && (
          <>
            <div className={styles.field}>
              <label>pH del Suelo <span className={styles.optional}>(opcional)</span></label>
              <input 
                type="number" 
                name="ph_suelo" 
                value={data.ph_suelo || ''} 
                onChange={handleInputChange} 
                placeholder="Ej: 6.5" 
                step="0.1"
                min="0"
                max="14"
              />
            </div>

            <div className={styles.field}>
              <label>Textura del Suelo <span className={styles.optional}>(opcional)</span></label>
              <input 
                type="text" 
                name="textura_suelo" 
                value={data.textura_suelo || ''} 
                onChange={handleInputChange} 
                placeholder="Ej: Fina, Media..." 
              />
            </div>

            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
              <label>Materia Orgánica (%) <span className={styles.optional}>(opcional)</span></label>
              <input 
                type="number" 
                name="materia_organica" 
                value={data.materia_organica || ''} 
                onChange={handleInputChange} 
                placeholder="Ej: 3.5" 
                step="0.1"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisForm;
