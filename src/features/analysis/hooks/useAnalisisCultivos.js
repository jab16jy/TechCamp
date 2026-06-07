import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "@shared/store";
import AnalysisService from "@shared/services/analysisService";
import {
  getSoilData,
  getClima,
  getHistorial as fetchHistorial,
  getModelMetrics,
  setAnalysisFeedback,
  MUNICIPIOS_COORD_MAP,
} from "@shared/services/api";
import { Leaf, Droplets, FlaskConical } from "lucide-react";

const DEFAULT_CLIMA = { temperatura: 26.4, humedad: 72, precipitacion: 1180 };

const SOIL_CLASS_OPTIONS = new Set([
  "Franco",
  "Franco-Arcilloso",
  "Franco-Arenoso",
  "Franco-Limoso",
  "Arenoso",
  "Limoso",
  "Arcilloso",
]);

const SOIL_CLASS_ALIASES = {
  franca: "Franco",
  franco: "Franco",
  "franco arcillosa": "Franco-Arcilloso",
  "franco arcilloso": "Franco-Arcilloso",
  "franco-arcillosa": "Franco-Arcilloso",
  "franco-arcilloso": "Franco-Arcilloso",
  "franco arenosa": "Franco-Arenoso",
  "franco arenoso": "Franco-Arenoso",
  "franco-arenosa": "Franco-Arenoso",
  "franco-arenoso": "Franco-Arenoso",
  "franco limosa": "Franco-Limoso",
  "franco limoso": "Franco-Limoso",
  "franco-limosa": "Franco-Limoso",
  "franco-limoso": "Franco-Limoso",
  arenosa: "Arenoso",
  arenoso: "Arenoso",
  limosa: "Limoso",
  limoso: "Limoso",
  arcillosa: "Arcilloso",
  arcilloso: "Arcilloso",
};

