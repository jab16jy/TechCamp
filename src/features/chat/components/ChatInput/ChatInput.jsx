import { Send } from 'lucide-react';

const ChatInput = ({ input, onInputChange, onEnviar, loading }) => {
  return (
    <div className="agro-input-area">
      <div className="agro-input-wrapper">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnviar()}
          placeholder="Escribe tu pregunta al Agro-Asesor..."
          className="agro-input"
          disabled={loading}
        />
        <button
          onClick={onEnviar}
          disabled={!input.trim() || loading}
          className="agro-send-btn"
        >
          <Send size={18} strokeWidth={1.5} />
        </button>
      </div>
      <p className="agro-input-hint">
        <span>💡</span> Pregúntame sobre análisis, recomendaciones o sensores.
      </p>
    </div>
  );
};

export default ChatInput;