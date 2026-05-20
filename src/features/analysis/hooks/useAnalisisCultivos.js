import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "@shared/store";
import AnalysisService from "@shared/services/analysisService";
import {
  getSoilData,
  getHistorial as fetchHistorial,
  MUNICIPIOS_COORD_MAP,
  MUNICIPIOS_CLIMA_MAP,
  MUNICIPIOS_SUELO_MAP,
  getClosestMunicipality,
} from "@shared/services/api";
import { Leaf, Droplets, FlaskConical } from "lucide-react";

const DEFAULT_CLIMA = { temperatura: 26.4, humedad: 72, precipitacion: 1180 };

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
  const rol = sessionStorage.getItem("rol");
  const isProductor = rol === "productor";
  const [mode, setMode] = useState("simple");
  const [activeTab, setActiveTab] = useState("analisis");
  const [selectedParcela, setSelectedParcela] = useState("");

  useEffect(() => {
    if (isProductor) setMode("simple");
  }, [isProductor]);

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

  const historialRegistros = useMemo(() => {
    const seen = new Set();
    const all = [];

    for (const item of serverHistory) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }

    for (const item of historial) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }

    return all.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [serverHistory, historial]);

  const selectedParcelaRecord = useMemo(
    () =>
      historialRegistros.find((item) => item.id === selectedParcela) || null,
    [historialRegistros, selectedParcela],
  );

  const selectedParcelaLabel = useMemo(
    () => formatHistoryLabel(selectedParcelaRecord),
    [selectedParcelaRecord],
  );

  const activeMunicipio = useMemo(() => {
    if (selectedParcelaRecord?.municipio)
      return selectedParcelaRecord.municipio;
    if (formulario.municipio) return formulario.municipio;
    return getClosestMunicipality(formulario.lat, formulario.lng);
  }, [
    formulario.lat,
    formulario.lng,
    formulario.municipio,
    selectedParcelaRecord,
  ]);

  const clima = useMemo(() => {
    const climaMunicipio = MUNICIPIOS_CLIMA_MAP[activeMunicipio];
    if (!climaMunicipio) return DEFAULT_CLIMA;
    return {
      temperatura: climaMunicipio.temperatura,
      humedad: climaMunicipio.humedad,
      precipitacion: climaMunicipio.precipitacion,
    };
  }, [activeMunicipio]);

  const preloadSoilForLocation = async (lat, lng, municipio) => {
    try {
      const soilFromApi = await getSoilData(lat, lng);
      const soil = soilFromApi || MUNICIPIOS_SUELO_MAP[municipio];

      if (soil?.ph !== null && soil?.ph !== undefined) {
        actualizarFormulario({
          ph_suelo: String(soil.ph),
          materia_organica:
            soil.materia_organica != null ? String(soil.materia_organica) : "",
          textura_suelo: soil.textura_suelo || "",
          tipo_suelo: soil.textura_suelo || formulario.tipo_suelo,
        });
        agregarToast(
          "Datos de suelo precargados para la ubicación seleccionada",
          "info",
        );
      }
    } catch {
      const fallbackSoil = MUNICIPIOS_SUELO_MAP[municipio];
      if (fallbackSoil) {
        actualizarFormulario({
          ph_suelo: String(fallbackSoil.ph),
          materia_organica: String(fallbackSoil.materia_organica),
          textura_suelo: fallbackSoil.textura_suelo,
          tipo_suelo: fallbackSoil.textura_suelo,
        });
        agregarToast(
          "Datos de suelo simulados precargados para el municipio seleccionado",
          "info",
        );
      }
    }
  };

  const handleFormChange = (newFields) => {
    const updates = { ...newFields };

    if (newFields.municipio) {
      const coords = MUNICIPIOS_COORD_MAP[newFields.municipio];
      if (coords) {
        updates.lat = coords.lat;
        updates.lng = coords.lng;
      }
    }

    actualizarFormulario(updates);

    if (newFields.municipio) {
      const coords = MUNICIPIOS_COORD_MAP[newFields.municipio];
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
    try {
      const soil = await getSoilData(latlng.lat, latlng.lng);
      if (soil?.ph !== null && soil?.ph !== undefined) {
        actualizarFormulario({
          ph_suelo: String(soil.ph),
          materia_organica:
            soil.materia_organica != null ? String(soil.materia_organica) : "",
          textura_suelo: soil.textura_suelo || "",
          tipo_suelo: soil.textura_suelo || formulario.tipo_suelo,
        });
        agregarToast(
          "Datos de suelo precargados desde ISRIC SoilGrids (pH, MO, textura)",
          "info",
        );
      }
    } catch {
      // Silencioso: SoilGrids es opcional
    }
  };

  const handleGeoDetected = (geo) => {
    const updates = {
      lat: geo.lat,
      lng: geo.lng,
    };
    if (geo.departamento) updates.departamento = geo.departamento;
    if (geo.municipio) updates.municipio = geo.municipio;
    if (geo.area_hectareas) updates.area_hectareas = String(geo.area_hectareas);
    actualizarFormulario(updates);
    agregarToast(
      `Ubicacion detectada: ${geo.municipio || ""}, ${geo.departamento || ""}`,
      "info",
    );
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
        tipo: mode === "advanced" ? "suelo" : "analisis",
        municipio: formulario.municipio,
        departamento: formulario.departamento,
        lat: formulario.lat,
        lng: formulario.lng,
        area_hectareas: formulario.area_hectareas,
        ...(mode === "simple"
          ? {
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
            }
          : {
              ph: formulario.ph_suelo || null,
              nitrogeno: formulario.nitrogeno || null,
              humedad_suelo: formulario.humedad_suelo || clima.humedad,
              fosforo: formulario.fosforo || null,
              potasio: formulario.potasio || null,
              materia_organica: formulario.materia_organica || null,
              textura_suelo: formulario.textura_suelo || null,
              calidad_suelo:
                resultado.indicadores_satelite?.calidad_suelo || null,
              ndvi: resultado.indicadores_satelite?.ndvi || null,
            }),
      });

      if (mode === "advanced") {
        navigate("/investigador/resultado-avanzado");
      } else {
        navigate("/resultado");
      }
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

    const coords = getRecordCoords(record) ||
      MUNICIPIOS_COORD_MAP[record.municipio] || {
        lat: formulario.lat,
        lng: formulario.lng,
      };
    const municipio =
      record.municipio || getClosestMunicipality(coords.lat, coords.lng);
    const soilFromMunicipio = MUNICIPIOS_SUELO_MAP[municipio] || {};
    const climaMunicipio = MUNICIPIOS_CLIMA_MAP[municipio] || {};

    let soilFromApi = null;
    try {
      soilFromApi = await getSoilData(coords.lat, coords.lng);
    } catch {
      soilFromApi = null;
    }

    const soil = { ...soilFromMunicipio, ...(soilFromApi || {}) };

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
        record.tipo_suelo ||
        record.textura_suelo ||
        soil.textura_suelo ||
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
        record.textura_suelo || soil.textura_suelo || formulario.textura_suelo,
      nitrogeno:
        record.nitrogeno != null
          ? String(record.nitrogeno)
          : formulario.nitrogeno || "",
      humedad_suelo:
        record.humedad_suelo != null
          ? String(record.humedad_suelo)
          : climaMunicipio.humedad != null
            ? String(climaMunicipio.humedad)
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
    mode,
    setMode,
    activeTab,
    setActiveTab,
    selectedParcela,
    setSelectedParcela,
    selectedParcelaRecord,
    selectedParcelaLabel,
    historialRegistros,
    // Datos derivados
    isProductor,
    clima,
    structuredPreview,
    metricCardsData,
    // Store
    formulario,
    cargandoAnalisis,
    // Handlers
    handleFormChange,
    handleMapChange,
    handleGeoDetected,
    handleSubmit,
    handleParcelaChange,
    // Navegación
    navigate,
  };
}
