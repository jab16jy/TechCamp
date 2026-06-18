import { useState, useCallback } from 'react';
import { apiClient } from '@shared/services/api';

/**
 * useHistorialEventos — GET /riesgo-climatico/historial.
 *
 * Loads REAL recent flood/drought events near a location (UNGRD/HDX), with the
 * impacts reported by the source. This is contextual evidence, not a prediction.
 *
 * Returns:
 *   eventos  — array of normalized events (newest first) | []
 *   resumen  — aggregate totals | null
 *   meta     — { departamento, municipio, total_disponibles } | null
 *   loading  — boolean
 *   error    — string | null
 *   empty    — true when the request succeeded but found no records
 *   fetchHistorial(lat, lon, { eventType, municipio, limit }) — triggers the call
 */
export default function useHistorialEventos() {
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);

  const fetchHistorial = useCallback(async (lat, lon, opts = {}) => {
    if (lat == null || lon == null) return;
    const { eventType = null, municipio = null, limit = 20 } = opts;

    setLoading(true);
    setError(null);
    setEmpty(false);
    setEventos([]);
    setResumen(null);
    setMeta(null);

    try {
      const params = { lat, lon, limit };
      if (eventType) params.event_type = eventType;
      if (municipio) params.municipio = municipio;

      // Heavier endpoint (parses historical datasets on a cold cache) — give it
      // more room than the 15s global default; the backend also pre-warms on boot.
      const { data } = await apiClient.get('/riesgo-climatico/historial', { params, timeout: 30000 });
      const list = data.eventos ?? [];

      setEventos(list);
      setResumen(data.resumen ?? null);
      setMeta({
        departamento: data.departamento ?? null,
        municipio: data.municipio ?? null,
        total_disponibles: data.total_disponibles ?? 0,
      });
      setEmpty(list.length === 0);
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.message || 'Error al cargar el historial de eventos';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { eventos, resumen, meta, loading, error, empty, fetchHistorial };
}
