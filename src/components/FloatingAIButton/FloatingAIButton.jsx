import React from 'react';
import { useNavigate } from 'react-router-dom';

const FloatingAIButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/dashboard')}
      className="fixed bottom-8 right-8 z-[9999] bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Ir al Agro-Asesor"
    >
      <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">
        smart_toy
      </span>
      <span className="absolute right-full mr-4 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Agro-Asesor IA
      </span>
    </button>
  );
};

export default FloatingAIButton;
