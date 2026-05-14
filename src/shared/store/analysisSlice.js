// shared/store/analysisSlice.js
export const createAnalysisSlice = (set) => ({
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
});
