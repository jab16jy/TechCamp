import { Bot, Brain, ChevronDown } from 'lucide-react';

const ChatHeader = ({ accionesOpen, onToggleAcciones }) => {
  return (
    <div className="agro-header">
      <div className="agro-header-left">
        <div className="agro-avatar">
          <Bot size={20} />
        </div>
        <div className="agro-header-info">
          <h2>Agro-Asesor IA</h2>
          <div className="agro-header-status">
            <span className="agro-status-dot" />
            <span>Conectado</span>
            <span className="agro-separator">·</span>
            <span>Sin capacidades de generación de imágenes</span>
          </div>
        </div>
      </div>
      <div className="agro-header-right">
        <div className="agro-header-badge">
          <Brain size={12} />
          <span>94.2% precisión</span>
        </div>
        <button
          className="agro-toggle-acciones"
          onClick={onToggleAcciones}
        >
          <span>Acciones</span>
          <ChevronDown size={14} className={accionesOpen ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
