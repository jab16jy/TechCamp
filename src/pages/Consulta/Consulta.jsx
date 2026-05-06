import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useAppStore from '../../context/useAppStore';
import { analizarUbicacion, getMunicipios } from '../../services/api';
import './Consulta.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para manejar el marcador y clics en el mapa
const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Usamos useEffect para que el mapa haga flyTo cuando la posición cambia externamente (ej: input text)
  useEffect(() => {
    if (position && map) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          setPosition(e.target.getLatLng());
        },
      }}
    />
  );
};

const Consulta = () => {
  const navigate = useNavigate();
  const { 
    formulario, 
    actualizarFormulario, 
    setCargandoAnalisis, 
    setResultado, 
    setErrorAnalisis, 
    agregarToast 
  } = useAppStore();

  const [municipiosLista, setMunicipiosLista] = useState([]);
  
  const {
    departamento, municipio, lat, lng, tipo_suelo, acceso_riego,
    mes_siembra, area_hectareas, ph_suelo, textura_suelo, materia_organica
  } = formulario;

  const [coordsInput, setCoordsInput] = useState(`${lat || 10.5}, ${lng || -74.8}`);
  
  // Guardamos una ref de la lista para usarla en el geocoding sin dependencias circulares
  const municipiosRef = useRef([]);

  useEffect(() => {
    // Cargar municipios
    getMunicipios().then((data) => {
      const list = data || [];
      setMunicipiosLista(list);
      municipiosRef.current = list;
    });
  }, []);

  const departamentosUnicos = [...new Set(municipiosLista.map(m => m.departamento))].sort();
  const municipiosFiltrados = municipiosLista
    .filter(m => m.departamento === departamento)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    actualizarFormulario({
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const fetchReverseGeocoding = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await response.json();
      
      if (data && data.address) {
        const stateStr = data.address.state || '';
        const cityStr = data.address.city || data.address.town || data.address.county || data.address.village || '';
        
        // Buscar coincidencia de departamento
        const deptos = [...new Set(municipiosRef.current.map(m => m.departamento))];
        const deptoMatch = deptos.find(d => 
          stateStr.toLowerCase().includes(d.toLowerCase()) || 
          d.toLowerCase().includes(stateStr.toLowerCase())
        );
        
        if (deptoMatch) {
          actualizarFormulario({ departamento: deptoMatch });
          agregarToast(`Departamento detectado: ${deptoMatch}`, 'info');
          
          // Buscar coincidencia de municipio
          const munis = municipiosRef.current.filter(m => m.departamento === deptoMatch);
          const muniMatch = munis.find(m => 
            cityStr.toLowerCase().includes(m.nombre.toLowerCase()) ||
            m.nombre.toLowerCase().includes(cityStr.toLowerCase())
          );
          
          if (muniMatch) {
            actualizarFormulario({ municipio: muniMatch.nombre });
            agregarToast(`Municipio detectado: ${muniMatch.nombre}`, 'info');
          } else {
            actualizarFormulario({ municipio: '' });
          }
        }
      }
    } catch (e) {
      console.warn("Error en reverse geocoding", e);
    }
  };

  const handleMapChange = (latlng) => {
    actualizarFormulario({
      lat: latlng.lat,
      lng: latlng.lng
    });
    setCoordsInput(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    fetchReverseGeocoding(latlng.lat, latlng.lng);
  };

  const handleCoordsInputChange = (e) => {
    const val = e.target.value;
    setCoordsInput(val);
    
    // Regex para soportar "10.9685, -74.7813" o "10.9685,-74.7813"
    const regex = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;
    const match = val.match(regex);
    if (match) {
      const newLat = parseFloat(match[1]);
      const newLng = parseFloat(match[3]);
      actualizarFormulario({ lat: newLat, lng: newLng });
      fetchReverseGeocoding(newLat, newLng);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!departamento || !municipio || !tipo_suelo || !mes_siembra || !area_hectareas) {
      agregarToast('Por favor, completa los campos requeridos', 'error');
      return;
    }

    setCargandoAnalisis(true);
    agregarToast('Analizando la zona...', 'info');
    
    try {
      const payload = { ...formulario };
      // Transformar valores numéricos
      payload.area_hectareas = Number(payload.area_hectareas);
      payload.ph_suelo = payload.ph_suelo ? Number(payload.ph_suelo) : null;
      payload.materia_organica = payload.materia_organica ? Number(payload.materia_organica) : null;
      
      const resultado = await analizarUbicacion(payload);
      setResultado(resultado);
      agregarToast('Análisis completado exitosamente', 'success');
      navigate('/resultado');
    } catch (error) {
      setErrorAnalisis(error.message);
      agregarToast('Error al analizar la ubicación', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return (
    <div className="consulta-page container">
      <header className="consulta-header">
        <h1>Análisis de Cultivos</h1>
        <p>Configure los parámetros de su parcela para obtener recomendaciones agronómicas de precisión.</p>
      </header>

      {/* Tabs Navigation */}
      <div className="consulta-tabs">
        <button className="tab-btn active">
          <span className="material-symbols-outlined">description</span>
          Datos de la Parcela
        </button>
        <button className="tab-btn">
          <span className="material-symbols-outlined">science</span>
          Calidad del Suelo
          <span className="tab-badge">MODO AVANZADO</span>
        </button>
      </div>

      <form className="consulta-grid-main" onSubmit={handleSubmit}>
        {/* Left Column: Map (5 columns) */}
        <section className="map-section-col">
          <div className="premium-card">
            <div className="card-title-row">
              <span className="material-symbols-outlined">map</span>
              <h3>Ubicación en el Mapa</h3>
            </div>
            <p className="card-subtitle">Haz clic en el mapa o arrastra el marcador para precisar las coordenadas.</p>
            
            <div className="map-wrapper">
              <MapContainer 
                center={[lat || 10.5, lng || -74.8]} 
                zoom={11} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                {/* Satellite View Layer */}
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  opacity={0.3} // Subtle overlay for labels
                />
                <LocationMarker position={{ lat, lng }} setPosition={handleMapChange} />
              </MapContainer>

              <div className="map-coords-badge">
                <p className="coords-label">Región seleccionada</p>
                <p className="coords-value">{lat?.toFixed(2)}° N, {lng?.toFixed(2)}° W</p>
              </div>
            </div>

            {/* Insight IA Box */}
            <div className="insight-box">
              <span className="material-symbols-outlined">lightbulb</span>
              <p className="insight-text">
                <strong>Insight IA:</strong> Humedad de suelo favorable detectada por sensores Sentinel-2 para el área seleccionada.
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Detailed Form (7 columns) */}
        <section className="form-section-col">
          <div className="premium-card">
            <div className="card-title-row">
              <span className="material-symbols-outlined">experiment</span>
              <h3>Información Detallada de la Parcela</h3>
            </div>
            
            <div className="agro-form">
              <div className="form-field">
                <label>Departamento</label>
                <select 
                  className="form-input-premium" 
                  name="departamento" 
                  value={departamento} 
                  onChange={(e) => {
                    handleChange(e);
                    actualizarFormulario({ municipio: '' });
                  }} 
                  required
                >
                  <option value="">Selecciona...</option>
                  {departamentosUnicos.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Municipio</label>
                <select 
                  className="form-input-premium" 
                  name="municipio" 
                  value={municipio} 
                  onChange={handleChange} 
                  required 
                  disabled={!departamento}
                >
                  <option value="">Selecciona...</option>
                  {municipiosFiltrados.map(m => (
                    <option key={m.id} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Tipo de Suelo</label>
                <select className="form-input-premium" name="tipo_suelo" value={tipo_suelo} onChange={handleChange} required>
                  <option value="">Selecciona...</option>
                  <option value="Arcilloso">Arcilloso</option>
                  <option value="Arenoso">Arenoso</option>
                  <option value="Franco">Franco</option>
                  <option value="Franco-Arcilloso">Franco-Arcilloso</option>
                  <option value="Limoso">Limoso</option>
                </select>
              </div>

              <div className="form-field">
                <label>Mes de Siembra</label>
                <select className="form-input-premium" name="mes_siembra" value={mes_siembra} onChange={handleChange} required>
                  <option value="">Selecciona...</option>
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map(mes => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Área (hectáreas)</label>
                <input 
                  type="number" step="0.1" min="0" 
                  className="form-input-premium" 
                  name="area_hectareas" 
                  value={area_hectareas} 
                  onChange={handleChange} 
                  placeholder="Ej: 15.5" 
                  required 
                />
              </div>

              <div className="form-field">
                <label>¿Acceso a Riego?</label>
                <select className="form-input-premium" name="acceso_riego" value={acceso_riego} onChange={(e) => actualizarFormulario({ acceso_riego: e.target.value === 'true' })}>
                  <option value="false">No, dependiente de lluvia</option>
                  <option value="true">Sí, sistema activo</option>
                </select>
              </div>

              <div className="form-field">
                <label>pH del Suelo <span>(opcional)</span></label>
                <input 
                  type="number" step="0.1" min="0" max="14" 
                  className="form-input-premium" 
                  name="ph_suelo" 
                  value={ph_suelo} 
                  onChange={handleChange} 
                  placeholder="Ej: 6.5" 
                />
              </div>

              <div className="form-field">
                <label>Textura <span>(opcional)</span></label>
                <input 
                  type="text" 
                  className="form-input-premium" 
                  name="textura_suelo" 
                  value={textura_suelo} 
                  onChange={handleChange} 
                  placeholder="Ej: Fina" 
                />
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>Materia Orgánica (%) <span>(opcional)</span></label>
                <input 
                  type="number" step="0.1" min="0" max="100" 
                  className="form-input-premium" 
                  name="materia_organica" 
                  value={materia_organica} 
                  onChange={handleChange} 
                  placeholder="Ej: 3.2" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer Row: CTA + Status (12 columns) */}
        <div className="footer-cards-row">
          <div className="cta-ai-card">
            <span className="material-symbols-outlined cta-bg-icon">auto_awesome</span>
            <div className="cta-content">
              <div className="cta-icon-wrapper">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div className="cta-text">
                <h4>¿Listo para el análisis?</h4>
                <p>Nuestra IA procesará 24 variables agroclimáticas, imágenes satelitales y datos históricos para generar su recomendación en segundos.</p>
              </div>
            </div>
            <button type="submit" className="btn-analyze-premium">
              Analizar con IA
            </button>
          </div>

          <div className="status-card">
            <div className="status-card-inner">
              <div className="status-header">
                <p className="status-label">ESTADO DEL MODELO</p>
                <span className="status-badge">ÓPTIMO</span>
              </div>
              <div className="status-body">
                <div className="accuracy-row">
                  <span className="accuracy-label">Precisión actual</span>
                  <span className="accuracy-value">94.2%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-fill" style={{ width: '94.2%' }}></div>
                </div>
                <p className="status-footer">Última actualización: Hace 14 minutos</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Consulta;
