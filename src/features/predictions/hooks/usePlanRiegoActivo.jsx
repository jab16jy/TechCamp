import { useState, useEffect, useCallback, useMemo } from 'react';
import useAppStore from '@shared/store';
import {
  getSensores, generarPlanRiego, exportarPlanATareas, getUmbralesCultivos,
  getPrediccion, getHistorial, getAnalysis,
} from '@shared/services/api';

const UMBRALES_FALLBACK = {
  Maiz: 20, Yuca: 18, Platano: 25, Arroz: 30,
  Frijel: 22, Name: 20, Cacao: 28, Algodon: 18,
  Sorgo: 18, "Palma Aceitera": 28,
};

const CICLOS_DIAS = {
  Maiz: 90, Yuca: 270, Arroz: 120, Frijol: 75,
  Name: 210, Platano: 365, Cacao: 180, Algodon: 150,
  Sorgo: 110, "Palma Aceitera": 365,
};

export default function usePlanRiegoActivo() {
  const { agregarToast, agregarTareaDesdePlan } = useAppStore();

  const [sensores, setSensores] = useState([]);
  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [loadingScan, setLoadingScan] = useState(true);
  const [plan, setPlan] = useState(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [umbrales, setUmbrales] = useState(UMBRALES_FALLBACK);
  const [historialPlanes, setHistorialPlanes] = useState([]);
  const [generandoPlan, setGenerandoPlan] = useState(false);

  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [fechaSiembra, setFechaSiembra] = useState(null);
  const [etapaFenologica, setEtapaFenologica] = useState(null);
  const [proyeccion6M, setProyeccion6M] = useState(null);
  const [loadingProyeccion, setLoadingProyeccion] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [npkSim, setNpkSim] = useState(120);
  const [riegoSim, setRiegoSim] = useState(75);
  const [stale, setStale] = useState(false);

  // Datos del analisis seleccionado para preview en el modal
  const [selectedAnalysisData, setSelectedAnalysisData] = useState(null);

  const selectedSensor = useMemo(
    () => sensores.find((s) => s.id === selectedSensorId) || null,
    [sensores, selectedSensorId],
  );

  const sensorRiskMap = useMemo(() => {
    const map = {};
    for (const sensor of sensores) {
      const humedad = sensor.ultima_lectura?.humedad;
      if (humedad === null || humedad === undefined) {
        map[sensor.id] = 'sin_datos';
        continue;
      }
      const cultivo = sensor.cultivo || 'Maiz';
      const umbral = umbrales[cultivo] || 20;
      if (humedad < umbral * 0.7) map[sensor.id] = 'critico';
      else if (humedad < umbral) map[sensor.id] = 'alto';
      else if (humedad < umbral * 1.3) map[sensor.id] = 'moderado';
      else map[sensor.id] = 'ok';
    }
    return map;
  }, [sensores, umbrales]);

  const riskStatus = useMemo(() => {
    if (!selectedSensor) return 'ninguno';
    return sensorRiskMap[selectedSensor.id] || 'ninguno';
  }, [selectedSensor, sensorRiskMap]);

  const sensoresEnRiesgo = useMemo(
    () => sensores.filter((s) => sensorRiskMap[s.id] === 'critico' || sensorRiskMap[s.id] === 'alto'),
    [sensores, sensorRiskMap],
  );

  const analisisConCoordenadas = useMemo(
    () => historial.filter((item) => {
      const lat = item.coordenadas?.lat ?? item.lat;
      const lng = item.coordenadas?.lng ?? item.lng;
      return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    }),
    [historial],
  );

  const inheritedRecord = useMemo(
    () => analisisConCoordenadas.find((item) => item.id === selectedAnalysisId) || null,
    [analisisConCoordenadas, selectedAnalysisId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingScan(true);

    Promise.all([
      getSensores().catch(() => []),
      getUmbralesCultivos().catch(() => ({ cultivos: [] })),
      getHistorial().catch(() => []),
    ]).then(([sensorsData, thresholdsData, historyData]) => {
      if (cancelled) return;

      const sensorList = Array.isArray(sensorsData) ? sensorsData : [];
      const enriched = sensorList.map((s) => ({
        ...s,
        cultivo: s.cultivo || 'Maiz',
      }));
      setSensores(enriched);

      if (thresholdsData?.cultivos?.length) {
        const umb = {};
        for (const c of thresholdsData.cultivos) {
          const nombre = c.cultivo.replace(/_/g, ' ');
          umb[nombre] = c.umbral_estres_hidrico_pct || 20;
        }
        setUmbrales({ ...UMBRALES_FALLBACK, ...umb });
      }

      setHistorial(Array.isArray(historyData) ? historyData : []);

      if (!cancelled && !selectedSensorId && enriched.length > 0) {
        const firstCritical = enriched.find((s) => {
          const h = s.ultima_lectura?.humedad;
          if (h === null || h === undefined) return false;
          const umbral = umbrales[s.cultivo || 'Maiz'] || 20;
          return h < umbral;
        });
        setSelectedSensorId(firstCritical?.id || enriched[0]?.id || null);
      }

      setLoadingScan(false);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (proyeccion6M) setStale(true);
  }, [npkSim, riegoSim]);

  const handleSelectSensor = useCallback((id) => {
    setSelectedSensorId(id);
    setPlan(null);
    setPreviewActive(false);
  }, []);

  // Funcion helper para ejecutar proyeccion con coordenadas
  const _runPrediccion = useCallback(async (lat, lng, options = {}) => {
    const {
      analysisId = null,
      cultivo = 'Maiz',
      fechaSiembraStr = null,
      npk = npkSim,
      riego = riegoSim,
    } = options;

    const ciclo = CICLOS_DIAS[cultivo] || 90;

    // Calcular dias desde siembra
    let diasDesdeSiembra = null;
    let fechaBase = null;
    if (fechaSiembraStr) {
      fechaBase = fechaSiembraStr;
      try {
        const siembraDate = new Date(fechaSiembraStr);
        diasDesdeSiembra = Math.max(0, Math.floor((Date.now() - siembraDate.getTime()) / 86400000));
      } catch {
        diasDesdeSiembra = null;
      }
    }

    setFechaSiembra(fechaSiembraStr ? new Date(fechaSiembraStr) : null);
    setLoadingProyeccion(true);

    try {
      const result = await getPrediccion(
        lat, lng, analysisId, 6, npk, riego,
        fechaBase, diasDesdeSiembra, ciclo,
        cultivo, fechaSiembraStr,
      );
      if (result) {
        setProyeccion6M(result);
        if (diasDesdeSiembra !== null && diasDesdeSiembra >= 0) {
          const etapa = result.meses?.[0]?.etapa_fenologica || 'germinacion';
          setEtapaFenologica({
            etapa, diasDesdeSiembra, cicloDias: ciclo,
            pct: Math.min(100, Math.round((diasDesdeSiembra / ciclo) * 100)),
          });
        }
        setStale(false);
        return result;
      }
    } catch {
      agregarToast('Error al cargar la proyeccion', 'error');
    } finally {
      setLoadingProyeccion(false);
    }
    return null;
  }, [npkSim, riegoSim, agregarToast]);

  const handleSelectAnalysis = useCallback(async (analysisId) => {
    if (!analysisId) {
      setSelectedAnalysisId(null);
      setFechaSiembra(null);
      setEtapaFenologica(null);
      setProyeccion6M(null);
      setSelectedAnalysisData(null);
      return;
    }

    setSelectedAnalysisId(analysisId);
    setLoadingProyeccion(true);

    try {
      let data = await getAnalysis(analysisId);
      if (!data) {
        const local = historial.find((item) => item.id === analysisId);
        if (local) {
          data = {
            lat: local.coordenadas?.lat ?? local.lat,
            lng: local.coordenadas?.lng ?? local.lng,
            cultivo: local.cultivo,
            created_at: local.fecha,
            mes_siembra: local.mes_siembra,
            ph_suelo: local.ph ?? local.ph_suelo,
            materia_organica: local.materia_organica,
            textura_suelo: local.textura_suelo,
            departamento: local.departamento,
            municipio: local.municipio,
          };
        }
      }
      if (!data) {
        agregarToast('Analisis no encontrado', 'advertencia');
        setLoadingProyeccion(false);
        return;
      }

      const lat = Number(data.lat);
      const lng = Number(data.lng);
      const cultivo = data.cultivo || data.cultivo_recomendado || inheritedRecord?.cultivo || 'Maiz';
      const fechaBase = data.created_at || data.fecha;

      setSelectedAnalysisData(data);

      await _runPrediccion(lat, lng, {
        analysisId,
        cultivo,
        fechaSiembraStr: fechaBase,
      });
    } catch {
      agregarToast('Error al cargar la proyeccion', 'error');
      setLoadingProyeccion(false);
    }
  }, [historial, _runPrediccion, agregarToast, inheritedRecord]);

  const handleManualQuery = useCallback(async ({ lat, lng, cultivo, fechaSiembra }) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      agregarToast('Selecciona una ubicacion valida', 'advertencia');
      return;
    }
    setSelectedAnalysisId(null);
    setSelectedAnalysisData(null);

    await _runPrediccion(lat, lng, {
      analysisId: null,
      cultivo: cultivo || 'Maiz',
      fechaSiembraStr: fechaSiembra || null,
    });
  }, [_runPrediccion, agregarToast]);

  const handleSimularContramedida = useCallback(async () => {
    if (!selectedAnalysisId) return;
    setLoadingProyeccion(true);
    try {
      const data = await getAnalysis(selectedAnalysisId);
      if (data) {
        const cultivo = data.cultivo || 'Maiz';
        const fechaBase = data.created_at || data.fecha;
        const ciclo = CICLOS_DIAS[cultivo] || 90;
        const diasDesdeSiembra = fechaBase
          ? Math.floor((Date.now() - new Date(fechaBase).getTime()) / 86400000)
          : 0;

        const result = await getPrediccion(
          Number(data.lat), Number(data.lng),
          selectedAnalysisId, 6, npkSim, riegoSim,
          fechaBase, diasDesdeSiembra, ciclo,
        );
        if (result) {
          setProyeccion6M(result);
          setStale(false);
          agregarToast('Contramedida aplicada — proyeccion recalculada', 'exito');
        }
      }
    } catch {
      agregarToast('Error al recalcular la proyeccion', 'error');
    } finally {
      setLoadingProyeccion(false);
    }
  }, [selectedAnalysisId, npkSim, riegoSim, agregarToast]);

  const handleGenerarPlan = useCallback(async () => {
    if (!selectedSensorId) {
      agregarToast('Selecciona un sensor primero', 'advertencia');
      return;
    }
    setGenerandoPlan(true);
    try {
      const result = await generarPlanRiego(
        selectedSensorId,
        null,
        selectedSensor?.cultivo || null,
      );
      if (result) {
        setPlan(result);
        setHistorialPlanes((prev) => [result, ...prev].slice(0, 10));
        agregarToast('Plan de riego generado con exito', 'exito');
      } else {
        agregarToast('No se pudo generar el plan de riego', 'error');
      }
    } catch {
      agregarToast('Error al generar el plan de riego', 'error');
    } finally {
      setGenerandoPlan(false);
    }
  }, [selectedSensorId, selectedSensor, agregarToast]);

  const togglePreview = useCallback(() => {
    setPreviewActive((prev) => !prev);
  }, []);

  const handleExportarTareas = useCallback(async () => {
    if (!plan) return;
    try {
      const tarea = await exportarPlanATareas(plan);
      if (tarea) {
        agregarTareaDesdePlan({
          ...plan,
          task_id: tarea.task_id,
          titulo: tarea.titulo,
        });
        agregarToast('Plan exportado a tareas exitosamente', 'exito');
      }
    } catch {
      agregarToast('Error al exportar plan a tareas', 'error');
    }
  }, [plan, agregarTareaDesdePlan, agregarToast]);

  const handleClearPlan = useCallback(() => {
    setPlan(null);
    setPreviewActive(false);
  }, []);

  const handleClearProyeccion = useCallback(() => {
    setSelectedAnalysisId(null);
    setFechaSiembra(null);
    setEtapaFenologica(null);
    setProyeccion6M(null);
    setSelectedAnalysisData(null);
  }, []);

  return {
    sensores, selectedSensorId, selectedSensor,
    loadingScan, riskStatus, sensorRiskMap, sensoresEnRiesgo,
    plan, generandoPlan, previewActive, umbrales, historialPlanes,
    selectedAnalysisId, fechaSiembra, etapaFenologica, proyeccion6M,
    loadingProyeccion, analisisConCoordenadas, inheritedRecord,
    selectedAnalysisData,
    npkSim, riegoSim, stale,
    setNpkSim, setRiegoSim,
    handleSelectSensor, handleGenerarPlan, togglePreview,
    handleExportarTareas, handleClearPlan,
    handleSelectAnalysis, handleManualQuery, handleSimularContramedida, handleClearProyeccion,
  };
}