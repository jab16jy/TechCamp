import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';
import AnalysisService from '@shared/services/analysisService';
import {
  getClosestMunicipality,
  getHistorial as fetchHistorial,
  getSoilData,
  MUNICIPIOS_CLIMA_MAP,
  MUNICIPIOS_SUELO_MAP,
} from '@shared/services/api';

const DEFAULT_SOIL = {
  ph_suelo: '',
  nitrogeno: '',
  humedad_suelo: '',
  fosforo: '',
  potasio: '',
  materia_organica: '',
  textura_suelo: '',
  tipo_suelo: '',
  fuente_suelo: '',
};

const getRecordCoords = (record) => {
  if (!record) return null;
  if (record.coordenadas?.lat != null && record.coordenadas?.lng != null) {
    return {
      lat: Number(record.coordenadas.lat),
      lng: Number(record.coordenadas.lng),
    };
  }
  if (record.lat != null && record.lng != null) {
    return { lat: Number(record.lat), lng: Number(record.lng) };
  }
  return null;
};

const formatRecordLabel = (record) => {
  if (!record) return '';
  const location =
    [record.municipio, record.departamento].filter(Boolean).join(', ') ||
    'Sin ubicacion';
  const date = record.fecha
    ? new Date(record.fecha).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Sin fecha';
  const type =
    record.tipo === 'suelo' || record.tipo === 'advanced'
      ? 'Calidad suelo'
      : 'Analisis cultivo';
  return `${record.id} · ${location} · ${date} · ${type}`;
};

const buildSoilSnapshot = (record, municipality, soilData, humidityFallback) => {
  const fallbackSoil = MUNICIPIOS_SUELO_MAP[municipality] || {};
  const mergedSoil = { ...fallbackSoil, ...(soilData || {}) };

  return {
    ph_suelo:
      record?.ph != null
        ? String(record.ph)
        : record?.ph_suelo != null
          ? String(record.ph_suelo)
          : mergedSoil.ph != null
            ? String(mergedSoil.ph)
            : '',
    nitrogeno: record?.nitrogeno != null ? String(record.nitrogeno) : '',
    humedad_suelo:
      record?.humedad_suelo != null
        ? String(record.humedad_suelo)
        : humidityFallback != null
          ? String(humidityFallback)
          : '',
    fosforo: record?.fosforo != null ? String(record.fosforo) : '',
    potasio: record?.potasio != null ? String(record.potasio) : '',
    materia_organica:
      record?.materia_organica != null
        ? String(record.materia_organica)
        : mergedSoil.materia_organica != null
          ? String(mergedSoil.materia_organica)
          : '',
    textura_suelo:
      record?.textura_suelo ||
      record?.tipo_suelo ||
      mergedSoil.textura_suelo ||
      '',
    tipo_suelo:
      record?.tipo_suelo ||
      record?.textura_suelo ||
      mergedSoil.textura_suelo ||
      '',
    fuente_suelo: mergedSoil.fuente || '',
  };
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
    () => allRecords.find((record) => record.id === selectedId) || null,
    [allRecords, selectedId],
  );

  const selectedCoords = useMemo(
    () => getRecordCoords(selectedRecord),
    [selectedRecord],
  );

  const selectedMunicipio = useMemo(() => {
    if (selectedRecord?.municipio) return selectedRecord.municipio;
    if (selectedCoords) {
      return getClosestMunicipality(selectedCoords.lat, selectedCoords.lng);
    }
    return '';
  }, [selectedCoords, selectedRecord]);

  const selectedLabel = useMemo(
    () => formatRecordLabel(selectedRecord),
    [selectedRecord],
  );

  const handleRecordSelect = async (e) => {
    const id = e.target.value;
    setSelectedId(id);

    if (!id) {
      setSueloParams(DEFAULT_SOIL);
      return;
    }

    const record = allRecords.find((item) => item.id === id);
    if (!record) return;

    const coords = getRecordCoords(record);
    const municipio =
      record.municipio ||
      (coords ? getClosestMunicipality(coords.lat, coords.lng) : '');
    const climaMunicipio = MUNICIPIOS_CLIMA_MAP[municipio] || {};

    let soilData = null;
    if (coords) {
      try {
        soilData = await getSoilData(coords.lat, coords.lng);
      } catch {
        soilData = null;
      }
    }

    setSueloParams(
      buildSoilSnapshot(record, municipio, soilData, climaMunicipio.humedad),
    );
    agregarToast(`Registro ${record.id} cargado para analisis de suelo`, 'info');
  };

  const handleParamChange = (field, value) => {
    setSueloParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ph_suelo, nitrogeno, humedad_suelo } = sueloParams;

    if (!ph_suelo.trim() || !nitrogeno.trim() || !humedad_suelo.trim()) {
      agregarToast('Completa pH, Nitrogeno y Humedad del Suelo antes de analizar', 'error');
      return;
    }

    const municipio = selectedRecord?.municipio || selectedMunicipio || '';
    const departamento = selectedRecord?.departamento || '';
    const area =
      selectedRecord?.area_hectareas != null
        ? Number(selectedRecord.area_hectareas)
        : 1;

    setCargandoAnalisis(true);
    try {
      const payload = {
        lat: selectedCoords?.lat || 10.5,
        lng: selectedCoords?.lng || -74.8,
        departamento,
        municipio,
        tipo_suelo:
          sueloParams.tipo_suelo ||
          sueloParams.textura_suelo ||
          selectedRecord?.tipo_suelo ||
          selectedRecord?.textura_suelo ||
          'Franco',
        area_hectareas: area,
        ph_suelo: Number(ph_suelo),
        materia_organica: sueloParams.materia_organica
          ? Number(sueloParams.materia_organica)
          : null,
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
        lat: selectedCoords?.lat || 10.5,
        lng: selectedCoords?.lng || -74.8,
        area_hectareas: String(area),
        ph: Number(ph_suelo),
        nitrogeno: Number(nitrogeno),
        humedad_suelo: Number(humedad_suelo),
        fosforo: sueloParams.fosforo ? Number(sueloParams.fosforo) : null,
        potasio: sueloParams.potasio ? Number(sueloParams.potasio) : null,
        materia_organica: sueloParams.materia_organica
          ? Number(sueloParams.materia_organica)
          : null,
        textura_suelo: sueloParams.textura_suelo || '',
        tipo_suelo: sueloParams.tipo_suelo || '',
        calidad_suelo: resultado?.indicadores_satelite?.calidad_suelo || null,
        ndvi: resultado?.indicadores_satelite?.ndvi || null,
      });

      agregarToast('Analisis de suelo completado exitosamente', 'exito');
      navigate('/investigador/resultado-avanzado');
    } catch {
      agregarToast('Error al procesar el analisis de suelo. Intentalo de nuevo.', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return {
    allRecords,
    selectedId,
    selectedRecord,
    selectedCoords,
    selectedMunicipio,
    selectedLabel,
    sueloParams,
    cargandoAnalisis,
    handleRecordSelect,
    handleParamChange,
    handleSubmit,
    navigate,
  };
}
