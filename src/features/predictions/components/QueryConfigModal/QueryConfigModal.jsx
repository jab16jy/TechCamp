import { useState, useCallback, useMemo } from 'react';
import {
  X, MapPin, Sprout, Calendar, Search, Loader2, Droplets, FlaskConical,
} from 'lucide-react';

const CULTIVOS = [
  'Maiz', 'Yuca', 'Arroz', 'Frijol', 'Platano',
  'Name', 'Cacao', 'Algodón', 'Sorgo', 'Palma Aceitera',
];

const CICLOS_DIAS = {
  Maiz: 90, Yuca: 270, Arroz: 120, Frijol: 75,
  Name: 210, Platano: 365, Cacao: 180, Algodón: 150,
  Sorgo: 110, 'Palma Aceitera': 365,
  'Maíz': 90, 'Ñame': 210, 'Plátano': 365,
};

const ETAPAS = [
  { key: 'germinacion', label: 'Germinación', min: 0, max: 0.1 },
  { key: 'desarrollo-vegetativo', label: 'Desarrollo', min: 0.1, max: 0.3 },
  { key: 'floracion', label: 'Floración', min: 0.3, max: 0.55 },
  { key: 'llenado', label: 'Llenado', min: 0.55, max: 0.8 },
  { key: 'maduracion', label: 'Maduración', min: 0.8, max: 1 },
];

function getEtapaFromDias(dias, ciclo) {
  if (dias < 0) return { key: 'pre-siembra', label: 'Pre-siembra' };
  const pct = Math.min(1, dias / Math.max(ciclo, 1));
  const etapa = ETAPAS.find((e) => pct >= e.min && pct < e.max);
  return etapa || { key: 'maduracion', label: 'Maduración' };
}

