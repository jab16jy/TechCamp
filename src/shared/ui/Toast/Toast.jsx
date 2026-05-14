// Toast — Sistema de notificaciones global
import useAppStore from '@shared/store';
import styles from './Toast.module.css';

const Toast = () => {
  const toasts = useAppStore((s) => s.toasts);
  const eliminarToast = useAppStore((s) => s.eliminarToast);

  return (
    <div className={styles.contenedor}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.tipo]}`}
        >
          <span className={styles.icono}>
            {toast.tipo === 'error' && '❌'}
            {toast.tipo === 'exito' && '✅'}
            {toast.tipo === 'advertencia' && '⚠️'}
            {toast.tipo === 'info' && 'ℹ️'}
          </span>
          <p className={styles.mensaje}>{toast.mensaje}</p>
          <button
            className={styles.cerrar}
            onClick={() => eliminarToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
