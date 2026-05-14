import styles from './SatelliteAnalysis.module.css';

const SatelliteAnalysis = ({ ndvi, ndwi, cloudCover, soilQuality }) => {
  // Calculate rotation for the needle/gauge based on ndvi (-1 to 1)
  // Mapping -1 to 1 to 0 to 180 degrees
  const rotation = ((ndvi + 1) / 2) * 180;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Análisis Satelital</h3>
        <span className="material-symbols-outlined">query_stats</span>
      </div>

      <div className={styles.gaugeWrapper}>
        <div className={styles.gaugeContainer}>
          <div className={styles.gaugeBg}></div>
          <div 
            className={styles.gaugeFill} 
            style={{ transform: `rotate(${rotation}deg)` }}
          ></div>
          <div className={styles.gaugeCenter}>
            <span className={styles.ndviValue}>{ndvi.toFixed(2)}</span>
            <span className={styles.ndviLabel}>Índice NDVI</span>
          </div>
        </div>
        <div className={styles.gaugeScale}>
          <span>-1.0</span>
          <span>+1.0</span>
        </div>
      </div>

      <div className={styles.dataList}>
        <div className={styles.dataItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemName}>NDWI (Agua)</span>
            <span className={styles.itemSub}>Stress hídrico</span>
          </div>
          <span className={styles.itemValue}>{ndwi.toFixed(2)}</span>
        </div>
        
        <div className={styles.dataItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemName}>Nubosidad</span>
            <span className={styles.itemSub}>Media semanal</span>
          </div>
          <span className={styles.itemValue}>{cloudCover}%</span>
        </div>

        <div className={styles.dataItem}>
          <div className={styles.itemInfo}>
            <span className={styles.itemName}>Calidad Suelo</span>
            <span className={styles.itemSub}>Materia orgánica</span>
          </div>
          <span className={styles.itemValue}>{soilQuality}</span>
        </div>
      </div>

      <button className={styles.historyBtn}>
        <span className="material-symbols-outlined">history</span>
        Ver historial
      </button>
    </div>
  );
};

export default SatelliteAnalysis;