export default function QueryConfigModal({
  isOpen,
  onClose,
  onApply,
  onSelectAnalysis,
  analisis,
  selectedAnalysisId,
  loading,
  analysisData,
}) {
  const [lote, setLote] = useState('');
  const [cultivo, setCultivo] = useState('');
  const [fechaSiembra, setFechaSiembra] = useState('');

  // When an analysis is selected, pre-fill fields
  const handleSelectAnalysisInternal = useCallback((item) => {
    if (onSelectAnalysis) {
      onSelectAnalysis(item.id);
    }
    // Pre-fill from selected analysis
    if (item.cultivo) setCultivo(item.cultivo);
    if (item.fecha) {
      const d = new Date(item.fecha);
      if (!isNaN(d.getTime())) {
        setFechaSiembra(d.toISOString().slice(0, 10));
      }
    }
    if (item.municipio || item.departamento) {
      setLote([item.municipio, item.departamento].filter(Boolean).join(', '));
    }
  }, [onSelectAnalysis]);

  const handleApply = useCallback(() => {
    // Find lat/lng from selected analysis or manual entry
    const selected = analisis?.find((a) => a.id === selectedAnalysisId);
    if (selected) {
      const lat = Number(selected.coordenadas?.lat ?? selected.lat);
      const lng = Number(selected.coordenadas?.lng ?? selected.lng);
      onApply?.({
        lat,
        lng,
        cultivo: cultivo || selected.cultivo || 'Maiz',
        fechaSiembra: fechaSiembra || null,
        source: 'analysis',
        analysisId: selectedAnalysisId,
      });
    } else if (lote) {
      // Manual query — needs lat/lng from somewhere
      onApply?.({
        lote,
        cultivo: cultivo || 'Maiz',
        fechaSiembra: fechaSiembra || null,
        source: 'manual',
      });
    } else {
      onApply?.({ lote, cultivo, fechaSiembra, source: 'manual' });
    }
  }, [lote, cultivo, fechaSiembra, onApply, analisis, selectedAnalysisId]);

  // Phenology preview
  const fenologiaPreview = useMemo(() => {
    if (!fechaSiembra || !cultivo) return null;
    const ciclo = CICLOS_DIAS[cultivo] || 90;
    const dias = Math.max(0, Math.floor((Date.now() - new Date(fechaSiembra).getTime()) / 86400000));
    const pct = Math.min(100, Math.round((dias / ciclo) * 100));
    const etapa = getEtapaFromDias(dias, ciclo);
    return { dias, ciclo, pct, etapa };
  }, [fechaSiembra, cultivo]);

  // Soil preview from analysis data
  const soilPreview = useMemo(() => {
    if (!analysisData) return null;
    const ph = analysisData.ph_suelo ?? analysisData.ph;
    const mo = analysisData.materia_organica;
    const textura = analysisData.textura_suelo ?? analysisData.tipo_suelo;
    if (ph === undefined && mo === undefined && !textura) return null;
    return { ph, mo, textura };
  }, [analysisData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(15,82,56,0.08)' }}
            >
              <Search size={18} style={{ color: '#0f5238' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1C1A]">Configurar Consulta</h2>
              <p className="text-xs text-[#6b7280]">Selecciona un análisis existente o define manualmente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(0,0,0,0.05)] transition-colors"
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Histórico selector (primary CTA) */}
          {analisis && analisis.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-[#0f5238]">Usar análisis existente</span>
                <span className="text-[10px] text-[#9ca3af]">(recomendado — datos reales)</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {analisis.map((item) => {
                  const isSelected = item.id === selectedAnalysisId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectAnalysisInternal(item)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: isSelected ? 'rgba(15,82,56,0.1)' : 'rgba(255,255,255,0.5)',
                        border: isSelected ? '1.5px solid rgba(15,82,56,0.3)' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1A1C1A]">{item.id}</span>
                          {item.cultivo && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                              style={{ background: 'rgba(15,82,56,0.08)', color: '#0f5238' }}>
                              {item.cultivo}
                            </span>
                          )}
                          {item.tipo && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-[rgba(0,0,0,0.05)] text-[#6b7280]">
                              {item.tipo === 'suelo' || item.tipo === 'advanced' ? 'Suelo' : 'Cultivo'}
                            </span>
                          )}
                        </div>
                        {item.score !== undefined && (
                          <span className="text-[10px] font-medium text-[#0f5238]">{item.score}%</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#9ca3af] mt-0.5">
                        {[item.municipio, item.departamento].filter(Boolean).join(', ') || '—'}
                        {item.fecha && ` · ${new Date(item.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider when both history and manual fields appear */}
          {analisis && analisis.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[rgba(0,0,0,0.06)]" />
              <span className="text-[10px] text-[#9ca3af] uppercase tracking-wider">o configure manualmente</span>
              <div className="flex-1 h-px bg-[rgba(0,0,0,0.06)]" />
            </div>
          )}

          {/* Lote / Ubicacion */}
          <div>
            <label className="bento-field-label">
              <MapPin size={13} />
              Lote / Ubicación
            </label>
            <input
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Ej: Lote 3A, Finca La Esperanza"
              className="bento-field-input"
            />
            {selectedAnalysisId && (
              <p className="text-[10px] text-[#0f5238] mt-1 flex items-center gap-1">
                <MapPin size={10} /> Coordenadas cargadas del análisis seleccionado
              </p>
            )}
          </div>

          {/* Cultivo */}
          <div>
            <label className="bento-field-label">
              <Sprout size={13} />
              Tipo de Cultivo
            </label>
            <select
              value={cultivo}
              onChange={(e) => setCultivo(e.target.value)}
              className="bento-field-input"
            >
              <option value="">Seleccionar cultivo...</option>
              {CULTIVOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Fecha Siembra + fenología preview */}
          <div>
            <label className="bento-field-label">
              <Calendar size={13} />
              Fecha de Siembra
            </label>
            <input
              type="date"
              value={fechaSiembra}
              onChange={(e) => setFechaSiembra(e.target.value)}
              className="bento-field-input"
            />
            <p className="text-[10px] text-[#9ca3af] mt-1">
              El estado fenológico se calcula automáticamente.
            </p>
            {/* Fenología preview */}
            {fenologiaPreview && (
              <div className="mt-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(15,82,56,0.04)', border: '1px solid rgba(15,82,56,0.12)' }}>
                <div className="flex items-center justify-between text-[#0f5238] font-medium">
                  <span>{fenologiaPreview.etapa.label}</span>
                  <span>{fenologiaPreview.dias}/{fenologiaPreview.ciclo} días — {fenologiaPreview.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[rgba(0,0,0,0.06)] rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0f5238] transition-all"
                    style={{ width: `${fenologiaPreview.pct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Soil data preview */}
          {soilPreview && (
            <div className="px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical size={12} className="text-blue-600" />
                <span className="font-semibold text-[#1A1C1A]">Datos de suelo del análisis</span>
              </div>
              <div className="flex gap-4 text-[#6b7280]">
                {soilPreview.ph !== undefined && soilPreview.ph !== null && (
                  <span><Droplets size={10} className="inline mr-1 text-amber-500" />pH: <strong className="text-[#1A1C1A]">{soilPreview.ph}</strong></span>
                )}
                {soilPreview.mo !== undefined && soilPreview.mo !== null && (
                  <span>MO: <strong className="text-[#1A1C1A]">{soilPreview.mo}%</strong></span>
                )}
                {soilPreview.textura && (
                  <span>Textura: <strong className="text-[#1A1C1A]">{soilPreview.textura}</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleApply}
              disabled={loading}
              className="bento-btn-primary flex-1"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {loading ? 'Calculando...' : 'Generar Proyección'}
            </button>
            <button onClick={onClose} className="bento-btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}