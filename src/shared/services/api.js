// ============================================
// Servicio de API — AgroCaribe AI
// Maneja todas las llamadas al backend FastAPI
// Fallback a datos mock cuando la API no está disponible
// ============================================

import axios from "axios";

const getBaseUrl = () => {
  try {
    const saved = localStorage.getItem("agrocaribe_api_url");
    if (saved) return JSON.parse(saved);
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
};

const BASE_URL = getBaseUrl();

// Instancia de Axios con configuración base
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Datos mock para desarrollo sin backend ──
export const MUNICIPIOS_COORD_MAP = {
  Soledad: { lat: 10.9186, lng: -74.7646 },
  Barranquilla: { lat: 10.9685, lng: -74.7813 },
  Cartagena: { lat: 10.391, lng: -75.4794 },
  "Santa Marta": { lat: 11.2408, lng: -74.199 },
  Montería: { lat: 8.7578, lng: -75.8814 },
  Valledupar: { lat: 10.4631, lng: -73.2532 },
  Sincelejo: { lat: 9.3047, lng: -75.3976 },
  Riohacha: { lat: 11.5444, lng: -72.9072 },
};

export const MUNICIPIOS_CLIMA_MAP = {
  Soledad: {
    temperatura: 31.2,
    precipitacion: 35.5,
    humedad: 64,
    evapotranspiracion: 6.8,
    radiacion_solar: 21.4,
    ndvi: 0.28,
    ndwi: 0.08,
    calidad_suelo: "Media-Baja",
    cobertura_nube: 8,
    zona: "seca",
  },
  Riohacha: {
    temperatura: 32.5,
    precipitacion: 22.0,
    humedad: 58,
    evapotranspiracion: 7.4,
    radiacion_solar: 22.1,
    ndvi: 0.22,
    ndwi: 0.05,
    calidad_suelo: "Baja",
    cobertura_nube: 5,
    zona: "seca",
  },
  Montería: {
    temperatura: 28.2,
    precipitacion: 145.0,
    humedad: 84,
    evapotranspiracion: 4.1,
    radiacion_solar: 16.5,
    ndvi: 0.76,
    ndwi: 0.35,
    calidad_suelo: "Alta",
    cobertura_nube: 22,
    zona: "humeda",
  },
  "Santa Marta": {
    temperatura: 28.8,
    precipitacion: 112.5,
    humedad: 80,
    evapotranspiracion: 4.6,
    radiacion_solar: 17.8,
    ndvi: 0.68,
    ndwi: 0.28,
    calidad_suelo: "Alta",
    cobertura_nube: 15,
    zona: "humeda",
  },
  Barranquilla: {
    temperatura: 30.4,
    precipitacion: 58.2,
    humedad: 71,
    evapotranspiracion: 5.9,
    radiacion_solar: 19.5,
    ndvi: 0.44,
    ndwi: 0.15,
    calidad_suelo: "Media",
    cobertura_nube: 12,
    zona: "moderada",
  },
  Cartagena: {
    temperatura: 29.8,
    precipitacion: 70.4,
    humedad: 76,
    evapotranspiracion: 5.3,
    radiacion_solar: 18.2,
    ndvi: 0.48,
    ndwi: 0.18,
    calidad_suelo: "Media-Alta",
    cobertura_nube: 14,
    zona: "moderada",
  },
  Valledupar: {
    temperatura: 31.5,
    precipitacion: 62.0,
    humedad: 66,
    evapotranspiracion: 6.2,
    radiacion_solar: 20.8,
    ndvi: 0.42,
    ndwi: 0.12,
    calidad_suelo: "Media",
    cobertura_nube: 10,
    zona: "moderada",
  },
  Sincelejo: {
    temperatura: 29.5,
    precipitacion: 88.0,
    humedad: 78,
    evapotranspiracion: 5.0,
    radiacion_solar: 17.5,
    ndvi: 0.55,
    ndwi: 0.22,
    calidad_suelo: "Media-Alta",
    cobertura_nube: 18,
    zona: "moderada",
  },
};

export const MUNICIPIOS_SUELO_MAP = {
  Soledad: { ph: 6.2, materia_organica: 1.8, textura_suelo: "Franco-Arenoso" },
  Riohacha: { ph: 7.8, materia_organica: 1.2, textura_suelo: "Arenoso" },
  Montería: {
    ph: 6.5,
    materia_organica: 3.8,
    textura_suelo: "Franco-Arcilloso",
  },
  "Santa Marta": { ph: 6.3, materia_organica: 3.2, textura_suelo: "Limoso" },
  Barranquilla: { ph: 6.8, materia_organica: 2.2, textura_suelo: "Franco" },
  Cartagena: { ph: 7.2, materia_organica: 2.5, textura_suelo: "Franco-Limoso" },
  Valledupar: { ph: 6.9, materia_organica: 2.0, textura_suelo: "Arcilloso" },
  Sincelejo: {
    ph: 6.4,
    materia_organica: 2.8,
    textura_suelo: "Franco-Arcilloso",
  },
};

export const getClosestMunicipality = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined)
    return "Barranquilla";
  let closest = "Barranquilla";
  let minDist = Infinity;
  for (const [muni, coords] of Object.entries(MUNICIPIOS_COORD_MAP)) {
    const dist = Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      closest = muni;
    }
  }
  return closest;
};

