import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useChat from '@features/chat/hooks/useChat';
import ChatHeader from '@features/chat/components/ChatHeader/ChatHeader';
import ChatMessages from '@features/chat/components/ChatMessages/ChatMessages';
import ChatInput from '@features/chat/components/ChatInput/ChatInput';
import QuickActions from '@features/chat/components/QuickActions/QuickActions';
import DataSources from '@features/chat/components/DataSources/DataSources';
import StudioPanel from '@features/chat/components/StudioPanel/StudioPanel';
import './AgroAsesor.css';

const AgroAsesor = () => {
  const authorized = useAuthGuard('investigador');
  const {
    mensajes,
    input,
    setInput,
    loading,
    handleAccion,
    enviar,
    messagesEndRef,
    ACCIONES_RAPIDAS,
  } = useChat();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="mapas">
      <div className="agro-asesor">
        <div className="agro-left-panel">
          <DataSources />
        </div>

        <div className="agro-center-panel">
          <ChatHeader loading={loading} />
          <ChatMessages mensajes={mensajes} loading={loading} endRef={messagesEndRef} />
          <QuickActions acciones={ACCIONES_RAPIDAS} onAccion={handleAccion} />
          <ChatInput input={input} onInputChange={setInput} onEnviar={enviar} loading={loading} />
        </div>

        <div className="agro-right-panel">
          <StudioPanel />
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default AgroAsesor;