/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import {
  FlaskConical,
  History,
  Sparkles,
  Loader2,
  Info,
  MapPin,
  ArrowLeft,
  ChevronRight,
  Sprout,
  Waves,
} from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useCalidadSuelo } from '@features/analysis/hooks/useCalidadSuelo';
import styles from './CalidadSueloModule.module.css';

const MapViewport = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center?.lat != null && center?.lng != null) {
      map.flyTo([center.lat, center.lng], 11, { duration: 0.8 });
    }
  }, [center, map]);

  return null;
};

const LocationPreviewMap = ({ coords, municipality }) => {
  if (!coords) return null;

  return (
    <div className={styles.mapCard}>
      <div className={styles.mapHeader}>
        <span className={styles.mapEyebrow}>Mapa de referencia</span>
        <p>{municipality || 'Ubicacion seleccionada'}</p>
      </div>
      <div className={styles.mapFrame}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={11}
          scrollWheelZoom={false}
          zoomControl={false}
          className={styles.mapCanvas}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={coords} />
          <CircleMarker
            center={[coords.lat, coords.lng]}
            radius={10}
            pathOptions={{
              color: '#0f5238',
              weight: 2,
              fillColor: '#7bd389',
              fillOpacity: 0.92,
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
};

const CalidadSueloModule = ({ onBack }) => {
  const {
    allRecords,
    selectedId,
    selectedRecord,
    selectedCoords,
    selectedMunicipio,
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
          Volver al selector de modulos
        </button>
        <nav className={styles.breadcrumb}>
          <span>Modulos</span>
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
              <h4>Seleccionar registro historico de suelo</h4>
              <p>Al elegir una ubicacion se completan los datos con historial y SoilGrids.</p>
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
                      {record.id} · {record.municipio || 'Sin municipio'} · {fecha} · {tipo}
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
                <h3>Parametros del Suelo</h3>
              </div>
              <div className={styles.dataOrigin}>
                <Info size={12} />
                <span>
                  {selectedRecord
                    ? `Datos de: ${selectedLabel}`
                    : 'Ingrese mediciones directas o cargue un historial'}
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
                  Nitrogeno (N) <span className={styles.required}>*</span>
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
                <label className={styles.optionalLabel}>Fosforo (P) — Opcional</label>
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
              <div className={styles.fieldGroup}>
                <label className={styles.optionalLabel}>Materia Organica — SoilGrids</label>
                <input
                  type="number"
                  className={styles.optionalInput}
                  placeholder="%"
                  value={sueloParams.materia_organica}
                  onChange={(e) => handleParamChange('materia_organica', e.target.value)}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.optionalLabel}>Textura / Tipo de suelo</label>
                <input
                  type="text"
                  className={styles.optionalInput}
                  placeholder="Franco, Arcilloso..."
                  value={sueloParams.textura_suelo}
                  onChange={(e) => {
                    handleParamChange('textura_suelo', e.target.value);
                    handleParamChange('tipo_suelo', e.target.value);
                  }}
                />
              </div>
            </div>
          </section>

          <div className={styles.submitCta}>
            <p className={styles.submitDesc}>
              El motor de IA procesara estos parametros para generar recomendaciones
              de fertilizacion, enmiendas y manejo del suelo.
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
                      {selectedRecord.municipio || selectedMunicipio || 'Ubicacion'}
                    </p>
                    <p className={styles.locationMeta}>
                      {[selectedRecord.municipio || selectedMunicipio, selectedRecord.departamento]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {selectedCoords && (
                      <p className={styles.locationMeta}>
                        {Number(selectedCoords.lat).toFixed(4)} N, {Number(selectedCoords.lng).toFixed(4)} W
                      </p>
                    )}
                  </div>

                  <LocationPreviewMap
                    coords={selectedCoords}
                    municipality={selectedRecord.municipio || selectedMunicipio}
                  />

                  <div className={styles.metricStack}>
                    <div className={styles.metricTile}>
                      <Sprout size={15} />
                      <div>
                        <span>Textura</span>
                        <strong>{sueloParams.textura_suelo || 'Sin dato'}</strong>
                      </div>
                    </div>
                    <div className={styles.metricTile}>
                      <Waves size={15} />
                      <div>
                        <span>Materia organica</span>
                        <strong>
                          {sueloParams.materia_organica ? `${sueloParams.materia_organica}%` : 'Sin dato'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.chipRow}>
                    {sueloParams.ph_suelo && (
                      <span className={styles.chip}>pH {sueloParams.ph_suelo}</span>
                    )}
                    {sueloParams.nitrogeno && (
                      <span className={styles.chip}>N {sueloParams.nitrogeno}</span>
                    )}
                    {sueloParams.fosforo && (
                      <span className={styles.chip}>P {sueloParams.fosforo}</span>
                    )}
                    {sueloParams.potasio && (
                      <span className={styles.chip}>K {sueloParams.potasio}</span>
                    )}
                    {sueloParams.humedad_suelo && (
                      <span className={styles.chip}>H {sueloParams.humedad_suelo}%</span>
                    )}
                  </div>

                  {sueloParams.fuente_suelo && (
                    <p className={styles.sourceHint}>
                      Datos de suelo complementados desde {sueloParams.fuente_suelo}.
                    </p>
                  )}

                  {!selectedRecord.nitrogeno && !selectedRecord.fosforo && !selectedRecord.potasio && (
                    <p className={styles.noDataHint}>
                      El historial aporto ubicacion y SoilGrids completo pH, materia organica y textura.
                    </p>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <History size={32} className={styles.emptyIcon} />
                  <p>Selecciona un registro historico para ver su ubicacion, mapa y datos previos.</p>
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
              <span className={styles.modelPill}>PRECISION 94.2%</span>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default CalidadSueloModule;
