/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { ChevronDown, FlaskConical } from "lucide-react";
import styles from "./AnalysisForm.module.css";

const CHEMISTRY_FIELDS = [
  { name: "calcio",        label: "Calcio",        unit: "cmol/kg" },
  { name: "cic",           label: "CIC",            unit: "cmol/kg" },
  { name: "conductividad", label: "Conductividad",  unit: "dS/m"    },
  { name: "magnesio",      label: "Magnesio",       unit: "cmol/kg" },
  { name: "potasio",       label: "Potasio",        unit: "cmol/kg" },
  { name: "fosforo",       label: "Fósforo (Bray)", unit: "mg/kg"   },
  { name: "azufre",        label: "Azufre",         unit: "mg/kg"   },
  { name: "boro",          label: "Boro",           unit: "mg/kg"   },
  { name: "sodio",         label: "Sodio",          unit: "cmol/kg" },
];

/**
 * Validates a single form field.
 * Shared between inline onBlur and handleSubmit validation.
 * @param {string} name - Field name.
 * @param {*} value - Field value.
 * @param {Object} [options] - Additional context.
 * @param {Object|null} [options.drawnArea] - Drawn area data.
 * @returns {string} Error message or empty string.
 */
export const validateField = (name, value, { drawnArea } = {}) => {
  switch (name) {
    case "area_hectareas":
      if (drawnArea?.area > 0) return "";
      if (value === "" || value === null || value === undefined || Number(value) <= 0) {
        return "El área debe ser mayor a 0";
      }
      return "";
    case "tipo_suelo":
      if (!value || value.trim() === "") {
        return "Selecciona un tipo de suelo";
      }
      return "";
    case "municipio":
      if (!value || value.trim() === "") {
        return "Selecciona un municipio";
      }
      return "";
    case "ph_suelo": {
      if (value === "" || value === null || value === undefined) return "";
      const ph = Number(value);
      if (isNaN(ph) || ph < 0 || ph > 14) {
        return "El pH debe estar entre 0 y 14";
      }
      return "";
    }
    default:
      return "";
  }
};

/**
 * AnalysisForm — Reusable form for crop analysis.
 * @param {Object} data - Current form data.
 * @param {Function} onChange - Callback when a field changes.
 * @param {Array} municipalities - List of available municipalities.
 * @param {Object|null} drawnArea - Drawn area data from map { area, lat, lng } or null.
 */
