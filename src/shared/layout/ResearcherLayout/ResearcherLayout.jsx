import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '@shared/store';
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
  LayoutDashboard,
  Sprout,
  Bot,
  Brain,
  Wifi,
  FileText,
  Clock,
} from 'lucide-react';

import AmbientBackground from '../AmbientBackground/AmbientBackground';
import HistorialDropdown from '@features/history/components/HistorialDropdown/HistorialDropdown';
import noFotoSrc from '@assets/images/nofoto-Usuario.png';
import './ResearcherLayout.css';

const NAV_ITEMS = [
  { path: '/investigador/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/investigador/analisis', label: 'Análisis', icon: Sprout },
  { path: '/investigador/mapas', label: 'AgroAsesor', icon: Bot },
  { path: '/investigador/ia', label: 'IA Predictiva', icon: Brain },
  { path: '/investigador/sensores', label: 'Sensores', icon: Wifi },
  { path: '/investigador/reportes', label: 'Reportes', icon: FileText },
  { path: '/investigador/historial', label: 'Historial', icon: Clock },
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

  const isActive = (path) => {
    if (path === '/investigador/dashboard') {
      return location.pathname === '/investigador/dashboard' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <div className="rl-root">
      <AmbientBackground />



      {/* ── Nav Pill (Top-Center) ── */}
      <nav className="rl-nav-pill">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`rl-nav-item ${active ? 'rl-nav-item-active' : ''}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="rl-nav-item-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Control Center (Top-Right) ── */}
      <div className="rl-control-center">
        {/* Search Bubble */}
        <div className="rl-control-search">
          <Search size={16} className="rl-search-icon" />
          <input
            className="rl-search-input"
            placeholder="Buscar..."
            type="text"
          />
        </div>

        <HistorialDropdown />

        {/* Alerts */}
        <div className="rl-control-bubble-wrap" ref={alertsRef}>
          <button
            onClick={() => setAlertsOpen((prev) => !prev)}
            className="rl-control-bubble rl-control-bell"
          >
            <Bell size={17} />
            <span className="rl-bell-dot" />
          </button>

          <AnimatePresence>
            {alertsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="rl-dropdown"
              >
                <div className="rl-dropdown-header">
                  <span className="rl-dropdown-title">Alertas Recientes</span>
                  <button className="rl-dropdown-link">Marcar leidas</button>
                </div>
                <div className="rl-dropdown-list">
                  {ALERTS.map((alert, index) => (
                    <div key={index} className="rl-dropdown-item">
                      <span className="rl-dropdown-item-icon">{alertIcon[alert.type]}</span>
                      <div>
                        <p className="rl-dropdown-item-title">{alert.title}</p>
                        <p className="rl-dropdown-item-desc">{alert.desc}</p>
                        <p className="rl-dropdown-item-time">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rl-dropdown-footer">
                  <button className="rl-dropdown-link">Ver todas →</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button className="rl-control-bubble">
          <Settings size={17} />
        </button>

        {/* Profile */}
        <div className="rl-control-bubble-wrap" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="rl-control-bubble rl-control-avatar"
          >
            <img src={noFotoSrc} alt="Usuario" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="rl-dropdown rl-dropdown-profile"
              >
                <div className="rl-dropdown-header rl-profile-header">
                  <p className="rl-profile-name">Dr johan borrero investigador</p>
                </div>
                {[
                  { label: 'Mi Perfil', icon: <User size={15} />, path: '/perfil' },
                  { label: 'Ajustes', icon: <Settings size={15} />, path: '/investigador/ajustes' },
                ].map((option) => (
                  <Link
                    key={option.label}
                    to={option.path}
                    className="rl-dropdown-profile-item"
                  >
                    <span className="rl-dropdown-profile-icon">{option.icon}</span>
                    {option.label}
                  </Link>
                ))}
                <div className="rl-dropdown-divider" />
                <button onClick={handleLogout} className="rl-dropdown-logout">
                  <LogOut size={15} /> Cerrar Sesion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="rl-main">
        <div className="rl-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResearcherLayout;