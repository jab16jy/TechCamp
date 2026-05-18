// ============================================
// Servicio de API — AgroCaribe AI
// Maneja todas las llamadas al backend FastAPI
// Fallback a datos mock cuando la API no está disponible
// ============================================

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Instancia de Axios con configuración base
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Datos mock para desarrollo sin backend ──
export const MOCK_DATA = {
  municipios: [
    { id: 1, nombre: 'Barranquilla', departamento: 'Atlántico' },
    { id: 2, nombre: 'Soledad', departamento: 'Atlántico' },
    { id: 3, nombre: 'Cartagena', departamento: 'Bolívar' },
    { id: 4, nombre: 'Santa Marta', departamento: 'Magdalena' },
    { id: 5, nombre: 'Montería', departamento: 'Córdoba' },
    { id: 6, nombre: 'Valledupar', departamento: 'Cesar' },
    { id: 7, nombre: 'Sincelejo', departamento: 'Sucre' },
    { id: 8, nombre: 'Riohacha', departamento: 'La Guajira' },
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
    calidad_suelo: 'Media-Alta',
    cobertura_nube: 12,
  },

  recomendaciones: [
    {
      cultivo: 'Maíz',
      score: 86,
      riesgo: 'medio',
      justificacion:
        'Las condiciones de temperatura (29.1°C) y precipitación (74.5 mm) son adecuadas para el ciclo vegetativo del maíz. El NDVI moderado indica cobertura vegetal existente aprovechable.',
      emoji: '🌽',
      ciclo_dias: 90,
      rendimiento_estimado: '4.2 t/ha',
    },
    {
      cultivo: 'Yuca',
      score: 81,
      riesgo: 'bajo',
      justificacion:
        'Alta tolerancia a la sequía y adaptación a suelos tropicales hace de la yuca una excelente opción. Riesgo bajo por su resistencia a variaciones climáticas del Caribe colombiano.',
      emoji: '🥔',
      ciclo_dias: 270,
      rendimiento_estimado: '18 t/ha',
    },
    {
      cultivo: 'Frijol',
      score: 73,
      riesgo: 'medio',
      justificacion:
        'Cultivo viable en el período analizado. Se recomienda riego suplementario durante la fase de floración dado el déficit hídrico moderado detectado en la zona.',
      emoji: '🫘',
      ciclo_dias: 75,
      rendimiento_estimado: '1.8 t/ha',
    },
    {
      cultivo: 'Ñame',
      score: 68,
      riesgo: 'bajo',
      justificacion:
        'Cultivo ancestral del Caribe con buena adaptación local. La textura del suelo y la materia orgánica detectada son favorables para su desarrollo tuberoso.',
      emoji: '🌱',
      ciclo_dias: 210,
      rendimiento_estimado: '12 t/ha',
    },
  ],

  historial: [
    {
      id: 'C-0421',
      fecha: '2025-04-21T10:30:00Z',
      municipio: 'Montería',
      departamento: 'Córdoba',
      cultivo: 'Maíz',
      score: 94,
      tipo: 'analisis',
      estado: 'Exitosa',
      area_hectareas: 5.2,
      coordenadas: { lat: 8.7578, lng: -75.8814 },
    },
    {
      id: 'C-0420',
      fecha: '2025-04-20T14:15:00Z',
      municipio: 'Barranquilla',
      departamento: 'Atlántico',
      cultivo: 'Plátano',
      score: 88,
      tipo: 'analisis',
      estado: 'Exitosa',
      area_hectareas: 3.0,
      coordenadas: { lat: 10.9685, lng: -74.7813 },
    },
    {
      id: 'S-0419',
      fecha: '2025-04-19T09:00:00Z',
      municipio: 'Santa Marta',
      departamento: 'Magdalena',
      tipo: 'suelo',
      estado: 'Exitosa',
      calidad_suelo: 'Media-Alta',
      ph: 6.2,
      nitrogeno: 58,
      fosforo: 21,
      potasio: 195,
      materia_organica: '3.5',
      ndvi: 0.72,
      coordenadas: { lat: 11.2408, lng: -74.199 },
    },
    {
      id: 'S-0418',
      fecha: '2025-04-18T16:45:00Z',
      municipio: 'Valledupar',
      departamento: 'Cesar',
      tipo: 'suelo',
      estado: 'Exitosa',
      calidad_suelo: 'Alta',
      ph: 6.8,
      nitrogeno: 67,
      fosforo: 28,
      potasio: 210,
      materia_organica: '4.1',
      ndvi: 0.81,
      coordenadas: { lat: 10.4631, lng: -73.2532 },
    },
    {
      id: 'C-0417',
      fecha: '2025-04-17T11:20:00Z',
      municipio: 'Sincelejo',
      departamento: 'Sucre',
      cultivo: 'Yuca',
      score: 76,
      tipo: 'analisis',
      estado: 'Exitosa',
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
  }
);

export const getApiStatus = () => apiDisponible;

// ── Funciones de la API ──

/** Obtener lista de municipios */
export const getMunicipios = async () => {
  try {
    const { data } = await apiClient.get('/municipalities');
    return data;
  } catch {
    console.warn('API no disponible — usando municipios mock');
    return MOCK_DATA.municipios;
  }
};

/** Analizar ubicación y obtener recomendaciones */
export const analizarUbicacion = async (payload) => {
  try {
    const { data } = await apiClient.post('/analyze-location', payload);
    return data;
  } catch {
    console.warn('API no disponible — usando recomendaciones mock');
    // Simular delay de procesamiento
    await new Promise((r) => setTimeout(r, 1800));
    return {
      clima: MOCK_DATA.clima,
      indicadores_satelite: MOCK_DATA.indicadores_satelite,
      recomendaciones: MOCK_DATA.recomendaciones,
      ubicacion: payload,
      es_mock: true,
    };
  }
};

/** Obtener datos climáticos de una ubicación */
export const getClima = async (lat, lng) => {
  try {
    const { data } = await apiClient.get('/climate', { params: { lat, lng } });
    return data;
  } catch {
    return MOCK_DATA.clima;
  }
};

/** Obtener indicadores satelitales */
export const getIndicadoresSatelite = async (lat, lng) => {
  try {
    const { data } = await apiClient.get('/satellite-indicators', { params: { lat, lng } });
    return data;
  } catch {
    return MOCK_DATA.indicadores_satelite;
  }
};

/** Obtener historial de consultas */
export const getHistorial = async () => {
  try {
    const { data } = await apiClient.get('/history');
    return data;
  } catch {
    return MOCK_DATA.historial;
  }
};

/** Iniciar sesion con Supabase Auth */
export const login = async (email, password) => {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
};

/** Enviar mensaje al chat del AgroAsesor */
export const enviarMensajeChat = async (message, conversationId = null, userId = null) => {
  const { data } = await apiClient.post('/chat', {
    message,
    conversation_id: conversationId,
    user_id: userId,
  });
  return data;
};

/** Obtener lista de sensores IoT con ultima lectura */
export const getSensores = async () => {
  try {
    const { data } = await apiClient.get('/sensors');
    return data;
  } catch {
    return [];
  }
};

/** Obtener lecturas de un sensor especifico */
export const getLecturasSensor = async (sensorId, limit = 20) => {
  try {
    const { data } = await apiClient.get(`/sensors/${sensorId}/readings`, { params: { limit } });
    return data;
  } catch {
    return [];
  }
};

/** Registrar una nueva lectura de sensor */
export const crearLecturaSensor = async (sensorId, ndvi, humedad, temperatura) => {
  try {
    const { data } = await apiClient.post('/sensors/readings', {
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
    const { data } = await apiClient.post('/geo/decode', { lat, lng });
    return data;
  } catch {
    return { detectado: false };
  }
};

/** Obtener prediccion climatica a 6 meses para una ubicacion */
export const getPrediccion = async (lat, lng) => {
  try {
    const { data } = await apiClient.post('/predict', { lat, lng });
    return data;
  } catch {
    return null;
  }
};

export default apiClient;
