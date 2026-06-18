import { useState, useCallback } from 'react';
import { apiClient } from '@shared/services/api';

/**
 * useRiesgoClimatico — Calls POST /riesgo-climatico (single call returns flood + drought).
 *
 * Returns:
 *   flood   — { probability, risk_level, model_used, confidence } | null
 *   drought — { probability, risk_level, model_used, confidence } | null
 *   meta    — { modelo_disponible, mensaje, lat, lon, year, month } | null
 *   loading — boolean
 *   error   — string | null
 *   fetchRisk(lat, lon, year, month) — triggers the call
 */
export default function useRiesgoClimatico() {
  const [flood, setFlood] = useState(null);
  const [drought, setDrought] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRisk = useCallback(async (lat, lon, year, month) => {
    if (lat == null || lon == null || year == null || month == null) return;

    setLoading(true);
    setError(null);
    setFlood(null);
    setDrought(null);
    setMeta(null);

    try {
      const res = await apiClient.post('/riesgo-climatico', { lat, lon, year, month });
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
