// Footer — AgroCaribe AI
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.col}>
        <div className={styles.logoTexto}>
          <span className={styles.logoNombre}>AgroCaribe AI</span>
          <p className={styles.logoSub}>
            Sistema inteligente de recomendación de cultivos para el Caribe colombiano.
          </p>
        </div>
      </div>

      <div className={styles.col}>
        <h4 className={styles.tituloCol}>Navegación</h4>
        <ul className={styles.listaLinks}>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/consulta">Consultar cultivos</Link></li>
          <li><Link to="/historial">Historial</Link></li>
        </ul>
      </div>

      <div className={styles.col}>
        <h4 className={styles.tituloCol}>Equipo TECHCAMP</h4>
        <ul className={styles.listaEquipo}>
          <li>👨‍💻 Desarrollador Frontend</li>
          <li>🌾 Especialista Agrónomo</li>
          <li>📡 Ingeniero de Datos</li>
          <li>🤖 Científico de IA</li>
        </ul>
      </div>
    </div>

    <div className={styles.base}>
      <p>© 2025 AgroCaribe AI · TECHCAMP · Región Caribe, Colombia 🇨🇴</p>
      <p className={styles.datos}>Datos satelitales desde 1940 · Resolución 1 km²</p>
    </div>
  </footer>
);

export default Footer;
