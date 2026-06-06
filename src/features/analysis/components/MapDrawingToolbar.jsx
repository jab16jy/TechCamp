import { Square, Circle, Trash2 } from 'lucide-react';

const TOOLS = [
  { key: 'rectangle', icon: Square, label: 'Rectángulo' },
  { key: 'circle', icon: Circle, label: 'Círculo' },
];

export default function MapDrawingToolbar({
  activeTool,
  onToolChange,
  onClear,
  canClear,
}) {
  return (
    <div className="leaflet-draw-toolbar leaflet-bar leaflet-control">
      <style>{`
        .leaflet-draw-toolbar {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          left: auto !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 2px;
          background: rgba(13, 17, 23, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          margin: 0 !important;
        }
        .leaflet-draw-toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .leaflet-draw-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .leaflet-draw-toolbar button.active {
          background: rgba(45, 90, 39, 0.3);
          color: #95d4b3;
          box-shadow: inset 0 0 0 1.5px rgba(149, 212, 179, 0.3);
        }
        .leaflet-draw-toolbar button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .leaflet-draw-toolbar button:disabled:hover {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
        }
        .leaflet-draw-toolbar .toolbar-divider {
          height: 1px;
          margin: 2px 4px;
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
      {TOOLS.map((tool) => (
        <button
          key={tool.key}
          onClick={() => onToolChange(tool.key)}
          className={activeTool === tool.key ? 'active' : ''}
          title={tool.label}
        >
          <tool.icon size={18} />
        </button>
      ))}
      <div className="toolbar-divider" />
      <button
        onClick={onClear}
        disabled={!canClear}
        title="Limpiar todo"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
