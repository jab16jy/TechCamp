import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useChat from '@features/chat/hooks/useChat';
import ChatHeader from '@features/chat/components/ChatHeader/ChatHeader';
import QuickActions from '@features/chat/components/QuickActions/QuickActions';
import ChatMessages from '@features/chat/components/ChatMessages/ChatMessages';
import ChatInput from '@features/chat/components/ChatInput/ChatInput';
import './AgroAsesor.css';

const AgroAsesor = () => {
  const {
    mensajes,
    input,
    setInput,
    loading,
    accionesOpen,
    setAccionesOpen,
    handleAccion,
    enviar,
    messagesEndRef,
  } = useChat();

  return (
    <ResearcherLayout activeTab="mapas">
      <div className="agro-asesor">
        <ChatHeader accionesOpen={accionesOpen} onToggleAcciones={() => setAccionesOpen((p) => !p)} />
        <QuickActions accionesOpen={accionesOpen} onAccion={handleAccion} />
        <ChatMessages mensajes={mensajes} loading={loading} endRef={messagesEndRef} />
        <ChatInput input={input} onInputChange={setInput} onEnviar={enviar} loading={loading} />
      </div>
    </ResearcherLayout>
  );
};

export default AgroAsesor;
