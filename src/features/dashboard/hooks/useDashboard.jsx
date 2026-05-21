import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Leaf, Zap, Thermometer, Droplets, Wind, Sun,
  AlertTriangle, Radio, FlaskConical, Activity,
} from 'lucide-react';
import { getDashboardSummary, getClima } from '@shared/services/api';

export const AI_METRICS = [
  { label: 'Precision del Modelo', value: '91.2%', delta: '+1.3%', up: true, icon: <BrainCircuit size={18} />, color: 'emerald' },
  { label: 'Latencia de Inferencia', value: '128 ms', delta: '-12ms', up: true, icon: <Zap size={18} />, color: 'blue' },
];

export const WEATHER_BASE = [
  { label: 'Temperatura', value: '—°C', key: 'temperatura', icon: <Thermometer size={15} className="text-amber-500" /> },
  { label: 'Humedad', value: '—%', key: 'humedad', icon: <Droplets size={15} className="text-blue-500" /> },
  { label: 'Viento', value: '—', key: null, icon: <Wind size={15} className="text-slate-400" /> },
  { label: 'Radiacion', value: '—', key: 'radiacion_solar', icon: <Sun size={15} className="text-yellow-500" /> },
];

export const MODEL_METRICS = [
  { cultivo: 'Yuca', accuracy: '95.8%', f1: '0.94', mae: '2.1%', confianza: 'Alta (Ideal para suelos francos)', icon: 'yuca' },
  { cultivo: 'Name', accuracy: '93.2%', f1: '0.91', mae: '3.5%', confianza: 'Alta (Sensible a humedad/NDWI)', icon: 'name' },
  { cultivo: 'Maiz', accuracy: '94.5%', f1: '0.93', mae: '2.8%', confianza: 'Alta (Amplio rango climatico)', icon: 'maiz' },
  { cultivo: 'Cacao', accuracy: '89.1%', f1: '0.87', mae: '5.8%', confianza: 'Moderada (Requiere mas datos)', icon: 'cacao' },
];

export default function useDashboard() {
  const navigate = useNavigate();
  const [timestamp, setTimestamp] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setTimestamp(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardSummary(),
      getClima(10.5, -74.8),
    ]).then(([summaryData, weatherData]) => {
      setSummary(summaryData);
      setWeather(weatherData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const refreshTimestamp = useCallback(() => setTimestamp(new Date()), []);

  const fieldUpdates = summary?.ultimos_analisis?.length
    ? summary.ultimos_analisis.map((a) => ({
        id: a.id,
        lote: a.municipio || 'Parcela',
        status: a.score >= 70 ? 'ok' : a.score >= 50 ? 'warn' : 'alert',
        msg: `${a.cultivo || 'Analisis'} — Score: ${a.score}% (${a.tipo})`,
        icon: <Leaf size={14} />,
        time: a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—',
        color: a.score >= 70 ? 'emerald' : a.score >= 50 ? 'amber' : 'red',
      }))
    : [];

  const aiMetrics = summary
    ? [
        { label: 'Precision del Modelo', value: '91.2%', delta: '+1.3%', up: true, icon: <BrainCircuit size={18} />, color: 'emerald' },
        { label: 'Analisis Totales', value: String(summary.total_analisis), delta: null, up: null, icon: <Activity size={18} />, color: 'blue' },
        { label: 'Sensores IoT', value: String(summary.total_sensores), delta: summary.sensores_criticos > 0 ? `${summary.sensores_criticos} criticos` : 'OK', up: summary.sensores_criticos === 0, icon: <Radio size={18} />, color: summary.sensores_criticos > 0 ? 'amber' : 'emerald' },
        { label: 'Alertas Activas', value: String(summary.sensores_criticos + summary.sensores_advertencias), delta: summary.sensores_criticos > 0 ? 'criticas' : 'OK', up: false, icon: <AlertTriangle size={18} />, color: summary.sensores_criticos > 0 ? 'amber' : 'emerald' },
      ]
    : AI_METRICS;

  const weatherData = weather
    ? [
        { label: 'Temperatura', value: `${weather.temperatura}°C`, key: null, icon: <Thermometer size={15} className="text-amber-500" /> },
        { label: 'Humedad', value: `${weather.humedad}%`, key: null, icon: <Droplets size={15} className="text-blue-500" /> },
        { label: 'Precipitacion', value: `${weather.precipitacion} mm`, key: null, icon: <Wind size={15} className="text-slate-400" /> },
        { label: 'Radiacion', value: weather.radiacion_solar ? `${weather.radiacion_solar} W/m²` : '—', key: null, icon: <Sun size={15} className="text-yellow-500" /> },
      ]
    : WEATHER_BASE;

  const moduleShortcuts = [
    { label: 'Agro-Asesor IA', sub: 'Mapa + Chatbot', path: '/investigador/mapas', icon: <BrainCircuit size={16} />, color: 'emerald', onClick: () => navigate('/investigador/mapas') },
    { label: 'Analisis Suelos', sub: 'Laboratorio digital', path: '/investigador/analisis', icon: <FlaskConical size={16} />, color: 'blue', onClick: () => navigate('/investigador/analisis') },
    { label: 'IA Predictiva', sub: 'Ventana siembra 6 meses', path: '/investigador/ia', icon: <Activity size={16} />, color: 'purple', onClick: () => navigate('/investigador/ia') },
    { label: 'Nodos IoT', sub: 'Sensores en campo', path: '/investigador/sensores', icon: <Radio size={16} />, color: 'amber', onClick: () => navigate('/investigador/sensores') },
  ];

  const weeklyStats = [
    { label: 'Analisis realizados', val: String(summary?.total_analisis || '—'), color: 'text-[#2D5A27]' },
    { label: 'Alertas gestionadas', val: String(summary?.sensores_advertencias || 0), color: 'text-amber-600' },
    { label: 'Sensores activos', val: String(summary?.total_sensores || '—'), color: 'text-blue-600' },
  ];

  return {
    timestamp, refreshTimestamp, loading,
    moduleShortcuts, weeklyStats,
    FIELD_UPDATES: fieldUpdates,
    AI_METRICS: aiMetrics,
    WEATHER: weatherData,
    MODEL_METRICS,
    SPARK_DATA: { acc: [], lat: [], proc: [] },
    summary,
    navigate,
  };
}
