import { useState, useCallback, useEffect, useRef } from 'react';
import { FileText, Clock, Sprout, CheckCircle, Leaf, TrendingUp } from 'lucide-react';
import { enviarMensajeChat } from '@shared/services/api';
import useAppStore from '@shared/store';

const WELCOME_MSG = {
  rol: 'ia',
  texto: '**AgroAsesor IA**\n\nConozco los cultivos del Caribe colombiano: maíz, yuca, arroz, plátano, cacao, palma, y más. Pregúntame sobre siembra, fertilización, plagas, riego, **rendimiento histórico** o **perfil foliar de nutrientes**.\n\nSelecciona una acción rápida o escríbeme directamente.',
  hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
};

const ACCIONES_RAPIDAS = [
  { id: 'ultimo',    label: 'Ver último análisis',   icon: <FileText size={14} /> },
  { id: 'cosecha',   label: 'Predicción de cosecha', icon: <TrendingUp size={14} /> },
  { id: 'foliar',    label: 'Perfil foliar',          icon: <Leaf size={14} /> },
  { id: 'sensores',  label: 'Estado de sensores',    icon: <CheckCircle size={14} /> },
];

export { WELCOME_MSG, ACCIONES_RAPIDAS };

const ACCION_MESSAGES = {
  ultimo:   'muéstrame mi último análisis con predicción de cosecha',
  cosecha:  'predicción de cosecha para mi cultivo recomendado',
  foliar:   'perfil foliar de nutrientes de mi cultivo',
  sensores: 'estado de los sensores',
  historial: 'historial',
  recomendar: 'recomendar cultivo',
};

export default function useChat() {
  const [mensajes, setMensajes] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const { resultado } = useAppStore();

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
    return 'No pude procesar tu mensaje en este momento. El servidor no está disponible. Intenta de nuevo.';
  }, [conversationId]);

  const handleAccion = useCallback((accionId) => {
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    // Enrich harvest/foliar prompts with the current analysis crop if available
    let textoAccion = ACCION_MESSAGES[accionId] || 'ayuda';
    const topCultivo = resultado?.recomendaciones?.[0]?.cultivo;
    const depto = resultado?.ubicacion?.departamento;

    if (accionId === 'cosecha' && topCultivo) {
      textoAccion = `predicción de cosecha para ${topCultivo}${depto ? ` en ${depto}` : ''}`;
    } else if (accionId === 'foliar' && topCultivo) {
      textoAccion = `perfil foliar de nutrientes de ${topCultivo}${depto ? ` en ${depto}` : ''}`;
    }

    setMensajes((p) => [...p, { rol: 'usuario', texto: textoAccion, hora }]);
    setLoading(true);

    callAgent(textoAccion).then((respText) => {
      setLoading(false);
      const horaResp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setMensajes((p) => [...p, { rol: 'ia', texto: respText, hora: horaResp }]);
    });
  }, [callAgent, resultado]);

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
