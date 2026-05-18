import { useState, useCallback, useEffect } from 'react';
import useAppStore from '@shared/store';
import { getPrediccion } from '@shared/services/api';

export default function useIAPredictiva() {
  const { formulario, agregarToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [lat, setLat] = useState(formulario.lat || 10.5);
  const [lng, setLng] = useState(formulario.lng || -74.8);
  const [source, setSource] = useState('analisis'); // 'analisis' or 'manual'

  useEffect(() => {
    if (formulario.lat && formulario.lng) {
      setLat(formulario.lat);
      setLng(formulario.lng);
    }
  }, [formulario.lat, formulario.lng]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPrediccion(lat, lng);
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
      setLat(formulario.lat);
      setLng(formulario.lng);
      setSource('analisis');
      agregarToast('Usando coordenadas del ultimo analisis', 'info');
    } else {
      agregarToast('No hay un analisis previo. Ingresa coordenadas manualmente.', 'advertencia');
    }
  }, [formulario, agregarToast]);

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
  };
}
