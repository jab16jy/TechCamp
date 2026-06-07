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
  return import.meta.env.VITE_API_URL || "";
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
export const MUNICIPIOS_REFERENCIA = [
  { id: 1, nombre: "Barranquilla", departamento: "Atlántico", lat: 10.9685, lng: -74.7813 },
  { id: 2, nombre: "Soledad", departamento: "Atlántico", lat: 10.9186, lng: -74.7646 },
  { id: 3, nombre: "Cartagena", departamento: "Bolívar", lat: 10.3910, lng: -75.5144 },
  { id: 4, nombre: "Santa Marta", departamento: "Magdalena", lat: 11.2408, lng: -74.1990 },
  { id: 5, nombre: "Montería", departamento: "Córdoba", lat: 8.7578, lng: -75.8814 },
  { id: 6, nombre: "Valledupar", departamento: "Cesar", lat: 10.4631, lng: -73.2532 },
  { id: 7, nombre: "Sincelejo", departamento: "Sucre", lat: 9.3047, lng: -75.3978 },
  { id: 8, nombre: "Riohacha", departamento: "La Guajira", lat: 11.5444, lng: -72.9072 },
];

export const MUNICIPIOS_COORD_MAP = MUNICIPIOS_REFERENCIA.reduce((acc, municipio) => {
  acc[municipio.nombre] = { lat: municipio.lat, lng: municipio.lng };
  return acc;
}, {});

const normalizeMunicipioName = (value = "") =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const getMunicipioReferencia = (nombre) => {
  const key = normalizeMunicipioName(nombre);
  return MUNICIPIOS_REFERENCIA.find((m) => normalizeMunicipioName(m.nombre) === key) || null;
};

// CLIMA_MAP y SUELO_MAP eliminados — los datos deben venir de la API real (OpenMeteo, NASA POWER, SoilGrids)

export const getClosestMunicipality = (lat, lng) => {
  // Ya no devuelve datos mock — debe usarse la API geo/decode
  return null;
};

// getDynamicRecommendations eliminado — las recomendaciones deben venir de la API /predict con ML real

// MOCK_DATA eliminado — los datos deben venir de la API real

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
    if (!Array.isArray(data)) return MUNICIPIOS_REFERENCIA;
    return data.map((m) => {
      const ref = getMunicipioReferencia(m.nombre);
      return {
        ...m,
        lat: m.lat ?? ref?.lat ?? null,
        lng: m.lng ?? ref?.lng ?? null,
      };
    });
  } catch {
    console.warn("API no disponible — usando municipios de referencia para selección local");
    return MUNICIPIOS_REFERENCIA;
  }
};

/** Analizar ubicación y obtener recomendaciones */
export const analizarUbicacion = async (payload) => {
  try {
    const { data } = await apiClient.post("/analyze-location", payload);
    return data;
  } catch (err) {
    console.warn("/analyze-location falló, componiendo desde APIs individuales:", err?.response?.status);
    // Fallback: compose result from individual real APIs
    const lat = Number(payload.lat);
    const lng = Number(payload.lng);
    const [clima, indicadores] = await Promise.all([
      getClima(lat, lng).catch(() => null),
      getIndicadoresSatelite(lat, lng).catch(() => null),
    ]);
    if (!clima && !indicadores) {
      throw new Error("No se pudo obtener datos climáticos ni satelitales de la API");
    }
    return {
      clima: clima || { temperatura: 29, precipitacion: 70, humedad: 74, evapotranspiracion: null, radiacion_solar: 20 },
      indicadores_satelite: indicadores || { ndvi: 0.42, ndwi: 0.15, calidad_suelo: "Media", cobertura_nube: 12 },
      recomendaciones: [],
    };
  }
};

/** Obtener datos climáticos de una ubicación */
export const getClima = async (lat, lng) => {
  try {
    const { data } = await apiClient.get("/climate", { params: { lat, lng } });
    return data;
  } catch {
    console.warn("API de clima no disponible para", lat, lng);
    return null;
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
    console.warn("API satelital no disponible para", lat, lng);
    return null;
  }
};

