import { useState, useCallback, useMemo } from 'react';
import useAppStore from '@shared/store';
import { getPrediccion, getAnalysis, postScenario, getCompareScenarios } from '@shared/services/api';

const CICLOS_DIAS = {
  Maiz: 90, Yuca: 270, Arroz: 120, Frijol: 75,
  Name: 210, Platano: 365, Cacao: 180, Algodon: 150,
  Sorgo: 110, 'Palma Aceitera': 365,
};

const ESTADOS = {
  IDLE: 'IDLE',
  CONFIGURING: 'CONFIGURING',
  LOADING: 'LOADING',
  PROJECTED: 'PROJECTED',
  SIMULATING: 'SIMULATING',
  PLAN_READY: 'PLAN_READY',
};

/**
 * usePrediccion — Proyección climática y simulación de escenarios.
 *
 * State machine: IDLE → CONFIGURING → LOADING → PROJECTED
 *                PROJECTED → SIMULATING → PROJECTED → PLAN_READY
 *
 * fetchProyeccion({lat, lng, cultivo, meses, analysisId, fechaSiembraStr}) → POST /predict
 * simularEscenario({precipDeltaPct, tempDeltaC, npkOverride, riegoOverride, lat, lng}) → POST /predict/scenario
 */
export default function usePrediccion() {
  const { agregarToast } = useAppStore();

  const [proyeccion6M, setProyeccion6M] = useState(null);
  const [loadingProyeccion, setLoadingProyeccion] = useState(false);
  const [estado, setEstado] = useState(ESTADOS.IDLE);
  const [npkSim, setNpkSimState] = useState(120);
  const [riegoSim, setRiegoSimState] = useState(75);
  const [stale, setStale] = useState(false);
  const [fechaSiembra, setFechaSiembra] = useState(null);
  const [etapaFenologica, setEtapaFenologica] = useState(null);
  const [selectedAnalysisData, setSelectedAnalysisData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // ── Fenologia ──
  const fenologia = useMemo(() => {
    if (!fechaSiembra) return null;
    try {
      const dias = Math.max(0, Math.floor((Date.now() - fechaSiembra.getTime()) / 86400000));
      const etapa = proyeccion6M?.meses?.find((m) => m.etapa_fenologica)?.etapa_fenologica || 'germinacion';
      return { etapa, diasDesdeSiembra: dias };
    } catch {
      return null;
    }
  }, [fechaSiembra, proyeccion6M]);

  // ── Core helpers ──
  const _resolveFenologia = useCallback((siembraStr, cultivo, result) => {
    if (!siembraStr) {
      setFechaSiembra(null);
      return;
    }
    try {
      const siembraDate = new Date(siembraStr);
      const ciclo = CICLOS_DIAS[cultivo] || 90;
      const dias = Math.max(0, Math.floor((Date.now() - siembraDate.getTime()) / 86400000));
      setFechaSiembra(siembraDate);
      const etapa = result?.meses?.[0]?.etapa_fenologica || 'germinacion';
      setEtapaFenologica({ etapa, diasDesdeSiembra: dias, cicloDias: ciclo,
        pct: Math.min(100, Math.round((dias / ciclo) * 100)) });
    } catch {
      setFechaSiembra(null);
    }
  }, []);

  const _runPrediccion = useCallback(async (lat, lng, cultivo, meses, analysisId, siembraStr, npk, riego) => {
    const ciclo = CICLOS_DIAS[cultivo] || 90;
    let diasDesdeSiembra = null;
    let fechaBase = null;
    if (siembraStr) {
      fechaBase = siembraStr;
      try { diasDesdeSiembra = Math.max(0, Math.floor((Date.now() - new Date(siembraStr).getTime()) / 86400000)); } catch { /* */ }
    }
    return getPrediccion(lat, lng, analysisId, meses, npk, riego, fechaBase, diasDesdeSiembra, ciclo, cultivo, siembraStr);
  }, []);

  // ── fetchProyeccion: manual projection ──
  const fetchProyeccion = useCallback(async ({
    lat, lng, cultivo = 'Maiz', meses = 6, analysisId = null, fechaSiembraStr = null,
  }) => {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      agregarToast('Selecciona una ubicación válida', 'advertencia');
      return null;
    }
    setEstado(ESTADOS.LOADING);
    setLoadingProyeccion(true);
    try {
      const result = await _runPrediccion(Number(lat), Number(lng), cultivo, meses, analysisId, fechaSiembraStr, npkSim, riegoSim);
      if (result) {
        // Normalize: ensure meses exists as an array (defensive against field name mismatches)
        console.debug('[usePrediccion] fetchProyeccion result shape:', {
          hasMeses: !!result.meses,
          mesesLength: result.meses?.length,
          keys: Object.keys(result),
        });
        if (!result.meses) {
          result.meses = [];
        }
        setProyeccion6M(result);
        _resolveFenologia(fechaSiembraStr, cultivo, result);
        setStale(false);
        setEstado(ESTADOS.PROJECTED);
        return result;
      }
      setEstado(ESTADOS.IDLE);
    } catch {
      agregarToast('Error al cargar la proyección', 'error');
      setEstado(ESTADOS.IDLE);
    } finally {
      setLoadingProyeccion(false);
    }
    return null;
  }, [npkSim, riegoSim, _runPrediccion, _resolveFenologia, agregarToast]);

  // ── selectAnalysis: fetch analysis by ID → project ──
  const selectAnalysis = useCallback(async (analysisId) => {
    if (!analysisId) {
      setSelectedAnalysisData(null); setProyeccion6M(null); setEstado(ESTADOS.IDLE);
      return null;
    }
    setEstado(ESTADOS.LOADING); setLoadingProyeccion(true);
    try {
      const data = await getAnalysis(analysisId);
      if (!data) { agregarToast('Análisis no encontrado', 'advertencia'); setEstado(ESTADOS.IDLE); setLoadingProyeccion(false); return null; }
      const lat = Number(data.lat), lng = Number(data.lng);
      const cultivo = data.cultivo || data.cultivo_recomendado || 'Maiz';
      setSelectedAnalysisData(data);
      return await fetchProyeccion({ lat, lng, cultivo, meses: 6, analysisId, fechaSiembraStr: data.fecha_siembra || data.fecha || data.created_at });
    } catch {
      agregarToast('Error al cargar la proyección', 'error');
      setEstado(ESTADOS.IDLE); setLoadingProyeccion(false);
      return null;
    }
  }, [fetchProyeccion, agregarToast]);

  // ── handleManualQuery ──
  const handleManualQuery = useCallback(async ({ lat, lng, cultivo, fechaSiembra: fs }) => {
    setSelectedAnalysisData(null);
    return await fetchProyeccion({ lat, lng, cultivo: cultivo || 'Maiz', meses: 6, fechaSiembraStr: fs || null });
  }, [fetchProyeccion]);

  // ── simularEscenario: POST /predict/scenario ──
  const simularEscenario = useCallback(async (scenario) => {
    const { precipDeltaPct = 0, tempDeltaC = 0, npkOverride = null, riegoOverride = null, lat, lng } = scenario;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      agregarToast('Coordenadas no disponibles para el escenario', 'advertencia');
      return null;
    }
    setEstado(ESTADOS.SIMULATING); setLoadingProyeccion(true);
    try {
      const result = await postScenario(Number(lat), Number(lng), 6, precipDeltaPct, tempDeltaC, npkOverride, riegoOverride);
      if (result) { setProyeccion6M(result); setEstado(ESTADOS.PROJECTED); agregarToast('Escenario aplicado — proyección recalculada', 'exito'); return result; }
      agregarToast('No se pudo calcular el escenario', 'error'); setEstado(ESTADOS.PROJECTED);
    } catch {
      agregarToast('No se pudo calcular el escenario', 'error'); setEstado(ESTADOS.PROJECTED);
    } finally {
      setLoadingProyeccion(false);
    }
    return null;
  }, [agregarToast]);

  const setNpkSim = useCallback((v) => { setNpkSimState(v); setStale(true); }, []);
  const setRiegoSim = useCallback((v) => { setRiegoSimState(v); setStale(true); }, []);
  const marcarPlanListo = useCallback(() => setEstado(ESTADOS.PLAN_READY), []);
  // ── compararEscenarios: POST /reports/compare-scenario ──
  const compararEscenarios = useCallback(async (lat, lng, months = 6) => {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      agregarToast('Coordenadas no disponibles para comparar escenarios', 'advertencia');
      return null;
    }
    setLoadingCompare(true);
    try {
      const result = await getCompareScenarios(Number(lat), Number(lng), months);
      if (result) {
        setCompareData(result);
        agregarToast('Comparación Niño vs Normal lista', 'exito');
        return result;
      }
      agregarToast('No se pudo obtener la comparación', 'error');
    } catch {
      agregarToast('Error al comparar escenarios', 'error');
    } finally {
      setLoadingCompare(false);
    }
    return null;
  }, [agregarToast]);

  const clearCompare = useCallback(() => {
    setCompareData(null);
  }, []);

  const clearProyeccion = useCallback(() => {
    setProyeccion6M(null); setFechaSiembra(null); setEtapaFenologica(null);
    setSelectedAnalysisData(null); setCompareData(null);
    setEstado(ESTADOS.IDLE); setStale(false);
  }, []);

  return {
    proyeccion6M, loadingProyeccion, estado, npkSim, riegoSim, stale,
    fenologia, etapaFenologica, fechaSiembra, selectedAnalysisData,
    setNpkSim, setRiegoSim,
    fetchProyeccion, simularEscenario, selectAnalysis, handleManualQuery, clearProyeccion, marcarPlanListo,
    compareData, loadingCompare, compararEscenarios, clearCompare,
  };
}
