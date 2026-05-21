import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import useAppStore from '@shared/store';
import {
  getPrediccion,
  getHistorial as fetchHistorial,
  getAnalysis,
} from '@shared/services/api';

const VALID_HISTORY_TYPES = new Set(['analisis', 'simple', 'suelo', 'advanced']);

const getRecordCoords = (record) => {
  if (!record) return null;

  const lat = record.coordenadas?.lat ?? record.lat;
  const lng = record.coordenadas?.lng ?? record.lng;
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  return { lat: latNum, lng: lngNum };
};

const getPredictionScore = (prediction) => {
  const bestMonth = prediction?.meses?.find(
    (month) => month.month === prediction.mejor_mes,
  );
  const bestCrop = bestMonth?.cultivos_recomendados?.find(
    (crop) => crop.cultivo === prediction.mejor_cultivo,
  );

  return bestCrop?.score ?? bestMonth?.cultivos_recomendados?.[0]?.score ?? null;
};

const toInheritedValue = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
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
  const [analysisId, setAnalysisId] = useState(null);
  const [inheritedData, setInheritedData] = useState(null);
  const [npk, setNpk] = useState(120);
  const [riego, setRiego] = useState(75);
  const [bestWindow, setBestWindow] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [factorWeights, setFactorWeights] = useState([]);
  const [stale, setStale] = useState(false);

  // Use refs so handleGenerate always reads current slider values without re-creating
  const npkRef = useRef(npk);
  const riegoRef = useRef(riego);
  useEffect(() => { npkRef.current = npk; }, [npk]);
  useEffect(() => { riegoRef.current = riego; }, [riego]);

  // Mark prediction as stale when sliders change after a prediction exists
  useEffect(() => {
    if (prediction) {
      setStale(true);
    }
  }, [npk, riego]);

  // Safety timeout: force loading off after 15s to prevent permanent spinner
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      agregarToast('La operacion esta tomando mas de lo esperado. Reintenta.', 'advertencia');
    }, 15000);
    return () => clearTimeout(timer);
  }, [loading]);

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

  const selectedRecord = useMemo(
    () => historialFiltrado.find((item) => item.id === selectedHistoryId) || null,
    [historialFiltrado, selectedHistoryId],
  );

  const resetCoordinates = useCallback(() => {
    setLat(String(formulario.lat || ''));
    setLng(String(formulario.lng || ''));
  }, [formulario.lat, formulario.lng]);

  const handleGenerate = useCallback(async () => {
    if (!analysisId) {
      agregarToast('Debes seleccionar un analisis del historial antes de generar la proyeccion', 'advertencia');
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      agregarToast('Coordenadas invalidas', 'error');
      return;
    }

      setLoading(true);
      try {
        const result = await getPrediccion(
          latNum,
          lngNum,
          analysisId,
          3,
          npkRef.current,
          riegoRef.current,
        );
        if (result) {
          setPrediction(result);
          setStale(false);
          setBestWindow(result.best_window || null);
          setAlerts(result.alertas_globales || []);

          const bestMonth = result.meses?.find(
            (m) => m.month === result.mejor_mes,
          );
          const bestCrop = bestMonth?.cultivos_recomendados?.[0];
          setFactorWeights(bestCrop?.factor_weights || []);

          agregarAlHistorial({
            tipo: 'prediccion',
            municipio: selectedRecord?.municipio || result.ubicacion?.municipio || '',
            departamento:
              selectedRecord?.departamento || result.ubicacion?.departamento || '',
            lat: latNum,
            lng: lngNum,
            analysis_id: analysisId,
            cultivo: result.mejor_cultivo || null,
            cultivo_top: result.mejor_cultivo || null,
            mejor_mes: result.mejor_mes || null,
            mejor_cultivo: result.mejor_cultivo || null,
            score: getPredictionScore(result),
            fuente: result.fuente || '',
            estado: 'Exitosa',
          });
          agregarToast('Prediccion generada con exito', 'exito');
        } else {
          agregarToast('El servidor de prediccion no esta disponible', 'error');
        }
      } catch (err) {
        console.error('[handleGenerate] Error:', err);
        agregarToast('Error al generar la prediccion', 'error');
      } finally {
        setLoading(false);
      }
  }, [
    analysisId,
    lat,
    lng,
    selectedRecord,
    agregarAlHistorial,
    agregarToast,
  ]);

  const handleUseLastAnalysis = useCallback(() => {
    if (formulario.lat && formulario.lng) {
      setLat(String(formulario.lat));
      setLng(String(formulario.lng));
      setSource('analisis');
      setSelectedHistoryId(null);
      agregarToast('Usando coordenadas del ultimo analisis', 'info');
    } else {
      agregarToast(
        'No hay un analisis previo. Ingresa coordenadas manualmente.',
        'advertencia',
      );
    }
  }, [formulario, agregarToast]);

  const handleSelectAnalysis = useCallback(
    async (id) => {
      if (!id) {
        setAnalysisId(null);
        setInheritedData(null);
        setSelectedHistoryId(null);
        setPrediction(null);
        resetCoordinates();
        return;
      }

      setLoading(true);
      try {
        let data = await getAnalysis(id);

        // Fallback: if backend has no record, search local combined history
        if (!data) {
          const localItem = combined.find((item) => item.id === id);
          if (localItem) {
            data = {
              lat: localItem.coordenadas?.lat ?? localItem.lat,
              lng: localItem.coordenadas?.lng ?? localItem.lng,
              cultivo: localItem.cultivo,
              cultivo_recomendado: localItem.cultivo,
              ph_suelo: localItem.ph ?? localItem.ph_suelo,
              ph: localItem.ph,
              materia_organica: localItem.materia_organica,
              tipo_suelo: localItem.tipo_suelo ?? localItem.textura_suelo,
              textura_suelo: localItem.textura_suelo,
              mes_siembra: localItem.mes_siembra,
            };
          }
        }

        if (!data) {
          console.warn(`[handleSelectAnalysis] getAnalysis returned null for id: ${id}`);
          setAnalysisId(null);
          setInheritedData(null);
          setSelectedHistoryId(null);
          agregarToast('El analisis seleccionado no se pudo encontrar', 'advertencia');
          return;
        }

        setLat(String(data.lat || ''));
        setLng(String(data.lng || ''));
        setSource('analisis');
        setAnalysisId(id);
        setSelectedHistoryId(id);
        setPrediction(null);
        setInheritedData({
          cultivo: toInheritedValue(data.cultivo || data.cultivo_recomendado),
          ph_suelo: toInheritedValue(data.ph_suelo || data.ph),
          materia_organica: toInheritedValue(data.materia_organica),
          textura_suelo: toInheritedValue(data.tipo_suelo || data.textura_suelo),
          mes_siembra: toInheritedValue(data.mes_siembra),
        });
        agregarToast(`Datos heredados con exito del analisis ${id}`, 'info');
      } catch (err) {
        console.error('[handleSelectAnalysis] Error:', err);
        agregarToast('Error al cargar datos del analisis previo', 'error');
      } finally {
        setLoading(false);
      }
    },
    [agregarToast, resetCoordinates, combined],
  );

  const handleSelectHistory = useCallback(
    (id) => {
      handleSelectAnalysis(id);
    },
    [handleSelectAnalysis],
  );

  const handleNPKChange = useCallback((val) => {
    setNpk(Number(val));
  }, []);

  const handleRiegoChange = useCallback((val) => {
    setRiego(Number(val));
  }, []);

  const handleResetSim = useCallback(() => {
    setNpk(120);
    setRiego(75);
  }, []);

  const handleClearSelection = useCallback(
    (silent = false) => {
      setAnalysisId(null);
      setInheritedData(null);
      setSelectedHistoryId(null);
      setPrediction(null);
      setSource('manual');
      setNpk(120);
      setRiego(75);
      setBestWindow(null);
      setAlerts([]);
      setFactorWeights([]);
      resetCoordinates();
      if (!silent) agregarToast('Registro desvinculado.', 'info');
    },
    [agregarToast, resetCoordinates],
  );

  const getSelectedRecord = useCallback(() => selectedRecord, [selectedRecord]);

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
    handleSelectAnalysis,
    analysisId,
    inheritedData,
    npk,
    riego,
    handleNPKChange,
    handleRiegoChange,
    handleResetSim,
    bestWindow,
    alerts,
    factorWeights,
    stale,
  };
}
