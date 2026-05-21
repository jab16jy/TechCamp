import React from 'react';
import {
  FlaskConical,
  History,
  Sparkles,
  Loader2,
  Info,
  MapPin,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useCalidadSuelo } from '@features/analysis/hooks/useCalidadSuelo';
import styles from './CalidadSueloModule.module.css';

const CalidadSueloModule = ({ onBack }) => {
  const {
    allRecords,
    selectedId,
    selectedRecord,
    selectedLabel,
    sueloParams,
    cargandoAnalisis,
    handleRecordSelect,
    handleParamChange,
    handleSubmit,
  } = useCalidadSuelo();

  return (
    <>
      <div className={styles.breadcrumbRow}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          Volver al selector de módulos
        </button>
        <nav className={styles.breadcrumb}>
          <span>Módulos</span>
          <ChevronRight size={12} />
          <span className={styles.breadcrumbActive}>Calidad del Suelo</span>
        </nav>
      </div>

      <form className={styles.grid} onSubmit={handleSubmit}>
        <div className={styles.wideCol}>
          <div className={styles.historyBanner}>
            <div className={styles.historyIcon}>
              <History size={22} />
            </div>
            <div className={styles.historyContent}>
              <h4>Seleccionar registro histórico de suelo</h4>
              <p>Carga mediciones previas o inicia con datos nuevos.</p>
            </div>
            <div className={styles.historySelectWrap}>
              <select
                className={styles.historySelect}
                value={selectedId}
                onChange={handleRecordSelect}
              >
                <option value="">Selecciona un registro...</option>
                {allRecords.map((record) => {
                  const fecha = record.fecha
                    ? new Date(record.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Sin fecha';
                  const tipo =
                    record.tipo === 'suelo' || record.tipo === 'advanced'
                      ? 'Suelo'
                      : 'Cultivo';
                  const coords = record.coordenadas
                    ? ` · ${Number(record.coordenadas.lat).toFixed(4)}, ${Number(record.coordenadas.lng).toFixed(4)}`
                    : '';
                  return (
                    <option key={record.id} value={record.id}>
                      {record.id} · {record.municipio || 'Sin municipio'} ·{' '}
                      {fecha} · {tipo}
                      {coords}
                    </option>
                  );
                })}
              </select>
              <span className={styles.selectArrow}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          <section className={styles.soilCard}>
            <div className={styles.soilCardHeader}>
              <div className={styles.soilCardTitleRow}>
                <FlaskConical size={22} className={styles.soilCardIcon} />
                <h3>Parámetros del Suelo</h3>
              </div>
              <div className={styles.dataOrigin}>
                <Info size={12} />
                <span>
                  {selectedRecord
                    ? `Datos de: ${selectedLabel}`
                    : 'Ingrese mediciones directas de laboratorio'}
                </span>
              </div>
            </div>

            <div className={styles.paramsGrid}>
              <div className={styles.fieldGroup}>
                <label>
                  pH del Suelo <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Ej: 6.5"
                  value={sueloParams.ph_suelo}
                  onChange={(e) => handleParamChange('ph_suelo', e.target.value)}
                  min="0"
                  max="14"
                  step="0.1"
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>
                  Nitrógeno (N) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="mg/kg"
                  value={sueloParams.nitrogeno}
                  onChange={(e) => handleParamChange('nitrogeno', e.target.value)}
                  step="1"
                  min="0"
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>
                  Humedad del Suelo <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="%"
                  value={sueloParams.humedad_suelo}
                  onChange={(e) => handleParamChange('humedad_suelo', e.target.value)}
                  step="1"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className={styles.optionalRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.optionalLabel}>Fósforo (P) — Opcional</label>
                <input
                  type="number"
                  className={styles.optionalInput}
                  placeholder="mg/kg"
                  value={sueloParams.fosforo}
                  onChange={(e) => handleParamChange('fosforo', e.target.value)}
                  min="0"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.optionalLabel}>Potasio (K) — Opcional</label>
                <input
                  type="number"
                  className={styles.optionalInput}
                  placeholder="mg/kg"
                  value={sueloParams.potasio}
                  onChange={(e) => handleParamChange('potasio', e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </section>

          <div className={styles.submitCta}>
            <p className={styles.submitDesc}>
              El motor de IA procesará estos parámetros para generar recomendaciones
              de fertilización, enmiendas y manejo del suelo.
            </p>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={cargandoAnalisis}
            >
              {cargandoAnalisis ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Analizando suelo...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analizar Suelo con IA
                </>
              )}
            </button>
          </div>
        </div>

        <div className={styles.narrowCol}>
          <div className={styles.stickyCol}>
            <section className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <MapPin size={20} className={styles.infoCardIcon} />
                <h4>Referencia</h4>
              </div>
              {selectedRecord ? (
                <>
                  <div className={styles.locationBox}>
                    <p className={styles.locationTitle}>
                      {selectedRecord.municipio || 'Ubicación'}
                    </p>
                    <p className={styles.locationMeta}>
                      {[
                        selectedRecord.municipio,
                        selectedRecord.departamento,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {selectedRecord.coordenadas && (
                      <p className={styles.locationMeta}>
                        {Number(selectedRecord.coordenadas.lat).toFixed(4)} N,{' '}
                        {Number(selectedRecord.coordenadas.lng).toFixed(4)} W
                      </p>
                    )}
                  </div>
                  {selectedRecord.tipo === 'suelo' || selectedRecord.tipo === 'advanced' ? (
                    <div className={styles.chipRow}>
                      {selectedRecord.ph != null && (
                        <span className={styles.chip}>pH {selectedRecord.ph}</span>
                      )}
                      {selectedRecord.nitrogeno != null && (
                        <span className={styles.chip}>N {selectedRecord.nitrogeno}</span>
                      )}
                      {selectedRecord.textura_suelo && (
                        <span className={styles.chip}>{selectedRecord.textura_suelo}</span>
                      )}
                    </div>
                  ) : (
                    <p className={styles.noDataHint}>
                      Registro de tipo cultivo. Se usarán solo coordenadas.
                    </p>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <History size={32} className={styles.emptyIcon} />
                  <p>Selecciona un registro histórico para ver su ubicación y datos previos.</p>
                </div>
              )}
            </section>

            <div className={styles.modelBadge}>
              <div className={styles.modelBadgeInner}>
                <Sparkles size={16} />
                <div>
                  <p className={styles.modelTitle}>Modelo Fertilidad</p>
                  <p className={styles.modelVersion}>Random Forest · v4.2.0</p>
                </div>
              </div>
              <span className={styles.modelPill}>PRECISIÓN 94.2%</span>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default CalidadSueloModule;
