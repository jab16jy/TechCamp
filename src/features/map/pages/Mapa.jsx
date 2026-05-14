import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import {
  Satellite, Leaf, Thermometer, Droplets, MapPin, Crosshair,
  Trash2, CheckCircle, AlertTriangle, Wind
} from 'lucide-react';
import './Mapa.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const iotIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#10b981;border:2px solid #fff;
    box-shadow:0 0 0 4px rgba(16,185,129,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const IOT_NODES = [
  { id: 'N01', lat: 10.383, lng: -75.477, nombre: 'Nodo Norte-01', hum: 72, temp: 28.4, ndvi: 0.73, estado: 'optimal' },
  { id: 'N02', lat: 10.371, lng: -75.461, nombre: 'Nodo Sur-02',   hum: 61, temp: 29.8, ndvi: 0.61, estado: 'warning' },
  { id: 'N03', lat: 10.377, lng: -75.450, nombre: 'Nodo Este-03',  hum: 55, temp: 31.2, ndvi: 0.54, estado: 'alert' },
];

const ZONA_DATA = {
  ndvi: 0.68,
  temp: 29.2,
  hum: 63,
  precipitacion: 85,
  riesgo: 'Moderado',
};

function DrawControl({ onZoneCreated, onZoneCleared }) {
  const map = useMapEvents({});
  const [drawnItems, setDrawnItems] = useState(null);

  const handleCreated = useCallback((e) => {
    const { layer } = e;
    setDrawnItems(layer);
    const latlngs = layer.getLatLngs()[0];
    const center = layer.getBounds().getCenter();
    const area = L.GeometryUtil.geodesicArea(latlngs) / 10000;
    onZoneCreated({ latlngs, center, area: area.toFixed(2) });
  }, [onZoneCreated]);

  const handleDeleted = useCallback(() => {
    setDrawnItems(null);
    onZoneCleared();
  }, [onZoneCleared]);

  useState(() => {
    const drawnItemsLayer = new L.FeatureGroup();
    map.addLayer(drawnItemsLayer);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        rectangle: true,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: { featureGroup: drawnItemsLayer, remove: true }
    });

    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeLayer(drawnItemsLayer);
    };
  }, [map, handleCreated, handleDeleted]);

  return null;
}

const Mapa = () => {
  const [zona, setZona] = useState(null);
  const [layerType, setLayerType] = useState('satellite');

  const handleZoneCreated = useCallback((data) => {
    setZona(data);
  }, []);

  const handleZoneCleared = useCallback(() => {
    setZona(null);
  }, []);

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

        {/* Zone info panel */}
        <div className={`mapa-zone-panel ${zona ? 'mapa-zone-panel-active' : ''}`}>
          <div className="mapa-zone-header">
            <Crosshair size={16} className="text-emerald-600" />
            <span>Zona Seleccionada</span>
          </div>
          {zona ? (
            <>
              <div className="mapa-zone-stats">
                <div className="mapa-zone-stat">
                  <Leaf size={14} className="text-emerald-500" />
                  <div>
                    <span className="mapa-zone-stat-label">NDVI Promedio</span>
                    <span className="mapa-zone-stat-value">{ZONA_DATA.ndvi}</span>
                  </div>
                </div>
                <div className="mapa-zone-stat">
                  <Thermometer size={14} className="text-amber-500" />
                  <div>
                    <span className="mapa-zone-stat-label">Temperatura</span>
                    <span className="mapa-zone-stat-value">{ZONA_DATA.temp}°C</span>
                  </div>
                </div>
                <div className="mapa-zone-stat">
                  <Droplets size={14} className="text-sky-500" />
                  <div>
                    <span className="mapa-zone-stat-label">Humedad</span>
                    <span className="mapa-zone-stat-value">{ZONA_DATA.hum}%</span>
                  </div>
                </div>
                <div className="mapa-zone-stat">
                  <Wind size={14} className="text-slate-500" />
                  <div>
                    <span className="mapa-zone-stat-label">Precipitación</span>
                    <span className="mapa-zone-stat-value">{ZONA_DATA.precipitacion} mm</span>
                  </div>
                </div>
              </div>
              <div className="mapa-zone-area">
                <MapPin size={12} />
                <span>Área: {zona.area} ha · Centro: {zona.center.lat.toFixed(4)}°, {zona.center.lng.toFixed(4)}°</span>
              </div>
              <div className="mapa-zone-risk">
                <AlertTriangle size={12} />
                <span>Riesgo: {ZONA_DATA.riesgo}</span>
              </div>
            </>
          ) : (
            <div className="mapa-zone-empty">
              <Crosshair size={24} className="text-slate-300" />
              <p>Usa las herramientas de dibujo (polígono o rectángulo) en la esquina superior derecha del mapa para delimitar una zona y ver sus variables ambientales.</p>
            </div>
          )}
        </div>

        {/* Layer toggle */}
        <div className="mapa-layer-toggle">
          <button
            className={`mapa-layer-btn ${layerType === 'satellite' ? 'active' : ''}`}
            onClick={() => setLayerType('satellite')}
          >
            <Satellite size={14} />
            <span>Satélite</span>
          </button>
          <button
            className={`mapa-layer-btn ${layerType === 'osm' ? 'active' : ''}`}
            onClick={() => setLayerType('osm')}
          >
            <span>Mapa</span>
          </button>
        </div>

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
