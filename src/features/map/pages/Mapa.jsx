import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import {
  Leaf, Thermometer, Droplets, MapPin,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import ZonePanel from '@features/map/components/ZonePanel/ZonePanel';
import LayerToggle from '@features/map/components/LayerToggle/LayerToggle';
import DrawControl from '@features/map/components/DrawControl/DrawControl';
import useMapZone, { IOT_NODES, ZONA_DATA, iotIcon } from '@features/map/hooks/useMapZone';
import './Mapa.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Mapa = () => {
  const {
    zona,
    layerType,
    setLayerType,
    handleZoneCreated,
    handleZoneCleared,
  } = useMapZone();

  const estadoIcon = (estado) => {
    if (estado === 'optimal') return <CheckCircle size={12} className="text-emerald-500" />;
    if (estado === 'warning') return <AlertTriangle size={12} className="text-amber-500" />;
    return <AlertTriangle size={12} className="text-red-500" />;
  };

  return (
    <ResearcherLayout activeTab="mapa">
      <div className="mapa-container">
        {/* Header chips */}
        <div className="mapa-chips">
          <div className="mapa-chip">
            <MapPin size={12} />
            <span>Zona Caribe · Colombia</span>
          </div>
          <div className="mapa-chip mapa-chip-green">
            <Leaf size={12} />
            <span>NDVI Promedio: {zona ? ZONA_DATA.ndvi : '--'}</span>
          </div>
          <div className="mapa-chip mapa-chip-amber">
            <Thermometer size={12} />
            <span>{zona ? `${ZONA_DATA.temp}°C` : '--°C · --% HR'}</span>
          </div>
          <div className="mapa-chip">
            <Droplets size={12} />
            <span>{zona ? `${ZONA_DATA.hum}% HR` : '--% HR'}</span>
          </div>
        </div>

        {/* Map */}
        <div className="mapa-map-wrapper">
          <MapContainer
            center={[10.377, -75.461]}
            zoom={14}
            className="mapa-map"
            zoomControl={false}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked={layerType === 'satellite'} name="Satélite ESRI">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri, Maxar, Earthstar"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer checked={layerType === 'osm'} name="OpenStreetMap">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* NDVI overlay circles */}
            <Circle center={[10.377, -75.461]} radius={600}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.18, weight: 1.5, dashArray: '6 4' }}
            />
            <Circle center={[10.371, -75.450]} radius={300}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 1.5 }}
            />

            {/* IoT Nodes */}
            {IOT_NODES.map((node) => (
              <Marker key={node.id} position={[node.lat, node.lng]} icon={iotIcon}>
                <Popup>
                  <div className="mapa-popup">
                    <div className="mapa-popup-header">
                      <span className="mapa-popup-title">{node.nombre}</span>
                      {estadoIcon(node.estado)}
                    </div>
                    <div className="mapa-popup-grid">
                      <span>Humedad</span><span className="mapa-popup-val">{node.hum}%</span>
                      <span>Temperatura</span><span className="mapa-popup-val">{node.temp}°C</span>
                      <span>NDVI</span><span className="mapa-popup-val">{node.ndvi}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Drawn zone polygon */}
            {zona && zona.latlngs && (
              <Polygon
                positions={zona.latlngs.map(l => [l.lat, l.lng])}
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }}
              />
            )}

            <DrawControl onZoneCreated={handleZoneCreated} onZoneCleared={handleZoneCleared} />
          </MapContainer>
        </div>

        <ZonePanel zona={zona} />
        <LayerToggle layerType={layerType} onLayerChange={setLayerType} />

        {/* NDVI Legend */}
        <div className="mapa-legend">
          <p className="mapa-legend-title">NDVI</p>
          <div className="mapa-legend-bar" />
          <div className="mapa-legend-labels">
            <span>0 Estrés</span>
            <span>1.0 Óptimo</span>
          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default Mapa;
