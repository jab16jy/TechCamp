// shared/store/historySlice.js

// ── Persistencia en localStorage ──
const loadHistorial = () => {
  try {
    const stored = localStorage.getItem('agrocaribe_historial');
    if (!stored) return [];
    const historial = JSON.parse(stored);
    return historial.map((entry) => {
      if (entry.tipo === 'simple') return { ...entry, tipo: 'analisis' };
      if (entry.tipo === 'advanced') return { ...entry, tipo: 'suelo' };
      return entry;
    });
  } catch {
    return [];
  }
};

const saveHistorial = (historial) => {
  try {
    localStorage.setItem('agrocaribe_historial', JSON.stringify(historial));
  } catch { /* ignore */ }
};

// ── Generador de IDs ──
const generateId = (tipo) => {
  const prefix = tipo === 'suelo' ? 'S' : tipo === 'prediccion' ? 'P' : 'C';
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${num}`;
};

export const createHistorySlice = (set) => ({
  historial: loadHistorial(),

  agregarAlHistorial: (registro) => {
    const nuevo = {
      id: generateId(registro.tipo),
      fecha: new Date().toISOString(),
      municipio: registro.municipio || '',
      departamento: registro.departamento || '',
      coordenadas: { lat: registro.lat || 0, lng: registro.lng || 0 },
      tipo: registro.tipo,
      estado: 'Exitosa',
      ...registro,
    };
    set((state) => {
      const updated = [nuevo, ...state.historial];
      saveHistorial(updated);
      return { historial: updated };
    });
  },

  limpiarHistorial: () => {
    saveHistorial([]);
    set({ historial: [] });
  },
});