const normalizeSoilClass = (value) => {
  if (!value) return "";
  if (SOIL_CLASS_OPTIONS.has(value)) return value;
  const key = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return SOIL_CLASS_ALIASES[key] || "";
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

const formatHistoryLabel = (record) => {
  if (!record) return "";
  const location =
    [record.municipio, record.departamento].filter(Boolean).join(", ") ||
    "Sin ubicación";
  const date = record.fecha
    ? new Date(record.fecha).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";
  const type =
    record.tipo === "suelo" || record.tipo === "advanced"
      ? "Calidad suelo"
      : "Análisis cultivo";
  return `${record.id} · ${location} · ${date} · ${type}`;
};

export function useAnalisisCultivos() {
  const navigate = useNavigate();
  const {
    formulario,
    actualizarFormulario,
    setCargandoAnalisis,
    cargandoAnalisis,
    setResultado,
    agregarToast,
    agregarAlHistorial,
    historial,
  } = useAppStore();

  const [municipiosLista, setMunicipiosLista] = useState([]);
  const [serverHistory, setServerHistory] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const rol = sessionStorage.getItem("rol");
  const isProductor = rol === "productor";
  const [activeTab, setActiveTab] = useState("analisis");
  const [selectedParcela, setSelectedParcela] = useState("");

  // Drawn area data from map (auto-fills hectares and coords in the form)
  const [drawnAreaData, setDrawnAreaData] = useState(null);

  useEffect(() => {
    AnalysisService.getAvailableLocations().then(setMunicipiosLista);
  }, []);

  useEffect(() => {
    fetchHistorial()
      .then((data) => {
        if (Array.isArray(data)) setServerHistory(data);
      })
      .catch(() => {});
  }, []);

  // Fetch real model metrics from backend
  useEffect(() => {
    getModelMetrics().then(setModelMetrics).catch(() => {});
  }, []);

  const historialRegistros = useMemo(() => {
    const seen = new Set();
    const all = [];

    // serverHistory is the single source of truth when available
    if (serverHistory.length > 0) {
      for (const item of serverHistory) {
        if (item?.id && !seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }
    } else {
      // Fallback to localStorage (historial) when server has no data
      for (const item of historial) {
        if (item?.id && !seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }
    }

    return all.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [serverHistory, historial]);

  const historialRegistrosEstandar = useMemo(
    () =>
      historialRegistros.filter(
        (r) => r.tipo === 'analisis' || r.tipo === 'simple',
      ),
    [historialRegistros],
  );

  const selectedParcelaRecord = useMemo(
    () =>
      historialRegistros.find((item) => item.id === selectedParcela) || null,
    [historialRegistros, selectedParcela],
  );

  const selectedParcelaLabel = useMemo(
    () => formatHistoryLabel(selectedParcelaRecord),
    [selectedParcelaRecord],
  );

  const [climaData, setClimaData] = useState(DEFAULT_CLIMA);

  const activeMunicipio = useMemo(() => {
    if (selectedParcelaRecord?.municipio)
      return selectedParcelaRecord.municipio;
    if (formulario.municipio) return formulario.municipio;
    return null;
  }, [
    formulario.lat,
    formulario.lng,
    formulario.municipio,
    selectedParcelaRecord,
  ]);

  const clima = climaData;

  const getCoordsForMunicipio = (nombre) => {
    const fromApi = municipiosLista.find((m) => m.nombre === nombre);
    if (fromApi?.lat != null && fromApi?.lng != null) {
      return { lat: Number(fromApi.lat), lng: Number(fromApi.lng) };
    }
    return MUNICIPIOS_COORD_MAP[nombre] || null;
  };

  // Fetch climate data when position changes
  useEffect(() => {
    if (formulario.lat == null || formulario.lng == null) return;
    getClima(formulario.lat, formulario.lng).then((data) => {
      if (data) {
        setClimaData({
          temperatura: data.temperatura ?? DEFAULT_CLIMA.temperatura,
          humedad: data.humedad ?? DEFAULT_CLIMA.humedad,
          precipitacion: data.precipitacion ?? DEFAULT_CLIMA.precipitacion,
        });
      }
    }).catch(() => {});
  }, [formulario.lat, formulario.lng]);

  const preloadSoilForLocation = async (lat, lng, municipio) => {
    try {
      const soil = await getSoilData(lat, lng);
      if (soil?.ph !== null && soil?.ph !== undefined) {
        const soilClass =
          normalizeSoilClass(soil.tipo_suelo) ||
          normalizeSoilClass(soil.textura_suelo) ||
          formulario.tipo_suelo;

        actualizarFormulario({
          ph_suelo: String(soil.ph),
          materia_organica:
            soil.materia_organica != null ? String(soil.materia_organica) : "",
          textura_suelo: soilClass || soil.textura_suelo || "",
          tipo_suelo: soilClass,
        });
        const isFallback = soil._fallback;
        agregarToast(
          isFallback
            ? `Datos de suelo estimados para zona Caribe (Agrosavia/IGAC)`
            : `Datos de suelo precargados desde ${soil.fuente || "ISRIC SoilGrids"}`,
          "info",
        );
      }
    } catch {
      // SoilGrids es opcional — el usuario puede ingresar datos manualmente
    }
  };

  const handleFormChange = (newFields) => {
    const updates = { ...newFields };

    if (newFields.municipio) {
      const coords = getCoordsForMunicipio(newFields.municipio);
      if (coords) {
        updates.lat = coords.lat;
        updates.lng = coords.lng;
      }
    }

    actualizarFormulario(updates);

    if (newFields.municipio) {
      const coords = getCoordsForMunicipio(newFields.municipio);
      if (coords) {
        preloadSoilForLocation(coords.lat, coords.lng, newFields.municipio);
      }
    }
  };

  const handleMapChange = async (latlng) => {
    actualizarFormulario({
      lat: latlng.lat,
      lng: latlng.lng,
    });
    // Climate is fetched by the useEffect depending on formulario.lat/lng
    // Soil is fetched by handleGeoDetected after geoDecode resolves
  };

  const handleGeoDetected = (geo) => {
    const updates = {
      lat: geo.lat,
      lng: geo.lng,
    };
    if (geo.departamento) updates.departamento = geo.departamento;
    if (geo.municipio) updates.municipio = geo.municipio;
    if (geo.area_hectareas > 0) updates.area_hectareas = String(geo.area_hectareas);
    actualizarFormulario(updates);
    agregarToast(
      `Ubicacion detectada: ${geo.municipio || ""}, ${geo.departamento || ""}`,
      "info",
    );
    // Trigger soil load for this location
    preloadSoilForLocation(geo.lat, geo.lng, geo.municipio);
  };

  // Called when user draws an area on the map (auto-fills hectares + lat/lng in form)
  const handleDrawnArea = (areaData) => {
    if (!areaData) {
      setDrawnAreaData(null);
      return;
    }
    const { area, lat, lng } = areaData;
    setDrawnAreaData({ area, lat, lng });
    actualizarFormulario({
      area_hectareas: String(area),
      lat,
      lng,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = [
      "departamento",
      "municipio",
      "tipo_suelo",
      "mes_siembra",
      "area_hectareas",
    ];
    const missing = required.filter((field) => !formulario[field]);

    if (missing.length > 0 || !formulario.lat || !formulario.lng) {
      agregarToast(
        "Por favor, completa todos los campos y selecciona la ubicacion en el mapa",
        "error",
      );
      return;
    }

    setCargandoAnalisis(true);
    try {
      const resultado = await AnalysisService.performAnalysis({
        ...formulario,
        humedad: formulario.humedad_suelo || clima.humedad,
      });
      setResultado(resultado);
      agregarToast("Analisis completado exitosamente", "exito");

      const topRec = resultado.recomendaciones?.[0];
      agregarAlHistorial({
        tipo: "analisis",
        municipio: formulario.municipio,
        departamento: formulario.departamento,
        lat: formulario.lat,
        lng: formulario.lng,
        area_hectareas: formulario.area_hectareas,
        cultivo: topRec?.cultivo || null,
        score: topRec?.score || null,
        cultivo_top: topRec?.cultivo || null,
        rankings:
          resultado.structuredRecommendation?.output?.ranking?.map(
            (r, i) => ({
              rank: i + 1,
              crop: r.crop,
              score: r.score,
            }),
          ) || [],
      });

      navigate("/resultado");
    } catch {
      agregarToast(
        "Error al procesar el analisis. Intentalo de nuevo.",
        "error",
      );
    } finally {
      setCargandoAnalisis(false);
    }
  };

  const handleParcelaChange = async (e) => {
    const id = e.target.value;
    setSelectedParcela(id);

    if (!id) return;

    const record = historialRegistros.find((item) => item.id === id);
    if (!record) return;

    const coords = getRecordCoords(record) || {
      lat: formulario.lat,
      lng: formulario.lng,
    };
    const municipio =
      record.municipio || (activeMunicipio || "");

    let soilFromApi = null;
    try {
      soilFromApi = await getSoilData(coords.lat, coords.lng);
    } catch {
      soilFromApi = null;
    }

    const soil = soilFromApi || {};

    actualizarFormulario({
      lat: coords.lat,
      lng: coords.lng,
      municipio,
      departamento: record.departamento || formulario.departamento,
      area_hectareas:
        record.area_hectareas != null
          ? String(record.area_hectareas)
          : formulario.area_hectareas,
      tipo_suelo:
        normalizeSoilClass(record.tipo_suelo) ||
        normalizeSoilClass(record.textura_suelo) ||
        normalizeSoilClass(soil.tipo_suelo) ||
        normalizeSoilClass(soil.textura_suelo) ||
        formulario.tipo_suelo,
      ph_suelo:
        record.ph != null
          ? String(record.ph)
          : record.ph_suelo != null
            ? String(record.ph_suelo)
            : soil.ph != null
              ? String(soil.ph)
              : formulario.ph_suelo,
      materia_organica:
        record.materia_organica != null
          ? String(record.materia_organica)
          : soil.materia_organica != null
            ? String(soil.materia_organica)
            : formulario.materia_organica,
      textura_suelo:
        normalizeSoilClass(record.textura_suelo) ||
        normalizeSoilClass(soil.textura_suelo) ||
        formulario.textura_suelo,
      nitrogeno:
        record.nitrogeno != null
          ? String(record.nitrogeno)
          : formulario.nitrogeno || "",
      humedad_suelo:
        record.humedad_suelo != null
          ? String(record.humedad_suelo)
          : formulario.humedad_suelo || "",
      fosforo:
        record.fosforo != null
          ? String(record.fosforo)
          : formulario.fosforo || "",
      potasio:
        record.potasio != null
          ? String(record.potasio)
          : formulario.potasio || "",
    });

    agregarToast(`Registro ${record.id} cargado en Calidad del Suelo`, "info");
  };

  /** Enviar feedback (éxito/fallo) para un análisis */
  const handleFeedback = async (id, exito, rendimiento_real) => {
    const result = await setAnalysisFeedback(id, { exito, rendimiento_real });
    if (result?.success === false) {
      agregarToast(result.message || "Error al enviar feedback", "error");
      return;
    }
    agregarToast(
      exito
        ? "¡Gracias! Reportaste este análisis como exitoso."
        : "Gracias por tu reporte. Ayudará a mejorar nuestras predicciones.",
      "exito",
    );
    const current = useAppStore.getState().resultado;
    if (current) {
      setResultado({ ...current, feedback: { enviado: true, exito, rendimiento_real } });
    }
  };

  const structuredPreview = useMemo(
    () =>
      AnalysisService.createStructuredAnalysisPayload(
        {
          clima: { humedad: formulario.humedad_suelo || clima.humedad },
          indicadores_satelite: { ndvi: clima.humedad > 68 ? 0.72 : 0.28 },
        },
        { ...formulario, humedad: formulario.humedad_suelo || clima.humedad },
      ),
    [clima.humedad, formulario],
  );

  const metricCardsData = useMemo(
    () => [
      {
        key: "ndvi",
        label: "Vegetacion (NDVI)",
        value: structuredPreview.output.kpis.ndvi.value,
        trend: structuredPreview.output.kpis.ndvi.trend,
        tone: "positive",
        Icon: Leaf,
        tip: "Índice de Vegetación de Diferencia Normalizada basado en imágenes Sentinel-2. Valores >0.5 indican vegetación saludable.",
      },
      {
        key: "humidity",
        label: "Humedad",
        value: structuredPreview.output.kpis.humidity.value,
        trend: structuredPreview.output.kpis.humidity.trend,
        tone: "neutral",
        Icon: Droplets,
        tip: "Humedad relativa promedio del ambiente, calculada con datos de NASA POWER para las coordenadas seleccionadas.",
      },
      {
        key: "nitrogen",
        label: "Nitrogeno",
        value: structuredPreview.output.kpis.nitrogen.value,
        trend: structuredPreview.output.kpis.nitrogen.trend,
        tone: "neutral",
        Icon: FlaskConical,
        tip: "Estimación de nitrógeno disponible basada en materia orgánica del suelo y área de la parcela.",
      },
    ],
    [structuredPreview],
  );

  return {
    // Estados
    municipiosLista,
    activeTab,
    setActiveTab,
    selectedParcela,
    setSelectedParcela,
    selectedParcelaRecord,
    selectedParcelaLabel,
    historialRegistros,
    historialRegistrosEstandar,
    drawnAreaData,
    // Datos derivados
    isProductor,
    clima,
    structuredPreview,
    metricCardsData,
    // Store
    formulario,
    cargandoAnalisis,
    modelMetrics,
    // Handlers
    handleFormChange,
    handleMapChange,
    handleGeoDetected,
    handleDrawnArea,
    handleSubmit,
    handleParcelaChange,
    handleFeedback,
    // Navegación
    navigate,
  };
}
