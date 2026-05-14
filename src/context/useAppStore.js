// ============================================
// Context global — AgroCaribe AI
// Maneja el estado compartido entre páginas
// usando Zustand (más limpio que Context API para este caso)
// ============================================

import { create } from 'zustand';

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
  const prefix = tipo === 'suelo' ? 'S' : 'C';
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${num}`;
};

const useAppStore = create((set, get) => ({
  // ── Estado del formulario de consulta ──
  formulario: {
    departamento: '',
    municipio: '',
    lat: 10.5,
    lng: -74.8,
    tipo_suelo: '',
    acceso_riego: false,
    mes_siembra: '',
    area_hectareas: '',
    ph_suelo: '',
    textura_suelo: '',
    materia_organica: '',
  },

  // ── Resultados del análisis ──
  resultado: null,
  cargandoAnalisis: false,
  errorAnalisis: null,

  // ── Toast notifications ──
  toasts: [],

  // ── Historial ──
  historial: loadHistorial(),

  // ── Acciones del formulario ──
  actualizarFormulario: (campos) =>
    set((state) => ({
      formulario: { ...state.formulario, ...campos },
    })),

  resetearFormulario: () =>
    set({
      formulario: {
        departamento: '',
        municipio: '',
        lat: 10.5,
        lng: -74.8,
        tipo_suelo: '',
        acceso_riego: false,
        mes_siembra: '',
        area_hectareas: '',
        ph_suelo: '',
        textura_suelo: '',
        materia_organica: '',
      },
    }),

  // ── Acciones de resultados ──
  setResultado: (resultado) => set({ resultado, errorAnalisis: null }),
  setCargandoAnalisis: (valor) => set({ cargandoAnalisis: valor }),
  setErrorAnalisis: (error) => set({ errorAnalisis: error, cargandoAnalisis: false }),
  resetearResultado: () => set({ resultado: null, errorAnalisis: null }),

  // ── Sistema de toasts ──
  agregarToast: (mensaje, tipo = 'info') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, mensaje, tipo }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  eliminarToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // ── Historial ──
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
}));

export default useAppStore;