const AnalysisForm = ({ data, onChange, municipalities = [], drawnArea = null }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (municipalities.length > 0) {
      const uniqueDeps = [
        ...new Set(municipalities.map((m) => m.departamento)),
      ].sort();
      setDepartamentos(uniqueDeps);
    }
  }, [municipalities]);

  useEffect(() => {
    if (data.departamento) {
      const filtered = municipalities
        .filter((m) => m.departamento === data.departamento)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setMunicipiosFiltrados(filtered);
    } else {
      setMunicipiosFiltrados([]);
    }
  }, [data.departamento, municipalities]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Clear inline error for this field as user types
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    onChange({
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value, { drawnArea });
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const hasDrawnArea = drawnArea && drawnArea.area > 0;

  return (
    <div className={styles.formContainer}>
      <div className={styles.formGrid}>
        {/* Column 1 */}
        <div className={styles.formColumn}>
          <div className={styles.field}>
            <label>Departamento</label>
            <select
              name="departamento"
              value={data.departamento || ""}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona departamento...</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Tipo de Suelo</label>
            <select
              name="tipo_suelo"
              value={data.tipo_suelo || ""}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={errors.tipo_suelo ? styles.inputError : ""}
            >
              <option value="">Selecciona tipo...</option>
              <option value="Franco">Franco</option>
              <option value="Franco-Arcilloso">Franco-Arcilloso</option>
              <option value="Franco-Arenoso">Franco-Arenoso</option>
              <option value="Franco-Limoso">Franco-Limoso</option>
              <option value="Arenoso">Arenoso</option>
              <option value="Limoso">Limoso</option>
              <option value="Arcilloso">Arcilloso</option>
            </select>
            {errors.tipo_suelo && (
              <span className={styles.errorText}>{errors.tipo_suelo}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>
              Área (hectáreas)
              {hasDrawnArea && <span className={styles.autoFilled}>auto</span>}
            </label>
            <input
              type="number"
              name="area_hectareas"
              value={data.area_hectareas || ""}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Ej: 15.5"
              required
              step="0.1"
              readOnly={hasDrawnArea}
              className={`${hasDrawnArea ? styles.readOnly : ""} ${errors.area_hectareas ? styles.inputError : ""}`}
            />
            {errors.area_hectareas && (
              <span className={styles.errorText}>{errors.area_hectareas}</span>
            )}
          </div>

          {hasDrawnArea && (
            <div className={styles.field}>
              <label>Coordenadas <span className={styles.autoFilled}>auto</span></label>
              <input
                type="text"
                value={`${drawnArea.lat.toFixed(4)}° N, ${drawnArea.lng.toFixed(4)}° W`}
                readOnly
                className={styles.readOnly}
              />
            </div>
          )}

          <div className={styles.field}>
            <label>
              pH del Suelo <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              type="number"
              name="ph_suelo"
              value={data.ph_suelo || ""}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Ej: 6.5"
              step="0.1"
              min="0"
              max="14"
              className={errors.ph_suelo ? styles.inputError : ""}
            />
            {errors.ph_suelo && (
              <span className={styles.errorText}>{errors.ph_suelo}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>
              Materia Orgánica (%){" "}
              <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              type="number"
              name="materia_organica"
              value={data.materia_organica || ""}
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
              value={data.municipio || ""}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              disabled={!data.departamento}
              className={errors.municipio ? styles.inputError : ""}
            >
              <option value="">Selecciona municipio...</option>
              {municipiosFiltrados.map((m) => (
                <option key={m.id} value={m.nombre}>
                  {m.nombre}
                </option>
              ))}
            </select>
            {errors.municipio && (
              <span className={styles.errorText}>{errors.municipio}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Mes de Siembra</label>
            <select
              name="mes_siembra"
              value={data.mes_siembra || ""}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona mes...</option>
              {[
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>¿Acceso a Riego?</label>
            <select
              name="acceso_riego"
              value={data.acceso_riego || ""}
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
            <label>
              Textura <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              type="text"
              name="textura_suelo"
              value={data.textura_suelo || ""}
              onChange={handleInputChange}
              placeholder="Ej: Fina"
            />
          </div>
        </div>
      </div>

      {/* ── Avanzado: variables de química de suelo ── */}
      <div className={styles.advancedToggle}>
        <button
          type="button"
          className={styles.advancedBtn}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <FlaskConical size={13} />
          <span>Avanzado — Química de Suelo</span>
          <ChevronDown size={13} className={`${styles.advancedChev} ${showAdvanced ? styles.open : ""}`} />
        </button>
        {!showAdvanced && data.calcio && (
          <span className={styles.autoFilled}>
            {9} variables auto
          </span>
        )}
      </div>

      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <p className={styles.advancedHint}>
            Rellenado automáticamente desde la base de datos AGROSAVIA (suelos_caribe.csv).
            Puedes ajustar los valores manualmente si tienes datos de laboratorio.
          </p>
          <div className={styles.advancedGrid}>
            {CHEMISTRY_FIELDS.map(({ name, label, unit }) => {
              const hasValue = data[name] !== "" && data[name] != null;
              return (
                <div key={name} className={styles.field}>
                  <label>
                    {label}
                    {hasValue && <span className={styles.autoFilled}>auto</span>}
                    <span className={styles.optional}>({unit})</span>
                  </label>
                  <input
                    type="number"
                    name={name}
                    value={data[name] || ""}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisForm;