/** Eliminar un registro del historial */
export const deleteHistory = async (id) => {
  try {
    await apiClient.delete(`/history/${id}`);
    return true;
  } catch {
    return false;
  }
};

/** Obtener historial de consultas */
export const getHistorial = async () => {
  try {
    const { data } = await apiClient.get("/history");
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn("API de historial no disponible");
    return [];
  }
};

/** Obtener detalles de un análisis previo */
export const getAnalysis = async (id) => {
  try {
    const { data } = await apiClient.get(`/analysis/${id}`);
    return data;
  } catch {
    console.warn("API de análisis no disponible para id", id);
    return null;
  }
};


/** Iniciar sesion con Supabase Auth */
export const login = async (email, password) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
};

/** Enviar mensaje al chat del AgroAsesor (timeout extendido: 5 min) */
export const enviarMensajeChat = async (
  message,
  conversationId = null,
  userId = null,
) => {
  const { data } = await apiClient.post("/chat", {
    message,
    conversation_id: conversationId,
    user_id: userId,
  }, { timeout: 300000 });
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

// Mapa de referencia: coordenadas aproximadas de municipios del Caribe colombiano (solo para geolocalización)
const MUNICIPIO_COORDS_REF = {
  "10.97,-74.78": { municipio: "Barranquilla", departamento: "Atlántico" },
  "10.39,-75.51": { municipio: "Cartagena", departamento: "Bolívar" },
  "11.24,-74.21": { municipio: "Santa Marta", departamento: "Magdalena" },
  "8.76,-75.88": { municipio: "Montería", departamento: "Córdoba" },
  "10.46,-73.25": { municipio: "Valledupar", departamento: "Cesar" },
  "9.30,-75.40": { municipio: "Sincelejo", departamento: "Sucre" },
  "11.54,-72.91": { municipio: "Riohacha", departamento: "La Guajira" },
};

const findClosestMunicipioRef = (lat, lng) => {
  let best = null;
  let bestDist = Infinity;
  for (const [key, val] of Object.entries(MUNICIPIO_COORDS_REF)) {
    const [rLat, rLng] = key.split(",").map(Number);
    const dist = Math.pow(rLat - lat, 2) + Math.pow(rLng - lng, 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = val;
    }
  }
  // Only return if within ~50km (rough threshold for the Caribbean region)
  return bestDist < 0.5 ? best : null;
};

/** Detectar departamento y municipio desde coordenadas */
export const geoDecode = async (lat, lng) => {
  try {
    const { data } = await apiClient.post("/geo/decode", { lat, lng });
    if (data?.detectado) return data;
    // Backend didn't detect — try local fallback
    const ref = findClosestMunicipioRef(Number(lat), Number(lng));
    if (ref) {
      return {
        detectado: true,
        departamento: ref.departamento,
        municipio: ref.municipio,
        municipio_id: null,
      };
    }
    return { detectado: false };
  } catch {
    // Fallback local: encontrar municipio más cercano por coordenadas
    const ref = findClosestMunicipioRef(Number(lat), Number(lng));
    if (ref) {
      return {
        detectado: true,
        departamento: ref.departamento,
        municipio: ref.municipio,
        municipio_id: null,
      };
    }
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
    console.warn("SoilGrids no disponible para", lat, lng);
    return null;
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
  fechaInicio = null,
  diasDesdeSiembra = null,
  cicloDias = null,
  cultivo = null,
  fechaSiembra = null,
) => {
  try {
    const payload = {
      analysis_id: analysisId,
      meses: months,
      npk_override: npk,
      riego_override: riego,
    };

    if (lat != null && lng != null) {
      payload.lat = lat;
      payload.lng = lng;
    }
    if (fechaInicio) payload.fecha_inicio = fechaInicio;
    if (diasDesdeSiembra != null) payload.dias_desde_siembra = diasDesdeSiembra;
    if (cicloDias != null) payload.ciclo_dias = cicloDias;
    if (cultivo) payload.cultivo = cultivo;
    if (fechaSiembra) payload.fecha_siembra = fechaSiembra;

    const { data } = await apiClient.post("/predict", payload);
    return data;
  } catch {
    console.warn("API de predicción no disponible para", lat, lng);
    return null;
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

/** Simular escenario climático what-if (POST /predict/scenario) */
export const postScenario = async (
  lat,
  lng,
  months = 6,
  precipDeltaPct = 0,
  tempDeltaC = 0,
  npkOverride = null,
  riegoOverride = null,
) => {
  try {
    const payload = {
      lat,
      lng,
      meses: months,
      precip_delta_pct: precipDeltaPct,
      temp_delta_c: tempDeltaC,
    };
    if (npkOverride != null) payload.npk_override = npkOverride;
    if (riegoOverride != null) payload.riego_override = riegoOverride;
    const { data } = await apiClient.post("/predict/scenario", payload);
    return data;
  } catch {
    return null;
  }
};

/** Generar plan de riego optimizado desde sensor IoT */
export const generarPlanRiego = async (sensorId, analysisId = null, cultivo = null) => {
  try {
    const payload = { sensor_id: sensorId };
    if (analysisId) payload.analysis_id = analysisId;
    if (cultivo) payload.cultivo = cultivo;
    const { data } = await apiClient.post("/irrigation-plans", payload);
    return data;
  } catch {
    console.warn("API de plan de riego no disponible para sensor", sensorId);
    return null;
  }
};

/** Exportar plan de riego como tarea prioritaria */
export const exportarPlanATareas = async (plan) => {
  try {
    const { data } = await apiClient.post("/tasks", { plan_id: plan.plan_id });
    return data;
  } catch {
    return {
      task_id: `T-${Date.now()}`,
      titulo: `Riego ${plan.cultivo} — ${plan.sensor_nodo || plan.sensor_id}`,
      estado: "pendiente",
      prioridad: "alta",
      plan_id: plan.plan_id,
    };
  }
};

/** Obtener metricas reales del modelo ML (accuracy, precision, etc.) */
export const getModelMetrics = async () => {
  try {
    const { data } = await apiClient.get("/model/metrics");
    return data;
  } catch {
    return { model_available: false, accuracy: null };
  }
};

/** Enviar feedback (exito/fracaso y rendimiento real) para un analisis */
export const setAnalysisFeedback = async (id, { exito, rendimiento_real }) => {
  try {
    const { data } = await apiClient.put(`/analysis/${id}/feedback`, { exito, rendimiento_real });
    return data;
  } catch {
    return { success: false, message: "Error enviando feedback" };
  }
};

/** Obtener umbrales de estres hidrico por cultivo */
export const getUmbralesCultivos = async () => {
  try {
    const { data } = await apiClient.get("/irrigation-plans/thresholds");
    return data;
  } catch {
    return {
      cultivos: [
        { cultivo: "Maiz", umbral_estres_hidrico_pct: 20, et0_mm_dia: 5.2, factor_raiz: 1.0 },
        { cultivo: "Yuca", umbral_estres_hidrico_pct: 18, et0_mm_dia: 4.1, factor_raiz: 1.2 },
        { cultivo: "Platano", umbral_estres_hidrico_pct: 25, et0_mm_dia: 4.8, factor_raiz: 0.9 },
        { cultivo: "Arroz", umbral_estres_hidrico_pct: 30, et0_mm_dia: 6.0, factor_raiz: 0.7 },
        { cultivo: "Frijol", umbral_estres_hidrico_pct: 22, et0_mm_dia: 4.5, factor_raiz: 0.8 },
        { cultivo: "Name", umbral_estres_hidrico_pct: 20, et0_mm_dia: 4.3, factor_raiz: 1.1 },
        { cultivo: "Cacao", umbral_estres_hidrico_pct: 28, et0_mm_dia: 3.5, factor_raiz: 0.7 },
        { cultivo: "Algodon", umbral_estres_hidrico_pct: 18, et0_mm_dia: 5.8, factor_raiz: 1.0 },
        { cultivo: "Sorgo", umbral_estres_hidrico_pct: 18, et0_mm_dia: 5.5, factor_raiz: 1.1 },
        { cultivo: "Palma Aceitera", umbral_estres_hidrico_pct: 28, et0_mm_dia: 4.0, factor_raiz: 0.9 },
      ],
    };
  }
};

export default apiClient;
