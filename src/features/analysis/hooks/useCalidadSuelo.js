import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';
import AnalysisService from '@shared/services/analysisService';
import {
  getHistorial as fetchHistorial,
} from '@shared/services/api';

const DEFAULT_SOIL = {
  ph_suelo: '',
  nitrogeno: '',
  humedad_suelo: '',
  fosforo: '',
  potasio: '',
  materia_organica: '',
};

const getRecordCoords = (record) => {
  if (!record) return null;
  if (record.coordenadas?.lat != null && record.coordenadas?.lng != null) {
    return { lat: Number(record.coordenadas.lat), lng: Number(record.coordenadas.lng) };
  }
  if (record.lat != null && record.lng != null) {
    return { lat: Number(record.lat), lng: Number(record.lng) };
  }
  return null;
};

const formatRecordLabel = (record) => {
  if (!record) return '';
  const location = [record.municipio, record.departamento].filter(Boolean).join(', ') || 'Sin ubicación';
  const date = record.fecha
    ? new Date(record.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin fecha';
  const type = record.tipo === 'suelo' || record.tipo === 'advanced' ? 'Calidad suelo' : 'Análisis cultivo';
  return `${record.id} · ${location} · ${date} · ${type}`;
};

export function useCalidadSuelo() {
  const navigate = useNavigate();
  const {
    agregarAlHistorial,
    agregarToast,
    setResultado,
    setCargandoAnalisis,
    cargandoAnalisis,
    historial: storeHistorial,
  } = useAppStore();

  const [sueloParams, setSueloParams] = useState(DEFAULT_SOIL);
  const [selectedId, setSelectedId] = useState('');
  const [serverHistory, setServerHistory] = useState([]);

  useEffect(() => {
    fetchHistorial()
      .then((data) => {
        if (Array.isArray(data)) setServerHistory(data);
      })
      .catch(() => {});
  }, []);

  const allRecords = useMemo(() => {
    const seen = new Set();
    const merged = [];
    for (const item of serverHistory) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    for (const item of storeHistorial) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [serverHistory, storeHistorial]);

  const selectedRecord = useMemo(
    () => allRecords.find((r) => r.id === selectedId) || null,
    [allRecords, selectedId],
  );

  const selectedLabel = useMemo(
    () => formatRecordLabel(selectedRecord),
    [selectedRecord],
  );

  const loadSoilParams = (record) => {
    setSueloParams({
      ph_suelo:
        record.ph != null
          ? String(record.ph)
          : record.ph_suelo != null
            ? String(record.ph_suelo)
            : '',
      nitrogeno: record.nitrogeno != null ? String(record.nitrogeno) : '',
      humedad_suelo: record.humedad_suelo != null ? String(record.humedad_suelo) : '',
      fosforo: record.fosforo != null ? String(record.fosforo) : '',
      potasio: record.potasio != null ? String(record.potasio) : '',
      materia_organica: record.materia_organica != null ? String(record.materia_organica) : '',
    });
  };

  const handleRecordSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (!id) {
      setSueloParams(DEFAULT_SOIL);
      return;
    }
    const record = allRecords.find((r) => r.id === id);
    if (record) {
      loadSoilParams(record);
      agregarToast(`Registro ${record.id} cargado para análisis de suelo`, 'info');
    }
  };

  const handleParamChange = (field, value) => {
    setSueloParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ph_suelo, nitrogeno, humedad_suelo } = sueloParams;

    if (!ph_suelo.trim() || !nitrogeno.trim() || !humedad_suelo.trim()) {
      agregarToast('Completa pH, Nitrógeno y Humedad del Suelo antes de analizar', 'error');
      return;
    }

    const coords = selectedRecord ? getRecordCoords(selectedRecord) : null;
    const municipio = selectedRecord?.municipio || '';
    const departamento = selectedRecord?.departamento || '';
    const area = selectedRecord?.area_hectareas != null ? Number(selectedRecord.area_hectareas) : 1;

    setCargandoAnalisis(true);
    try {
      const payload = {
        lat: coords?.lat || 10.5,
        lng: coords?.lng || -74.8,
        departamento,
        municipio,
        tipo_suelo: selectedRecord?.tipo_suelo || selectedRecord?.textura_suelo || 'Franco',
        area_hectareas: area,
        ph_suelo: Number(ph_suelo),
        materia_organica: sueloParams.materia_organica ? Number(sueloParams.materia_organica) : null,
        nitrogeno: Number(nitrogeno),
        fosforo: sueloParams.fosforo ? Number(sueloParams.fosforo) : null,
        potasio: sueloParams.potasio ? Number(sueloParams.potasio) : null,
        humedad: Number(humedad_suelo),
        humedad_suelo: Number(humedad_suelo),
      };

      const resultado = await AnalysisService.performAnalysis(payload);
      setResultado(resultado);

      agregarAlHistorial({
        tipo: 'suelo',
        municipio,
        departamento,
        lat: coords?.lat || 10.5,
        lng: coords?.lng || -74.8,
        area_hectareas: String(area),
        ph: Number(ph_suelo),
        nitrogeno: Number(nitrogeno),
        humedad_suelo: Number(humedad_suelo),
        fosforo: sueloParams.fosforo ? Number(sueloParams.fosforo) : null,
        potasio: sueloParams.potasio ? Number(sueloParams.potasio) : null,
        materia_organica: sueloParams.materia_organica ? Number(sueloParams.materia_organica) : null,
        textura_suelo: selectedRecord?.textura_suelo || '',
        calidad_suelo: resultado?.indicadores_satelite?.calidad_suelo || null,
        ndvi: resultado?.indicadores_satelite?.ndvi || null,
      });

      agregarToast('Análisis de suelo completado exitosamente', 'exito');
      navigate('/investigador/resultado-avanzado');
    } catch {
      agregarToast('Error al procesar el análisis de suelo. Inténtalo de nuevo.', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return {
    allRecords,
    selectedId,
    selectedRecord,
    selectedLabel,
    sueloParams,
    cargandoAnalisis,
    handleRecordSelect,
    handleParamChange,
    handleSubmit,
    navigate,
  };
}
