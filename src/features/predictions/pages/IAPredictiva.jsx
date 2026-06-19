import React, { useState, useCallback, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sprout, AlertTriangle, ShieldAlert, History } from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useAppStore from '@shared/store';
import { getMunicipioReferencia, guardarRegistroPrediccion } from '@shared/services/api';
import { BentoGrid, BentoCard } from '@shared/ui/BentoGrid';
import ControlBar from '@features/predictions/components/ControlBar';
import PlantabilityPanel from '@features/predictions/components/PlantabilityPanel';
import HistorialLocalPanel from '@features/predictions/components/HistorialLocalPanel';
import MLRiskPanel from '@features/predictions/components/MLRiskPanel/MLRiskPanel';
import './IAPredictiva.css';

// ── Error Boundary para la sección de resultados ──
class ResultsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(`[IAPredictiva] Crash en "${this.props.label}":`, error?.message || error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error
        ? (this.state.error.message || String(this.state.error).slice(0, 120))
        : '';
      return (
        <BentoCard span={{ col: 12, row: 1 }} variant="default">
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(186,26,26,0.08)' }}>
              <AlertTriangle size={28} style={{ color: '#ba1a1a' }} />
            </div>
            <p className="text-sm text-[#6b7280]">Error en: <strong>{this.props.label || 'resultados'}</strong></p>
            <p className="text-xs text-[#9ca3af] max-w-sm break-all">{errMsg}</p>
          </div>
        </BentoCard>
      );
    }
    return this.props.children;
  }
}

// ── Department centroid coordinates [lon, lat] — mainland Caribbean only ──
// San Andrés excluded: no useful agricultural/risk records for this module.
const DEPT_COORDS = {
  'Atlántico':   [-74.88, 10.94],
  'Bolívar':     [-74.85,  8.67],
  'Córdoba':     [-75.88,  8.33],
  'Magdalena':   [-74.18, 10.42],
  'Cesar':       [-73.65,  9.33],
  'La Guajira':  [-72.50, 11.33],
  'Sucre':       [-75.13,  9.30],
};

const CURRENT_MONTH = new Date().getMonth() + 1;

