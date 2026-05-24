import { ChevronDown, X, History, Calendar, MapPin, Sprout, FlaskConical } from 'lucide-react';

const TIPO_CONFIG = {
  analisis: { label: 'Analisis', icon: Sprout, color: '#2d6a4f', bg: 'rgba(45,106,79,0.08)' },
  simple: { label: 'Analisis', icon: Sprout, color: '#2d6a4f', bg: 'rgba(45,106,79,0.08)' },
  suelo: { label: 'Suelo', icon: FlaskConical, color: '#75584d', bg: 'rgba(117,88,77,0.08)' },
  advanced: { label: 'Suelo', icon: FlaskConical, color: '#75584d', bg: 'rgba(117,88,77,0.08)' },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AnalisisSelector({
  analisis, selectedId, onSelect, onClear, isOpen, onToggle,
}) {
  const selectedRecord = analisis.find((a) => a.id === selectedId);
  const config = selectedRecord ? (TIPO_CONFIG[selectedRecord.tipo] || TIPO_CONFIG.analisis) : null;
  const IconComp = config?.icon;

  return (
    <div className="ia-dropdown-container" style={{ position: 'relative' }}>
      <button
        type="button"
        className="ia-use-last"
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 1rem', borderRadius: '9999px',
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
          color: selectedId ? '#1A1C1A' : '#6b7280',
          cursor: 'pointer', transition: 'all 0.3s ease',
        }}
      >
        <History size={14} />
        <span className="truncate" style={{ maxWidth: 180 }}>
          {selectedRecord
            ? `${selectedRecord.id} — ${selectedRecord.municipio || selectedRecord.cultivo || 'Parcela'}`
            : 'Seleccionar analisis del historial'}
        </span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          className="ia-history-popover"
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 50,
            marginTop: '0.5rem', width: 360, maxHeight: 340,
            borderRadius: '1rem',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          <div className="ia-popover-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1A1C1A' }}>Analisis reutilizables</span>
            <button onClick={onToggle} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={12} color="#6b7280" />
            </button>
          </div>
          <div className="ia-popover-list" style={{ overflowY: 'auto', maxHeight: 280 }}>
            {analisis.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <History size={24} style={{ opacity: 0.4, marginBottom: '0.25rem' }} />
                <span style={{ fontSize: '0.8rem' }}>Sin registros con ubicacion reutilizable</span>
              </div>
            ) : (
              analisis.map((item) => {
                const cfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.analisis;
                const Icon = cfg.icon;
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => { onSelect(item.id); onToggle(); }}
                    style={{
                      padding: '0.6rem 0.75rem', cursor: 'pointer',
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      background: isSelected ? 'rgba(15,82,56,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1A1C1A' }}>{item.id}</span>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 9999, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={10} />{formatDate(item.fecha)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} />{[item.municipio, item.departamento].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.15rem', fontSize: '0.65rem', color: '#6b7280' }}>
                      {item.cultivo && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Sprout size={10} />{item.cultivo}
                        </span>
                      )}
                      {item.lat && (
                        <span>
                          Lat: {Number(item.lat).toFixed(4)}, Lng: {Number(item.lng || 0).toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
