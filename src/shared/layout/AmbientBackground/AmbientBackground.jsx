import { memo, useState, useEffect, useCallback } from 'react';
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

const PALETTES = [
  {
    name: 'green',
    mesh: [
      'rgba(163, 190, 140, 0.25)',
      'rgba(186, 200, 155, 0.18)',
      'rgba(212, 195, 140, 0.12)',
      'rgba(165, 198, 210, 0.15)',
      'rgba(200, 185, 155, 0.1)',
      'rgba(175, 205, 175, 0.12)',
    ],
    orbs: [
      'rgba(163, 190, 140, 0.2)',
      'rgba(212, 195, 140, 0.12)',
      'rgba(165, 198, 210, 0.1)',
      'rgba(175, 205, 175, 0.12)',
    ],
    topo: 'rgba(120, 140, 100, 0.06)',
    vignette: 'rgba(180, 170, 150, 0.08)',
    particles: [
      'rgba(255,255,255,0.5)',
      'rgba(255,255,255,0.35)',
      'rgba(212,195,140,0.3)',
      'rgba(255,255,255,0.4)',
      'rgba(255,255,255,0.3)',
      'rgba(163,190,140,0.3)',
      'rgba(255,255,255,0.45)',
      'rgba(255,255,255,0.25)',
      'rgba(212,195,140,0.35)',
      'rgba(255,255,255,0.3)',
      'rgba(255,255,255,0.25)',
      'rgba(165,198,210,0.25)',
    ],
  },
  {
    name: 'yellow',
    mesh: [
      'rgba(212, 195, 140, 0.25)',
      'rgba(200, 185, 155, 0.18)',
      'rgba(186, 200, 155, 0.12)',
      'rgba(220, 200, 160, 0.15)',
      'rgba(212, 195, 140, 0.1)',
      'rgba(200, 185, 155, 0.12)',
    ],
    orbs: [
      'rgba(212, 195, 140, 0.2)',
      'rgba(200, 185, 155, 0.12)',
      'rgba(220, 200, 160, 0.1)',
      'rgba(186, 200, 155, 0.12)',
    ],
    topo: 'rgba(160, 140, 100, 0.06)',
    vignette: 'rgba(180, 170, 150, 0.08)',
    particles: [
      'rgba(255,255,255,0.5)',
      'rgba(255,255,255,0.35)',
      'rgba(212,195,140,0.3)',
      'rgba(255,255,255,0.4)',
      'rgba(255,255,255,0.3)',
      'rgba(200,185,155,0.3)',
      'rgba(255,255,255,0.45)',
      'rgba(255,255,255,0.25)',
      'rgba(212,195,140,0.35)',
      'rgba(255,255,255,0.3)',
      'rgba(255,255,255,0.25)',
      'rgba(220,200,160,0.25)',
    ],
  },
  {
    name: 'blue',
    mesh: [
      'rgba(165, 198, 210, 0.25)',
      'rgba(184, 212, 224, 0.18)',
      'rgba(194, 219, 230, 0.12)',
      'rgba(165, 198, 210, 0.15)',
      'rgba(184, 212, 224, 0.1)',
      'rgba(194, 219, 230, 0.12)',
    ],
    orbs: [
      'rgba(165, 198, 210, 0.2)',
      'rgba(184, 212, 224, 0.12)',
      'rgba(194, 219, 230, 0.1)',
      'rgba(165, 198, 210, 0.12)',
    ],
    topo: 'rgba(100, 140, 160, 0.06)',
    vignette: 'rgba(150, 170, 180, 0.08)',
    particles: [
      'rgba(255,255,255,0.5)',
      'rgba(255,255,255,0.35)',
      'rgba(165,198,210,0.3)',
      'rgba(255,255,255,0.4)',
      'rgba(255,255,255,0.3)',
      'rgba(184,212,224,0.3)',
      'rgba(255,255,255,0.45)',
      'rgba(255,255,255,0.25)',
      'rgba(194,219,230,0.35)',
      'rgba(255,255,255,0.3)',
      'rgba(255,255,255,0.25)',
      'rgba(165,198,210,0.25)',
    ],
  },
  {
    name: 'brown',
    mesh: [
      'rgba(196, 168, 130, 0.25)',
      'rgba(212, 191, 168, 0.18)',
      'rgba(224, 208, 188, 0.12)',
      'rgba(196, 168, 130, 0.15)',
      'rgba(212, 191, 168, 0.1)',
      'rgba(224, 208, 188, 0.12)',
    ],
    orbs: [
      'rgba(196, 168, 130, 0.2)',
      'rgba(212, 191, 168, 0.12)',
      'rgba(224, 208, 188, 0.1)',
      'rgba(196, 168, 130, 0.12)',
    ],
    topo: 'rgba(140, 120, 100, 0.06)',
    vignette: 'rgba(180, 170, 150, 0.08)',
    particles: [
      'rgba(255,255,255,0.5)',
      'rgba(255,255,255,0.35)',
      'rgba(196,168,130,0.3)',
      'rgba(255,255,255,0.4)',
      'rgba(255,255,255,0.3)',
      'rgba(212,191,168,0.3)',
      'rgba(255,255,255,0.45)',
      'rgba(255,255,255,0.25)',
      'rgba(224,208,188,0.35)',
      'rgba(255,255,255,0.3)',
      'rgba(255,255,255,0.25)',
      'rgba(196,168,130,0.25)',
    ],
  },
];

