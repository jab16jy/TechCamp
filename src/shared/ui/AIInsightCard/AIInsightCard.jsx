import styles from './AIInsightCard.module.css';

const AIInsightCard = ({ prediction, image }) => {
  return (
    <div className={styles.card}>
      <div className={styles.decoration}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className={styles.label}>Predicción IA</span>
        </div>
        <p className={styles.text}>{prediction}</p>
        <div className={styles.imageWrapper}>
          <img src={image} alt="Crop prediction landscape" className={styles.image} />
        </div>
      </div>
    </div>
  );
};

export default AIInsightCard;
