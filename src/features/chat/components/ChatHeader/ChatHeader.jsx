import { Bot } from 'lucide-react';

const ChatHeader = ({ loading }) => {
  return (
    <div className="agro-header">
      <div className="agro-avatar">
        <Bot size={16} strokeWidth={1.5} />
      </div>
      <div className="agro-header-info">
        <h2>Agro-Asesor IA</h2>
        <div className="agro-header-status">
          <span className={`agro-status-dot ${loading ? 'agro-status-writing' : ''}`} />
          <span>{loading ? 'Escribiendo...' : 'Conectado'}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;