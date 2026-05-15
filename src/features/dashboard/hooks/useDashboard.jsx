import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Leaf, Zap, Thermometer, Droplets, Wind, Sun,
  AlertTriangle, Radio, FlaskConical, Activity,
} from 'lucide-react';

// ── Static demo data ────────────────────────────────────────
export const FIELD_UPDATES = [
  { id: 'u1', lote: 'Lote A – Norte', status: 'ok', msg: 'Humedad estable al 74%. Sin intervención necesaria.', icon: <Droplets size={14} />, time: '5 min ago', color: 'emerald' },
  { id: 'u2', lote: 'Sector Este – B2', status: 'warn', msg: 'Temperatura en ascenso: 31.2°C. Riesgo moderado de estrés térmico.', icon: <Thermometer size={14} />, time: '12 min ago', color: 'amber' },
  { id: 'u3', lote: 'Lote C – Sur', status: 'ok', msg: 'NDVI 0.71 — Salud foliar en rango óptimo (0.65–0.80).', icon: <Leaf size={14} />, time: '28 min ago', color: 'emerald' },
  { id: 'u4', lote: 'Nodo S-04 – B', status: 'alert', msg: 'Humedad de suelo crítica: 34%. Activar riego en próximas 2 horas.', icon: <AlertTriangle size={14} />, time: '1 h ago', color: 'red' },
  { id: 'u5', lote: 'Sentinel-2 Sync', status: 'ok', msg: 'Nuevas imágenes NDVI disponibles. Análisis de cobertura completado.', icon: <Radio size={14} />, time: '2 h ago', color: 'blue' },
];

export const AI_METRICS = [
  { label: 'Precisión del Modelo', value: '94.2%', delta: '+1.3%', up: true, icon: <BrainCircuit size={18} />, color: 'emerald' },
  { label: 'Latencia de Inferencia', value: '124 ms', delta: '-8ms', up: true, icon: <Zap size={18} />, color: 'blue' },
  { label: 'Muestras Procesadas', value: '12,847', delta: '+247', up: true, icon: <Activity size={18} />, color: 'purple' },
  { label: 'Alertas Activas', value: '3', delta: '+1', up: false, icon: <AlertTriangle size={18} />, color: 'amber' },
];

export const WEATHER = [
  { label: 'Temperatura', value: '28.6°C', icon: <Thermometer size={15} className="text-amber-500" /> },
  { label: 'Humedad', value: '72%', icon: <Droplets size={15} className="text-blue-500" /> },
  { label: 'Viento', value: '12 km/h', icon: <Wind size={15} className="text-slate-400" /> },
  { label: 'Radiación', value: '847 W/m²', icon: <Sun size={15} className="text-yellow-500" /> },
];

export const MODEL_METRICS = [
  { cultivo: 'Yuca', accuracy: '95.8%', f1: '0.94', mae: '2.1%', confianza: 'Alta (Ideal para suelos francos)', icon: 'yuca' },
  { cultivo: 'Ñame', accuracy: '93.2%', f1: '0.91', mae: '3.5%', confianza: 'Alta (Sensible a humedad/NDWI)', icon: 'ñame' },
  { cultivo: 'Guineo', accuracy: '91.5%', f1: '0.89', mae: '4.2%', confianza: 'Media (Depende de vientos/clima)', icon: 'guineo' },
  { cultivo: 'Papa', accuracy: '89.1%', f1: '0.87', mae: '5.8%', confianza: 'Moderada (Afinidad baja en Caribe)', icon: 'papa' },
];

export const SPARK_DATA = {
  acc: [90.1, 91.8, 92.4, 93.0, 93.9, 94.2],
  lat: [148, 140, 136, 131, 127, 124],
  proc: [12200, 12380, 12540, 12640, 12780, 12847],
};

export default function useDashboard() {
  const navigate = useNavigate();
  const [timestamp, setTimestamp] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTimestamp(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const refreshTimestamp = useCallback(() => setTimestamp(new Date()), []);

  const moduleShortcuts = [
    { label: 'Agro-Asesor IA', sub: 'Mapa + Chatbot', path: '/investigador/mapas', icon: <BrainCircuit size={16} />, color: 'emerald', onClick: () => navigate('/investigador/mapas') },
    { label: 'Análisis Suelos', sub: 'Laboratorio digital', path: '/investigador/analisis', icon: <FlaskConical size={16} />, color: 'blue', onClick: () => navigate('/investigador/analisis') },
    { label: 'IA Predictiva', sub: 'Modelos de ML', path: '/investigador/ia', icon: <Activity size={16} />, color: 'purple', onClick: () => navigate('/investigador/ia') },
    { label: 'Nodos IoT', sub: 'Sensores en campo', path: '/investigador/sensores', icon: <Radio size={16} />, color: 'amber', onClick: () => navigate('/investigador/sensores') },
  ];

  const weeklyStats = [
    { label: 'Análisis realizados', val: '24', color: 'text-[#0f5238]' },
    { label: 'Alertas gestionadas', val: '7', color: 'text-amber-600' },
    { label: 'Reportes exportados', val: '3', color: 'text-blue-600' },
  ];

  return {
    timestamp,
    refreshTimestamp,
    moduleShortcuts,
    weeklyStats,
    FIELD_UPDATES,
    AI_METRICS,
    WEATHER,
    MODEL_METRICS,
    SPARK_DATA,
    navigate,
  };
}
