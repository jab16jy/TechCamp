import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useAppStore from '../../context/useAppStore';
import './Resultado.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Resultado = () => {
  const navigate = useNavigate();
  const { resultado, resetearFormulario, resetearResultado, agregarToast } = useAppStore();

  useEffect(() => {
    if (!resultado) {
      agregarToast('No hay resultados disponibles. Por favor realiza una consulta.', 'error');
      navigate('/consulta');
    }
  }, [resultado, navigate, agregarToast]);

  if (!resultado) return null;

  const { clima, indicadores_satelite, recomendaciones, ubicacion } = resultado;

  const handleNuevaConsulta = () => {
    resetearFormulario();
    resetearResultado();
    navigate('/consulta');
  };

  const handleDescargarPDF = () => {
    agregarToast('Generando reporte PDF... (Simulación)', 'info');
    // Lógica futura para PDF
  };

  const getNdviColor = (ndvi) => {
    if (ndvi < 0.2) return 'var(--ndvi-rojo)';
    if (ndvi <= 0.5) return 'var(--ndvi-amarillo)';
    return 'var(--ndvi-verde)';
  };

  const getNdviText = (ndvi) => {
    if (ndvi < 0.2) return 'Bajo (Poco vigor vegetal)';
    if (ndvi <= 0.5) return 'Medio (Vigor moderado)';
    return 'Alto (Buen vigor vegetal)';
  };

  return (
    <div className="resultado-page container">
      <div className="resultado-header">
        <div className="resultado-title">
          <h1>Resultados del Análisis</h1>
          <p>📍 {ubicacion?.municipio || 'Ubicación'}, {ubicacion?.departamento || 'Departamento'}</p>
        </div>
        <div className="resultado-acciones">
          <button className="btn-secundario" onClick={handleDescargarPDF}>
            📄 Descargar reporte PDF
          </button>
          <button className="btn-primario" onClick={handleNuevaConsulta}>
            🔄 Nueva consulta
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Columna Principal: Recomendaciones y Clima */}
        <div className="dashboard-col-main">
          
          <div className="seccion-dashboard">
            <h2>🌦️ Condiciones Climáticas Locales</h2>
            <div className="clima-grid">
              <div className="clima-card">
                <div className="clima-icono">🌡️</div>
                <div className="clima-valor">{clima?.temperatura}°C</div>
                <div className="clima-label">Temperatura</div>
              </div>
              <div className="clima-card">
                <div className="clima-icono">🌧️</div>
                <div className="clima-valor">{clima?.precipitacion} mm</div>
                <div className="clima-label">Precipitación</div>
              </div>
              <div className="clima-card">
                <div className="clima-icono">💧</div>
                <div className="clima-valor">{clima?.humedad}%</div>
                <div className="clima-label">Humedad</div>
              </div>
              <div className="clima-card">
                <div className="clima-icono">☀️</div>
                <div className="clima-valor">{clima?.radiacion_solar}</div>
                <div className="clima-label">Radiación Solar</div>
              </div>
              <div className="clima-card">
                <div className="clima-icono">♨️</div>
                <div className="clima-valor">{clima?.evapotranspiracion}</div>
                <div className="clima-label">Evapotransp. (ET₀)</div>
              </div>
            </div>
          </div>

          <div className="seccion-dashboard">
            <h2>🌾 Cultivos Recomendados</h2>
            <div className="recomendaciones-lista">
              {recomendaciones?.map((rec, index) => (
                <div className="cultivo-card" key={index}>
                  <div className="cultivo-header">
                    <div className="cultivo-nombre">
                      {rec.emoji} {rec.cultivo}
                    </div>
                    <div className="cultivo-score">
                      {rec.score}%
                    </div>
                  </div>
                  
                  <div className="score-bar-bg">
                    <div 
                      className="score-bar-fill" 
                      style={{ 
                        width: `${rec.score}%`,
                        background: rec.score > 80 ? 'var(--verde-medio)' : (rec.score > 60 ? 'var(--dorado)' : 'var(--ndvi-rojo)')
                      }}
                    ></div>
                  </div>

                  <div className="cultivo-meta">
                    <span className={`badge-riesgo riesgo-${rec.riesgo.toLowerCase()}`}>
                      Riesgo {rec.riesgo}
                    </span>
                    <span><strong>Ciclo:</strong> {rec.ciclo_dias} días</span>
                    <span><strong>Rendimiento est.:</strong> {rec.rendimiento_estimado}</span>
                  </div>

                  <p className="cultivo-justificacion">
                    {rec.justificacion}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Columna Secundaria: Satélite y Mapa */}
        <div className="dashboard-col-side">
          
          <div className="seccion-dashboard">
            <h2>🛰️ Análisis Satelital</h2>
            
            <div className="indicador-ndvi-container">
              <div 
                className="ndvi-circulo" 
                style={{ backgroundColor: getNdviColor(indicadores_satelite?.ndvi) }}
              >
                {indicadores_satelite?.ndvi}
              </div>
              <div className="ndvi-info">
                <h3>Índice NDVI</h3>
                <p>{getNdviText(indicadores_satelite?.ndvi)}</p>
              </div>
            </div>

            <div className="satelite-grid">
              <div className="satelite-item">
                <span>NDWI (Humedad):</span>
                <span>{indicadores_satelite?.ndwi}</span>
              </div>
              <div className="satelite-item">
                <span>Cobertura Nube:</span>
                <span>{indicadores_satelite?.cobertura_nube}%</span>
              </div>
              <div className="satelite-item" style={{ gridColumn: 'span 2' }}>
                <span>Calidad Suelo (Estimada):</span>
                <span>{indicadores_satelite?.calidad_suelo}</span>
              </div>
            </div>
          </div>

          <div className="seccion-dashboard">
            <h2>📍 Ubicación Analizada</h2>
            <div className="minimapa-container">
              {ubicacion?.lat && ubicacion?.lng && (
                <MapContainer 
                  center={[ubicacion.lat, ubicacion.lng]} 
                  zoom={10} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[ubicacion.lat, ubicacion.lng]} />
                </MapContainer>
              )}
            </div>
            <div className="ubicacion-detalles">
              <p><strong>Latitud:</strong> {ubicacion?.lat?.toFixed(4)}</p>
              <p><strong>Longitud:</strong> {ubicacion?.lng?.toFixed(4)}</p>
              <p><strong>Área:</strong> {ubicacion?.area_hectareas} ha</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Resultado;
