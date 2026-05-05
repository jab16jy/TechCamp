// ============================================
// Navbar — Componente de navegación global
// Fijo en la parte superior con logo, links y estado API
// ============================================

import { NavLink, Link } from 'react-router-dom';
import { useEffect } from 'react';
import useAppStore from '../../context/useAppStore';
import { getApiStatus } from '../../services/api';
import styles from './Navbar.module.css';

const Navbar = () => {
  const apiConectada = useAppStore((s) => s.apiConectada);
  const setApiConectada = useAppStore((s) => s.setApiConectada);

  // Verificar estado de la API cada 30 segundos
  useEffect(() => {
    const verificar = () => setApiConectada(getApiStatus());
    verificar();
    const intervalo = setInterval(verificar, 30000);
    return () => clearInterval(intervalo);
  }, [setApiConectada]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" className={styles.logoSvg}>
            <path d="M10 35c0-10 5-15 15-15s15 5 15 15" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="25" cy="20" r="4" fill="currentColor"/>
            <path d="M45 25a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" fill="none" stroke="#E8B84B" strokeWidth="2" strokeDasharray="2 1"/>
            <text x="60" y="35" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="24" fill="currentColor">AgroCaribe</text>
          </svg>
        </Link>

        {/* Links de navegación */}
        <ul className={styles.links}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActivo}` : styles.link
              }
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/consulta"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActivo}` : styles.link
              }
            >
              Consultar
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/historial"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActivo}` : styles.link
              }
            >
              Historial
            </NavLink>
          </li>
        </ul>

        {/* Derecha: estado API + CTA */}
        <div className={styles.derecha}>
          <div className={styles.apiStatus}>
            <span
              className={`${styles.statusDot} ${
                apiConectada ? styles.conectado : styles.desconectado
              }`}
            />
            {apiConectada ? 'API conectada' : 'Modo demo'}
          </div>
          <Link to="/consulta" className={styles.btnConsulta}>
            Analizar zona
          </Link>
        </div>

        {/* Menú hamburguesa (mobile) */}
        <button className={styles.hamburguesa} aria-label="Menú">
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