const IAPredictiva = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const { agregarAlHistorial } = useAppStore();

  // ── Draft intake (edited freely; only committed on Ejecutar) ──
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedMes, setSelectedMes] = useState(CURRENT_MONTH);
  const [precipDelta, setPrecipDelta] = useState(0);   // % rainfall what-if
  const [tempDelta, setTempDelta] = useState(0);        // °C what-if

  // ── Committed query (props for MLRiskPanel; change together on Ejecutar) ──
  const [query, setQuery] = useState(null); // { lat, lng, mes, precip, temp }
  const [riskData, setRiskData] = useState({ flood: null, drought: null });
  const [running, setRunning] = useState(false);

  const queryRef = useRef(null);   // location/scenario context for persistence
  const savedKeyRef = useRef(null); // dedupe: one history record per execution

  // ── Handlers ──
  const handleDeptChange = useCallback((dept) => {
    setSelectedDept(dept);
    setSelectedMunicipio(''); // municipios depend on the department
  }, []);

  const handleExecute = useCallback(() => {
    if (!selectedDept || !DEPT_COORDS[selectedDept]) return;
    const muniRef = selectedMunicipio ? getMunicipioReferencia(selectedMunicipio) : null;
    const [lon, lat] = DEPT_COORDS[selectedDept];
    const coords = muniRef ? { lat: muniRef.lat, lng: muniRef.lng } : { lat, lng: lon };

    queryRef.current = {
      lat: coords.lat, lng: coords.lng, mes: selectedMes,
      precip: precipDelta, temp: tempDelta,
      municipio: selectedMunicipio || null, departamento: selectedDept,
    };
    setRunning(true);
    setRiskData({ flood: null, drought: null });
    setQuery({ lat: coords.lat, lng: coords.lng, mes: selectedMes, precip: precipDelta, temp: tempDelta });
  }, [selectedDept, selectedMunicipio, selectedMes, precipDelta, tempDelta]);

  // Persist one record per execution (localStorage immediately + Postgres).
  const persistResult = useCallback((flood, drought, meta) => {
    const q = queryRef.current;
    if (!q) return;
    const key = `${q.lat},${q.lng},${q.mes},${q.precip},${q.temp}`;
    if (savedKeyRef.current === key) return;
    savedKeyRef.current = key;

    const items = [
      flood && { label: 'inundacion', p: flood.probability },
      drought && { label: 'sequia', p: drought.probability },
    ].filter(Boolean);
    const dom = items.sort((a, b) => (b.p || 0) - (a.p || 0))[0] || null;
    const score = dom ? Math.round((dom.p || 0) * 100) : null;

    agregarAlHistorial({
      tipo: 'prediccion',
      municipio: q.municipio || '',
      departamento: q.departamento || '',
      lat: q.lat,
      lng: q.lng,
      cultivo: dom ? dom.label : '—',
      score,
    });
    guardarRegistroPrediccion({
      lat: q.lat, lon: q.lng, municipio: q.municipio, departamento: q.departamento,
      datos_formulario: { mes: q.mes, precip_delta_pct: q.precip, temp_delta_c: q.temp },
      resultado_completo: { riesgos: [flood, drought].filter(Boolean), meta },
      score, riesgo_dominante: dom ? dom.label : null,
    }).catch(() => { /* best-effort; localStorage already holds the record */ });
  }, [agregarAlHistorial]);

  const handleRiskData = useCallback(({ flood, drought, meta }) => {
    setRiskData({ flood, drought });
    setRunning(false);
    if (flood || drought) persistResult(flood, drought, meta);
  }, [persistResult]);

  const handleClearAll = useCallback(() => {
    setSelectedDept(null);
    setSelectedMunicipio('');
    setSelectedMes(CURRENT_MONTH);
    setPrecipDelta(0);
    setTempDelta(0);
    setQuery(null);
    setRiskData({ flood: null, drought: null });
    setRunning(false);
    queryRef.current = null;
    savedKeyRef.current = null;
  }, []);

  // ── Auth guard ──
  if (!authorized) return null;

  const hasResult = !!query;

  return (
    <ResearcherLayout activeTab="ia">
      <div className="ia-root">
        {/* ═══════════ HEADER ═══════════ */}
        <header className="ia-header">
          <div className="ia-header-left">
            <button className="ia-back-btn" onClick={() => navigate('/investigador/dashboard')}>
              <ArrowLeft size={14} />
              Dashboard
            </button>
            <div className="ia-header-row">
              <h1 className="ia-title">
                IA Predictiva
                <span className="ia-title-light"> — Modelo de Riesgo Climático</span>
              </h1>
            </div>
            <p className="ia-page-intent">
              Predicción de riesgo de inundación y sequía para el Caribe colombiano. Elige una
              ubicación y un mes; puedes simular escenarios de clima (más/menos lluvia, más/menos
              temperatura) y comparar contra la evidencia histórica. Cada corrida queda en tu historial.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="ia-badge-mode">RiskClassifier ML · CHIRPS + ERA5</span>
            </div>
          </div>
        </header>

        {/* ═══════════ CONTROL BAR ═══════════ */}
        <ControlBar
          selectedDept={selectedDept}
          onDeptChange={handleDeptChange}
          selectedMunicipio={selectedMunicipio}
          onMunicipioChange={setSelectedMunicipio}
          selectedMes={selectedMes}
          onMesChange={setSelectedMes}
          precipDelta={precipDelta}
          onPrecipChange={setPrecipDelta}
          tempDelta={tempDelta}
          onTempChange={setTempDelta}
          onClear={handleClearAll}
          onExecute={handleExecute}
          loading={running}
        />

        {/* ═══════════ BENTO GRID ═══════════ */}
        <BentoGrid>
          {/* ── IDLE empty state ── */}
          {!hasResult && (
            <BentoCard span={{ col: 12, row: 1 }} variant="default">
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(26,141,90,0.12), rgba(15,82,56,0.06))' }}
                >
                  <Sprout size={30} style={{ color: '#0f5238' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1C1A] mb-1.5">Aún no hay análisis de riesgo</h3>
                  <p className="text-xs text-[#6b7280] max-w-md mx-auto leading-relaxed">
                    Selecciona un departamento del Caribe en el mapa, elige el mes a evaluar y
                    (opcional) ajusta el escenario de clima, luego presiona{' '}
                    <strong style={{ color: '#0f5238' }}>Ejecutar</strong> para obtener la{' '}
                    <strong style={{ color: '#ba1a1a' }}>predicción de riesgo de inundación y sequía</strong>.
                  </p>
                </div>
              </div>
            </BentoCard>
          )}

          {/* ═══════════ Predicción de riesgo ═══════════ */}
          {hasResult && (
            <>
              <div className="ia-section ia-section--primary">
                <div className="ia-section-text">
                  <span className="ia-section-eyebrow"><ShieldAlert size={13} /> Predicción de riesgo</span>
                  <h2 className="ia-section-title">Modelo Predictivo de Riesgos</h2>
                  <p className="ia-section-subtitle">
                    Probabilidad de inundación y sequía estimada por el modelo ML (RiskClassifier)
                    para la ubicación y el escenario seleccionados.
                  </p>
                </div>
              </div>

              <ResultsErrorBoundary label="MLRiskPanel">
                <BentoCard span={{ col: 12, row: 1 }} variant="default">
                  <MLRiskPanel
                    lat={query.lat}
                    lon={query.lng}
                    month={query.mes}
                    precipDeltaPct={query.precip}
                    tempDeltaC={query.temp}
                    onRiskData={handleRiskData}
                  />
                </BentoCard>
              </ResultsErrorBoundary>

              {(riskData.flood || riskData.drought) && (
                <ResultsErrorBoundary label="PlantabilityPanel">
                  <PlantabilityPanel
                    flood={riskData.flood}
                    drought={riskData.drought}
                    cultivo={null}
                    fecha={null}
                  />
                </ResultsErrorBoundary>
              )}

              {/* ── Evidencia histórica local ── */}
              <div className="ia-section">
                <div className="ia-section-text">
                  <span className="ia-section-eyebrow"><History size={13} /> Evidencia histórica</span>
                  <h2 className="ia-section-title">Historial local de eventos</h2>
                  <p className="ia-section-subtitle">
                    Inundaciones y sequías reales registradas cerca de la ubicación seleccionada
                    (UNGRD / HDX). Es evidencia contextual, no una predicción.
                  </p>
                </div>
              </div>

              <ResultsErrorBoundary label="HistorialLocalPanel">
                <HistorialLocalPanel
                  lat={query.lat}
                  lon={query.lng}
                  municipio={queryRef.current?.municipio || null}
                  limit={8}
                />
              </ResultsErrorBoundary>
            </>
          )}
        </BentoGrid>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
