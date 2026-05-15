import { Satellite } from 'lucide-react';

const LayerToggle = ({ layerType, onLayerChange }) => {
  return (
    <div className="mapa-layer-toggle">
      <button
        className={`mapa-layer-btn ${layerType === 'satellite' ? 'active' : ''}`}
        onClick={() => onLayerChange('satellite')}
      >
        <Satellite size={14} />
        <span>Satélite</span>
      </button>
      <button
        className={`mapa-layer-btn ${layerType === 'osm' ? 'active' : ''}`}
        onClick={() => onLayerChange('osm')}
      >
        <span>Mapa</span>
      </button>
    </div>
  );
};

export default LayerToggle;
