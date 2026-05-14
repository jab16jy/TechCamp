import { memo } from 'react';
import styles from './AmbientBackground.module.css';

const TOPO_PATHS = [
  'M0,180 C200,160 350,220 500,190 S700,140 850,175 S1000,210 1200,170 S1350,130 1440,160',
  'M0,280 C180,260 320,310 480,280 S650,240 820,270 S980,300 1160,255 S1320,220 1440,250',
  'M0,380 C220,355 380,410 540,375 S720,330 900,365 S1060,400 1240,350 S1380,310 1440,340',
  'M0,480 C160,455 340,500 500,470 S680,435 860,460 S1020,490 1200,440 S1360,410 1440,435',
  'M0,580 C200,560 360,605 520,575 S700,540 880,565 S1040,590 1220,545 S1380,515 1440,540',
  'M0,680 C180,660 340,710 500,675 S660,640 840,665 S1000,690 1180,640 S1340,610 1440,635',
  'M0,780 C220,760 380,800 540,770 S720,740 900,760 S1060,785 1230,740 S1380,715 1440,735',
  'M0,120 C200,100 360,145 520,115 S680,80 860,105 S1020,130 1200,80 S1360,50 1440,75',
  'M0,860 C160,840 340,880 500,850 S660,820 840,840 S1000,865 1180,820 S1340,790 1440,815',
];

const PARTICLES = [
  { cx: 120, cy: 180, r: 1.5, fill: 'rgba(255,255,255,0.5)' },
  { cx: 380, cy: 520, r: 1, fill: 'rgba(255,255,255,0.35)' },
  { cx: 650, cy: 280, r: 2, fill: 'rgba(212,195,140,0.3)' },
  { cx: 900, cy: 620, r: 1.5, fill: 'rgba(255,255,255,0.4)' },
  { cx: 1150, cy: 150, r: 1, fill: 'rgba(255,255,255,0.3)' },
  { cx: 250, cy: 750, r: 1.5, fill: 'rgba(163,190,140,0.3)' },
  { cx: 780, cy: 420, r: 1, fill: 'rgba(255,255,255,0.45)' },
  { cx: 1320, cy: 500, r: 2, fill: 'rgba(255,255,255,0.25)' },
  { cx: 500, cy: 120, r: 1, fill: 'rgba(212,195,140,0.35)' },
  { cx: 1050, cy: 780, r: 1.5, fill: 'rgba(255,255,255,0.3)' },
  { cx: 80, cy: 400, r: 1.2, fill: 'rgba(255,255,255,0.25)' },
  { cx: 1350, cy: 300, r: 1.8, fill: 'rgba(165,198,210,0.25)' },
];

const AmbientBackground = memo(() => (
  <div className={styles.root} aria-hidden="true">
    <div className={styles.mesh} />
    <svg
      className={styles.topo}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {TOPO_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.7 - i * 0.04}
          opacity={0.25 - i * 0.02}
        />
      ))}
    </svg>
    <div className={`${styles.orb} ${styles.orb1}`} />
    <div className={`${styles.orb} ${styles.orb2}`} />
    <div className={`${styles.orb} ${styles.orb3}`} />
    <div className={`${styles.orb} ${styles.orb4}`} />
    <svg
      className={styles.particles}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {PARTICLES.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.fill}
          className={styles.particle}
        />
      ))}
    </svg>
    <div className={styles.noise} />
    <div className={styles.vignette} />
  </div>
));

AmbientBackground.displayName = 'AmbientBackground';
export default AmbientBackground;
