import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Leaf, Zap, Thermometer, Droplets, Wind, Sun,
  FlaskConical, Activity,
} from 'lucide-react';
import { getDashboardSummary, getClima, getModelMetrics } from '@shared/services/api';

export const WEATHER_BASE = [
  { label: 'Temperatura', value: '—°C', key: 'temperatura', icon: <Thermometer size={15} className="text-amber-500" /> },
  { label: 'Humedad', value: '—%', key: 'humedad', icon: <Droplets size={15} className="text-blue-500" /> },
  { label: 'Viento', value: '—', key: null, icon: <Wind size={15} className="text-slate-400" /> },
  { label: 'Radiacion', value: '—', key: 'radiacion_solar', icon: <Sun size={15} className="text-yellow-500" /> },
];

export default function useDashboard() {
  const navigate = useNavigate();
  const [timestamp, setTimestamp] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [modelMetricsStatus, setModelMetricsStatus] = useState('loading');

  useEffect(() => {
    const id = setInterval(() => setTimestamp(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardSummary(),
      getClima(10.5, -74.8),
      getModelMetrics(),
    ]).then(([summaryData, weatherData, metrics]) => {
      setSummary(summaryData);
      setWeather(weatherData);
      setModelMetrics(metrics);
      setModelMetricsStatus('loaded');
    }).catch(() => {
      setModelMetricsStatus('error');
    }).finally(() => setLoading(false));
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

  const realAccuracy = modelMetrics?.accuracy != null
    ? modelMetrics.accuracy
    : modelMetrics?.cv_accuracy_mean;

  const aiMetrics = summary
    ? [
        {
          label: 'Precision del Modelo',
          value: realAccuracy != null ? `${(realAccuracy * 100).toFixed(1)}%` : '—',
          delta: realAccuracy != null ? 'Real' : null,
          up: true,
          icon: <BrainCircuit size={18} />,
          color: 'emerald',
        },
        { label: 'Analisis Totales', value: String(summary.total_analisis), delta: null, up: null, icon: <Activity size={18} />, color: 'blue' },
      ]
    : [
        {
          label: 'Precision del Modelo',
          value: realAccuracy != null ? `${(realAccuracy * 100).toFixed(1)}%` : '—',
          delta: null,
          up: null,
          icon: <BrainCircuit size={18} />,
          color: 'emerald',
        },
        { label: 'Latencia de Inferencia', value: '128 ms', delta: '-12ms', up: true, icon: <Zap size={18} />, color: 'blue' },
      ];

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
  ];

  const weeklyStats = [
    { label: 'Analisis realizados', val: String(summary?.total_analisis || '—'), color: 'text-[#2D5A27]' },
  ];

  const modelMetricsPerCrop = modelMetrics?.per_crop_accuracy
    ? Object.entries(modelMetrics.per_crop_accuracy)
        .sort(([a], [b]) => a.localeCompare(b, 'es-CO'))
        .map(([crop, acc]) => {
          const f1 = modelMetrics.per_crop_f1?.[crop];
          const errorRate = (1 - acc) * 100;
          return {
            cultivo: crop.replaceAll('_', ' '),
            accuracy: `${(acc * 100).toFixed(1)}%`,
            f1: f1 != null ? f1.toFixed(4) : '—',
            errorRate: `${errorRate.toFixed(1)}%`,
            confianza: acc >= 0.85 ? 'Alta' : acc >= 0.7 ? 'Moderada' : 'En desarrollo',
            icon: crop.toLowerCase().slice(0, 4),
          };
        })
    : [];

  return {
    timestamp, refreshTimestamp, loading,
    moduleShortcuts, weeklyStats,
    FIELD_UPDATES: fieldUpdates,
    AI_METRICS: aiMetrics,
    WEATHER: weatherData,
    MODEL_METRICS: modelMetricsPerCrop,
    SPARK_DATA: { acc: [], lat: [], proc: [] },
    modelMetrics,
    modelMetricsStatus,
    summary,
    navigate,
  };
}
