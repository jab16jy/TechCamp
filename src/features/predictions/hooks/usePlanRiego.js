import { useState, useCallback } from 'react';
import useAppStore from '@shared/store';
import {
  generarPlanRiego,
  exportarPlanATareas,
} from '@shared/services/api';

/**
 * usePlanRiego — Generación de plan de riego optimizado.
 *
 * POST /sensors/{id}/plan → generarPlanRiego()
 * POST /tasks → exportarPlanATareas()
 * Preview toggle, plan history (last 10), clear.
 *
 * @returns {{ plan, generandoPlan, previewActive, historialPlanes,
 *            generarPlan, togglePreview, exportarPlan, clearPlan }}
 */
export default function usePlanRiego() {
  const { agregarToast, agregarTareaDesdePlan } = useAppStore();

  const [plan, setPlan] = useState(null);
  const [generandoPlan, setGenerandoPlan] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [historialPlanes, setHistorialPlanes] = useState([]);

  // ── Generate irrigation plan ──
  const generarPlan = useCallback(async (sensorId, cultivo = null) => {
    if (!sensorId) {
      agregarToast('Selecciona un sensor primero', 'advertencia');
      return null;
    }

    setGenerandoPlan(true);
    try {
      const result = await generarPlanRiego(sensorId, null, cultivo);
      if (result) {
        setPlan(result);
        setHistorialPlanes((prev) => [result, ...prev].slice(0, 10));
        agregarToast('Plan de riego generado con éxito', 'exito');
        return result;
      }
      agregarToast('No se pudo generar el plan de riego', 'error');
    } catch {
      agregarToast('Error al generar el plan de riego', 'error');
    } finally {
      setGenerandoPlan(false);
    }

    return null;
  }, [agregarToast]);

  // ── Toggle preview mode ──
  const togglePreview = useCallback(() => {
    setPreviewActive((prev) => !prev);
  }, []);

  // ── Export plan to tasks ──
  const exportarPlan = useCallback(async () => {
    if (!plan) {
      agregarToast('No hay plan para exportar', 'advertencia');
      return null;
    }

    try {
      const tarea = await exportarPlanATareas(plan);
      if (tarea) {
        agregarTareaDesdePlan({
          ...plan,
          task_id: tarea.task_id,
          titulo: tarea.titulo,
        });
        agregarToast('Plan exportado a tareas exitosamente', 'exito');
        return tarea;
      }
      agregarToast('Error al exportar plan a tareas', 'error');
    } catch {
      agregarToast('Error al exportar plan a tareas', 'error');
    }

    return null;
  }, [plan, agregarTareaDesdePlan, agregarToast]);

  // ── Clear plan ──
  const clearPlan = useCallback(() => {
    setPlan(null);
    setPreviewActive(false);
  }, []);

  return {
    plan,
    generandoPlan,
    previewActive,
    historialPlanes,
    generarPlan,
    togglePreview,
    exportarPlan,
    clearPlan,
  };
}
