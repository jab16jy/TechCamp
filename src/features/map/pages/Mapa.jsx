import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, Polygon } from 'react-leaflet';
import L from '@shared/utils/leafletDrawPatch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import {
  MapPin, Leaf, Thermometer, Droplets, Radio,
  CloudRain, BarChart3, ChevronRight, Loader2,
} from 'lucide-react';
import DrawControl from '@features/map/components/DrawControl/DrawControl';
import useMapZone from '@features/map/hooks/useMapZone';
import './Mapa.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Mapa = () => {
  const authorized = useAuthGuard('investigador');
  const {
    zona, layerType, setLayerType,
    sensors, climate, mapCenter, loadingSensors,
    handleZoneCreated, handleZoneCleared,
  } = useMapZone();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="mapa">
      <div className="m-sat-root">
        <MapContainer
          center={mapCenter}
          zoom={14}
          className="m-sat-map"
          zoomControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked={layerType === 'satellite'} name="Satelite ESRI">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked={layerType === 'osm'} name="OpenStreetMap">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {zona && zona.center && (
            <Circle
              center={[zona.center.lat, zona.center.lng]}
              radius={500}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.12, weight: 1.5, dashArray: '6 4' }}
            />
          )}

          {zona && zona.latlngs && (
            <Polygon
              positions={zona.latlngs.map((l) => [l.lat, l.lng])}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.18, weight: 2 }}
            />
          )}

          {sensors.map((node) => (
            <Marker key={node.id} position={[node.lat, node.lng]} icon={node.icon}>
              <Popup>
                <div className="m-popup">
                  <strong>{node.nombre}</strong>
                  <div className="m-popup-grid">
                    {node.ndvi != null && <><span>NDVI</span><span className="m-popup-val">{node.ndvi}</span></>}
                    {node.hum != null && <><span>Humedad</span><span className="m-popup-val">{node.hum}%</span></>}
                    {node.temp != null && <><span>Temp</span><span className="m-popup-val">{node.temp} C</span></>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <DrawControl onZoneCreated={handleZoneCreated} onZoneCleared={handleZoneCleared} />
        </MapContainer>

        <div className="m-topbar">
          <div className="m-topbar-left">
            <MapPin size={14} />
            <span>Dashboard Satelital</span>
          </div>
          <div className="m-topbar-right">
            <button
              className={`m-layer-btn ${layerType === 'satellite' ? 'active' : ''}`}
              onClick={() => setLayerType('satellite')}
            >
              Satelite
            </button>
            <button
              className={`m-layer-btn ${layerType === 'osm' ? 'active' : ''}`}
              onClick={() => setLayerType('osm')}
            >
              Mapa
            </button>
          </div>
        </div>

        <div className="m-panels">
          <div className="m-panel">
            <div className="m-panel-head">
              <Radio size={15} /> Sensores IoT
              {loadingSensors && <Loader2 size={12} className="spin" />}
            </div>
            <div className="m-panel-body m-sensor-list">
              {!loadingSensors && sensors.length === 0 && (
                <p className="m-empty-text">Sin sensores registrados</p>
              )}
              {sensors.slice(0, 6).map((s) => (
                <div key={s.id} className="m-sensor-row">
                  <span className={`m-sensor-dot ${s.estado === 'critical' ? 'crit' : s.estado === 'warn' ? 'warn' : 'ok'}`} />
                  <span className="m-sensor-name">{s.nombre || s.id}</span>
                  {s.ndvi != null && <span className="m-sensor-stat">NDVI {s.ndvi}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="m-panel">
            <div className="m-panel-head">
              <Thermometer size={15} /> Clima
            </div>
            <div className="m-panel-body">
              {climate ? (
                <div className="m-climate-grid">
                  <div className="m-climate-item">
                    <Thermometer size={13} />
                    <span className="m-climate-val">{climate.temperatura} C</span>
                  </div>
                  <div className="m-climate-item">
                    <CloudRain size={13} />
                    <span className="m-climate-val">{climate.precipitacion} mm</span>
                  </div>
                  <div className="m-climate-item">
                    <Droplets size={13} />
                    <span className="m-climate-val">{climate.humedad}%</span>
                  </div>
                </div>
              ) : (
                <p className="m-empty-text">Cargando datos climaticos...</p>
              )}
            </div>
          </div>

          {zona && (
            <div className="m-panel">
              <div className="m-panel-head">
                <BarChart3 size={15} /> Zona delimitada
              </div>
              <div className="m-panel-body">
                <div className="m-zone-info">
                  <span>Area: <strong>{zona.area} ha</strong></span>
                  <span>Centro: {zona.center?.lat.toFixed(4)}, {zona.center?.lng.toFixed(4)}</span>
                </div>
                <button className="m-zone-action" onClick={() => window.open('/investigador/analisis', '_self')}>
                  Analizar esta zona <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="m-legend">
          <div className="m-legend-title">NDVI</div>
          <div className="m-legend-gradient" />
          <div className="m-legend-labels">
            <span>0.0 Estres</span>
            <span>1.0 Optimo</span>
          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default Mapa;
