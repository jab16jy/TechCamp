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
      fecha: new Date().toISOString(),
      municipio: registro.municipio || '',
      departamento: registro.departamento || '',
      coordenadas: { lat: registro.lat || 0, lng: registro.lng || 0 },
      tipo: registro.tipo,
      estado: 'Exitosa',
      ...registro,
      // Use real ID if provided, otherwise generate synthetic one
      id: registro.id || generateId(registro.tipo),
    };
    set((state) => {
      const updated = [nuevo, ...state.historial];
      saveHistorial(updated);
      return { historial: updated };
    });
  },

  agregarTareaDesdePlan: (plan) => {
    const tarea = {
      id: `T-${Date.now()}`,
      tipo: 'plan_riego',
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      titulo: plan.titulo || `Riego ${plan.cultivo} — ${plan.sensor_nodo || plan.sensor_id}`,
      descripcion: plan.justificacion_xai || '',
      prioridad: 'alta',
      plan_id: plan.plan_id,
      task_id: plan.task_id,
      is_critical: true,
      cultivo: plan.cultivo,
      volumen_total_m3_ha: plan.volumen_total_m3_ha,
      coordenadas: plan.coordenadas || null,
    };
    set((state) => {
      const updated = [tarea, ...state.historial];
      saveHistorial(updated);
      return { historial: updated };
    });
  },

  agregarAlertaClimatica: (alerta) => {
    const tarea = {
      id: `AC-${Date.now()}`,
      tipo: 'riesgo_climatico',
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      titulo: (alerta.mensaje || '').slice(0, 60),
      descripcion: alerta.mensaje || '',
      prioridad: alerta.severidad === 'critico' ? 'alta' : 'media',
      severidad: alerta.severidad || 'moderado',
      mes_afectado: alerta.mes || null,
      cultivo_afectado: alerta.cultivo_afectado || null,
      is_critical: alerta.severidad === 'critico',
      tipo_alerta: alerta.tipo || 'general',
      accion_recomendada: alerta.accion || '',
    };
    set((state) => {
      const updated = [tarea, ...state.historial];
      saveHistorial(updated);
      return { historial: updated };
    });
  },

  limpiarHistorial: () => {
    saveHistorial([]);
    set({ historial: [] });
  },
});
