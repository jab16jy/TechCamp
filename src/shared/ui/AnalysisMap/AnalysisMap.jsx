import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './AnalysisMap.module.css';
import { useState } from 'react';

const AnalysisMap = ({ lat, lng, indicators = [] }) => {
  const [mapType, setMapType] = useState('satellite');

  const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const topoUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className="material-symbols-outlined">satellite_alt</span>
          <h3 className={styles.title}>Ubicación Analizada</h3>
        </div>
        <div className={styles.controls}>
          <button 
            className={`${styles.toggleBtn} ${mapType === 'satellite' ? styles.active : ''}`}
            onClick={() => setMapType('satellite')}
          >
            Satélite
          </button>
          <button 
            className={`${styles.toggleBtn} ${mapType === 'topo' ? styles.active : ''}`}
            onClick={() => setMapType('topo')}
          >
            Topográfico
          </button>
        </div>
      </div>
      
      <div className={styles.mapWrapper}>
        <MapContainer 
          center={[lat, lng]} 
          zoom={13} 
          className={styles.leafletContainer}
          zoomControl={false}
        >
          <TileLayer url={mapType === 'satellite' ? satelliteUrl : topoUrl} />
          <Marker position={[lat, lng]} />
          <ZoomControl position="bottomright" />
        </MapContainer>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.dot} ${styles.high}`}></div>
            <span>Vigor Alto</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.dot} ${styles.medium}`}></div>
            <span>Vigor Medio</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.dot} ${styles.low}`}></div>
            <span>Vigor Bajo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisMap;
