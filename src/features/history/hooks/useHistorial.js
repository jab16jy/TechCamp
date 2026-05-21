import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';
import { getHistorial as fetchHistorial, deleteHistory as apiDeleteHistory } from '@shared/services/api';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export default function useHistorial() {
  const navigate = useNavigate();
  const historial = useAppStore((s) => s.historial);

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState([]);
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchHistorial()
      .then((data) => {
        if (Array.isArray(data)) setServerData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const combined = useMemo(() => {
    const seen = new Set();
    const all = [];
    for (const item of serverData) {
      if (!seen.has(item.id)) { seen.add(item.id); all.push(item); }
    }
    for (const item of historial) {
      if (!seen.has(item.id)) { seen.add(item.id); all.push(item); }
    }
    return all.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [serverData, historial]);

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase().trim();
    return combined.filter((item) => {
      if (q) {
        const haystack = [
          item.id,
          item.municipio,
          item.departamento,
          item.cultivo,
          item.cultivo_top,
          item.mejor_mes,
          item.mejor_cultivo,
        ]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterTipo !== 'all' && item.tipo !== filterTipo) return false;
      return true;
    });
  }, [combined, debounced, filterTipo]);

  const stats = useMemo(() => ({
    total: combined.length,
    analisis: combined.filter((h) => h.tipo === 'simple' || h.tipo === 'analisis').length,
    prediccion: combined.filter((h) => h.tipo === 'prediccion').length,
    suelo: combined.filter((h) => h.tipo === 'advanced' || h.tipo === 'suelo').length,
  }), [combined]);

  const handleView = useCallback((item) => {
    if (item.coordenadas) {
      useAppStore.setState({
        formulario: {
          ...useAppStore.getState().formulario,
          lat: item.coordenadas.lat,
          lng: item.coordenadas.lng,
        }
      });
    }
    if (item.tipo === 'prediccion') {
      navigate('/investigador/ia');
    } else if (item.tipo === 'advanced' || item.tipo === 'suelo') {
      navigate('/investigador/resultado-avanzado');
    } else {
      navigate('/resultado');
    }
  }, [navigate]);

  const handleDelete = useCallback((id) => {
    apiDeleteHistory(id);
    const updated = combined.filter((h) => h.id !== id);
    setServerData((p) => p.filter((h) => h.id !== id));
    try {
      localStorage.setItem('agrocaribe_historial', JSON.stringify(updated));
      useAppStore.setState({ historial: updated });
      useAppStore.getState().agregarToast('Registro eliminado del historial', 'success');
    } catch {
      useAppStore.getState().agregarToast('Error al eliminar el registro', 'error');
    }
  }, [combined]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Eliminar todo el historial? Esta accion no se puede deshacer.')) {
      setServerData([]);
      useAppStore.getState().limpiarHistorial();
    }
  }, []);

  const clearSearch = useCallback(() => setSearch(''), []);

  return {
    search, setSearch,
    filterTipo, setFilterTipo,
    loading,
    historial: combined,
    filtered,
    stats,
    handleView,
    handleDelete,
    handleClearAll,
    clearSearch,
    navigate,
  };
}
