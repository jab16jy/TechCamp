import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSensores, getUmbralesCultivos } from '@shared/services/api';

// ── Risk thresholds per sensor type ──
const VIENTO_ALTO = 30;       // km/h — above = warning
const PLUVIOMETRIA_ALTA = 50; // mm in period — above = alert
const HUMECTACION_FUNGUS = 90; // % for extended period — above = fungus risk
const HUMECTACION_ALTA = 70;  // % moderately elevated

/**
 * useSensores — Gestión de sensores IoT meteorológicos.
 *
 * Fetch GET /sensors + GET /irrigation-plans/thresholds,
 * cálculo de riesgo multicriterio por sensor (humedad, viento, pluviometría, humectación),
 * y selección de sensor activo.
 *
 * @returns {{ sensores, selectedSensorId, selectedSensor, sensorRiskMap,
 *            riskStatus, sensoresEnRiesgo, loading, handleSelectSensor,
 *            umbrales }}
 */
export default function useSensores() {
  const [sensores, setSensores] = useState([]);
  const [umbrales, setUmbrales] = useState({});
  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch sensors + thresholds on mount ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getSensores().catch(() => []),
      getUmbralesCultivos().catch(() => ({ cultivos: [] })),
    ]).then(([sensorsData, thresholdsData]) => {
      if (cancelled) return;

      const sensorList = Array.isArray(sensorsData) ? sensorsData : [];
      setSensores(sensorList);

      // Build thresholds map from API
      const umb = {};
      if (thresholdsData?.cultivos?.length) {
        for (const c of thresholdsData.cultivos) {
          const nombre = c.cultivo.replace(/_/g, ' ');
          umb[nombre] = c.umbral_estres_hidrico_pct || 20;
        }
      }
      setUmbrales(umb);

      // Auto-select first critical sensor, else first sensor
      if (!selectedSensorId && sensorList.length > 0) {
        const firstCritical = sensorList.find((s) => {
          const h = s.ultima_lectura?.humedad;
          if (h === null || h === undefined) return false;
          const cultivo = s.cultivo || 'Maiz';
          const umbral = umb[cultivo] || 20;
          return h < umbral;
        });
        setSelectedSensorId(firstCritical?.id || sensorList[0]?.id || null);
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: selected sensor object ──
  const selectedSensor = useMemo(
    () => sensores.find((s) => s.id === selectedSensorId) || null,
    [sensores, selectedSensorId],
  );

  // ── Multi-type risk calculation ──
  const sensorRiskMap = useMemo(() => {
    const map = {};

    for (const sensor of sensores) {
      const lectura = sensor.ultima_lectura || {};
      let worstRisk = null;

      // 1. Humedad suelo — compare against crop threshold
      const humedad = lectura.humedad;
      const cultivo = sensor.cultivo || 'Maiz';
      const umbralHumedad = umbrales[cultivo] || 20;

      if (humedad != null) {
        if (humedad < umbralHumedad * 0.5) {
          worstRisk = 'critico';
        } else if (humedad < umbralHumedad * 0.7) {
          worstRisk = 'alto';
        } else if (humedad < umbralHumedad) {
          worstRisk = 'moderado';
        } else {
          worstRisk = 'ok';
        }
      }

      // 2. Viento — >30 km/h → alto
      const viento = lectura.viento_kmh;
      if (viento != null && viento > VIENTO_ALTO) {
        if (worstRisk !== 'critico') worstRisk = 'alto';
      }

      // 3. Pluviometría — >50 mm → alto
      const pluv = lectura.pluviometria_mm;
      if (pluv != null && pluv > PLUVIOMETRIA_ALTA) {
        if (worstRisk !== 'critico') worstRisk = 'alto';
      }

      // 4. Humectación hoja — >90% → fungus risk (critico)
      //                      >70% → moderate fungal pressure (moderado)
      const humect = lectura.humectacion_hoja_pct;
      if (humect != null) {
        if (humect > HUMECTACION_FUNGUS) {
          worstRisk = 'critico';
        } else if (humect > HUMECTACION_ALTA) {
          if (worstRisk !== 'critico' && worstRisk !== 'alto') worstRisk = 'moderado';
        }
      }

      // Fallback: sin datos
      map[sensor.id] = worstRisk || 'sin_datos';
    }

    return map;
  }, [sensores, umbrales]);

  // ── Derived: risk status for active sensor ──
  const riskStatus = useMemo(() => {
    if (!selectedSensor) return 'ninguno';
    return sensorRiskMap[selectedSensor.id] || 'ninguno';
  }, [selectedSensor, sensorRiskMap]);

  // ── Derived: sensors in critical or high risk ──
  const sensoresEnRiesgo = useMemo(
    () => sensores.filter(
      (s) => sensorRiskMap[s.id] === 'critico' || sensorRiskMap[s.id] === 'alto',
    ),
    [sensores, sensorRiskMap],
  );

  // ── Sensor selection handler ──
  const handleSelectSensor = useCallback((id) => {
    setSelectedSensorId(id);
  }, []);

  return {
    sensores,
    selectedSensorId,
    selectedSensor,
    sensorRiskMap,
    riskStatus,
    sensoresEnRiesgo,
    loading,
    handleSelectSensor,
    umbrales,
  };
}
