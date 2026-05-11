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
  Activity, RefreshCw,
} from 'lucide-react';

// ── Static demo data ────────────────────────────────────────
const FIELD_UPDATES = [
  { id: 'u1', lote: 'Lote A – Norte',   status: 'ok',   msg: 'Humedad estable al 74%. Sin intervención necesaria.',              icon: <Droplets size={14} />,     time: '5 min ago',  color: 'emerald' },
  { id: 'u2', lote: 'Sector Este – B2', status: 'warn', msg: 'Temperatura en ascenso: 31.2°C. Riesgo moderado de estrés térmico.', icon: <Thermometer size={14} />,  time: '12 min ago', color: 'amber'   },
  { id: 'u3', lote: 'Lote C – Sur',     status: 'ok',   msg: 'NDVI 0.71 — Salud foliar en rango óptimo (0.65–0.80).',             icon: <Leaf size={14} />,         time: '28 min ago', color: 'emerald' },
  { id: 'u4', lote: 'Nodo S-04 – B',    status: 'alert',msg: 'Humedad de suelo crítica: 34%. Activar riego en próximas 2 horas.',  icon: <AlertTriangle size={14} />, time: '1 h ago',    color: 'red'    },
  { id: 'u5', lote: 'Sentinel-2 Sync',  status: 'ok',   msg: 'Nuevas imágenes NDVI disponibles. Análisis de cobertura completado.', icon: <Radio size={14} />,        time: '2 h ago',    color: 'blue'   },
];

const AI_METRICS = [
  { label: 'Precisión del Modelo', value: '94.2%', delta: '+1.3%', up: true,  icon: <BrainCircuit size={18} />, color: 'emerald' },
  { label: 'Latencia de Inferencia', value: '124 ms', delta: '-8ms',  up: true,  icon: <Zap size={18} />,          color: 'blue'    },
  { label: 'Muestras Procesadas',  value: '12,847', delta: '+247',  up: true,  icon: <Activity size={18} />,     color: 'purple'  },
  { label: 'Alertas Activas',      value: '3',      delta: '+1',    up: false, icon: <AlertTriangle size={18} />, color: 'amber'  },
];

const WEATHER = [
  { label: 'Temperatura', value: '28.6°C', icon: <Thermometer size={15} className="text-amber-500" /> },
  { label: 'Humedad',     value: '72%',    icon: <Droplets size={15} className="text-blue-500" />     },
  { label: 'Viento',      value: '12 km/h',icon: <Wind size={15} className="text-slate-400" />        },
  { label: 'Radiación',   value: '847 W/m²',icon: <Sun size={15} className="text-yellow-500" />      },
];

const TOP_CROP = {
  nombre: 'Maíz Amarillo',
  score: 89,
  riesgo: 'Bajo',
  justificacion: 'Condiciones de humedad (72%), temperatura (28.6°C) y NDVI (0.73) óptimas para inicio de ciclo. Suelo con alta conductividad y sin riesgo de encharcamiento.',
  tips: [
    'Aplicar fertilización nitrogenada (+12 kg N/ha) en las próximas 48 horas.',
    'Mantener riego por goteo a 65% de capacidad de campo.',
    'Monitorear Nodo S-04 — posible déficit hídrico localizado.',
  ],
  icon: '🌽',
};

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

// ── Progress ring ────────────────────────────────────────────
const ScoreRing = ({ value }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#10b981" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">{value}</text>
    </svg>
  );
};

const colorMap = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500'     },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
};

const card = 'bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all';

