import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '../../context/useAppStore';
import {
  LayoutDashboard,
  Map as MapIcon,
  FlaskConical,
  BrainCircuit,
  Activity,
  FileText,
  RadioTower,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Shield,
  Plus,
  Loader2,
  Command,
  ChevronDown,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Info,
  Bot,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard Hub', path: '/investigador/dashboard' },
      { id: 'mapas',     icon: <Bot size={17} />,            label: 'Agro-Asesor IA', path: '/investigador/mapas' },
    ],
  },
  {
    title: 'CIENCIA',
    items: [
      { id: 'analisis',  icon: <FlaskConical size={17} />,   label: 'Análisis de Suelos', path: '/investigador/analisis' },
      { id: 'ia',        icon: <BrainCircuit size={17} />,   label: 'IA Predictiva',      path: '/investigador/ia' },
      { id: 'simulador', icon: <Activity size={17} />,       label: 'Simulador',          path: '/investigador/simulador' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { id: 'reportes', icon: <FileText size={17} />,    label: 'Reportes',         path: '/investigador/reportes' },
      { id: 'sensores', icon: <RadioTower size={17} />,  label: 'Nodos IoT',        path: '/investigador/sensores' },
    ],
  },
];

const ALERTS = [
  { title: 'Estrés hídrico detectado',   desc: 'Nodo Sur-02 registra 61% HR.',         time: 'Hace 5 min',  type: 'warn'    },
  { title: 'Imágenes Sentinel-2 listas', desc: 'NDVI procesado para todos los lotes.', time: 'Hace 1 hora', type: 'success' },
  { title: 'Reporte semanal generado',   desc: 'Descarga disponible en Reportes.',      time: 'Hace 3 horas',type: 'info'    },
];

const alertIcon = { warn: <AlertTriangle size={13} className="text-amber-400" />, success: <CheckCircle2 size={13} className="text-emerald-400" />, info: <Info size={13} className="text-blue-400" /> };

const ResearcherLayout = ({ children, activeTab }) => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const agregarToast = useAppStore((s) => s.agregarToast);

  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen,  setAlertsOpen]  = useState(false);
  const [generating,  setGenerating]  = useState(false);

  const profileRef = useRef(null);
  const alertsRef  = useRef(null);

  const rol = sessionStorage.getItem('rol');

  useEffect(() => {
    if (rol !== 'investigador' && rol !== 'productor') navigate('/investigador/login');
  }, [rol, navigate]);

  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (alertsRef.current  && !alertsRef.current.contains(e.target))  setAlertsOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('rol');
    agregarToast('Sesión cerrada correctamente', 'info');
    navigate('/');
  };

  const triggerReport = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); agregarToast('Reporte generado exitosamente', 'success'); }, 2800);
  };

  const currentLabel = NAV_SECTIONS.flatMap((s) => s.items).find(
    (i) => location.pathname === i.path || activeTab === i.id
  )?.label ?? 'Panel de Control';

  return (
    /* h-screen + overflow-hidden → el scroll sucede DENTRO de los hijos */
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ─────────────────── SIDEBAR ─────────────────── */}
      <aside className="w-64 bg-slate-900 flex flex-col shadow-2xl z-20 shrink-0 border-r border-slate-800">

        {/* BRANDING — siempre visible en la esquina superior */}
        <div className="px-5 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <h1
                className="text-[17px] font-black text-slate-100 leading-tight tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                AgroCaribe <span className="text-emerald-400">IA</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-500 tracking-[0.22em] uppercase mt-0.5">
                Intelligence Hub
              </p>
            </div>
          </div>
        </div>

        {/* NAV — overflow-y-auto permite scroll en menú si crece */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-5 space-y-7">
          {NAV_SECTIONS.map((sec) => (
            <div key={sec.title}>
              <p className="text-[9.5px] font-black text-slate-600 tracking-[0.25em] uppercase px-3 mb-3">
                {sec.title}
              </p>
              <ul className="space-y-0.5">
                {sec.items.map((item) => {
                  const active = location.pathname === item.path || activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        onClick={() => item.id === 'reportes' && triggerReport()}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all relative group ${
                          active
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                        }`}
                      >
                        <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* CTA Footer */}
        <div className="shrink-0 p-4 border-t border-slate-800 space-y-3">
          {generating && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 animate-pulse">
              <Loader2 size={14} className="text-emerald-400 animate-spin shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Generando reporte…</p>
                <p className="text-[9px] text-slate-500">NDVI · Análisis de Suelo</p>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/investigador/mapas')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all"
          >
            <Plus size={13} /> Nueva Simulación
          </button>
        </div>
      </aside>

      {/* ─────────────────── MAIN ─────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* HEADER */}
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-7 shrink-0 z-10 shadow-sm">

          {/* Breadcrumb */}
          <h2
            className="text-[15px] font-black text-slate-800 uppercase tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {currentLabel}
          </h2>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-8 hidden md:block">
            <div className="relative group">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
              />
              <input
                type="text"
                placeholder="Buscar lotes, nodos, análisis… (Cmd+K)"
                className="w-full bg-slate-100 border border-transparent rounded-full py-2 pl-9 pr-12 text-[12.5px] text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none placeholder:text-slate-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] text-slate-500 font-bold shadow-sm">
                <Command size={9} /> K
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">

            {/* AI badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10.5px] font-black text-emerald-700 tracking-wide">v4.2 Pro | 94.2% Accuracy</span>
            </div>

            {/* Bell */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => setAlertsOpen((p) => !p)}
                className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bell size={19} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
              </button>

              <AnimatePresence>
                {alertsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Alertas Recientes</span>
                      <button className="text-[10px] font-bold text-emerald-600 hover:underline">Marcar leídas</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {ALERTS.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                          <span className="mt-0.5 shrink-0">{alertIcon[a.type]}</span>
                          <div>
                            <p className="text-[12.5px] font-semibold text-slate-800">{a.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{a.desc}</p>
                            <p className="text-[9.5px] text-slate-400 font-bold mt-1">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="py-2.5 text-center border-t border-slate-100 bg-slate-50">
                      <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ver todas →</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 hover:bg-slate-50 py-1 pl-1 pr-3 rounded-2xl transition-all border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-xl border-2 border-emerald-400/40 overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71f1536b1e?auto=format&fit=crop&q=80&w=100"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[11px] font-black text-slate-800 leading-none">Dra. Elena Ramos</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Investigadora Senior</p>
                </div>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[13px] font-black text-slate-800">Dra. Elena Ramos</p>
                      <p className="text-[10px] text-slate-500">Investigadora Principal</p>
                    </div>
                    {[
                      { label: 'Mi Perfil',      icon: <User size={15} />,     path: '/perfil' },
                      { label: 'Ajustes de Finca', icon: <Settings size={15} />, path: '/ajustes' },
                      { label: 'Administración', icon: <Shield size={15} />,   path: '/admin' },
                    ].map((opt) => (
                      <Link
                        key={opt.label}
                        to={opt.path}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <span className="text-slate-400">{opt.icon}</span> {opt.label}
                      </Link>
                    ))}
                    <div className="h-px bg-slate-100 my-1 mx-4" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} /> Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* CONTENT — overflow-y-auto → scroll del mouse funciona aquí */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar-light">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResearcherLayout;
