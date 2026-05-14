import styles from './CropRecommendation.module.css';

const CropRecommendation = ({ cultivo, score, riesgo, descripcion, metadatos }) => {
  const strokeDasharray = 339.292;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * score) / 100;

  return (
    <div className={styles.card}>
      <div className={styles.topographicBg}></div>
      <div className={styles.content}>
        <div className={styles.infoWrapper}>
          <div className={styles.header}>
            <h2 className={styles.title}>{cultivo} ({score}%)</h2>
            <div className={`${styles.badge} ${styles[riesgo.toLowerCase().replace(' ', '')]}`}>
              RIESGO {riesgo.toUpperCase()}
            </div>
          </div>
          <p className={styles.description}>{descripcion}</p>
          <p className={styles.metadata}>{metadatos}</p>
        </div>

        <div className={styles.chartWrapper}>
          <div className={styles.relative}>
            <svg className={styles.svg}>
              <circle 
                className={styles.circleBg} 
                cx="64" cy="64" r="54" 
                fill="transparent" strokeWidth="8"
              />
              <circle 
                className={styles.circleProgress} 
                cx="64" cy="64" r="54" 
                fill="transparent" strokeWidth="10"
                style={{ strokeDasharray, strokeDashoffset }}
              />
            </svg>
            <div className={styles.scoreText}>
              <span className={styles.percentage}>{score}%</span>
              <span className={styles.label}>Afinidad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
