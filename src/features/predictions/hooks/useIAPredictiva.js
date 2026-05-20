import { useState, useCallback, useEffect, useMemo } from 'react';
import useAppStore from '@shared/store';
import { getPrediccion, getHistorial as fetchHistorial } from '@shared/services/api';

const isStandardAnalysis = (r) => r.tipo === 'analisis' || r.tipo === 'simple';

export default function useIAPredictiva() {
  const { formulario, agregarToast, historial } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [lat, setLat] = useState(String(formulario.lat || 10.5));
  const [lng, setLng] = useState(String(formulario.lng || -74.8));
  const [source, setSource] = useState('analisis');
  const [serverData, setServerData] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  useEffect(() => {
    fetchHistorial()
      .then((data) => {
        if (Array.isArray(data)) setServerData(data);
      })
      .catch(() => {});
  }, []);

  const combined = useMemo(() => {
    const seen = new Set();
    const all = [];
    for (const item of serverData) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }
    for (const item of historial) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }
    return all.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [serverData, historial]);

  const historialFiltrado = useMemo(
    () => combined.filter(isStandardAnalysis),
    [combined],
  );

  const handleGenerate = useCallback(async () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      agregarToast('Coordenadas invalidas', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await getPrediccion(latNum, lngNum);
      if (result) {
        setPrediction(result);
        agregarToast('Prediccion a 6 meses generada con exito', 'exito');
      } else {
        agregarToast('El servidor de prediccion no esta disponible', 'error');
      }
    } catch {
      agregarToast('Error al generar la prediccion', 'error');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, agregarToast]);

  const handleUseLastAnalysis = useCallback(() => {
    if (formulario.lat && formulario.lng) {
      setLat(String(formulario.lat));
      setLng(String(formulario.lng));
      setSource('analisis');
      agregarToast('Usando coordenadas del ultimo analisis', 'info');
    } else {
      agregarToast('No hay un analisis previo. Ingresa coordenadas manualmente.', 'advertencia');
    }
  }, [formulario, agregarToast]);

  const handleSelectHistory = useCallback(async (id) => {
    if (!id) {
      setSelectedHistoryId(null);
      return;
    }
    const record = combined.find((item) => item.id === id);
    if (!record) return;

    const coords = record.coordenadas;
    if (coords) {
      setLat(String(coords.lat));
      setLng(String(coords.lng));
    }

    setSelectedHistoryId(id);

    const locText = record.municipio && record.departamento
      ? `${record.municipio}, ${record.departamento}`
      : 'ubicacion seleccionada';
    agregarToast(`Coordenadas cargadas para: ${locText}`, 'info');

    const latNum = coords ? parseFloat(coords.lat) : null;
    const lngNum = coords ? parseFloat(coords.lng) : null;
    if (latNum == null || lngNum == null || isNaN(latNum) || isNaN(lngNum)) return;

    setLoading(true);
    try {
      const result = await getPrediccion(latNum, lngNum);
      if (result) setPrediction(result);
    } catch {
      agregarToast('Error al generar la prediccion desde el historial', 'error');
    } finally {
      setLoading(false);
    }
  }, [combined, agregarToast]);

  const handleClearSelection = useCallback(() => {
    setSelectedHistoryId(null);
  }, []);

  const getSelectedRecord = useCallback(() => {
    return combined.find((item) => item.id === selectedHistoryId) || null;
  }, [combined, selectedHistoryId]);

  const selectedRecord = useMemo(() => {
    return combined.find((item) => item.id === selectedHistoryId) || null;
  }, [combined, selectedHistoryId]);

  return {
    loading,
    prediction,
    lat,
    setLat,
    lng,
    setLng,
    source,
    setSource,
    handleGenerate,
    handleUseLastAnalysis,
    hasLastAnalysis: !!(formulario.lat && formulario.lng),
    historial: historialFiltrado,
    selectedHistoryId,
    handleSelectHistory,
    handleClearSelection,
    getSelectedRecord,
    selectedRecord,
  };
}
