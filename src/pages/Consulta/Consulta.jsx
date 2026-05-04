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
      <div className="consulta-header">
        <h1>Nueva Consulta</h1>
        <p>Ingresa los detalles de tu parcela para recibir recomendaciones impulsadas por IA.</p>
      </div>

      <form className="consulta-grid" onSubmit={handleSubmit}>
        {/* Columna Izquierda: Formulario */}
        <div className="formulario-seccion">
          <h2>Datos de la Parcela</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departamento">Departamento *</label>
              <select 
                className="form-control" 
                name="departamento" 
                id="departamento" 
                value={departamento} 
                onChange={(e) => {
                  handleChange(e);
                  actualizarFormulario({ municipio: '' }); // Resetear municipio al cambiar departamento
                }} 
                required
              >
                <option value="">Selecciona...</option>
                {departamentosUnicos.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="municipio">Municipio *</label>
              <select 
                className="form-control" 
                name="municipio" 
                id="municipio" 
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo_suelo">Tipo de Suelo *</label>
              <select className="form-control" name="tipo_suelo" id="tipo_suelo" value={tipo_suelo} onChange={handleChange} required>
                <option value="">Selecciona...</option>
                <option value="Arcilloso">Arcilloso</option>
                <option value="Arenoso">Arenoso</option>
                <option value="Franco">Franco</option>
                <option value="Franco-Arcilloso">Franco-Arcilloso</option>
                <option value="Limoso">Limoso</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mes_siembra">Mes de Siembra *</label>
              <select className="form-control" name="mes_siembra" id="mes_siembra" value={mes_siembra} onChange={handleChange} required>
                <option value="">Selecciona...</option>
                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="area_hectareas">Área (hectáreas) *</label>
              <input type="number" step="0.1" min="0" className="form-control" name="area_hectareas" id="area_hectareas" value={area_hectareas} onChange={handleChange} placeholder="Ej. 5.5" required />
            </div>

            <div className="form-group">
              <label htmlFor="acceso_riego">¿Acceso a Riego?</label>
              <select className="form-control" name="acceso_riego" id="acceso_riego" value={acceso_riego} onChange={(e) => actualizarFormulario({ acceso_riego: e.target.value === 'true' })}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ph_suelo">pH del Suelo (opcional)</label>
              <input type="number" step="0.1" min="0" max="14" className="form-control" name="ph_suelo" id="ph_suelo" value={ph_suelo} onChange={handleChange} placeholder="Ej. 6.5" />
            </div>

            <div className="form-group">
              <label htmlFor="textura_suelo">Textura (opcional)</label>
              <input type="text" className="form-control" name="textura_suelo" id="textura_suelo" value={textura_suelo} onChange={handleChange} placeholder="Ej. Fina, Gruesa" />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="materia_organica">Materia Orgánica (%) (opcional)</label>
            <input type="number" step="0.1" min="0" max="100" className="form-control" name="materia_organica" id="materia_organica" value={materia_organica} onChange={handleChange} placeholder="Ej. 2.5" />
          </div>

        </div>

        {/* Columna Derecha: Mapa */}
        <div className="mapa-seccion">
          <h2>Ubicación en el Mapa</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Haz clic en el mapa, arrastra el marcador o ingresa las coordenadas directamente.
          </p>
          
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              value={coordsInput} 
              onChange={handleCoordsInputChange} 
              placeholder="Ej. 10.9685, -74.7813" 
            />
          </div>

          <div className="mapa-container">
            <MapContainer 
              center={[10.5, -74.8]} 
              zoom={7} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={{ lat, lng }} setPosition={handleMapChange} />
            </MapContainer>
          </div>
          
          <div className="btn-container">
            <button type="submit" className="btn-primario">
              Analizar zona 🚜
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Consulta;
