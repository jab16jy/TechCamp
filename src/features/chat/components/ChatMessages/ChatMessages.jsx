import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

const ChatMessages = ({ mensajes, loading, endRef }) => {
  const internalRef = useRef(null);
  const chatEndRef = endRef || internalRef;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading]);

  return (
    <div className="agro-chat">
      <div className="agro-messages">
        {mensajes.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.rol === 'ia' ? -16 : 16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`agro-msg agro-msg-${msg.rol}`}
          >
            <div className={`agro-msg-avatar agro-avatar-${msg.rol}`}>
              {msg.rol === 'ia' ? <Bot size={14} strokeWidth={1.5} /> : <User size={14} strokeWidth={1.5} />}
            </div>
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
          <motion.div
            initial={{ opacity: 0, x: -16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="agro-msg agro-msg-ia"
          >
            <div className="agro-msg-avatar agro-avatar-ia">
              <Bot size={14} strokeWidth={1.5} />
            </div>
            <div className="agro-msg-bubble agro-msg-loading">
              <div className="agro-loading-dots">
                <span /><span /><span />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;