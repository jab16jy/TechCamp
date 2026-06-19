import { useState, useCallback } from 'react';
import { apiClient } from '@shared/services/api';

/**
 * useRiesgoClimatico — POST /riesgo-climatico (returns flood + drought).
 *
 * The backend resolves the most recent year that has climate data for `month`,
 * and applies the optional climate scenario (rainfall / temperature what-if).
 *
 * Returns:
 *   flood   — { probability, risk_level, model_used, confidence } | null
 *   drought — same shape | null
 *   meta    — { modelo_disponible, mensaje, lat, lon, year, month, simulacion, escenario } | null
 *   loading, error
 *   fetchRisk(lat, lon, month, { precipDeltaPct, tempDeltaC })
 */
export default function useRiesgoClimatico() {
  const [flood, setFlood] = useState(null);
  const [drought, setDrought] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRisk = useCallback(async (lat, lon, month, scenario = {}) => {
    if (lat == null || lon == null || month == null) return;
    const { precipDeltaPct = 0, tempDeltaC = 0 } = scenario;

    setLoading(true);
    setError(null);
    setFlood(null);
    setDrought(null);
    setMeta(null);

    try {
      const res = await apiClient.post('/riesgo-climatico', {
        lat, lon, month,
        precip_delta_pct: precipDeltaPct,
        temp_delta_c: tempDeltaC,
      });
      const riesgos = res.data.riesgos ?? [];

      const mapRiesgo = (r) => r ? {
        type: r.tipo,
        probability: r.probabilidad,
        risk_level: r.severidad,
        confidence: r.confianza_modelo,
        model_used: r.fallback_heuristico ? 'heuristic' : 'ml',
      } : null;

      setFlood(mapRiesgo(riesgos.find(r => r.tipo === 'inundacion')));
      setDrought(mapRiesgo(riesgos.find(r => r.tipo === 'sequia')));
      setMeta({
        modelo_disponible: Boolean(res.data.modelo_disponible),
        mensaje: res.data.mensaje || null,
        lat: res.data.lat,
        lon: res.data.lon,
        year: res.data.year,
        month: res.data.month,
        simulacion: Boolean(res.data.simulacion),
        escenario: res.data.escenario || null,
      });
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Error al obtener riesgo climatico';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { flood, drought, meta, loading, error, fetchRisk };
}
