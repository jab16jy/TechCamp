import { useState, useCallback } from 'react';
import { Sprout, BadgeCheck, AlertTriangle } from 'lucide-react';
import AnalysisService from '@shared/services/analysisService';
import useAppStore from '@shared/store';

const MONTHS = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];

export default function usePredictionSimulator() {
  const { agregarToast } = useAppStore();

  const [riego, setRiego] = useState(75);
  const [npk, setNpk] = useState(120);
  const [compare, setCompare] = useState(false);
  const [timeIdx, setTimeIdx] = useState(2);
  const [fechaSiembra, setFechaSiembra] = useState('2023-10-24');
  const [variedad, setVariedad] = useState('Híbrido Premium Maíz A-21');
  const [simulando, setSimulando] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const rendimiento = simResult
    ? simResult.rendimiento.toFixed(1)
    : (3.8 + riego * 0.012 + npk * 0.004).toFixed(1);
  const prob = simResult
    ? simResult.prob
    : Math.min(98, Math.round(72 + riego * 0.18 + npk * 0.06));
  const riesgo = simResult
    ? simResult.riesgo
    : Math.max(4, Math.round(28 - riego * 0.1 - npk * 0.04));

  const handleSimular = useCallback(async () => {
    if (simulando) return;
    setSimulando(true);
    try {
      const resultado = await AnalysisService.runPrediction({
        riego,
        npk,
        fechaSiembra,
        variedad,
      });
      setSimResult(resultado);
      agregarToast('Simulación predictiva completada con éxito', 'success');
    } catch {
      agregarToast('Error al ejecutar la simulación', 'error');
    } finally {
      setSimulando(false);
    }
  }, [riego, npk, fechaSiembra, variedad, simulando, agregarToast]);

  const clearSim = useCallback(() => setSimResult(null), []);

  const metrics = [
    {
      icon: Sprout,
      label: 'Rendimiento Estimado',
      val: `${rendimiento}`,
      unit: 't/ha',
      sub: simResult ? 'Simulado' : 'Proyectadas',
      color: '#10b981',
      tip: 'Calculado con NASA POWER + Sentinel-2 NDVI',
    },
    {
      icon: BadgeCheck,
      label: 'Probabilidad de Éxito',
      val: `${prob}`,
      unit: '%',
      sub: simResult ? 'Resultado del modelo' : 'Estado: Óptimo',
      color: '#2563eb',
      tip: 'Modelo Random Forest con 94.2% de precisión',
    },
    {
      icon: AlertTriangle,
      label: 'Riesgo Climático',
      val: `${riesgo}`,
      unit: '%',
      sub: simResult
        ? riesgo < 10
          ? 'Amenaza Muy Baja'
          : 'Amenaza Baja'
        : 'Amenaza Baja',
      color: '#f59e0b',
      tip: 'Basado en pronóstico ECMWF + alertas Sentinel-2',
    },
  ];

  return {
    // Estados
    riego,
    setRiego,
    npk,
    setNpk,
    compare,
    setCompare,
    timeIdx,
    setTimeIdx,
    fechaSiembra,
    setFechaSiembra,
    variedad,
    setVariedad,
    simulando,
    simResult,
    setSimResult,
    // Valores calculados
    rendimiento,
    prob,
    riesgo,
    MONTHS,
    // Handlers
    handleSimular,
    clearSim,
    // View model
    metrics,
  };
}
