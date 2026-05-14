// LoadingSpinner — Componente reutilizable de carga
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ mensaje = 'Cargando...', size = 'md' }) => (
  <div className={`${styles.wrapper} ${styles[size]}`}>
    <div className={styles.spinner}>
      <div className={styles.anillo} />
      <span className={styles.icono}>🌱</span>
    </div>
    {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
  </div>
);

export default LoadingSpinner;