const CYCLE_INTERVAL = 16000;
const TRANSITION_MS = 2000;

const AmbientBackground = memo(() => {
  const [idx, setIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitioning(true);
      setIdx((prev) => (prev + 1) % PALETTES.length);
      setTimeout(() => setTransitioning(false), TRANSITION_MS);
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const p = PALETTES[idx];

  const meshBg = `
    radial-gradient(ellipse 70% 55% at 20% 30%, ${p.mesh[0]} 0%, transparent 70%),
    radial-gradient(ellipse 55% 50% at 80% 65%, ${p.mesh[1]} 0%, transparent 60%),
    radial-gradient(ellipse 50% 45% at 45% 55%, ${p.mesh[2]} 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 70% 20%, ${p.mesh[3]} 0%, transparent 50%),
    radial-gradient(ellipse 45% 40% at 30% 75%, ${p.mesh[4]} 0%, transparent 45%),
    radial-gradient(ellipse 55% 60% at 60% 40%, ${p.mesh[5]} 0%, transparent 50%)
  `;

  return (
    <div className={styles.root} aria-hidden="true">
      <div
        className={styles.mesh}
        style={{
          background: meshBg,
          transition: `background ${TRANSITION_MS}ms ease-in-out`,
        }}
      />
      <svg
        className={styles.topo}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          color: p.topo,
          transition: `color ${TRANSITION_MS}ms ease-in-out`,
        }}
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
      {p.orbs.map((orb, i) => (
        <div
          key={i}
          className={`${styles.orb} ${styles[`orb${i + 1}`]}`}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${orb}, transparent 70%)`,
            transition: `background ${TRANSITION_MS}ms ease-in-out`,
          }}
        />
      ))}
      <svg
        className={styles.particles}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {p.particles.map((fill, i) => (
          <circle
            key={i}
            cx={[120, 380, 650, 900, 1150, 250, 780, 1320, 500, 1050, 80, 1350][i]}
            cy={[180, 520, 280, 620, 150, 750, 420, 500, 120, 780, 400, 300][i]}
            r={[1.5, 1, 2, 1.5, 1, 1.5, 1, 2, 1, 1.5, 1.2, 1.8][i]}
            fill={fill}
            className={styles.particle}
            style={{
              transition: `fill ${TRANSITION_MS}ms ease-in-out`,
            }}
          />
        ))}
      </svg>
      <div className={styles.noise} />
      <div
        className={styles.vignette}
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 50%, transparent 50%, ${p.vignette} 100%)`,
          transition: `background ${TRANSITION_MS}ms ease-in-out`,
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
export default AmbientBackground;
