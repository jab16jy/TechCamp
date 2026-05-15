import { motion, AnimatePresence } from 'framer-motion';
import { ACCIONES_RAPIDAS } from '@features/chat/hooks/useChat';

const QuickActions = ({ accionesOpen, onAccion }) => {
  return (
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
                onClick={() => onAccion(acc.id)}
              >
                {acc.icon}
                <span>{acc.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickActions;
