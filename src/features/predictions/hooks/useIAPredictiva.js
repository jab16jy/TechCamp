import { useState, useCallback, useEffect, useMemo } from 'react';
import useAppStore from '@shared/store';
import { getPrediccion, getHistorial as fetchHistorial } from '@shared/services/api';

const VALID_HISTORY_TYPES = new Set(['analisis', 'simple', 'suelo', 'advanced', 'prediccion']);

const getRecordCoords = (record) => {
  if (!record) return null;

  const lat = record.coordenadas?.lat ?? record.lat;
  const lng = record.coordenadas?.lng ?? record.lng;
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  return { lat: latNum, lng: lngNum };
};

const getRecordLocation = (record, fallback = 'ubicacion seleccionada') => {
  if (!record) return fallback;
  return [record.municipio, record.departamento].filter(Boolean).join(', ') || fallback;
};

const getPredictionScore = (prediction) => {
  const bestMonth = prediction?.meses?.find((month) => month.month === prediction.mejor_mes);
  const bestCrop = bestMonth?.cultivos_recomendados?.find(
    (crop) => crop.cultivo === prediction.mejor_cultivo,
  );
  return bestCrop?.score ?? bestMonth?.cultivos_recomendados?.[0]?.score ?? null;
};

export default function useIAPredictiva() {
  const { formulario, agregarToast, agregarAlHistorial, historial } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [lat, setLat] = useState(String(formulario.lat || 10.5));
  const [lng, setLng] = useState(String(formulario.lng || -74.8));
  const [source, setSource] = useState('manual');
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
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }
    for (const item of historial) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }
    return all.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [serverData, historial]);

  const historialFiltrado = useMemo(
    () =>
      combined.filter(
        (item) => VALID_HISTORY_TYPES.has(item.tipo) && getRecordCoords(item),
      ),
    [combined],
  );

  const selectedRecord = useMemo(() => {
    return historialFiltrado.find((item) => item.id === selectedHistoryId) || null;
  }, [historialFiltrado, selectedHistoryId]);

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
        agregarAlHistorial({
          tipo: 'prediccion',
          municipio: selectedRecord?.municipio || result.ubicacion?.municipio || '',
          departamento: selectedRecord?.departamento || result.ubicacion?.departamento || '',
          lat: latNum,
          lng: lngNum,
          cultivo: result.mejor_cultivo || null,
          cultivo_top: result.mejor_cultivo || null,
          mejor_mes: result.mejor_mes || null,
          mejor_cultivo: result.mejor_cultivo || null,
          score: getPredictionScore(result),
          fuente: result.fuente || '',
          estado: 'Exitosa',
        });
        agregarToast('Prediccion a 6 meses generada con exito', 'exito');
      } else {
        agregarToast('El servidor de prediccion no esta disponible', 'error');
      }
    } catch {
      agregarToast('Error al generar la prediccion', 'error');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, selectedRecord, agregarAlHistorial, agregarToast]);

  const handleUseLastAnalysis = useCallback(() => {
    if (formulario.lat && formulario.lng) {
      setLat(String(formulario.lat));
      setLng(String(formulario.lng));
      setSource('analisis');
      setSelectedHistoryId(null);
      agregarToast('Usando coordenadas del ultimo analisis', 'info');
    } else {
      agregarToast('No hay un analisis previo. Ingresa coordenadas manualmente.', 'advertencia');
    }
  }, [formulario, agregarToast]);

  const handleSelectHistory = useCallback((id) => {
    if (!id) {
      setSelectedHistoryId(null);
      setSource('manual');
      return;
    }
    const record = historialFiltrado.find((item) => item.id === id);
    if (!record) return;

    const coords = getRecordCoords(record);
    if (!coords) {
      agregarToast('El registro seleccionado no tiene coordenadas validas', 'advertencia');
      return;
    }

    setLat(String(coords.lat));
    setLng(String(coords.lng));
    setSelectedHistoryId(id);
    setSource('historial');
    agregarToast(`Coordenadas precargadas para: ${getRecordLocation(record)}`, 'info');
  }, [historialFiltrado, agregarToast]);

  const handleClearSelection = useCallback((silent = false) => {
    setSelectedHistoryId(null);
    setSource('manual');
    if (!silent) agregarToast('Registro desvinculado. Puedes editar coordenadas manualmente.', 'info');
  }, [agregarToast]);

  const getSelectedRecord = useCallback(() => {
    return selectedRecord;
  }, [selectedRecord]);

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
    getRecordCoords,
  };
}
