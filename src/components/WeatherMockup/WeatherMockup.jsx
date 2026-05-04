// ============================================
// WeatherMockup — Tarjeta de clima animada
// Se muestra a la derecha del hero
// ============================================

import { useState, useEffect } from 'react';
import styles from './WeatherMockup.module.css';

// Datos que rotan en la tarjeta mockup
const LOCALIDADES = [
  {
    ciudad: 'Barranquilla',
    temp: '29.1°C',
    humedad: '77%',
    lluvia: '74.5 mm',
    ndvi: '0.42',
    cultivo: 'Maíz 🌽',
    score: 86,
  },
  {
    ciudad: 'Santa Marta',
    temp: '28.4°C',
    humedad: '72%',
    lluvia: '58.2 mm',
    ndvi: '0.51',
    cultivo: 'Yuca 🥔',
    score: 91,
  },
  {
    ciudad: 'Montería',
    temp: '30.8°C',
    humedad: '81%',
    lluvia: '112.3 mm',
    ndvi: '0.63',
    cultivo: 'Arroz 🌾',
    score: 88,
  },
];

const WeatherMockup = () => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Rotar ciudades cada 3s con fade
  useEffect(() => {
    const intervalo = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % LOCALIDADES.length);
        setVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const d = LOCALIDADES[idx];

  return (
    <div className={styles.tarjeta}>
      {/* Cabecera */}
      <div className={styles.cabecera}>
        <div className={styles.puntoVerde} />
        <span className={styles.etiqueta}>Análisis en tiempo real</span>
      </div>

      {/* Ciudad y fecha */}
      <div className={`${styles.ciudad} ${visible ? styles.visible : styles.oculto}`}>
        <h3 className={styles.nombreCiudad}>{d.ciudad}</h3>
        <span className={styles.fecha}>Caribe Colombiano · {new Date().getFullYear()}</span>
      </div>

      {/* Variables climáticas */}
      <div className={`${styles.grilla} ${visible ? styles.visible : styles.oculto}`}>
        <div className={styles.variable}>
          <span className={styles.varIcono}>🌡️</span>
          <div>
            <p className={styles.varValor}>{d.temp}</p>
            <p className={styles.varLabel}>Temperatura</p>
          </div>
        </div>
        <div className={styles.variable}>
          <span className={styles.varIcono}>💧</span>
          <div>
            <p className={styles.varValor}>{d.humedad}</p>
            <p className={styles.varLabel}>Humedad</p>
          </div>
        </div>
        <div className={styles.variable}>
          <span className={styles.varIcono}>🌧️</span>
          <div>
            <p className={styles.varValor}>{d.lluvia}</p>
            <p className={styles.varLabel}>Precipitación</p>
          </div>
        </div>
        <div className={styles.variable}>
          <span className={styles.varIcono}>🛰️</span>
          <div>
            <p className={styles.varValor}>{d.ndvi}</p>
            <p className={styles.varLabel}>NDVI</p>
          </div>
        </div>
      </div>

      {/* Recomendación principal */}
      <div className={`${styles.recomendacion} ${visible ? styles.visible : styles.oculto}`}>
        <div className={styles.recCabecera}>
          <span className={styles.recLabel}>Cultivo recomendado</span>
          <span className={styles.recScore}>{d.score}% confianza</span>
        </div>
        <div className={styles.recCultivo}>{d.cultivo}</div>
        <div className={styles.barraContenedor}>
          <div className={styles.barra} style={{ width: `${d.score}%` }} />
        </div>
      </div>

      {/* Dots indicadores */}
      <div className={styles.dots}>
        {LOCALIDADES.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === idx ? styles.dotActivo : ''}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default WeatherMockup;
