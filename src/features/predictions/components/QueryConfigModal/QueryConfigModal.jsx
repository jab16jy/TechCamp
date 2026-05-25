import { useState, useCallback } from 'react';
import {
  X, MapPin, Sprout, Calendar, Search, Loader2,
} from 'lucide-react';

const CULTIVOS = [
  'Maiz', 'Yuca', 'Arroz', 'Frijol', 'Platano',
  'Name', 'Cacao', 'Algodon', 'Sorgo', 'Palma Aceitera',
];

export default function QueryConfigModal({
  isOpen,
  onClose,
  onApply,
  analisis,
  selectedAnalysisId,
  onSelectAnalysis,
  loading,
}) {
  const [lote, setLote] = useState('');
  const [cultivo, setCultivo] = useState('');
  const [fechaSiembra, setFechaSiembra] = useState('');

  const handleApply = useCallback(() => {
    onApply?.({ lote, cultivo, fechaSiembra });
  }, [lote, cultivo, fechaSiembra, onApply]);

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
              <p className="text-xs text-[#6b7280]">Define lote, cultivo y fecha de siembra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(0,0,0,0.05)] transition-colors"
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Lote / Ubicacion */}
          <div>
            <label className="bento-field-label">
              <MapPin size={13} />
              Lote / Ubicacion
            </label>
            <input
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Ej: Lote 3A, Finca La Esperanza"
              className="bento-field-input"
            />
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

          {/* Fecha Siembra */}
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
              El estado fenologico se calcula automaticamente desde esta fecha.
            </p>
          </div>

          {/* Historial selector */}
          {analisis && analisis.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-[#1A1C1A]">O usar analisis existente</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {analisis.map((item) => {
                  const isSelected = item.id === selectedAnalysisId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectAnalysis(item.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: isSelected ? 'rgba(15,82,56,0.08)' : 'rgba(255,255,255,0.4)',
                        border: isSelected ? '1.5px solid rgba(15,82,56,0.25)' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <span className="font-semibold text-[#1A1C1A]">{item.id}</span>
                      <span className="ml-2 text-[#6b7280]">
                        {[item.municipio, item.departamento].filter(Boolean).join(', ') || '—'}
                      </span>
                      {item.cultivo && (
                        <span className="ml-2 text-[#0f5238] font-medium">{item.cultivo}</span>
                      )}
                    </button>
                  );
                })}
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
              {loading ? 'Calculando...' : 'Generar Proyeccion'}
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