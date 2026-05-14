import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

const FloatingAIButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on researcher pages (except the map page itself)
  const show =
    location.pathname.startsWith('/investigador') &&
    location.pathname !== '/investigador/mapas' &&
    location.pathname !== '/investigador/login';

  if (!show) return null;

  return (
    <button
      onClick={() => navigate('/investigador/mapas')}
      className="fixed bottom-8 right-8 z-[9999] bg-[#0f5238] hover:bg-[#1a6b4a] text-white p-4 rounded-full shadow-xl shadow-[#0f5238]/20 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Abrir Agro-Asesor IA"
    >
      <Bot size={26} className="group-hover:rotate-12 transition-transform" />
      <span className="absolute right-full mr-4 bg-slate-900 text-white text-[12px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
        Agro-Asesor IA
      </span>
    </button>
  );
};

export default FloatingAIButton;
