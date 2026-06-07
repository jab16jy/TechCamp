import { useState, useMemo } from 'react';
import { Search, Sprout, AlertCircle } from 'lucide-react';

const HistorialTab = ({ registros = [], loading = false, onError = null }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegistros = useMemo(() => {
    if (!Array.isArray(registros)) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return registros;
    return registros.filter((row) => {
      const id = String(row?.id ?? '').toLowerCase();
      const municipio = String(row?.municipio ?? '').toLowerCase();
      return id.includes(term) || municipio.includes(term);
    });
  }, [registros, searchTerm]);

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(fecha);
    }
  };

  return (
    <div className="ac-historial">
      <div className="ac-table-card">
        <div className="ac-table-header">
          <h2 className="ac-table-title">Consultas recientes</h2>
          <div className="ac-search-wrap">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por ID o Municipio..."
              className="ac-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ac-table-scroll">
          {onError && (
            <div className="ac-historial-error" role="alert">
              <AlertCircle size={18} />
              <span>No se pudo cargar el historial. Reintenta más tarde.</span>
            </div>
          )}

          {loading ? (
            <div className="ac-historial-loading">Cargando historial...</div>
          ) : filteredRegistros.length === 0 ? (
            <div className="ac-historial-empty">
              <p>No hay análisis registrados. Realiza tu primer análisis.</p>
            </div>
          ) : (
            <table className="ac-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Municipio</th>
                  <th>Cultivo rec.</th>
                  <th className="ac-txt-center">Score IA</th>
                  <th>Estado</th>
                  <th className="ac-txt-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistros.map((row) => {
                  const id = String(row?.id ?? '');
                  const score = Number(row?.score ?? 0);
                  const estado = row?.estado || 'Exitosa';
                  return (
                    <tr key={id}>
                      <td className="ac-row-id">{id}</td>
                      <td className="ac-row-date">{formatFecha(row?.fecha)}</td>
                      <td className="ac-row-loc">{row?.municipio || '—'}</td>
                      <td>
                        <div className="ac-crop-info">
                          <Sprout size={16} />
                          <span>{row?.cultivo || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`ac-score ${score < 70 ? 'ac-score--low' : ''}`}>
                          {score}%
                        </span>
                      </td>
                      <td>
                        <span className={`ac-cell-badge ${estado !== 'Exitosa' ? 'ac-cell-badge--warn' : ''}`}>
                          {estado}
                        </span>
                      </td>
                      <td className="ac-txt-right">
                        <button type="button" className="ac-view-btn">Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialTab;
