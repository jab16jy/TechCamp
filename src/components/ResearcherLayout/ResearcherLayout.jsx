import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  ChevronDown
} from 'lucide-react';

const ResearcherLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const agregarToast = useAppStore((s) => s.agregarToast);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const profileRef = useRef(null);
  const alertsRef = useRef(null);

  const rol = sessionStorage.getItem('rol');

  useEffect(() => {
    if (rol !== 'investigador' && rol !== 'productor') {
      navigate('/investigador/login');
    }
  }, [rol, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(event.target)) setIsAlertsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('rol');
    agregarToast('Sesión cerrada', 'info');
    navigate('/');
  };

  const simularReporte = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      agregarToast('Reporte generado exitosamente', 'success');
    }, 3000);
  };

  const navSections = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/investigador/dashboard' },
        { id: 'mapas', icon: <MapIcon size={18} />, label: 'Mapas en Vivo', path: '/investigador/mapas' },
      ]
    },
    {
      title: 'CIENCIA',
      items: [
        { id: 'analisis', icon: <FlaskConical size={18} />, label: 'Análisis de Suelos', path: '/investigador/analisis' },
        { id: 'ia', icon: <BrainCircuit size={18} />, label: 'IA Predictiva', path: '/investigador/ia' },
        { id: 'simulador', icon: <Activity size={18} />, label: 'Simulador', path: '/investigador/simulador' },
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { id: 'reportes', icon: <FileText size={18} />, label: 'Reportes', path: '/investigador/reportes' },
        { id: 'sensores', icon: <RadioTower size={18} />, label: 'Gestión de Nodos IoT', path: '/investigador/sensores' },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0 border-r border-slate-800 transition-all duration-300">
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Nueva Simulación Button */}
          <button className="w-full mb-8 group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95 font-medium text-sm">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Nueva Simulación
          </button>

          <nav className="space-y-8">
            {navSections.map((sec, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 px-3 uppercase">
                  {sec.title}
                </h4>
                <ul className="space-y-1">
                  {sec.items.map((item) => {
                    const isActive = location.pathname.includes(item.path) || activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.path}
                          onClick={() => item.id === 'reportes' && simularReporte()}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                            isActive 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'hover:bg-slate-800 hover:text-slate-100'
                          }`}
                        >
                          {/* Active indicator stripe */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full" />
                          )}
                          <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Info Reporte Generando */}
        {isGeneratingReport && (
          <div className="mx-4 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-3 animate-pulse">
            <Loader2 size={16} className="text-emerald-400 animate-spin" />
            <div>
              <p className="text-xs text-slate-200 font-medium">Generando reporte...</p>
              <p className="text-[10px] text-slate-500">NDVI & Análisis Suelo</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center font-medium">
            AgroCaribe Engine <br/> v4.2 Pro
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* ── HEADER ── */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-inner shadow-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-5 h-5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: '"Montserrat", sans-serif' }}>
              AgroCaribe <span className="text-emerald-600 font-extrabold">IA</span>
            </h1>
          </div>

          {/* Command Palette */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar nodos, lotes, análisis..." 
                className="w-full bg-slate-100 border border-transparent rounded-full py-2 pl-10 pr-12 text-sm text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] text-slate-500 font-medium">
                  <Command size={10} /> K
                </div>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            
            {/* IA Health Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wide">v4.2 Pro | 94.2% Accuracy</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={alertsRef}>
              <button 
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              </button>

              {/* Alerts Dropdown */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800">Alertas Recientes</h3>
                    <button className="text-[10px] text-emerald-600 font-bold hover:underline">Marcar leídas</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[
                      { title: 'Estrés hídrico detectado', desc: 'Nodo Sur-02 registra 61% HR.', time: 'Hace 5 min', urgent: true },
                      { title: 'Análisis Sentinel-2', desc: 'Nuevas imágenes NDVI disponibles.', time: 'Hace 1 hora', urgent: false },
                      { title: 'Reporte listo', desc: 'Resumen semanal generado.', time: 'Hace 3 horas', urgent: false },
                    ].map((alert, i) => (
                      <div key={i} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 items-start cursor-pointer">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.urgent ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{alert.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{alert.desc}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center border-t border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="text-xs font-bold text-slate-600">Ver todas las alertas</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-full pr-3 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden">
                  <img src="https://lh3.googleusercontent.com/aida/ADBb0ujPlGjbWMxBx3mhqQy7KLwgTutTW9OFXzmeMtI6mp5Mx5IM7k3vzcwkhNiEO6YVglNVEQ2byE9IiCgVKI3xhn0KC9eB64BE1PH4Y23FdAI9jkvfIoeIYrRDZ1GXPqabFEiYnlDVD4l5WWdzrKiAVIbQVyC4OUnuY4NvJAi6OQDBKkcBsyT4i2Yki7WEPIYlKMSNbhiyZBPCbgIz6J81cpQJhXrCEWFmaIIqBPjVY-VUl18q5qHZ7LSWymM" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 origin-top-right">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-800">Dra. Elena Ramos</p>
                    <p className="text-xs text-slate-500">Investigadora Principal</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> Mi Perfil
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <MapIcon size={16} className="text-slate-400" /> Ajustes de Finca
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Shield size={16} className="text-slate-400" /> Administración
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

    </div>
  );
};

export default ResearcherLayout;