// ── Main Component ───────────────────────────────────────────
const DashboardInvestigador = () => {
  const navigate = useNavigate();
  const [sparkData] = useState({
    acc:  [90.1, 91.8, 92.4, 93.0, 93.9, 94.2],
    lat:  [148, 140, 136, 131, 127, 124],
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
      {/* Scroll sucede aquí ─ el parent tiene overflow-y-auto */}
      <div className="p-6 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── TOP ROW: Timestamp + Refresh ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-black text-slate-800"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Centro de Inteligencia
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Última sincronización: {timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · Turbaco, Bolívar
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[12px] font-bold transition-all">
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>

        {/* ── AI HEALTH METRICS ── */}
        <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_METRICS.map((m, i) => {
            const c = colorMap[m.color];
            const sparkColors = { emerald: '#10b981', blue: '#3b82f6', purple: '#8b5cf6', amber: '#f59e0b' };
            const sparkSeries = [sparkData.acc, sparkData.lat, sparkData.proc, [1, 2, 1, 3, 2, 3]][i];
            return (
              <div key={i} className={`${card} p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${c.bg} ${c.text}`}>{m.icon}</div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {m.delta}
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-800 leading-none">{m.value}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{m.label}</p>
                <div className="mt-2">
                  <MiniSparkline data={sparkSeries} color={sparkColors[m.color]} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ── BENTO MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Recomendación Maestra — 2/3 width */}
          <motion.div {...fadeUp(0.05)} className="lg:col-span-2 space-y-5">

            {/* Hero Card: ¿Qué plantar hoy? */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
              {/* Decorative blob */}
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sprout size={16} className="text-emerald-200" />
                  <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-emerald-200">Recomendación Maestra · HOY</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest mb-1">¿Qué plantar hoy?</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{TOP_CROP.icon}</span>
                  <div>
                    <h3
                      className="text-2xl font-black text-white leading-tight"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {TOP_CROP.nombre}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <ScoreRing value={TOP_CROP.score} />
                      <div>
                        <p className="text-[11px] text-emerald-200 font-bold uppercase tracking-wide">Afinidad</p>
                        <p className="text-[11px] text-white font-semibold mt-1">
                          Riesgo: <span className="text-emerald-200 font-black">{TOP_CROP.riesgo}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[12.5px] text-emerald-100 leading-relaxed mb-4">{TOP_CROP.justificacion}</p>
                <div className="space-y-1.5">
                  {TOP_CROP.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11.5px] text-emerald-100">
                      <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/investigador/analisis')}
                  className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[12px] font-bold transition-all"
                >
                  Análisis completo <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Weather Row */}
            <div className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10.5px] font-black text-slate-500 uppercase tracking-widest">Condiciones Meteorológicas · Ahora</p>
                <span className="text-[9px] text-slate-400 font-bold">NASA POWER API</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {WEATHER.map((w, i) => (
                  <div key={i} className="text-center">
                    <div className="flex justify-center mb-1">{w.icon}</div>
                    <p className="text-[15px] font-black text-slate-800">{w.value}</p>
                    <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{w.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Ver Agro-Asesor', icon: <BrainCircuit size={15} />, path: '/investigador/mapas',  color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
                { label: 'Análisis de Suelos', icon: <FlaskConical size={15} />, path: '/investigador/analisis', color: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200' },
                { label: 'IA Predictiva',   icon: <Activity size={15} />,     path: '/investigador/ia',      color: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200' },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => navigate(btn.path)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold transition-all shadow-sm ${btn.color}`}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Feed de Actualizaciones de Parcelas */}
          <motion.div {...fadeUp(0.1)}>
            <div className={`${card} p-0 overflow-hidden h-full flex flex-col`}>
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Actualizaciones de Parcelas</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Feed en tiempo real · Turbaco</p>
              </div>

              {/* Feed items — this column scrolls independently */}
              <div className="flex-1 overflow-y-auto custom-scrollbar-light divide-y divide-slate-50">
                {FIELD_UPDATES.map((u) => {
                  const c = colorMap[u.color];
                  return (
                    <div key={u.id} className="flex gap-3 px-5 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group">
                      <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
                        {u.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-[11.5px] font-bold text-slate-800 truncate">{u.lote}</p>
                          <span className={`shrink-0 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                            {u.status === 'ok' ? 'OK' : u.status === 'warn' ? 'AVISO' : 'ALERTA'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{u.msg}</p>
                        <p className="text-[9.5px] text-slate-400 font-bold mt-1">{u.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
                <button
                  onClick={() => navigate('/investigador/sensores')}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-all"
                >
                  Ver todos los nodos <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── BOTTOM ROW: Reportes + Accesos Rápidos ── */}
        <motion.div {...fadeUp(0.15)} className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Resumen semanal */}
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Resumen Semanal</p>
              <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Semana 19</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Análisis realizados', val: '24',  color: 'text-emerald-600' },
                { label: 'Alertas gestionadas', val: '7',   color: 'text-amber-600'   },
                { label: 'Reportes exportados', val: '3',   color: 'text-blue-600'    },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[9.5px] text-slate-400 font-bold mt-1 uppercase tracking-wide leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/investigador/reportes')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-bold transition-all"
            >
              <FileText size={13} /> Ir a Reportes
            </button>
          </div>

          {/* Accesos rápidos a módulos */}
          <div className={`${card} p-5`}>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-4">Módulos del Sistema</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Agro-Asesor IA',   sub: 'Mapa + Chatbot',       path: '/investigador/mapas',    icon: <BrainCircuit size={14} />, color: 'emerald' },
                { label: 'Análisis Suelos',   sub: 'Laboratorio digital',   path: '/investigador/analisis', icon: <FlaskConical size={14} />, color: 'blue'    },
                { label: 'IA Predictiva',      sub: 'Modelos de ML',        path: '/investigador/ia',       icon: <Activity size={14} />,     color: 'purple'  },
                { label: 'Nodos IoT',          sub: 'Sensores en campo',    path: '/investigador/sensores', icon: <Radio size={14} />,        color: 'amber'   },
              ].map((mod) => {
                const c = colorMap[mod.color];
                return (
                  <button
                    key={mod.label}
                    onClick={() => navigate(mod.path)}
                    className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-sm ${c.bg} ${c.border}`}
                  >
                    <span className={`shrink-0 mt-0.5 ${c.text}`}>{mod.icon}</span>
                    <div>
                      <p className={`text-[12px] font-bold ${c.text}`}>{mod.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{mod.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

      </div>
    </ResearcherLayout>
  );
};

export default DashboardInvestigador;
