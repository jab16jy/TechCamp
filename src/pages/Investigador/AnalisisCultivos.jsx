import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useAppStore from '../../context/useAppStore';
import { analizarUbicacion, getMunicipios } from '../../services/api';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './AnalisisCultivos.module.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

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

const AnalisisCultivos = () => {
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

  const municipiosRef = useRef([]);

  useEffect(() => {
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

  const handleMapChange = (latlng) => {
    actualizarFormulario({
      lat: latlng.lat,
      lng: latlng.lng
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departamento || !municipio || !tipo_suelo || !mes_siembra || !area_hectareas) {
      agregarToast('Por favor, completa los campos requeridos', 'error');
      return;
    }

    setCargandoAnalisis(true);
    try {
      const payload = { ...formulario };
      payload.area_hectareas = Number(payload.area_hectareas);
      const resultado = await analizarUbicacion(payload);
      setResultado(resultado);
      agregarToast('Análisis completado', 'success');
      navigate('/resultado');
    } catch (error) {
      setErrorAnalisis(error.message);
      agregarToast('Error al analizar', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return (
    <ResearcherLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Análisis de Cultivos</h1>
          <p>Configure los parámetros de su parcela para obtener recomendaciones agronómicas de precisión.</p>
        </header>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
            Datos de la Parcela
          </button>
          <button className={styles.tabBtn}>
            Calidad del Suelo
            <span className={styles.tabBadge}>MODO AVANZADO</span>
          </button>
        </div>

        <form className={styles.gridMain} onSubmit={handleSubmit}>
          {/* Left Column: Map */}
          <div className={styles.colMap}>
            <div className={styles.premiumCard}>
              <div className={styles.cardHeader}>
                <span className="material-symbols-outlined">map</span>
                <h3>Ubicación en el Mapa</h3>
              </div>
              <p className={styles.cardDesc}>Haz clic en el mapa o arrastra el marcador para precisar las coordenadas.</p>
              
              <div className={styles.mapWrapper}>
                <MapContainer 
                  center={[lat || 10.5, lng || -74.8]} 
                  zoom={11} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  <LocationMarker position={{ lat, lng }} setPosition={handleMapChange} />
                </MapContainer>
                <div className={styles.coordsBadge}>
                  <p className={styles.coordsLabel}>Región seleccionada</p>
                  <p className={styles.coordsValue}>{lat?.toFixed(2)}° N, {lng?.toFixed(2)}° W</p>
                </div>
              </div>

              <div className={styles.insightBox}>
                <span className="material-symbols-outlined">lightbulb</span>
                <p>
                  <strong>Insight IA:</strong> Humedad de suelo favorable detectada por sensores Sentinel-2 para el área seleccionada.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className={styles.colForm}>
            <div className={styles.premiumCard}>
              <div className={styles.cardHeader}>
                <span className="material-symbols-outlined">experiment</span>
                <h3>Información Detallada de la Parcela</h3>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Departamento</label>
                  <select name="departamento" value={departamento} onChange={handleChange} required>
                    <option value="">Selecciona...</option>
                    {departamentosUnicos.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Municipio</label>
                  <select name="municipio" value={municipio} onChange={handleChange} required disabled={!departamento}>
                    <option value="">Selecciona...</option>
                    {municipiosFiltrados.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Tipo de Suelo</label>
                  <select name="tipo_suelo" value={tipo_suelo} onChange={handleChange} required>
                    <option value="">Selecciona...</option>
                    <option value="Franco-Arcilloso">Franco-Arcilloso</option>
                    <option value="Arenoso">Arenoso</option>
                    <option value="Limoso">Limoso</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Mes de Siembra</label>
                  <select name="mes_siembra" value={mes_siembra} onChange={handleChange} required>
                    <option value="">Selecciona...</option>
                    {['Marzo','Abril','Mayo'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Área (hectáreas)</label>
                  <input type="number" name="area_hectareas" value={area_hectareas} onChange={handleChange} placeholder="Ej: 15.5" required />
                </div>
                <div className={styles.field}>
                  <label>¿Acceso a Riego?</label>
                  <select name="acceso_riego" value={acceso_riego} onChange={(e) => actualizarFormulario({ acceso_riego: e.target.value === 'true' })}>
                    <option value="true">Sí, por goteo</option>
                    <option value="false">No, dependiente de lluvia</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>pH del Suelo <span>(opcional)</span></label>
                  <input type="text" name="ph_suelo" value={ph_suelo} onChange={handleChange} placeholder="Ej: 6.5" />
                </div>
                <div className={styles.field}>
                  <label>Textura <span>(opcional)</span></label>
                  <input type="text" name="textura_suelo" value={textura_suelo} onChange={handleChange} placeholder="Ej: Fina" />
                </div>
                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                  <label>Materia Orgánica (%) <span>(opcional)</span></label>
                  <input type="text" name="materia_organica" value={materia_organica} onChange={handleChange} placeholder="Ej: 3.2" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className={styles.colCta}>
            <div className={styles.ctaCard}>
              <span className={`material-symbols-outlined ${styles.ctaBgIcon}`}>auto_awesome</span>
              <div className={styles.ctaContent}>
                <div className={styles.ctaIconBox}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div className={styles.ctaText}>
                  <h4>¿Listo para el análisis?</h4>
                  <p>Nuestra IA procesará 24 variables agroclimáticas, imágenes satelitales y datos históricos para generar su recomendación en segundos.</p>
                </div>
              </div>
              <button type="submit" className={styles.btnAnalyze}>Analizar con IA</button>
            </div>
          </div>

          <div className={styles.colStatus}>
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <p>ESTADO DEL MODELO</p>
                <span className={styles.badgeOptimo}>ÓPTIMO</span>
              </div>
              <div className={styles.statusBody}>
                <div className={styles.accRow}>
                  <span>Precisión actual</span>
                  <strong>94.2%</strong>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: '94.2%' }}></div>
                </div>
                <p className={styles.statusFooter}>Última actualización: Hace 14 minutos</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ResearcherLayout>
  );
};

export default AnalisisCultivos;
