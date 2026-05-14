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
        {/* Column 1 */}
        <div className={styles.formColumn}>
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
            <label>Tipo de Suelo</label>
            <select 
              name="tipo_suelo" 
              value={data.tipo_suelo || ''} 
              onChange={handleInputChange} 
              required
            >
              <option value="">Selecciona tipo...</option>
              <option value="Franco-Arcilloso">Franco-Arcilloso</option>
              <option value="Arenoso">Arenoso</option>
              <option value="Limoso">Limoso</option>
              <option value="Arcilloso">Arcilloso</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Área (hectáreas)</label>
            <input 
              type="number" 
              name="area_hectareas" 
              value={data.area_hectareas || ''} 
              onChange={handleInputChange} 
              placeholder="Ej: 15.5" 
              required 
              step="0.1"
            />
          </div>

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
            <label>Materia Orgánica (%) <span className={styles.optional}>(opcional)</span></label>
            <input 
              type="number" 
              name="materia_organica" 
              value={data.materia_organica || ''} 
              onChange={handleInputChange} 
              placeholder="Ej: 3.2" 
              step="0.1"
            />
          </div>
        </div>

        {/* Column 2 */}
        <div className={styles.formColumn}>
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
            <label>¿Acceso a Riego?</label>
            <select 
              name="acceso_riego" 
              value={data.acceso_riego || ''} 
              onChange={handleInputChange} 
              required
            >
              <option value="">Selecciona...</option>
              <option value="goteo">Sí, por goteo</option>
              <option value="gravedad">Sí, por gravedad</option>
              <option value="no">No, dependiente de lluvia</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Textura <span className={styles.optional}>(opcional)</span></label>
            <input 
              type="text" 
              name="textura_suelo" 
              value={data.textura_suelo || ''} 
              onChange={handleInputChange} 
              placeholder="Ej: Fina" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisForm;
