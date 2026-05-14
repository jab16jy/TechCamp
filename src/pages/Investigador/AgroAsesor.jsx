import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import useAppStore from '../../context/useAppStore';
import {
  Send, Bot, ChevronDown, ChevronLeft, Brain, BarChart3,
  Sprout, FileText, CheckCircle, AlertTriangle, Clock, MapPin
} from 'lucide-react';
import './AgroAsesor.css';

const ACCIONES_RAPIDAS = [
  { id: 'ultimo', label: 'Ver último resultado', icon: <FileText size={14} /> },
  { id: 'historial', label: 'Comparar históricos', icon: <Clock size={14} /> },
  { id: 'recomendar', label: 'Recomendación de cultivo', icon: <Sprout size={14} /> },
  { id: 'sensores', label: 'Estado de sensores', icon: <CheckCircle size={14} /> },
];

const WELCOME_MSG = {
  rol: 'ia',
  texto: '¡Bienvenido al **Agro-Asesor IA**! 🌱\n\nEstoy sincronizado con tu historial de análisis, resultados de parcelas y datos de sensores. Puedo ayudarte a interpretar datos, comparar resultados o recomendarte acciones.\n\nSelecciona una acción rápida o escríbeme directamente.',
  hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
};

const RESPUESTAS = {
  ultimo: `Tienes un análisis de **suelo** generado el ${new Date().toLocaleDateString('es-CO')}.\n\n**Resumen:**\n• pH: 6.4 (óptimo)\n• Nitrógeno: 42 kg/ha (-3.4%)\n• NDVI: 0.72 (+4%)\n• Humedad: 72% (estable)\n\n¿Quieres que profundice en algún parámetro?`,
  historial: `Tienes **2 análisis** en tu historial:\n\n**1.** Análisis de Parcela — Atlántico · 12 may 2026\n**2.** Calidad de Suelo — Cesar · 8 may 2026\n\nAmbos con estado "Exitosa". ¿Quieres que compare los NDVI o los rankings de cultivos?`,
  recomendar: `Basado en tus datos climáticos y de suelo:\n\n**Cultivos recomendados para esta zona:**\n• 🥇 **Maíz** — Score: 87% · Zonas con NDVI >0.65\n• 🥈 **Yuca** — Score: 81% · Resistente a sequía\n• 🥉 **Café** — Score: 74% · Requiere altitud >800m\n\nEl **maíz** es la mejor opción considerando el tipo de suelo Franco-Arcilloso y la humedad promedio del 72%.`,
  sensores: `**Estado de sensores IoT:**\n\n• **Nodo Norte-01** ✅ Óptimo\n  NDVI: 0.73 · Humedad: 72% · Temp: 28.4°C\n\n• **Nodo Sur-02** ⚠️ Alerta\n  NDVI: 0.61 · Humedad: 61% · Temp: 29.8°C\n\n• **Nodo Este-03** 🔴 Crítico\n  NDVI: 0.54 · Humedad: 55% · Temp: 31.2°C\n\nEl **Nodo Este-03** muestra estrés hídrico. Recomiendo revisar el sistema de riego en esa zona.`,
  default: 'Entiendo tu consulta. Para darte una respuesta precisa, necesito que me indiques sobre qué tema quieres información: análisis de suelo, recomendaciones de cultivo, estado de sensores o comparación de históricos.',
};

const AgroAsesor = () => {
  const { historial, resultado } = useAppStore();
  const [mensajes, setMensajes] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [accionesOpen, setAccionesOpen] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleAccion = useCallback((accionId) => {
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    let textoAccion = '';
    if (accionId === 'ultimo') textoAccion = 'Ver el último resultado de análisis';
    if (accionId === 'historial') textoAccion = 'Comparar mis análisis históricos';
    if (accionId === 'recomendar') textoAccion = 'Dame una recomendación de cultivo';
    if (accionId === 'sensores') textoAccion = '¿Cuál es el estado de los sensores?';

    setMensajes((p) => [...p, { rol: 'usuario', texto: textoAccion, hora }]);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const resp = RESPUESTAS[accionId] || RESPUESTAS.default;
      const horaResp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setMensajes((p) => [...p, { rol: 'ia', texto: resp, hora: horaResp }]);
    }, 1200);
  }, []);

  const enviar = useCallback(() => {
    if (!input.trim()) return;
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setMensajes((p) => [...p, { rol: 'usuario', texto: input, hora }]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const resp = RESPUESTAS.default;
      const horaResp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setMensajes((p) => [...p, { rol: 'ia', texto: resp, hora: horaResp }]);
    }, 1000);
  }, [input]);

  const ultimoResultado = useMemo(() => {
    const entries = historial.filter(h => h.tipo === 'suelo');
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }, [historial]);

  return (
    <ResearcherLayout activeTab="mapas">
      <div className="agro-asesor">
        {/* Header */}
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
              onClick={() => setAccionesOpen((p) => !p)}
            >
              <span>Acciones</span>
              <ChevronDown size={14} className={accionesOpen ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        {/* Acciones rápidas dropdown */}
        <AnimatePresence>
          {accionesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="agro-acciones-wrapper"
            >
              <div className="agro-acciones">
                {ACCIONES_RAPIDAS.map((acc) => (
                  <button
                    key={acc.id}
                    className="agro-accion-btn"
                    onClick={() => handleAccion(acc.id)}
                  >
                    {acc.icon}
                    <span>{acc.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="agro-chat">
          <div className="agro-messages">
            {mensajes.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`agro-msg agro-msg-${msg.rol} ${msg.rol === 'ia' ? 'agro-msg-ia' : 'agro-msg-user'}`}
              >
                {msg.rol === 'ia' && (
                  <div className="agro-msg-avatar">
                    <Bot size={14} />
                  </div>
                )}
                <div className="agro-msg-bubble">
                  <p
                    className="agro-msg-text"
                    dangerouslySetInnerHTML={{
                      __html: msg.texto
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/🥇|🥈|🥉|🌱|✅|⚠️|🔴/g, '<span class="agro-emoji">$&</span>')
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                  <span className="agro-msg-hora">{msg.hora}</span>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="agro-msg agro-msg-ia">
                <div className="agro-msg-avatar">
                  <Bot size={14} />
                </div>
                <div className="agro-msg-bubble agro-msg-loading">
                  <div className="agro-loading-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="agro-input-area">
          <div className="agro-input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar()}
              placeholder="Escribe tu pregunta al Agro-Asesor…"
              className="agro-input"
              disabled={loading}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || loading}
              className="agro-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="agro-input-hint">
            <span>💡</span> Puedes preguntar sobre tus análisis, recomendaciones de cultivo o estado de sensores.
          </p>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default AgroAsesor;