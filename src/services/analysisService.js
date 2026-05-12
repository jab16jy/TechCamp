import {
  analizarUbicacion,
  getMunicipios,
  getClima,
  getIndicadoresSatelite,
  getHistorial,
} from './api';

const FALLBACK_CROPS = [
  {
    crop: 'Platano',
    score: 95,
    explanation:
      'Se adapta bien a humedad alta y temperatura estable. El vigor satelital sugiere buena respuesta productiva en el lote.',
  },
  {
    crop: 'Maiz',
    score: 88,
    explanation:
      'Tiene buen potencial si se mantiene el manejo de agua y nitrogeno. El entorno actual favorece un desarrollo vegetativo consistente.',
  },
  {
    crop: 'Cacao',
    score: 84,
    explanation:
      'Es viable por el microclima humedo, aunque requiere mejor drenaje. Su estabilidad mejora en sistemas sostenibles y con sombra regulada.',
  },
];

const COVER_CROP = {
  crop: 'Canavalia',
  score: 91,
  explanation:
    'Se prioriza como cultivo de cobertura por el bajo vigor detectado. Ayuda a proteger suelo, fijar nitrogeno y recuperar estructura biologica.',
};

const clampScore = (value) => Math.max(70, Math.min(97, Math.round(value)));
const toFixedString = (value, digits = 2) => Number(value || 0).toFixed(digits);

const getTrendFromNdvi = (ndvi) => {
  const pct = Math.max(1, Math.round(Math.abs((ndvi - 0.5) * 20)));
  return ndvi >= 0.5 ? `+${pct}%` : `-${pct}%`;
};

const estimateNitrogen = (raw, formData) => {
  const directValue =
    raw?.suelo?.nitrogeno ??
    raw?.nitrogeno ??
    raw?.indicadores_suelo?.nitrogeno ??
    raw?.lab?.nitrogeno;

  if (typeof directValue === 'number') return Math.round(directValue);

  const organicMatter = Number(formData?.materia_organica || 0);
  const area = Number(formData?.area_hectareas || 0);
  return Math.round(42 + organicMatter * 3 + Math.min(area, 20) * 0.4);
};

const buildRanking = (raw, ndvi) => {
  const rawRecommendations = Array.isArray(raw?.recomendaciones) ? raw.recomendaciones : [];

  if (rawRecommendations.length > 0) {
    const normalized = rawRecommendations.slice(0, 3).map((item, index) => ({
      rank: index + 1,
      crop: item.cultivo || item.crop || `Cultivo ${index + 1}`,
      score: clampScore(item.score ?? 80 - index * 5),
      explanation:
        item.justificacion ||
        item.explanation ||
        'Compatibilidad positiva con el microclima actual y un perfil vegetativo estable para esta parcela.',
    }));

    if (ndvi < 0.3) {
      return [COVER_CROP, ...normalized].slice(0, 3).map((item, index) => ({ ...item, rank: index + 1 }));
    }

    return normalized;
  }

  const fallback = ndvi < 0.3 ? [COVER_CROP, ...FALLBACK_CROPS].slice(0, 3) : FALLBACK_CROPS;
  return fallback.map((item, index) => ({ rank: index + 1, ...item }));
};

const buildThought = ({ humidity, ndvi, nitrogen, ranking }) => {
  const topCrop = ranking[0]?.crop || 'cultivo principal';
  const humidityBand = humidity >= 70 ? 'humedad alta y estable' : 'humedad moderada con mayor sensibilidad al estres';
  const ndviBand = ndvi < 0.3 ? 'vigor vegetal bajo' : 'vigor vegetal favorable';
  const nitrogenCheck = nitrogen >= 50 ? 'suficiente' : 'limitante';

  return `Relacion humedad-fenologia: el lote muestra ${humidityBand}, con ${ndviBand} para establecimiento y desarrollo inicial. Verificacion cognitiva: el nitrogeno estimado (${nitrogen} kg/ha) es ${nitrogenCheck} para ${topCrop}.`;
};

const buildTechnicalNote = (ndvi) => {
  if (ndvi < 0.3) {
    return 'La recomendacion prioriza cobertura y recuperacion biologica del suelo para estabilizar humedad, reducir erosiones y preparar una siguiente siembra comercial con menor riesgo.';
  }

  return 'La recomendacion favorece cultivos compatibles con humedad relativamente alta y vigor vegetal positivo, priorizando productividad con menor estres hidrico. Se recomienda cobertura viva, monitoreo de nitrogeno y manejo de drenaje para sostener fertilidad y estructura.';
};

const AnalysisService = {
  async performAnalysis(formData) {
    const payload = {
      ...formData,
      area_hectareas: Number(formData.area_hectareas) || 0,
      ph_suelo: formData.ph_suelo ? Number(formData.ph_suelo) : null,
      materia_organica: formData.materia_organica ? Number(formData.materia_organica) : null,
    };

    try {
      const results = await analizarUbicacion(payload);
      const structuredRecommendation = this.createStructuredAnalysisPayload(results, payload);

      return {
        ...results,
        structuredRecommendation,
      };
    } catch (error) {
      console.error('Error in AnalysisService.performAnalysis:', error);
      throw error;
    }
  },

  async getAvailableLocations() {
    return await getMunicipios();
  },

  async getClimateData(lat, lng) {
    return await getClima(lat, lng);
  },

  async getSatelliteIndicators(lat, lng) {
    return await getIndicadoresSatelite(lat, lng);
  },

  async getHistory() {
    return await getHistorial();
  },

  createStructuredAnalysisPayload(raw = {}, formData = {}) {
    const ndvi = Number(raw?.indicadores_satelite?.ndvi ?? raw?.ndvi ?? 0.72);
    const humidity = Math.round(Number(raw?.clima?.humedad ?? formData?.humedad ?? 76));
    const nitrogen = estimateNitrogen(raw, formData);
    const ranking = buildRanking(raw, ndvi);

    return {
      thought: buildThought({ humidity, ndvi, nitrogen, ranking }),
      output: {
        kpis: {
          ndvi: {
            value: toFixedString(ndvi),
            trend: getTrendFromNdvi(ndvi),
            status: 'emerald',
          },
          humidity: {
            value: `${humidity}%`,
            trend: humidity >= 70 ? 'Estable' : 'Variable',
            status: 'blue',
          },
          nitrogen: {
            value: `${nitrogen} kg/ha`,
            trend: nitrogen >= 50 ? '-1.2' : '-3.4',
            status: 'amber',
          },
        },
        ranking,
        technical_note: buildTechnicalNote(ndvi),
      },
    };
  },

  getNdviStatus(ndvi) {
    if (ndvi < 0.2) return { label: 'Bajo', color: 'var(--riesgo-alto)', class: 'alerta' };
    if (ndvi <= 0.5) return { label: 'Medio', color: 'var(--riesgo-medio)', class: 'normal' };
    return { label: 'Alto', color: 'var(--riesgo-bajo)', class: 'optimo' };
  },
};

export default AnalysisService;
