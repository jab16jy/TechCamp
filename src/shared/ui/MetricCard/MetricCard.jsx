import styles from './MetricCard.module.css';

const MetricCard = ({ icon, label, value, unit, status, colorClass }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${styles[colorClass]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {status && (
          <span className={`${styles.status} ${styles[status.toLowerCase()]}`}>
            {status}
          </span>
        )}
      </div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <h3 className={styles.value}>
          {value}{unit}
        </h3>
      </div>
    </div>
  );
};

export default MetricCard;
