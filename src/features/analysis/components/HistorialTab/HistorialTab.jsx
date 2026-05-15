import {
  Search,
  Sprout,
} from 'lucide-react';

const HistorialTab = () => {
  const rows = [
    { id: 'C-0421', fecha: '2025-04-21', municipio: 'Monteria', cultivo: 'Maiz', score: 94, estado: 'Exitosa' },
    { id: 'C-0420', fecha: '2025-04-20', municipio: 'Barranquilla', cultivo: 'Platano', score: 88, estado: 'Exitosa' },
    { id: 'C-0419', fecha: '2025-04-19', municipio: 'Sincelejo', cultivo: 'Yuca', score: 76, estado: 'Exitosa' },
  ];

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
            />
          </div>
        </div>

        <div className="ac-table-scroll">
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="ac-row-id">{row.id}</td>
                  <td className="ac-row-date">{row.fecha}</td>
                  <td className="ac-row-loc">{row.municipio}</td>
                  <td>
                    <div className="ac-crop-info">
                      <Sprout size={16} />
                      <span>{row.cultivo}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ac-score ${row.score < 70 ? 'ac-score--low' : ''}`}>
                      {row.score}%
                    </span>
                  </td>
                  <td>
                    <span className={`ac-cell-badge ${row.estado !== 'Exitosa' ? 'ac-cell-badge--warn' : ''}`}>
                      {row.estado}
                    </span>
                  </td>
                  <td className="ac-txt-right">
                    <button className="ac-view-btn">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistorialTab;
