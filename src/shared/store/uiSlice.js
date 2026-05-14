// shared/store/uiSlice.js
export const createUISlice = (set) => ({
  toasts: [],

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
});
