import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';

const FALLBACK_DATA = {
  clima: {
    temperatura: 28.4,
    precipitacion: 12,
    humedad: 76,
    radiacion_solar: 850,
    evapotranspiracion: 5.2,
  },
  ubicacion: {
    municipio: 'Santa Marta',
    departamento: 'Magdalena',
    lat: 11.2408,
    lng: -74.1990,
    area_hectareas: 15.5,
    mes_siembra: 'Abril',
  },
  recomendaciones: [
    {
      cultivo: 'Maíz',
      score: 86,
      riesgo: 'Medio',
      justificacion:
        'Las condiciones actuales de humedad del suelo y la proyección de precipitaciones sugieren un entorno favorable para el desarrollo del maíz híbrido. Se recomienda un monitoreo constante de la radiación solar en las próximas semanas para ajustar el ciclo de riego.',
    },
  ],
  indicadores_satelite: {
    ndvi: 0.42,
    ndwi: 0.18,
    cobertura_nube: 14.2,
    calidad_suelo: 'Alta',
  },
  anomalia: {
    temperatura_actual: 28.4,
    temperatura_historica: 28.1,
    anomalia_temperatura: 0.3,
    precipitacion_actual: 12.0,
    precipitacion_historica: 50.0,
    anomalia_precipitacion: -38.0,
    humedad_actual: 76.0,
    humedad_historica: 78.0,
    anomalia_humedad: -2.0,
    fuente: 'NASA POWER',
  },
};

export default function useResultado() {
  const navigate = useNavigate();
  const { resultado, resetearFormulario, resetearResultado, agregarToast } = useAppStore();

  const data = useMemo(() => resultado || FALLBACK_DATA, [resultado]);

  const handleNuevaConsulta = useCallback(() => {
    resetearFormulario();
    resetearResultado();
    navigate('/investigador/analisis');
  }, [resetearFormulario, resetearResultado, navigate]);

  const handleDescargarPDF = useCallback(() => {
    agregarToast('Generando reporte PDF...', 'info');
  }, [agregarToast]);

  return {
    data,
    handleNuevaConsulta,
    handleDescargarPDF,
  };
}
