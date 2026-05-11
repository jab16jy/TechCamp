// ============================================
// Context global — AgroCaribe AI
// Maneja el estado compartido entre páginas
// usando Zustand (más limpio que Context API para este caso)
// ============================================

import { create } from 'zustand';

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
    // Auto-eliminar después de 4 segundos
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
}));

export default useAppStore;
