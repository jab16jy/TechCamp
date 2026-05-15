import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';
import AnalysisService from '@shared/services/analysisService';
import { Leaf, Droplets, FlaskConical } from 'lucide-react';

export function useAnalisisCultivos() {
  const navigate = useNavigate();
  const {
    formulario,
    actualizarFormulario,
    setCargandoAnalisis,
    cargandoAnalisis,
    setResultado,
    agregarToast,
    agregarAlHistorial,
  } = useAppStore();

  const [municipiosLista, setMunicipiosLista] = useState([]);
  const rol = sessionStorage.getItem('rol');
  const isProductor = rol === 'productor';
  const [mode, setMode] = useState('simple');
  const [activeTab, setActiveTab] = useState('analisis');
  const [selectedParcela, setSelectedParcela] = useState('');

  const CLIMA_POR_PARCELA = {
    'Hacienda El Sol - Hace 2 dias': { temperatura: 26.4, humedad: 72, precipitacion: 1180 },
    'Lote Norte - Hace 1 semana': { temperatura: 28.1, humedad: 65, precipitacion: 940 },
    'Parcela Demo - Ayer': { temperatura: 24.8, humedad: 78, precipitacion: 1320 },
  };

  const clima =
    selectedParcela && CLIMA_POR_PARCELA[selectedParcela]
      ? CLIMA_POR_PARCELA[selectedParcela]
      : { temperatura: 26.4, humedad: 72, precipitacion: 1180 };

  useEffect(() => {
    if (isProductor) setMode('simple');
  }, [isProductor]);

  useEffect(() => {
    AnalysisService.getAvailableLocations().then(setMunicipiosLista);
  }, []);

  const handleFormChange = (newFields) => {
    actualizarFormulario(newFields);
  };

  const handleMapChange = (latlng) => {
    actualizarFormulario({
      lat: latlng.lat,
      lng: latlng.lng,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ['departamento', 'municipio', 'tipo_suelo', 'mes_siembra', 'area_hectareas'];
    const missing = required.filter((field) => !formulario[field]);

    if (missing.length > 0 || !formulario.lat || !formulario.lng) {
      agregarToast('Por favor, completa todos los campos y selecciona la ubicacion en el mapa', 'error');
      return;
    }

    setCargandoAnalisis(true);
    try {
      const resultado = await AnalysisService.performAnalysis({
        ...formulario,
        humedad: clima.humedad,
      });
      setResultado(resultado);
      agregarToast('Analisis completado exitosamente', 'exito');

      const topRec = resultado.recomendaciones?.[0];
      agregarAlHistorial({
        tipo: mode === 'advanced' ? 'suelo' : 'analisis',
        municipio: formulario.municipio,
        departamento: formulario.departamento,
        lat: formulario.lat,
        lng: formulario.lng,
        area_hectareas: formulario.area_hectareas,
        ...(mode === 'simple'
          ? {
              cultivo: topRec?.cultivo || null,
              score: topRec?.score || null,
              cultivo_top: topRec?.cultivo || null,
              rankings:
                resultado.structuredRecommendation?.output?.ranking?.map((r, i) => ({
                  rank: i + 1,
                  crop: r.crop,
                  score: r.score,
                })) || [],
            }
          : {
              ph: formulario.ph_suelo || null,
              nitrogeno: null,
              fosforo: null,
              potasio: null,
              materia_organica: formulario.materia_organica || null,
              calidad_suelo: resultado.indicadores_satelite?.calidad_suelo || null,
              ndvi: resultado.indicadores_satelite?.ndvi || null,
            }),
      });

      if (mode === 'advanced') {
        navigate('/investigador/resultado-avanzado');
      } else {
        navigate('/resultado');
      }
    } catch (error) {
      agregarToast('Error al procesar el analisis. Intentalo de nuevo.', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  const handleParcelaChange = (e) => {
    setSelectedParcela(e.target.value);
  };

  const structuredPreview = useMemo(
    () =>
      AnalysisService.createStructuredAnalysisPayload(
        {
          clima: { humedad: clima.humedad },
          indicadores_satelite: { ndvi: clima.humedad > 68 ? 0.72 : 0.28 },
        },
        { ...formulario, humedad: clima.humedad },
      ),
    [clima.humedad, formulario],
  );

  const metricCardsData = useMemo(
    () => [
      {
        key: 'ndvi',
        label: 'Vegetacion (NDVI)',
        value: structuredPreview.output.kpis.ndvi.value,
        trend: structuredPreview.output.kpis.ndvi.trend,
        tone: 'positive',
        Icon: Leaf,
        tip: 'Índice de Vegetación de Diferencia Normalizada basado en imágenes Sentinel-2. Valores >0.5 indican vegetación saludable.',
      },
      {
        key: 'humidity',
        label: 'Humedad',
        value: structuredPreview.output.kpis.humidity.value,
        trend: structuredPreview.output.kpis.humidity.trend,
        tone: 'neutral',
        Icon: Droplets,
        tip: 'Humedad relativa promedio del ambiente, calculada con datos de NASA POWER para las coordenadas seleccionadas.',
      },
      {
        key: 'nitrogen',
        label: 'Nitrogeno',
        value: structuredPreview.output.kpis.nitrogen.value,
        trend: structuredPreview.output.kpis.nitrogen.trend,
        tone: 'neutral',
        Icon: FlaskConical,
        tip: 'Estimación de nitrógeno disponible basada en materia orgánica del suelo y área de la parcela.',
      },
    ],
    [structuredPreview],
  );

  return {
    // Estados
    municipiosLista,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    selectedParcela,
    setSelectedParcela,
    // Datos derivados
    isProductor,
    clima,
    CLIMA_POR_PARCELA,
    structuredPreview,
    metricCardsData,
    // Store
    formulario,
    cargandoAnalisis,
    // Handlers
    handleFormChange,
    handleMapChange,
    handleSubmit,
    handleParcelaChange,
    // Navegación
    navigate,
  };
}
