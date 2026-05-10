import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import styles from './ResearcherLayout.module.css';

const ResearcherLayout = ({ children, activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const agregarToast = useAppStore((s) => s.agregarToast);

  useEffect(() => {
    const rol = sessionStorage.getItem('rol');
    if (rol !== 'investigador' && rol !== 'productor') {
      navigate('/investigador/login');
    }
  }, [navigate]);

  const rol = sessionStorage.getItem('rol');

  const cerrarSesion = () => {
    sessionStorage.removeItem('rol');
    agregarToast('Sesión cerrada', 'info');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/investigador/dashboard', roles: ['investigador'] },
    { id: 'analisis', icon: 'potted_plant', label: 'Análisis de Cultivos', path: '/investigador/analisis', roles: ['investigador', 'productor'] },
    { id: 'sensores', icon: 'sensors', label: 'Sensores IoT', path: '/investigador/sensores', roles: ['investigador'] },
    { id: 'ia', icon: 'psychology', label: 'IA Predictiva', path: '/investigador/ia', roles: ['investigador'] },
    { id: 'reportes', icon: 'assessment', label: 'Reportes', path: '/investigador/reportes', roles: ['investigador', 'productor'] },
  ].filter(item => item.roles.includes(rol));

  let topNavItems = [];
  
  if (location.pathname === '/investigador/dashboard') {
    topNavItems = [
      { id: 'asesor', label: 'Centro de Mando', roles: ['investigador'] },
      { id: 'metricas', label: 'Métricas del modelo', roles: ['investigador'] },
      { id: 'exportar', label: 'Exportar datos', roles: ['investigador'] },
    ].filter(item => item.roles.includes(rol));
  } else if (location.pathname === '/investigador/analisis' || location.pathname === '/resultado') {
    topNavItems = [
      { id: 'analisis', label: 'Análisis', roles: ['investigador', 'productor'] },
      { id: 'historial', label: 'Historial de consultas', roles: ['investigador', 'productor'] },
    ].filter(item => item.roles.includes(rol));
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* Top Navigation Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to="/home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" className={styles.logoSvg}>
              <path d="M10 35c0-10 5-15 15-15s15 5 15 15" fill="none" stroke="#2D5A27" strokeWidth="3"/>
              <circle cx="25" cy="20" r="4" fill="#2D5A27"/>
              <path d="M45 25a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" fill="none" stroke="#5D4037" strokeWidth="2" strokeDasharray="2 1"/>
              <text x="60" y="35" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="24" fill="#2D5A27">AgroCaribe</text>
            </svg>
          </Link>
          <nav className={styles.topNav}>
            {topNavItems.map((item) => (
              <button 
                key={item.id}
                className={`${styles.topNavItem} ${activeTab === item.id ? styles.topNavItemActive : ''}`}
                onClick={() => {
                  if (onTabChange) {
                    onTabChange(item.id);
                  }
                  
                  if (item.id === 'analisis' && location.pathname !== '/investigador/analisis') {
                    navigate('/investigador/analisis');
                  } else if (item.id !== 'analisis' && location.pathname === '/investigador/dashboard') {
                    // Stay in dashboard but change tab
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.iconButton}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className={styles.iconButton}>
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className={styles.profileCircle}>
            <img 
              src="https://lh3.googleusercontent.com/aida/ADBb0ujPlGjbWMxBx3mhqQy7KLwgTutTW9OFXzmeMtI6mp5Mx5IM7k3vzcwkhNiEO6YVglNVEQ2byE9IiCgVKI3xhn0KC9eB64BE1PH4Y23FdAI9jkvfIoeIYrRDZ1GXPqabFEiYnlDVD4l5WWdzrKiAVIbQVyC4OUnuY4NvJAi6OQDBKkcBsyT4i2Yki7WEPIYlKMSNbhiyZBPCbgIz6J81cpQJhXrCEWFmaIIqBPjVY-VUl18q5qHZ7LSWymM" 
              alt="Profile" 
            />
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderIcon}>
              <span className="material-symbols-outlined">biotech</span>
            </div>
            <div>
              <p className={styles.sidebarHeaderTitle}>Laboratorio IA</p>
              <p className={styles.sidebarHeaderSubtitle}>Sede Central</p>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {menuItems.map((item) => (
              <Link 
                key={item.id}
                to={item.path} 
                className={`${styles.sidebarNavItem} ${location.pathname === item.path || activeTab === item.id ? styles.sidebarNavItemActive : ''}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarAction}>
            <button className={styles.newSimulationBtn}>
              <span className="material-symbols-outlined">add</span>
              Nueva Simulación
            </button>
          </div>

          <div className={styles.sidebarFooter}>
            <a href="#" className={styles.sidebarFooterItem}>
              <span className="material-symbols-outlined">help</span>
              <span>Ayuda</span>
            </a>
            <button onClick={cerrarSesion} className={styles.sidebarFooterItem}>
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResearcherLayout;
