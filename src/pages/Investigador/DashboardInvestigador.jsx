// ============================================================
// DashboardInvestigador.jsx — Hub de Actualizaciones AgroCaribe IA
// Layout: Bento-Grid responsive de alta densidad informativa
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import {
  BrainCircuit, Leaf, Zap, Thermometer, Droplets, Wind, Sun,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  MapPin, Radio, FileText, ArrowRight, Sprout, FlaskConical,
  Activity, RefreshCw, BarChart3
} from 'lucide-react';

// ── Static demo data ────────────────────────────────────────
const FIELD_UPDATES = [
  { id: 'u1', lote: 'Lote A – Norte', status: 'ok', msg: 'Humedad estable al 74%. Sin intervención necesaria.', icon: <Droplets size={14} />, time: '5 min ago', color: 'emerald' },
  { id: 'u2', lote: 'Sector Este – B2', status: 'warn', msg: 'Temperatura en ascenso: 31.2°C. Riesgo moderado de estrés térmico.', icon: <Thermometer size={14} />, time: '12 min ago', color: 'amber' },
  { id: 'u3', lote: 'Lote C – Sur', status: 'ok', msg: 'NDVI 0.71 — Salud foliar en rango óptimo (0.65–0.80).', icon: <Leaf size={14} />, time: '28 min ago', color: 'emerald' },
  { id: 'u4', lote: 'Nodo S-04 – B', status: 'alert', msg: 'Humedad de suelo crítica: 34%. Activar riego en próximas 2 horas.', icon: <AlertTriangle size={14} />, time: '1 h ago', color: 'red' },
  { id: 'u5', lote: 'Sentinel-2 Sync', status: 'ok', msg: 'Nuevas imágenes NDVI disponibles. Análisis de cobertura completado.', icon: <Radio size={14} />, time: '2 h ago', color: 'blue' },
];

const AI_METRICS = [
  { label: 'Precisión del Modelo', value: '94.2%', delta: '+1.3%', up: true, icon: <BrainCircuit size={18} />, color: 'emerald' },
  { label: 'Latencia de Inferencia', value: '124 ms', delta: '-8ms', up: true, icon: <Zap size={18} />, color: 'blue' },
  { label: 'Muestras Procesadas', value: '12,847', delta: '+247', up: true, icon: <Activity size={18} />, color: 'purple' },
  { label: 'Alertas Activas', value: '3', delta: '+1', up: false, icon: <AlertTriangle size={18} />, color: 'amber' },
];

const WEATHER = [
  { label: 'Temperatura', value: '28.6°C', icon: <Thermometer size={15} className="text-amber-500" /> },
  { label: 'Humedad', value: '72%', icon: <Droplets size={15} className="text-blue-500" /> },
  { label: 'Viento', value: '12 km/h', icon: <Wind size={15} className="text-slate-400" /> },
  { label: 'Radiación', value: '847 W/m²', icon: <Sun size={15} className="text-yellow-500" /> },
];

const MODEL_METRICS = [
  { cultivo: 'Yuca', accuracy: '95.8%', f1: '0.94', mae: '2.1%', confianza: 'Alta (Ideal para suelos francos)', icon: '🌿' },
  { cultivo: 'Ñame', accuracy: '93.2%', f1: '0.91', mae: '3.5%', confianza: 'Alta (Sensible a humedad/NDWI)', icon: '🍠' },
  { cultivo: 'Guineo', accuracy: '91.5%', f1: '0.89', mae: '4.2%', confianza: 'Media (Depende de vientos/clima)', icon: '🍌' },
  { cultivo: 'Papa', accuracy: '89.1%', f1: '0.87', mae: '5.8%', confianza: 'Moderada (Afinidad baja en Caribe)', icon: '🥔' },
];

// ── Sparkline minimalista ────────────────────────────────────
const MiniSparkline = ({ data, color = '#10b981' }) => {
  const w = 60, h = 22;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 0.001)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
};

const colorMap = {
  emerald: { bg: 'bg-[#0f5238]/10', border: 'border-[#0f5238]/20', text: 'text-[#0f5238]', dot: 'bg-[#0f5238]' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const glassPanel = 'bg-white/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:backdrop-blur-2xl hover:-translate-y-1 transition-all duration-300 border border-white/50 rounded-2xl';

// ── Main Component ───────────────────────────────────────────
const DashboardInvestigador = () => {
  const navigate = useNavigate();
  const [sparkData] = useState({
    acc: [90.1, 91.8, 92.4, 93.0, 93.9, 94.2],
    lat: [148, 140, 136, 131, 127, 124],
    proc: [12200, 12380, 12540, 12640, 12780, 12847],
  });
  const [timestamp, setTimestamp] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTimestamp(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: 'easeOut' },
  });

  return (
    <ResearcherLayout activeTab="dashboard">
      <div className="relative min-h-full w-full font-sans" style={{ fontFamily: "'Manrope', sans-serif" }}>
        
        {/* Background Map from the design */}
        <div className="absolute inset-0 z-0 bg-[#edeeef] overflow-hidden pointer-events-none">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACABo3njzKgJNUWnzuJCodRyQWeRPBhkjAPZ2fu5HeMNcXYhop_kXKqB1h32KLxzgjbcTXwOx0qhYRCGI5M21cAv-Nolc2Bg5H0gCpzXOp9I7zi2pHiVS025IgtIss8036EVJ9AOVouiy_9qnQ__6m4BZN11cDXE79bn2RV1AYppHikLGJNoU8DdU7hwdifneonly_93Ms6hc7sPPA9KO0LLYD-ZjbR69408EhygpB3IT_HfPHilzfUqkGwC5CkLDO0kioZOq6g10d" 
            alt="Map" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 space-y-6">
          
          {/* ── TOP ROW: Timestamp + Refresh ── */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#0f5238] tracking-tight">
                Centro de Inteligencia
              </h2>
              <p className="text-sm text-slate-700 mt-1 font-medium">
                Última sincronización: {timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · Turbaco, Bolívar
              </p>
            </div>
            <button 
              onClick={() => setTimestamp(new Date())}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md hover:bg-white border border-white/50 text-[#0f5238] text-sm font-bold transition-all shadow-sm"
            >
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>

          {/* ── AI HEALTH METRICS ── */}
          <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {AI_METRICS.map((m, i) => {
              const c = colorMap[m.color];
              const sparkColors = { emerald: '#0f5238', blue: '#3b82f6', purple: '#8b5cf6', amber: '#f59e0b' };
              const sparkSeries = [sparkData.acc, sparkData.lat, sparkData.proc, [1, 2, 1, 3, 2, 3]][i];
              return (
                <div key={i} className={`${glassPanel} p-5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-full ${c.bg} ${c.text}`}>{m.icon}</div>
                    <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${m.up ? 'bg-[#0f5238]/10 text-[#0f5238]' : 'bg-red-100 text-red-700'}`}>
                      {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {m.delta}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 leading-none">{m.value}</p>
                  <p className="text-sm text-slate-600 mt-2 font-medium">{m.label}</p>
                  <div className="mt-3 opacity-80">
                    <MiniSparkline data={sparkSeries} color={sparkColors[m.color]} />
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── BENTO MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Model Metrics — 2/3 width */}
            <motion.div {...fadeUp(0.05)} className="lg:col-span-2 space-y-6">
              
              {/* Table of Model Metrics */}
              <div className={`${glassPanel} p-6 overflow-hidden relative`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#0f5238] mb-1">Métricas de Modelo Predictivo</h3>
                    <p className="text-sm text-slate-600">Rendimiento de los algoritmos por tipo de cultivo</p>
                  </div>
                  <div className="bg-[#2d6a4f]/10 text-[#0f5238] px-4 py-1.5 rounded-full flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-bold">Modelos Estables</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60">
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cultivo</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Precisión (Accuracy)</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">F1-Score</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Error Medio (MAE)</th>
                        <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Confianza del Modelo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MODEL_METRICS.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="font-bold text-slate-800">{item.cultivo}</span>
                          </td>
                          <td className="py-4">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0f5238]">
                              <BarChart3 size={14} /> {item.accuracy}
                            </span>
                          </td>
                          <td className="py-4 font-medium text-slate-700">{item.f1}</td>
                          <td className="py-4 font-medium text-slate-600">{item.mae}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.confianza.includes('Alta') ? 'bg-[#0f5238]/10 text-[#0f5238]' : 
                              item.confianza.includes('Media') ? 'bg-amber-100 text-amber-800' : 
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {item.confianza}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weather Row */}
              <div className={`${glassPanel} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Condiciones Meteorológicas · Ahora</p>
                  <span className="text-[10px] text-slate-500 font-bold bg-white/50 px-2 py-1 rounded-full border border-white/60">NASA POWER API</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {WEATHER.map((w, i) => (
                    <div key={i} className="text-center bg-white/40 rounded-xl p-3 border border-white/50 shadow-sm">
                      <div className="flex justify-center mb-2">{w.icon}</div>
                      <p className="text-lg font-bold text-slate-800">{w.value}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mt-1">{w.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Feed de Actualizaciones de Parcelas */}
            <motion.div {...fadeUp(0.1)} className="h-full">
              <div className={`${glassPanel} p-0 overflow-hidden h-full flex flex-col`}>
                <div className="px-6 py-5 border-b border-white/40 bg-white/50 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#0f5238] uppercase tracking-widest">Actualizaciones de Parcelas</p>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0f5238] animate-pulse shadow-[0_0_8px_rgba(15,82,56,0.5)]" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">Feed en tiempo real · Turbaco</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar-light divide-y divide-white/40">
                  {FIELD_UPDATES.map((u) => {
                    const c = colorMap[u.color];
                    return (
                      <div key={u.id} className="flex gap-4 px-6 py-4 hover:bg-white/60 transition-colors cursor-pointer group">
                        <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${c.bg} ${c.text}`}>
                          {u.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-[#0f5238] transition-colors">{u.lote}</p>
                            <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                              {u.status === 'ok' ? 'OK' : u.status === 'warn' ? 'AVISO' : 'ALERTA'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-snug">{u.msg}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1.5">{u.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 border-t border-white/40 bg-white/50 shrink-0">
                  <button
                    onClick={() => navigate('/investigador/sensores')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#0f5238] text-xs font-bold transition-all shadow-sm border border-slate-100"
                  >
                    Ver todos los nodos <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── BOTTOM ROW: Reportes + Accesos Rápidos ── */}
          <motion.div {...fadeUp(0.15)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Resumen semanal */}
            <div className={`${glassPanel} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Resumen Semanal</p>
                <span className="text-[10px] text-slate-600 font-bold bg-white/60 px-3 py-1 rounded-full shadow-sm border border-white/50">Semana 19</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Análisis realizados', val: '24', color: 'text-[#0f5238]' },
                  { label: 'Alertas gestionadas', val: '7', color: 'text-amber-600' },
                  { label: 'Reportes exportados', val: '3', color: 'text-blue-600' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm">
                    <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-wide leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/investigador/reportes')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] hover:shadow-lg hover:scale-[1.02] text-white text-sm font-bold transition-all"
              >
                <FileText size={16} /> Generar Reporte Semanal
              </button>
            </div>

            {/* Accesos rápidos a módulos */}
            <div className={`${glassPanel} p-6`}>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-5">Módulos del Sistema</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Agro-Asesor IA', sub: 'Mapa + Chatbot', path: '/investigador/mapas', icon: <BrainCircuit size={16} />, color: 'emerald' },
                  { label: 'Análisis Suelos', sub: 'Laboratorio digital', path: '/investigador/analisis', icon: <FlaskConical size={16} />, color: 'blue' },
                  { label: 'IA Predictiva', sub: 'Modelos de ML', path: '/investigador/ia', icon: <Activity size={16} />, color: 'purple' },
                  { label: 'Nodos IoT', sub: 'Sensores en campo', path: '/investigador/sensores', icon: <Radio size={16} />, color: 'amber' },
                ].map((mod) => {
                  const c = colorMap[mod.color];
                  return (
                    <button
                      key={mod.label}
                      onClick={() => navigate(mod.path)}
                      className={`flex items-start gap-3 p-4 rounded-2xl text-left border border-white/50 bg-white/50 transition-all hover:-translate-y-1 hover:bg-white/80 hover:shadow-md`}
                    >
                      <span className={`shrink-0 mt-0.5 p-2 rounded-full ${c.bg} ${c.text}`}>{mod.icon}</span>
                      <div>
                        <p className={`text-sm font-bold text-slate-800`}>{mod.label}</p>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{mod.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default DashboardInvestigador;