export const getDynamicRecommendations = (muniName, clima, ndvi) => {
  const climaProfile =
    MUNICIPIOS_CLIMA_MAP[muniName] || MUNICIPIOS_CLIMA_MAP["Barranquilla"];
  const zona = climaProfile.zona;
  const ndviAdjustment =
    typeof ndvi === "number" ? Math.round((ndvi - climaProfile.ndvi) * 10) : 0;

  let yucaScore = 75;
  let yucaRiesgo = "bajo";
  let yucaJust = `La Yuca presenta una excelente adaptabilidad en ${muniName}. Las texturas y condiciones locales favorecen su desarrollo vegetativo con bajo estrés.`;

  let maizScore = 80;
  let maizRiesgo = "medio";
  let maizJust = `Las condiciones de temperatura (${clima.temperatura}°C) y precipitación (${clima.precipitacion} mm) en ${muniName} son óptimas para el ciclo vegetativo del maíz, favoreciendo un vigor vegetativo constante.`;

  let platanoScore = 70;
  let platanoRiesgo = "medio";
  let platanoJust = `El Plátano es viable en ${muniName} bajo condiciones de humedad controlada y fertilización adecuada.`;

  let frijolScore = 65;
  let frijolRiesgo = "medio";
  let frijolJust = `El Frijol es viable en el ciclo actual de ${muniName}, recomendándose monitoreo de humedad en floración.`;

  if (zona === "seca") {
    yucaScore = 94;
    yucaRiesgo = "bajo";
    yucaJust = `El clima cálido y seco de ${muniName} (${clima.precipitacion} mm de lluvia) es ideal para la Yuca. Al ser altamente tolerante a la sequía, se destaca como la opción principal y de menor riesgo para esta parcela en ${muniName}.`;

    maizScore = 48;
    maizRiesgo = "alto";
    maizJust = `El Maíz tiene un desempeño limitado en el clima seco de ${muniName} con bajas precipitaciones (${clima.precipitacion} mm), explicando que necesita un sistema de riego intensivo y costoso para prosperar.`;

    platanoScore = 50;
    platanoRiesgo = "alto";
    platanoJust = `El Plátano se desaconseja en ${muniName} debido a la baja humedad relativa (${clima.humedad}%) y escasez de lluvias, a menos que se cuente con riego tecnificado por goteo continuo.`;

    frijolScore = 55;
    frijolRiesgo = "alto";
    frijolJust = `El Frijol muestra viabilidad baja en ${muniName} por el estrés térmico prolongado y la escasa disponibilidad de agua.`;
  } else if (zona === "humeda") {
    maizScore = 93;
    maizRiesgo = "bajo";
    maizJust = `Las fértiles y húmedas condiciones de ${muniName} son insuperables para el Maíz. La precipitación de ${clima.precipitacion} mm y la temperatura promedio de ${clima.temperatura}°C cubren a cabalidad su demanda hídrica natural.`;

    platanoScore = 90;
    platanoRiesgo = "bajo";
    platanoJust = `El Plátano prospera de manera óptima gracias al ambiente húmedo (${clima.humedad}%) y los suelos ricos y profundos típicos de ${muniName}. Presenta un riesgo muy bajo de estrés.`;

    yucaScore = 78;
    yucaRiesgo = "medio";
    yucaJust = `La Yuca es cultivable en ${muniName}, pero se debe prestar especial atención al drenaje debido a las altas precipitaciones (${clima.precipitacion} mm) para evitar pudrición radicular.`;

    frijolScore = 75;
    frijolRiesgo = "medio";
    frijolJust = `Frijol viable bajo las abundantes lluvias de ${muniName}, aunque se recomienda vigilar la aparición de hongos debido a la humedad del ${clima.humedad}%.`;
  } else {
    maizScore = 85;
    maizRiesgo = "medio";
    maizJust = `El clima de transición en ${muniName} provee lluvias moderadas (${clima.precipitacion} mm) que, complementadas con riego ocasional, garantizan un buen rendimiento para el Maíz.`;

    yucaScore = 83;
    yucaRiesgo = "bajo";
    yucaJust = `Excelente comportamiento de la Yuca en ${muniName}, tolerando la variabilidad de humedad típica de la zona central de la región Caribe colombiana.`;

    platanoScore = 75;
    platanoRiesgo = "medio";
    platanoJust = `Viabilidad media para Plátano en ${muniName}, requiriendo micro-riego en los meses con menor precipitación del año.`;

    frijolScore = 70;
    frijolRiesgo = "medio";
    frijolJust = `El Frijol se adapta bien en ${muniName} gracias a las temperaturas templadas de transición, logrando una cosecha estable en ciclo corto.`;
  }

  maizScore = Math.min(98, Math.max(35, maizScore + ndviAdjustment));
  yucaScore = Math.min(
    98,
    Math.max(35, yucaScore + Math.round(ndviAdjustment * 0.5)),
  );
  platanoScore = Math.min(98, Math.max(35, platanoScore + ndviAdjustment));
  frijolScore = Math.min(
    98,
    Math.max(35, frijolScore + Math.round(ndviAdjustment * 0.7)),
  );

  const list = [
    {
      cultivo: "Maíz",
      score: maizScore,
      riesgo: maizRiesgo,
      justificacion: maizJust,
      emoji: "🌽",
      ciclo_dias: 90,
      rendimiento_estimado:
        zona === "seca"
          ? "2.1 t/ha"
          : zona === "humeda"
            ? "5.4 t/ha"
            : "4.0 t/ha",
    },
    {
      cultivo: "Yuca",
      score: yucaScore,
      riesgo: yucaRiesgo,
      justificacion: yucaJust,
      emoji: "🥔",
      ciclo_dias: 270,
      rendimiento_estimado:
        zona === "seca" ? "20 t/ha" : zona === "humeda" ? "15 t/ha" : "17 t/ha",
    },
    {
      cultivo: "Plátano",
      score: platanoScore,
      riesgo: platanoRiesgo,
      justificacion: platanoJust,
      emoji: "🍌",
      ciclo_dias: 330,
      rendimiento_estimado:
        zona === "seca" ? "8 t/ha" : zona === "humeda" ? "22 t/ha" : "14 t/ha",
    },
    {
      cultivo: "Frijol",
      score: frijolScore,
      riesgo: frijolRiesgo,
      justificacion: frijolJust,
      emoji: "🫘",
      ciclo_dias: 75,
      rendimiento_estimado: "1.8 t/ha",
    },
  ];

  return list.sort((a, b) => b.score - a.score);
};

