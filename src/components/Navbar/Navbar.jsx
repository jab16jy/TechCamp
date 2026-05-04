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
          <div className={styles.logoIcono}>
            🌿
            <span className={styles.logoPunto} />
          </div>
          <div className={styles.logoTexto}>
            <span className={styles.logoNombre}>AgroCaribe AI</span>
            <span className={styles.logoSub}>TECHCAMP · 2025</span>
          </div>
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
