import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
      className="fixed bottom-8 right-8 z-[9999] bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-4 rounded-full shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Abrir Agro-Asesor IA"
    >
      <span className="material-symbols-outlined text-[26px] group-hover:rotate-12 transition-transform">smart_toy</span>
      <span className="absolute right-full mr-4 bg-slate-900 text-white text-[12px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
        Agro-Asesor IA
      </span>
    </button>
  );
};

export default FloatingAIButton;