export const MOCK_DATA = {
  municipios: [
    { id: 1, nombre: "Barranquilla", departamento: "Atlántico" },
    { id: 2, nombre: "Soledad", departamento: "Atlántico" },
    { id: 3, nombre: "Cartagena", departamento: "Bolívar" },
    { id: 4, nombre: "Santa Marta", departamento: "Magdalena" },
    { id: 5, nombre: "Montería", departamento: "Córdoba" },
    { id: 6, nombre: "Valledupar", departamento: "Cesar" },
    { id: 7, nombre: "Sincelejo", departamento: "Sucre" },
    { id: 8, nombre: "Riohacha", departamento: "La Guajira" },
  ],

  clima: {
    temperatura: 29.1,
    precipitacion: 74.5,
    humedad: 77,
    evapotranspiracion: 5.2,
    radiacion_solar: 18.4,
  },

  indicadores_satelite: {
    ndvi: 0.42,
    ndwi: 0.18,
    calidad_suelo: "Media-Alta",
    cobertura_nube: 12,
  },

  recomendaciones: [
    {
      cultivo: "Maíz",
      score: 86,
      riesgo: "medio",
      justificacion:
        "Las condiciones de temperatura (29.1°C) y precipitación (74.5 mm) son adecuadas para el ciclo vegetativo del maíz. El NDVI moderado indica cobertura vegetal existente aprovechable.",
      emoji: "🌽",
      ciclo_dias: 90,
      rendimiento_estimado: "4.2 t/ha",
    },
    {
      cultivo: "Yuca",
      score: 81,
      riesgo: "bajo",
      justificacion:
        "Alta tolerancia a la sequía y adaptación a suelos tropicales hace de la yuca una excelente opción. Riesgo bajo por su resistencia a variaciones climáticas del Caribe colombiano.",
      emoji: "🥔",
      ciclo_dias: 270,
      rendimiento_estimado: "18 t/ha",
    },
    {
      cultivo: "Frijol",
      score: 73,
      riesgo: "medio",
      justificacion:
        "Cultivo viable en el período analizado. Se recomienda riego suplementario durante la fase de floración dado el déficit hídrico moderado detectado en la zona.",
      emoji: "🫘",
      ciclo_dias: 75,
      rendimiento_estimado: "1.8 t/ha",
    },
    {
      cultivo: "Ñame",
      score: 68,
      riesgo: "bajo",
      justificacion:
        "Cultivo ancestral del Caribe con buena adaptación local. La textura del suelo y la materia orgánica detectada son favorables para su desarrollo tuberoso.",
      emoji: "🌱",
      ciclo_dias: 210,
      rendimiento_estimado: "12 t/ha",
    },
  ],

  historial: [
    {
      id: "C-0421",
      fecha: "2025-04-21T10:30:00Z",
      municipio: "Montería",
      departamento: "Córdoba",
      cultivo: "Maíz",
      score: 94,
      tipo: "analisis",
      estado: "Exitosa",
      area_hectareas: 5.2,
      coordenadas: { lat: 8.7578, lng: -75.8814 },
    },
    {
      id: "C-0420",
      fecha: "2025-04-20T14:15:00Z",
      municipio: "Barranquilla",
      departamento: "Atlántico",
      cultivo: "Plátano",
      score: 88,
      tipo: "analisis",
      estado: "Exitosa",
      area_hectareas: 3.0,
      coordenadas: { lat: 10.9685, lng: -74.7813 },
    },
    {
      id: "S-0419",
      fecha: "2025-04-19T09:00:00Z",
      municipio: "Santa Marta",
      departamento: "Magdalena",
      tipo: "suelo",
      estado: "Exitosa",
      calidad_suelo: "Media-Alta",
      ph: 6.2,
      nitrogeno: 58,
      fosforo: 21,
      potasio: 195,
      materia_organica: "3.5",
      ndvi: 0.72,
      coordenadas: { lat: 11.2408, lng: -74.199 },
    },
    {
      id: "S-0418",
      fecha: "2025-04-18T16:45:00Z",
      municipio: "Valledupar",
      departamento: "Cesar",
      tipo: "suelo",
      estado: "Exitosa",
      calidad_suelo: "Alta",
      ph: 6.8,
      nitrogeno: 67,
      fosforo: 28,
      potasio: 210,
      materia_organica: "4.1",
      ndvi: 0.81,
      coordenadas: { lat: 10.4631, lng: -73.2532 },
    },
    {
      id: "C-0417",
      fecha: "2025-04-17T11:20:00Z",
      municipio: "Sincelejo",
      departamento: "Sucre",
      cultivo: "Yuca",
      score: 76,
      tipo: "analisis",
      estado: "Exitosa",
      area_hectareas: 8.5,
      coordenadas: { lat: 9.3047, lng: -75.3976 },
    },
  ],
};

