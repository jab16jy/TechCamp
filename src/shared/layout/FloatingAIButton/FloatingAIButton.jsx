import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

const FloatingAIButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const show =
    location.pathname.startsWith('/investigador') &&
    location.pathname !== '/investigador/mapas' &&
    location.pathname !== '/investigador/login';

  if (!show) return null;

  return (
    <button
      onClick={() => navigate('/investigador/mapas')}
      className="fixed bottom-8 right-8 z-[9999] group flex items-center justify-center"
      aria-label="Abrir Agro-Asesor IA"
    >
      <span className="absolute inset-0 rounded-full bg-[#2D5A27]/15 animate-ping" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }} />
      <div className="relative bg-white/60 backdrop-blur-xl border border-white/30 text-[#2D5A27] p-3.5 rounded-full shadow-lg shadow-[#2D5A27]/10 transition-all duration-300 hover:bg-white/80 hover:scale-110 hover:shadow-xl hover:shadow-[#2D5A27]/15">
        <Bot size={22} strokeWidth={1.8} className="transition-transform group-hover:rotate-12" />
      </div>
      <span className="absolute right-full mr-3 bg-white/80 backdrop-blur-md border border-white/30 text-slate-700 text-[12px] font-semibold px-3 py-1.5 rounded-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-lg">
        Agro-Asesor IA
      </span>
    </button>
  );
};

export default FloatingAIButton;
