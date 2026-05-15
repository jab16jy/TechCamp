import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';

export const TYPE_META = {
  analisis: { label: 'Análisis Cultivo', color: '#2d6a4f', bgColor: 'rgba(45,106,79,0.08)' },
  suelo: { label: 'Calidad Suelo', color: '#75584d', bgColor: 'rgba(117,88,77,0.08)' },
};

export const ESTADO_COLORS = {
  Exitosa: { bg: 'rgba(0,109,72,0.1)', color: '#006d48' },
  Pendiente: { bg: 'rgba(234,179,8,0.1)', color: '#ca8a04' },
  Error: { bg: 'rgba(186,26,26,0.1)', color: '#ba1a1a' },
};

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function useHistorial() {
  const navigate = useNavigate();
  const historial = useAppStore((s) => s.historial);
  const limpiarHistorial = useAppStore((s) => s.limpiarHistorial);

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');

  const filtered = useMemo(() => {
    return historial.filter((item) => {
      const matchSearch =
        !search ||
        item.id?.toLowerCase().includes(search.toLowerCase()) ||
        item.municipio?.toLowerCase().includes(search.toLowerCase()) ||
        item.cultivo?.toLowerCase().includes(search.toLowerCase()) ||
        item.cultivo_top?.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filterTipo === 'all' || item.tipo === filterTipo;
      const matchEstado = filterEstado === 'all' || item.estado === filterEstado;
      return matchSearch && matchTipo && matchEstado;
    });
  }, [historial, search, filterTipo, filterEstado]);

  const stats = useMemo(() => ({
    total: historial.length,
    analisis: historial.filter((h) => h.tipo === 'analisis').length,
    suelo: historial.filter((h) => h.tipo === 'suelo').length,
  }), [historial]);

  const handleView = useCallback((item) => {
    if (item.tipo === 'suelo') {
      navigate('/investigador/resultado-avanzado');
    } else {
      navigate('/resultado');
    }
  }, [navigate]);

  const handleDelete = useCallback((id) => {
    const updated = historial.filter((h) => h.id !== id);
    try {
      localStorage.setItem('agrocaribe_historial', JSON.stringify(updated));
      useAppStore.setState({ historial: updated });
    } catch { /* ignore */ }
  }, [historial]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('¿Eliminar todo el historial?')) {
      limpiarHistorial();
    }
  }, [limpiarHistorial]);

  const clearSearch = useCallback(() => setSearch(''), []);

  return {
    // Estado
    search,
    setSearch,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    // Datos
    historial,
    filtered,
    stats,
    // Handlers
    handleView,
    handleDelete,
    handleClearAll,
    clearSearch,
    navigate,
  };
}