// ── Interceptores ──
let apiDisponible = true;

apiClient.interceptors.response.use(
  (response) => {
    apiDisponible = true;
    return response;
  },
  (error) => {
    apiDisponible = false;
    return Promise.reject(error);
  },
);

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiStatus = () => apiDisponible;

// ── Funciones de la API ──

/** Obtener lista de municipios */
export const getMunicipios = async () => {
  try {
    const { data } = await apiClient.get("/municipalities");
    return data;
  } catch {
    console.warn("API no disponible — usando municipios mock");
    return MOCK_DATA.municipios;
  }
};

/** Analizar ubicación y obtener recomendaciones */
export const analizarUbicacion = async (payload) => {
  try {
    const { data } = await apiClient.post("/analyze-location", payload);
    return data;
  } catch {
    console.warn(
      "API no disponible — usando recomendaciones dinámicas por municipio",
    );
    await new Promise((r) => setTimeout(r, 1800));

    // Detectar municipio desde el payload o desde coordenadas
    const muniName = payload.municipio
      ? payload.municipio
      : getClosestMunicipality(payload.lat, payload.lng);

    const climaLocal =
      MUNICIPIOS_CLIMA_MAP[muniName] || MUNICIPIOS_CLIMA_MAP["Barranquilla"];
    const recomendaciones = getDynamicRecommendations(
      muniName,
      climaLocal,
      climaLocal.ndvi,
    );

    return {
      clima: {
        temperatura: climaLocal.temperatura,
        precipitacion: climaLocal.precipitacion,
        humedad: climaLocal.humedad,
        evapotranspiracion: climaLocal.evapotranspiracion,
        radiacion_solar: climaLocal.radiacion_solar,
      },
      indicadores_satelite: {
        ndvi: climaLocal.ndvi,
        ndwi: climaLocal.ndwi,
        calidad_suelo: climaLocal.calidad_suelo,
        cobertura_nube: climaLocal.cobertura_nube,
      },
      recomendaciones,
      ubicacion: payload,
      es_mock: true,
    };
  }
};

