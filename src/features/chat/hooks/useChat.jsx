import { useState, useCallback, useEffect, useRef } from 'react';
import { FileText, Clock, Sprout, CheckCircle } from 'lucide-react';
import { enviarMensajeChat } from '@shared/services/api';

const WELCOME_MSG = {
  rol: 'ia',
  texto: '**AgroAsesor IA**\n\nConozco los cultivos del Caribe colombiano: maiz, yuca, arroz, platano, cacao, palma, y mas. Preguntame sobre siembra, fertilizacion, plagas, riego, sensores IoT o interpretacion de NDVI.\n\nSelecciona una accion rapida o escribeme directamente.',
  hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
};

const ACCIONES_RAPIDAS = [
  { id: 'ultimo', label: 'Ver ultimo analisis', icon: <FileText size={14} /> },
  { id: 'historial', label: 'Comparar historicos', icon: <Clock size={14} /> },
  { id: 'recomendar', label: 'Recomendar cultivo', icon: <Sprout size={14} /> },
  { id: 'sensores', label: 'Estado de sensores', icon: <CheckCircle size={14} /> },
];

export { WELCOME_MSG, ACCIONES_RAPIDAS };

const ACCION_MESSAGES = {
  ultimo: 'ultimo analisis',
  historial: 'historial',
  recomendar: 'recomendar cultivo',
  sensores: 'estado de los sensores',
};

export default function useChat() {
  const [mensajes, setMensajes] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const callAgent = useCallback(async (texto) => {
    try {
      const resp = await enviarMensajeChat(texto, conversationId, null);
      if (resp) {
        setConversationId(resp.conversation_id);
        return resp.message.contenido;
      }
    } catch {
      /* fallback */
    }
    return 'No pude procesar tu mensaje en este momento. El servidor no esta disponible. Intenta de nuevo.';
  }, [conversationId]);

  const handleAccion = useCallback((accionId) => {
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const textoAccion = ACCION_MESSAGES[accionId] || 'ayuda';

    setMensajes((p) => [...p, { rol: 'usuario', texto: textoAccion, hora }]);
    setLoading(true);

    callAgent(textoAccion).then((respText) => {
      setLoading(false);
      const horaResp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setMensajes((p) => [...p, { rol: 'ia', texto: respText, hora: horaResp }]);
    });
  }, [callAgent]);

  const enviar = useCallback(() => {
    if (!input.trim()) return;
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const texto = input.trim();
    setMensajes((p) => [...p, { rol: 'usuario', texto, hora }]);
    setInput('');
    setLoading(true);

    callAgent(texto).then((respText) => {
      setLoading(false);
      const horaResp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setMensajes((p) => [...p, { rol: 'ia', texto: respText, hora: horaResp }]);
    });
  }, [input, callAgent]);

  return {
    mensajes, input, setInput, loading,
    handleAccion, enviar, messagesEndRef,
    WELCOME_MSG, ACCIONES_RAPIDAS,
  };
}
