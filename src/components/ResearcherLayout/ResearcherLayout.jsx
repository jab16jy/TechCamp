import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '../../context/useAppStore';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  Map,
  Cloud,
  History,
  Activity,
  Leaf
} from 'lucide-react';

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

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="bg-[#f8f9fa] text-slate-900 font-sans antialiased overflow-hidden h-screen w-full relative"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Top Navigation (Shared Component) */}
      <header className="w-full top-0 sticky z-50 bg-transparent flex justify-between items-center px-10 py-4 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4">
          <span className="text-[24px] font-bold text-[#0f5238]" style={{ fontFamily: "'Manrope', sans-serif" }}>AgroCaribe IA</span>
          <div className="hidden md:flex bg-white/80 backdrop-blur-xl shadow-sm rounded-full px-6 py-2 gap-8 ml-8">
            <Link to="/investigador/dashboard" className={`${isActive('/investigador/dashboard') ? 'text-[#0f5238] font-semibold border-b-2 border-[#0f5238] pb-1 opacity-80 scale-95' : 'text-slate-600 hover:text-[#0f5238]'} transition-all flex items-center font-medium`}>Dashboard</Link>
            <Link to="/investigador/ia" className={`${isActive('/investigador/ia') ? 'text-[#0f5238] font-semibold border-b-2 border-[#0f5238] pb-1 opacity-80 scale-95' : 'text-slate-600 hover:text-[#0f5238]'} transition-all flex items-center font-medium`}>Analysis</Link>
            <Link to="/investigador/mapas" className={`${isActive('/investigador/mapas') ? 'text-[#0f5238] font-semibold border-b-2 border-[#0f5238] pb-1 opacity-80 scale-95' : 'text-slate-600 hover:text-[#0f5238]'} transition-all flex items-center font-medium`}>Satellites</Link>
            <Link to="/investigador/reportes" className={`${isActive('/investigador/reportes') ? 'text-[#0f5238] font-semibold border-b-2 border-[#0f5238] pb-1 opacity-80 scale-95' : 'text-slate-600 hover:text-[#0f5238]'} transition-all flex items-center font-medium`}>Archives</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-white/85 backdrop-blur-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:backdrop-blur-[20px] hover:-translate-y-0.5 rounded-full px-4 py-2 flex items-center gap-2 text-slate-500 transition-all duration-300">
            <Search size={20} />
            <input className="bg-transparent border-none focus:ring-0 text-sm w-48 text-slate-700 placeholder:text-slate-400 p-0 outline-none" placeholder="Buscar parcela..." type="text"/>
          </div>
          <div className="flex gap-4 items-center">
            
            <div className="relative" ref={alertsRef}>
              <button onClick={() => setAlertsOpen((prev) => !prev)} className="text-slate-500 hover:text-[#0f5238] transition-colors relative flex items-center justify-center">
                <Bell size={24} />
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>
              
              <AnimatePresence>
                {alertsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
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

            <button className="text-slate-500 hover:text-[#0f5238] transition-colors">
              <Settings size={24} />
            </button>
            
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen((prev) => !prev)} className="focus:outline-none flex items-center">
                <img alt="Agronomist Profile" className="w-10 h-10 rounded-full border-2 border-[#f8f9fa] object-cover shadow-sm" src="https://images.unsplash.com/photo-1559839734-2b71f1536b1e?auto=format&fit=crop&q=80&w=100"/>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 z-50 mt-4 w-56 overflow-hidden rounded-3xl border border-emerald-100 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
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
        </div>
      </header>

      {/* Floating Sidebar (Shared Component) */}
      <nav className="fixed left-4 top-24 bottom-4 w-20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] shadow-xl bg-white/90 backdrop-blur-md flex flex-col items-center py-8 gap-y-6 z-40">
        <Link to="/investigador/dashboard" className={`${isActive('/investigador/dashboard') ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] shadow-sm scale-90 transition-transform duration-200' : 'text-slate-400 hover:bg-slate-100/50 hover:text-[#0f5238] transition-colors group'} rounded-xl p-3 flex flex-col items-center justify-center`}>
          <Map size={24} className={isActive('/investigador/dashboard') ? 'text-[#2d6a4f]' : 'group-hover:text-[#0f5238]'} />
        </Link>
        <Link to="/investigador/mapas" className={`${isActive('/investigador/mapas') ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] shadow-sm scale-90 transition-transform duration-200' : 'text-slate-400 hover:bg-slate-100/50 hover:text-[#0f5238] transition-colors group'} rounded-xl p-3 flex flex-col items-center justify-center`}>
          <Leaf size={24} className={isActive('/investigador/mapas') ? 'text-[#2d6a4f]' : 'group-hover:text-[#0f5238]'} />
        </Link>
        <Link to="/investigador/ia" className={`${isActive('/investigador/ia') ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] shadow-sm scale-90 transition-transform duration-200' : 'text-slate-400 hover:bg-slate-100/50 hover:text-[#0f5238] transition-colors group'} rounded-xl p-3 flex flex-col items-center justify-center`}>
          <Activity size={24} className={isActive('/investigador/ia') ? 'text-[#2d6a4f]' : 'group-hover:text-[#0f5238]'} />
        </Link>
        <Link to="/investigador/analisis" className={`${isActive('/investigador/analisis') ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] shadow-sm scale-90 transition-transform duration-200' : 'text-slate-400 hover:bg-slate-100/50 hover:text-[#0f5238] transition-colors group'} rounded-xl p-3 flex flex-col items-center justify-center`}>
          <Cloud size={24} className={isActive('/investigador/analisis') ? 'text-[#2d6a4f]' : 'group-hover:text-[#0f5238]'} />
        </Link>
        <Link to="/investigador/reportes" className={`${isActive('/investigador/reportes') ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] shadow-sm scale-90 transition-transform duration-200' : 'text-slate-400 hover:bg-slate-100/50 hover:text-[#0f5238] transition-colors group'} rounded-xl p-3 flex flex-col items-center justify-center`}>
          <History size={24} className={isActive('/investigador/reportes') ? 'text-[#2d6a4f]' : 'group-hover:text-[#0f5238]'} />
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="absolute top-24 left-32 right-10 bottom-4 z-30 overflow-y-auto pb-10 pr-2 custom-scrollbar-light">
        {children}
      </main>
    </div>
  );
};

export default ResearcherLayout;
