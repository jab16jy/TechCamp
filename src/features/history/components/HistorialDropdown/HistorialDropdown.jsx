import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Leaf, FlaskConical, MapPin, ArrowRight, Trash2, Eye } from 'lucide-react';
import useAppStore from '@shared/store';
import './HistorialDropdown.css';

const TYPE_META = {
  analisis: {
    label: 'Cultivo',
    icon: Leaf,
    badgeClass: 'hd-badge--analisis',
    scoreClass: 'hd-score--analisis',
  },
  suelo: {
    label: 'Suelo',
    icon: FlaskConical,
    badgeClass: 'hd-badge--suelo',
    scoreClass: 'hd-score--suelo',
  },
};

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const HistorialDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const historial = useAppStore((s) => s.historial);
  const limpiarHistorial = useAppStore((s) => s.limpiarHistorial);

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const preview = historial.slice(0, 5);
  const count = historial.length;

  const handleVerDetalle = (e, item) => {
    e.preventDefault();
    setOpen(false);
  };

  return (
    <div className="hd-wrapper" ref={ref}>
      <button
        className={`hd-trigger ${open ? 'hd-trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Historial de análisis"
      >
        <History size={22} />
        {count > 0 && (
          <span className="hd-count">{count > 99 ? '99+' : count}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="hd-dropdown"
          >
            <div className="hd-header">
              <div className="hd-header-left">
                <History size={15} className="hd-header-icon" />
                <span>Historial de Análisis</span>
              </div>
              {count > 0 && (
                <button
                  className="hd-clear-btn"
                  onClick={() => { limpiarHistorial(); setOpen(false); }}
                  title="Limpiar historial"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div className="hd-body">
              {preview.length === 0 ? (
                <div className="hd-empty">
                  <div className="hd-empty-icon">
                    <History size={28} />
                  </div>
                  <p className="hd-empty-title">Sin registros aún</p>
                  <p className="hd-empty-desc">Los análisis realizados aparecerán aquí</p>
                </div>
              ) : (
                <ul className="hd-list">
                  {preview.map((item) => {
                    const meta = TYPE_META[item.tipo] || TYPE_META.analisis;
                    const Icon = meta.icon;
                    return (
                      <li key={item.id} className="hd-item">
                        <div className={`hd-item-icon-wrap ${item.tipo === 'suelo' ? 'hd-icon-wrap--suelo' : 'hd-icon-wrap--analisis'}`}>
                          <Icon size={15} />
                        </div>
                        <div className="hd-item-content">
                          <div className="hd-item-top">
                            <span className="hd-item-id">{item.id}</span>
                            <span className={`hd-badge ${meta.badgeClass}`}>{meta.label}</span>
                          </div>
                          <div className="hd-item-location">
                            <MapPin size={11} />
                            <span>{item.municipio}{item.departamento ? `, ${item.departamento}` : ''}</span>
                          </div>
                          {item.tipo === 'analisis' ? (
                            <div className="hd-item-result">
                              <Leaf size={12} className="hd-result-icon" />
                              <span className="hd-result-crop">{item.cultivo || item.cultivo_top || '—'}</span>
                              {item.score != null && (
                                <span className={`hd-score ${meta.scoreClass}`}>{item.score}%</span>
                              )}
                            </div>
                          ) : (
                            <div className="hd-item-result">
                              <FlaskConical size={12} className="hd-result-icon" />
                              <span className="hd-result-crop">{item.calidad_suelo || '—'}</span>
                              {item.ph && (
                                <span className="hd-score hd-score--suelo">pH {item.ph}</span>
                              )}
                            </div>
                          )}
                          <div className="hd-item-date">{formatDate(item.fecha)}</div>
                        </div>
                        <div className="hd-item-actions">
                          <Link
                            to={item.tipo === 'suelo' ? '/investigador/resultado-avanzado' : '/resultado'}
                            onClick={() => setOpen(false)}
                            className="hd-action-btn"
                            title="Ver detalle"
                          >
                            <Eye size={14} />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {count > 0 && (
              <div className="hd-footer">
                <Link
                  to="/investigador/historial"
                  className="hd-view-all"
                  onClick={() => setOpen(false)}
                >
                  <span>Ver todo el historial</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistorialDropdown;