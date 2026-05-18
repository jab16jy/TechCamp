import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@shared/store';
import { apiClient } from '@shared/services/api';

const STORAGE_KEYS = {
  finca: 'agrocaribe_finca',
  apiUrl: 'agrocaribe_api_url',
};

const DEFAULTS = {
  finca: { lat: 10.5, lng: -74.8, nombre: 'Mi Finca' },
  apiUrl: 'http://localhost:8000',
};

export function getSetting(key) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

export function setSetting(key, value) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
}

export default function useSettings() {
  const { agregarToast } = useAppStore();
  const [finca, setFinca] = useState(() => getSetting('finca'));
  const [apiUrl, setApiUrl] = useState(() => getSetting('apiUrl'));
  const [backendStatus, setBackendStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const saveFinca = useCallback((data) => {
    const updated = { ...finca, ...data };
    setFinca(updated);
    setSetting('finca', updated);
    agregarToast('Coordenadas de la finca guardadas', 'exito');
  }, [finca, agregarToast]);

  const saveApiUrl = useCallback((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    setApiUrl(trimmed);
    setSetting('apiUrl', trimmed);
    window.location.reload();
  }, [agregarToast]);

  const testBackend = useCallback(async () => {
    setTesting(true);
    try {
      const resp = await fetch(`${apiUrl}/health`);
      const data = await resp.json();
      setBackendStatus({ ok: true, version: data.version, status: resp.status });
      agregarToast(`Backend conectado: v${data.version}`, 'exito');
    } catch {
      setBackendStatus({ ok: false, error: 'No se pudo conectar' });
      agregarToast('Backend no disponible', 'error');
    } finally {
      setTesting(false);
    }
  }, [apiUrl, agregarToast]);

  const exportData = useCallback(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('agrocaribe_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrocaribe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    agregarToast('Datos exportados correctamente', 'exito');
  }, [agregarToast]);

  const importData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let count = 0;
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('agrocaribe_')) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            count++;
          }
        });
        agregarToast(`${count} claves importadas. Recargando...`, 'exito');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        agregarToast('Archivo JSON invalido', 'error');
      }
    };
    reader.readAsText(file);
  }, [agregarToast]);

  const clearCache = useCallback(() => {
    if (window.confirm('Esto eliminara todo el historial, configuracion y datos locales. ¿Continuar?')) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('agrocaribe_')) keys.push(key);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      agregarToast('Cache limpiado. Recargando...', 'info');
      setTimeout(() => window.location.reload(), 800);
    }
  }, [agregarToast]);

  return {
    finca, setFinca, saveFinca,
    apiUrl, setApiUrl, saveApiUrl,
    backendStatus, testing, testBackend,
    exportData, importData, clearCache,
  };
}
