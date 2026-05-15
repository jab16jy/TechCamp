import { Satellite, Globe, Microscope } from 'lucide-react';

/**
 * Tarjeta de fuentes de datos reutilizable.
 * Muestra las fuentes principales de información del sistema.
 */
const DEFAULT_SOURCES = [
  { icon: Satellite, name: 'Sentinel-2', desc: 'NDVI · Última imagen: hace 6h' },
  { icon: Globe, name: 'NASA POWER', desc: 'Clima histórico y actual' },
  { icon: Microscope, name: 'Laboratorio', desc: 'Suelo · Calibración: 24/05' },
];

const DataSourcesCard = ({ sources = DEFAULT_SOURCES, title = 'Fuentes de datos' }) => {
  return (
    <div className="ac-sources-card">
      <p className="ac-sources-title">{title}</p>
      {sources.map((s) => (
        <div key={s.name} className="ac-source-row">
          <s.icon size={16} className="ac-source-icon" />
          <div>
            <p className="ac-source-name">{s.name}</p>
            <p className="ac-source-desc">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DataSourcesCard;
