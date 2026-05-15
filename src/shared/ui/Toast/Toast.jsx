// Toast — Sistema de notificaciones global glassmórfico
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import useAppStore from '@shared/store';
import './Toast.css';

const ICONS = {
  exito: CheckCircle,
  success: CheckCircle,
  error: AlertCircle,
  advertencia: AlertTriangle,
  info: Info,
};

const COLORS = {
  exito: 'border-l-[#2d6a4f] text-[#2d6a4f]',
  success: 'border-l-[#2d6a4f] text-[#2d6a4f]',
  error: 'border-l-[#e05252] text-[#e05252]',
  advertencia: 'border-l-[#e8b84b] text-[#e8b84b]',
  info: 'border-l-[#60a5fa] text-[#60a5fa]',
};

const Toast = () => {
  const toasts = useAppStore((s) => s.toasts);
  const eliminarToast = useAppStore((s) => s.eliminarToast);

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const IconComponent = ICONS[toast.tipo] || Info;
        const colorClass = COLORS[toast.tipo] || COLORS.info;

        return (
          <div
            key={toast.id}
            className={`toast-card glass-card ${colorClass}`}
          >
            <div className="toast-icon">
              <IconComponent size={20} strokeWidth={2} />
            </div>
            <p className="toast-message">{toast.mensaje}</p>
            <button
              className="toast-close"
              onClick={() => eliminarToast(toast.id)}
              aria-label="Cerrar notificación"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <div className={`toast-progress-bar ${toast.tipo}`} />
          </div>
        );
      })}
    </div>
  );
};

export default Toast;