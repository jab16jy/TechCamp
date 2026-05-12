import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '../../context/useAppStore';
import {
  LayoutDashboard,
  FlaskConical,
  BrainCircuit,
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
      { id: 'mapas', icon: <Bot size={17} />, label: 'Agro-Asesor IA', path: '/investigador/mapas' },
    ],
  },
  {
    title: 'CIENCIA',
    items: [
      { id: 'analisis', icon: <FlaskConical size={17} />, label: 'Analisis de Suelos', path: '/investigador/analisis' },
      { id: 'ia', icon: <BrainCircuit size={17} />, label: 'IA Predictiva', path: '/investigador/ia' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { id: 'reportes', icon: <FileText size={17} />, label: 'Reportes', path: '/investigador/reportes' },
      { id: 'sensores', icon: <RadioTower size={17} />, label: 'Nodos IoT', path: '/investigador/sensores' },
    ],
  },
];

const ALERTS = [
  { title: 'Estres hidrico detectado', desc: 'Nodo Sur-02 registra 61% HR.', time: 'Hace 5 min', type: 'warn' },
  { title: 'Imagenes Sentinel-2 listas', desc: 'NDVI procesado para todos los lotes.', time: 'Hace 1 hora', type: 'success' },
  { title: 'Reporte semanal generado', desc: 'Descarga disponible en Reportes.', time: 'Hace 3 horas', type: 'info' },
];

const alertIcon = {
  warn: <AlertTriangle size={13} className="text-amber-500" />,
  success: <CheckCircle2 size={13} className="text-emerald-500" />,
  info: <Info size={13} className="text-sky-500" />,
};

const ResearcherLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const agregarToast = useAppStore((s) => s.agregarToast);

  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const profileRef = useRef(null);
  const alertsRef = useRef(null);

  const rol = sessionStorage.getItem('rol');

  useEffect(() => {
    if (rol !== 'investigador' && rol !== 'productor') navigate('/investigador/login');
  }, [rol, navigate]);

  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('rol');
    agregarToast('Sesion cerrada correctamente', 'info');
    navigate('/');
  };

  const triggerReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      agregarToast('Reporte generado exitosamente', 'success');
    }, 2800);
  };

  const currentLabel = NAV_SECTIONS.flatMap((section) => section.items).find(
    (item) => location.pathname === item.path || activeTab === item.id,
  )?.label ?? 'Panel de Control';

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#f9fafb] text-slate-900"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <aside className="w-72 shrink-0 border-r border-emerald-100/80 bg-white/96 backdrop-blur-sm">
        <div className="border-b border-emerald-100 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 shadow-[0_14px_30px_rgba(16,185,129,0.22)]">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <h1
                className="text-[18px] font-black leading-tight tracking-tight text-emerald-950"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                AgroCaribe <span className="text-emerald-500">IA</span>
              </h1>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-900/55">
                Research Console
              </p>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-8 overflow-y-auto px-4 py-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-[9.5px] font-black uppercase tracking-[0.28em] text-emerald-950/40">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = location.pathname === item.path || activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        onClick={() => item.id === 'reportes' && triggerReport()}
                        className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                          active
                            ? 'bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.18)]'
                            : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-950'
                        }`}
                      >
                        <span className={active ? 'text-white' : 'text-emerald-800/55'}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-emerald-100 p-4">
          {generating && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <Loader2 size={14} className="shrink-0 animate-spin text-emerald-500" />
              <div>
                <p className="text-[11px] font-bold text-emerald-950">Generando reporte...</p>
                <p className="text-[9px] text-emerald-900/55">NDVI · Analisis de Suelo</p>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/investigador/ia')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-950 bg-emerald-950 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-emerald-900"
          >
            <Plus size={13} /> Nueva Prediccion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-emerald-100 bg-white/90 px-7 backdrop-blur-sm">
          <h2
            className="text-[15px] font-black uppercase tracking-tight text-emerald-950"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {currentLabel}
          </h2>

          <div className="mx-8 hidden max-w-sm flex-1 md:block">
            <div className="group relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600"
              />
              <input
                type="text"
                placeholder="Buscar lotes, nodos, analisis... (Cmd+K)"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-12 text-[12.5px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 shadow-sm">
                <Command size={9} /> K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10.5px] font-black tracking-wide text-emerald-800">v4.2 Pro | 94.2% Accuracy</span>
            </div>

            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => setAlertsOpen((prev) => !prev)}
                className="relative rounded-2xl p-2.5 text-slate-500 transition-colors hover:bg-emerald-50"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              <AnimatePresence>
                {alertsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50/60 px-4 py-3">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Alertas Recientes</span>
                      <button className="text-[10px] font-bold text-emerald-600 hover:underline">Marcar leidas</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {ALERTS.map((alert, index) => (
                        <div
                          key={index}
                          className="flex cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors hover:bg-emerald-50/40"
                        >
                          <span className="mt-0.5 shrink-0">{alertIcon[alert.type]}</span>
                          <div>
                            <p className="text-[12.5px] font-semibold text-slate-800">{alert.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{alert.desc}</p>
                            <p className="mt-1 text-[9.5px] font-bold text-slate-400">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50 py-2.5 text-center">
                      <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Ver todas →</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-2xl border border-transparent py-1 pl-1 pr-3 transition-all hover:border-emerald-100 hover:bg-emerald-50/60"
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-400/40">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71f1536b1e?auto=format&fit=crop&q=80&w=100"
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-[11px] font-black leading-none text-slate-800">Dra. Elena Ramos</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-tighter text-slate-500">Investigadora Senior</p>
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
                    className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-3xl border border-emerald-100 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-[13px] font-black text-slate-800">Dra. Elena Ramos</p>
                      <p className="text-[10px] text-slate-500">Investigadora Principal</p>
                    </div>
                    {[
                      { label: 'Mi Perfil', icon: <User size={15} />, path: '/perfil' },
                      { label: 'Ajustes de Finca', icon: <Settings size={15} />, path: '/ajustes' },
                      { label: 'Administracion', icon: <Shield size={15} />, path: '/admin' },
                    ].map((option) => (
                      <Link
                        key={option.label}
                        to={option.path}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className="text-slate-400">{option.icon}</span> {option.label}
                      </Link>
                    ))}
                    <div className="mx-4 my-1 h-px bg-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={15} /> Cerrar Sesion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="custom-scrollbar-light flex-1 overflow-y-auto bg-[#f9fafb]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResearcherLayout;
