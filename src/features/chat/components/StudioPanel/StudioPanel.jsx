import { FileText, Droplets, Sprout, TrendingUp, Download, BarChart3, Map, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudioPanel.css';

const STUDIO_ACTIONS = [
  {
    id: 'reporte-riego',
    title: 'Generar reporte de riego',
    desc: 'Análisis de humedad por zona',
    icon: Droplets,
    route: '/investigador/reportes',
    color: 'blue',
  },
  {
    id: 'mapa-nutrientes',
    title: 'Mapa de nutrientes',
    desc: 'Distribución NPK en parcela',
    icon: Map,
    route: '/investigador/analisis',
    color: 'green',
  },
  {
    id: 'prediccion-cosecha',
    title: 'Predicción de cosecha',
    desc: 'Estimación de rendimiento',
    icon: TrendingUp,
    route: '/investigador/ia',
    color: 'amber',
  },
  {
    id: 'exportar-analisis',
    title: 'Exportar análisis',
    desc: 'Descargar datos en PDF',
    icon: Download,
    route: '/investigador/analisis',
    color: 'purple',
  },
  {
    id: 'historial-completo',
    title: 'Historial de análisis',
    desc: 'Revisar todos los registros',
    icon: BarChart3,
    route: '/investigador/historial',
    color: 'green',
  },
  {
    id: 'sensores-iot',
    title: 'Panel de sensores',
    desc: 'Monitoreo en tiempo real',
    icon: Shield,
    route: '/investigador/sensores',
    color: 'blue',
  },
];

const StudioPanel = () => {
  const navigate = useNavigate();

  const handleAction = (route) => {
    navigate(route);
  };

  return (
    <div className="studio-panel">
      <h3 className="studio-title">
        <Sprout size={14} strokeWidth={1.5} />
        Studio
      </h3>
      <p className="studio-subtitle">Acciones rápidas</p>

      <div className="studio-actions">
        {STUDIO_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={`studio-card studio-card-${action.color}`}
              onClick={() => handleAction(action.route)}
            >
              <div className="studio-card-icon">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div className="studio-card-content">
                <span className="studio-card-title">{action.title}</span>
                <span className="studio-card-desc">{action.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudioPanel;