import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './MapSelector.module.css';

// Fix for Leaflet icons
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

/**
 * MapSelector — Reusable component to select geographic coordinates.
 * @param {Object} position - { lat, lng }
 * @param {Function} onPositionChange - Callback when position changes.
 * @param {number} height - Map height in pixels.
 */
const MapSelector = ({ position, onPositionChange, height = 400 }) => {
  const initialCenter = position.lat && position.lng ? [position.lat, position.lng] : [10.5, -74.8];

  return (
    <div className={styles.mapContainer} style={{ height: `${height}px` }}>
      <MapContainer 
        center={initialCenter} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <LocationMarker position={position} setPosition={onPositionChange} />
      </MapContainer>
      
      <div className={styles.coordsBadge}>
        <div className={styles.coordsIcon}>
          <span className="material-symbols-outlined">location_on</span>
        </div>
        <div className={styles.coordsText}>
          <span className={styles.coordsLabel}>Coordenadas seleccionadas</span>
          <span className={styles.coordsValue}>
            {position.lat?.toFixed(4)}° N, {position.lng?.toFixed(4)}° W
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