/** Obtener datos climáticos de una ubicación */
export const getClima = async (lat, lng) => {
  try {
    const { data } = await apiClient.get("/climate", { params: { lat, lng } });
    return data;
  } catch {
    const muniName = getClosestMunicipality(Number(lat), Number(lng));
    const climaLocal =
      MUNICIPIOS_CLIMA_MAP[muniName] || MUNICIPIOS_CLIMA_MAP["Barranquilla"];
    return {
      temperatura: climaLocal.temperatura,
      precipitacion: climaLocal.precipitacion,
      humedad: climaLocal.humedad,
      evapotranspiracion: climaLocal.evapotranspiracion,
      radiacion_solar: climaLocal.radiacion_solar,
    };
  }
};

/** Obtener indicadores satelitales */
export const getIndicadoresSatelite = async (lat, lng) => {
  try {
    const { data } = await apiClient.get("/satellite-indicators", {
      params: { lat, lng },
    });
    return data;
  } catch {
    const muniName = getClosestMunicipality(Number(lat), Number(lng));
    const climaLocal =
      MUNICIPIOS_CLIMA_MAP[muniName] || MUNICIPIOS_CLIMA_MAP["Barranquilla"];
    return {
      ndvi: climaLocal.ndvi,
      ndwi: climaLocal.ndwi,
      calidad_suelo: climaLocal.calidad_suelo,
      cobertura_nube: climaLocal.cobertura_nube,
    };
  }
};

