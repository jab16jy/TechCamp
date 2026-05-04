import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import { getHistorial, analizarUbicacion } from '../../services/api';
import './Historial.css';

const Historial = () => {
  const navigate = useNavigate();
  const { agregarToast, setResultado, setCargandoAnalisis, actualizarFormulario } = useAppStore();
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const data = await getHistorial();
        setHistorial(data || []);
      } catch (error) {
        agregarToast('Error al cargar el historial', 'error');
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [agregarToast]);

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--ndvi-verde)';
    if (score >= 70) return 'var(--dorado)';
    return 'var(--ndvi-rojo)';
  };

  const handleVerDetalle = async (item) => {
    setCargandoAnalisis(true);
    agregarToast('Cargando detalles de la consulta...', 'info');

    try {
      // Simulamos la recarga de los datos reconstruyendo un payload básico
      const payload = {
        municipio: item.municipio,
        lat: item.coordenadas?.lat || 10.5,
        lng: item.coordenadas?.lng || -74.8,
        area_hectareas: 5, // Mock data default
        tipo_suelo: 'Franco',
        mes_siembra: 'Mayo',
      };
      
      // Actualizamos el formulario para que la vista de consulta no quede vacía si vuelven
      actualizarFormulario(payload);

      // Ejecutamos la API para obtener el resultado completo (en mock devolverá lo mismo estructurado)
      const resultado = await analizarUbicacion(payload);
      setResultado(resultado);
      
      navigate('/resultado');
    } catch (error) {
      agregarToast('Error al cargar los detalles', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return (
    <div className="historial-page container">
      <div className="historial-header">
        <h1>Historial de Consultas</h1>
        <p>Revisa tus análisis previos y recomendaciones generadas.</p>
      </div>

      <div className="historial-container">
        {cargando ? (
          <div className="historial-cargando">Cargando registros...</div>
        ) : historial.length === 0 ? (
          <div className="historial-vacio">
            <p>No tienes consultas previas registradas en el sistema.</p>
            <Link to="/consulta" className="btn-primario">
              Realizar nueva consulta
            </Link>
          </div>
        ) : (
          <table className="historial-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Municipio / Ubicación</th>
                <th>Cultivo Top Recomendado</th>
                <th>Score de Viabilidad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.fecha}</strong>
                  </td>
                  <td>
                    {item.municipio}
                    <br />
                    <span style={{ fontSize: '0.8rem', color: 'var(--gris-400)' }}>
                      Lat: {item.coordenadas?.lat.toFixed(4)}, Lng: {item.coordenadas?.lng.toFixed(4)}
                    </span>
                  </td>
                  <td>
                    <strong>{item.cultivo_top}</strong>
                  </td>
                  <td>
                    <span 
                      className="score-badge" 
                      style={{ backgroundColor: getScoreColor(item.score) }}
                    >
                      {item.score}%
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-detalle" 
                      onClick={() => handleVerDetalle(item)}
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Historial;
