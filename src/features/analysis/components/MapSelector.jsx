import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from '@shared/utils/leafletDrawPatch';
import { MapPin, Maximize2 } from 'lucide-react';
import { geoDecode } from '@shared/services/api';
import styles from './MapSelector.module.css';

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

  return position.lat === null || position.lng === null ? null : (
    <Marker position={position} draggable eventHandlers={{
      dragend: (e) => { setPosition(e.target.getLatLng()); },
    }} />
  );
};

const DrawTool = ({ onZoneCreated, onZoneCleared }) => {
  const map = useMapEvents({});
  const drawnGroup = useRef(new L.FeatureGroup());

  const handleCreated = useCallback((e) => {
    const { layer } = e;
    drawnGroup.current.clearLayers();
    drawnGroup.current.addLayer(layer);
    const latlngs = layer.getLatLngs()[0];
    const center = layer.getBounds().getCenter();
    const area = L.GeometryUtil.geodesicArea(latlngs) / 10000;
    onZoneCreated({ center, area: Number(area.toFixed(2)), latlngs });
  }, [onZoneCreated]);

  const handleDeleted = useCallback(() => {
    drawnGroup.current.clearLayers();
    onZoneCleared();
  }, [onZoneCleared]);

  useEffect(() => {
    map.addLayer(drawnGroup.current);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: '#2D5A27' } },
        rectangle: { shapeOptions: { color: '#2D5A27' } },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: { featureGroup: drawnGroup.current, remove: true },
    });

    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeLayer(drawnGroup.current);
    };
  }, [map, handleCreated, handleDeleted]);

  return null;
};

const MapSelector = ({ position, onPositionChange, onGeoDetected, height = 400 }) => {
  const initialCenter = position.lat && position.lng ? [position.lat, position.lng] : [10.5, -74.8];
  const [drawnArea, setDrawnArea] = useState(null);
  const [detectedGeo, setDetectedGeo] = useState(null);
  const [detecting, setDetecting] = useState(false);

  const handleZoneCreated = useCallback(async ({ center, area }) => {
    const lat = center.lat;
    const lng = center.lng;

    setDrawnArea({ lat, lng, area });
    onPositionChange({ lat, lng });

    setDetecting(true);
    try {
      const geo = await geoDecode(lat, lng);
      if (geo.detectado) {
        setDetectedGeo({
          departamento: geo.departamento,
          municipio: geo.municipio,
          municipio_id: geo.municipio_id,
        });
        onGeoDetected?.({
          departamento: geo.departamento,
          municipio: geo.municipio,
          area_hectareas: area,
          lat,
          lng,
        });
      }
    } catch {
      /* fallback silencioso */
    } finally {
      setDetecting(false);
    }
  }, [onPositionChange, onGeoDetected]);

  const handleZoneCleared = useCallback(() => {
    setDrawnArea(null);
    setDetectedGeo(null);
  }, []);

  const handleMapClick = useCallback((latlng) => {
    if (onGeoDetected) {
      setDetecting(true);
      onPositionChange(latlng);
      geoDecode(latlng.lat, latlng.lng).then((geo) => {
        if (geo.detectado) {
          setDetectedGeo({
            departamento: geo.departamento,
            municipio: geo.municipio,
          });
          onGeoDetected({
            departamento: geo.departamento,
            municipio: geo.municipio,
            lat: latlng.lat,
            lng: latlng.lng,
          });
        }
        setDetecting(false);
      });
    }
  }, [onPositionChange, onGeoDetected]);

  return (
    <div className={styles.mapContainer} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <MapContainer center={initialCenter} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <LocationMarker position={position} setPosition={onGeoDetected ? handleMapClick : onPositionChange} />
        <DrawTool onZoneCreated={handleZoneCreated} onZoneCleared={handleZoneCleared} />
      </MapContainer>

      <div className={styles.coordsBadge}>
        <div className={styles.coordsIcon}>
          <MapPin size={20} />
        </div>
        <div className={styles.coordsText}>
          <span className={styles.coordsLabel}>
            {detecting ? 'Detectando ubicacion...' : 'Coordenadas seleccionadas'}
          </span>
          <span className={styles.coordsValue}>
            {position.lat?.toFixed(4)}° N, {position.lng?.toFixed(4)}° W
          </span>
        </div>
        {detectedGeo && (
          <div className={styles.geoBadge}>
            <span className={styles.geoMuni}>{detectedGeo.municipio}</span>
            <span className={styles.geoDept}>{detectedGeo.departamento}</span>
          </div>
        )}
        {drawnArea && (
          <div className={styles.areaBadge}>
            <Maximize2 size={14} />
            <span>{drawnArea.area.toLocaleString()} ha</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSelector;