/** Obtener historial de consultas */
export const getHistorial = async () => {
  try {
    const { data } = await apiClient.get("/history");
    return data;
  } catch {
    return MOCK_DATA.historial;
  }
};

/** Obtener detalles de un análisis previo */
export const getAnalysis = async (id) => {
  try {
    const { data } = await apiClient.get(`/analysis/${id}`);
    return data;
  } catch {
    const localHistorialStr = localStorage.getItem("agrocaribe_historial");
    const localHistorial = localHistorialStr
      ? JSON.parse(localHistorialStr)
      : [];
    const allHistorial = [...localHistorial, ...(MOCK_DATA.historial || [])];
    const record = allHistorial.find((item) => item.id === id);
    if (record) {
      const fallbackMonth = record.fecha
        ? new Date(record.fecha).toLocaleDateString("es-CO", {
            month: "long",
          })
        : "Mayo";

      return {
        id: record.id,
        lat: record.coordenadas?.lat ?? record.lat ?? 10.9685,
        lng: record.coordenadas?.lng ?? record.lng ?? -74.7813,
        municipio: record.municipio || "Barranquilla",
        departamento: record.departamento || "Atlántico",
        tipo_suelo: record.tipo_suelo || record.textura_suelo || "Franco",
        ph_suelo: record.ph_suelo ?? record.ph ?? 6.8,
        materia_organica: record.materia_organica ?? 2.2,
        textura_suelo: record.textura_suelo ?? "Franco",
        mes_siembra: record.mes_siembra ?? fallbackMonth,
        cultivo:
          record.cultivo ||
          record.cultivo_top ||
          record.mejor_cultivo ||
          "Maíz",
      };
    }
    return null;
  }
};


/** Iniciar sesion con Supabase Auth */
export const login = async (email, password) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
};

/** Enviar mensaje al chat del AgroAsesor */
export const enviarMensajeChat = async (
  message,
  conversationId = null,
  userId = null,
) => {
  const { data } = await apiClient.post("/chat", {
    message,
    conversation_id: conversationId,
    user_id: userId,
  });
  return data;
};

/** Obtener lista de sensores IoT con ultima lectura */
export const getSensores = async () => {
  try {
    const { data } = await apiClient.get("/sensors");
    return data;
  } catch {
    return [];
  }
};

/** Obtener lecturas de un sensor especifico */
export const getLecturasSensor = async (sensorId, limit = 20) => {
  try {
    const { data } = await apiClient.get(`/sensors/${sensorId}/readings`, {
      params: { limit },
    });
    return data;
  } catch {
    return [];
  }
};

/** Registrar una nueva lectura de sensor */
export const crearLecturaSensor = async (
  sensorId,
  ndvi,
  humedad,
  temperatura,
) => {
  try {
    const { data } = await apiClient.post("/sensors/readings", {
      sensor_id: sensorId,
      ndvi,
      humedad,
      temperatura,
    });
    return data;
  } catch {
    return null;
  }
};

/** Detectar departamento y municipio desde coordenadas */
export const geoDecode = async (lat, lng) => {
  try {
    const { data } = await apiClient.post("/geo/decode", { lat, lng });
    return data;
  } catch {
    return { detectado: false };
  }
};

/** Obtener datos de suelo desde ISRIC SoilGrids v2.0 */
export const getSoilData = async (lat, lng) => {
  try {
    const { data } = await apiClient.get("/soil/data", {
      params: { lat, lng },
    });
    return data;
  } catch {
    const muniName = getClosestMunicipality(Number(lat), Number(lng));
    return MUNICIPIOS_SUELO_MAP[muniName] || null;
  }
};

