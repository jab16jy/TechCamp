import { useState, useCallback } from 'react';
import useAppStore from '@shared/store';
import { getPrediccion } from '@shared/services/api';

export default function useIAPredictiva() {
  const { formulario, agregarToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [lat, setLat] = useState(String(formulario.lat || 10.5));
  const [lng, setLng] = useState(String(formulario.lng || -74.8));
  const [source, setSource] = useState('analisis');

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