/** Obtener prediccion climatica para una ubicacion */
export const getPrediccion = async (
  lat,
  lng,
  analysisId = null,
  months = 3,
  npk = null,
  riego = null,
) => {
  try {
    const payload = {
      analysis_id: analysisId,
      meses: months,
      npk,
      riego,
    };

    if (lat != null && lng != null) {
      payload.lat = lat;
      payload.lng = lng;
    }

    const { data } = await apiClient.post("/predict", payload);
    return data;
  } catch {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const muniName = getClosestMunicipality(latNum, lngNum);
    const climaLocal =
      MUNICIPIOS_CLIMA_MAP[muniName] || MUNICIPIOS_CLIMA_MAP["Barranquilla"];
    const recomendacionesBase = getDynamicRecommendations(
      muniName,
      climaLocal,
      climaLocal.ndvi,
    );
    const now = new Date();

    const meses = Array.from({ length: months }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
      const seasonalRainFactor =
        0.85 + (Math.sin(((date.getMonth() + 1) / 12) * Math.PI * 2) + 1) * 0.2;
      const seasonalTempDelta =
        Math.cos(((date.getMonth() + 1) / 12) * Math.PI * 2) * 1.2;
      const precipitacion = Number(
        (climaLocal.precipitacion * seasonalRainFactor).toFixed(1),
      );
      const temperatura = Number(
        (climaLocal.temperatura + seasonalTempDelta).toFixed(1),
      );
      const humedad = Math.min(
        96,
        Math.max(
          42,
          Math.round(climaLocal.humedad + (seasonalRainFactor - 1) * 18),
        ),
      );
      const ndviEstimado = Number(
        Math.min(
          0.92,
          Math.max(
            0.18,
            climaLocal.ndvi + (precipitacion - climaLocal.precipitacion) / 450,
          ),
        ).toFixed(2),
      );

      return {
        month: date
          .toLocaleDateString("es-CO", { month: "short" })
          .replace(".", ""),
        year: date.getFullYear(),
        temperatura,
        precipitacion,
        humedad,
        ndvi_estimado: ndviEstimado,
        cultivos_recomendados: getDynamicRecommendations(
          muniName,
          { ...climaLocal, temperatura, precipitacion, humedad },
          ndviEstimado,
        ).slice(0, 3),
      };
    });

    const bestMonth = meses.reduce((best, current) => {
      const bestScore =
        best.precipitacion * 0.45 +
        best.humedad * 0.35 +
        best.ndvi_estimado * 100 * 0.2;
      const currentScore =
        current.precipitacion * 0.45 +
        current.humedad * 0.35 +
        current.ndvi_estimado * 100 * 0.2;
      return currentScore > bestScore ? current : best;
    }, meses[0]);

    return {
      mejor_mes: bestMonth.month,
      mejor_cultivo: recomendacionesBase[0]?.cultivo || "Yuca",
      fuente: `Mock dinámico · ${muniName} · NASA POWER/OpenMeteo`,
      ubicacion: { lat: latNum, lng: lngNum, municipio: muniName },
      meses,
      es_mock: true,
    };
  }
};

/** Obtener alertas del sistema (sensores + analisis) */
export const getAlertas = async () => {
  try {
    const { data } = await apiClient.get("/reports/alerts");
    return data;
  } catch {
    return { alertas: [], total_criticas: 0, total_advertencias: 0 };
  }
};

/** Comparar analisis por IDs */
export const compararAnalisis = async (analysisIds) => {
  try {
    const { data } = await apiClient.post("/reports/compare", {
      analysis_ids: analysisIds,
    });
    return data;
  } catch {
    return { items: [] };
  }
};

/** Exportar reporte de un analisis */
export const exportarReporte = async (analysisId) => {
  try {
    const { data } = await apiClient.post("/reports/export", {
      analysis_id: analysisId,
    });
    return data;
  } catch {
    return null;
  }
};

/** Obtener resumen del dashboard */
export const getDashboardSummary = async () => {
  try {
    const { data } = await apiClient.get("/dashboard/summary");
    return data;
  } catch {
    return null;
  }
};

export default apiClient;
