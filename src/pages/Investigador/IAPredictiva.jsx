import React, { useState } from 'react';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './IAPredictiva.module.css';

const IAPredictiva = () => {
  const [riego, setRiego] = useState(75);
  const [npk, setNpk] = useState(120);

  return (
    <ResearcherLayout activeTab="ia">
      <div className={styles.container}>
        {/* Top Info Header */}
        <header className={styles.header}>
          <div>
            <h2 className={styles.headerTitle}>IA Predictiva y Proyección de Cosecha</h2>
            <div className={styles.headerMeta}>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_today</span> Octubre 24, 2023
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span> Zona Norte - Lote A4
              </span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.statusBadge}>
              <span className="material-symbols-outlined" style={{ color: 'var(--m3-outline)' }}>cloud_off</span>
              <span className={styles.statusText}>Modo Local Activo</span>
            </div>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className={styles.grid}>
          {/* Left: Simulation Panel */}
          <section className={`${styles.card} ${styles.col4}`}>
            <div className={styles.cardHeader}>
              <span className={`material-symbols-outlined ${styles.iconBox}`}>search</span>
              <h3 className={styles.cardTitle}>Simulador de Rendimiento y Riesgos</h3>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha de Siembra</label>
                <input className={styles.input} type="date" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Variedad de Semilla</label>
                <select className={styles.select}>
                  <option>Híbrido Premium Maíz A-21</option>
                  <option>Bio-Resistente Soja G-90</option>
                  <option>Variedad Tradicional</option>
                </select>
              </div>

              <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div className={styles.rangeRow}>
                    <label className={styles.label} style={{ marginBottom: 0, fontWeight: 500 }}>Ajuste de Riego</label>
                    <span className={styles.rangeValue}>{riego}%</span>
                  </div>
                  <input 
                    className={styles.range} 
                    max="100" min="0" 
                    type="range" 
                    value={riego} 
                    onChange={(e) => setRiego(e.target.value)} 
                  />
                </div>
                <div>
                  <div className={styles.rangeRow}>
                    <label className={styles.label} style={{ marginBottom: 0, fontWeight: 500 }}>Fertilización NPK</label>
                    <span className={styles.rangeValue}>{npk}kg/ha</span>
                  </div>
                  <input 
                    className={styles.range} 
                    max="250" min="0" 
                    type="range" 
                    value={npk} 
                    onChange={(e) => setNpk(e.target.value)} 
                  />
                </div>
              </div>

              <button className={styles.btnPrimary} type="button">
                <span className="material-symbols-outlined">auto_awesome</span>
                Ejecutar Simulación Predictiva
              </button>
            </form>
          </section>

          {/* Right: Results & Chart */}
          <div className={styles.col8}>
            {/* Metrics Bar */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricCircle}>
                  <span className={`${styles.metricValue} ${styles.val1}`}>4.5</span>
                </div>
                <div>
                  <p className={styles.metricLabel}>Rendimiento Estimado</p>
                  <p className={styles.metricDesc}>t/ha proyectadas</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={`${styles.metricCircle} ${styles.metricCircle2}`}>
                  <span className={`${styles.metricValue} ${styles.val2}`}>88%</span>
                </div>
                <div>
                  <p className={styles.metricLabel}>Probabilidad Éxito</p>
                  <p className={`${styles.metricDesc} ${styles.val2}`}>Estado: Óptimo</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={`${styles.metricCircle} ${styles.metricCircle3}`}>
                  <span className={`${styles.metricValue} ${styles.val3}`}>15%</span>
                </div>
                <div>
                  <p className={styles.metricLabel}>Riesgo Climático</p>
                  <p className={`${styles.metricDesc} ${styles.val3}`}>Amenaza Baja</p>
                </div>
              </div>
            </div>

            {/* Projection Chart */}
            <div className={styles.chartArea}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Proyección de Crecimiento (6 meses)</h3>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.dot} ${styles.dot1}`}></div>
                    <span>Crecimiento</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.dot} ${styles.dot2}`}></div>
                    <span>Estrés Climático</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.chartContainer}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 800 200">
                  {/* Growth Curve */}
                  <path d="M0,180 Q100,160 200,140 T400,80 T600,40 T800,20" fill="none" stroke="var(--m3-primary)" strokeLinecap="round" strokeWidth="4"></path>
                  {/* Stress Curve */}
                  <path d="M0,190 Q100,195 200,180 T400,190 T600,160 T800,170" fill="none" stroke="var(--m3-error)" strokeDasharray="8 4" strokeLinecap="round" strokeWidth="2"></path>
                </svg>
                <div className={styles.chartXAxis}>
                  <span className={styles.axisLabel}>Oct</span>
                  <span className={styles.axisLabel}>Nov</span>
                  <span className={styles.axisLabel}>Dic</span>
                  <span className={styles.axisLabel}>Ene</span>
                  <span className={styles.axisLabel}>Feb</span>
                  <span className={styles.axisLabel}>Mar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Projection Map */}
          <section className={`${styles.mapCard} ${styles.col8}`}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined">map</span> Capa de Productividad Futura
              </h3>
              <div className={styles.chartLegend}>
                <span className={styles.axisLabel}>Baja</span>
                <div className={styles.gradientBar}></div>
                <span className={styles.axisLabel}>Alta</span>
              </div>
            </div>
            
            <div className={styles.mapArea}>
              <img 
                className={styles.mapImg}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUMdDBxU37Dk3LkbzQFCMGwXwYTatU5m7cZNMi84Q8y1jPrBliha-Q_bhzfmyqr66vcW9AM6RzpWI7MOSQtYEKLWv6f8zTYBt2htsc2JH_Sq29u3QJrA3gTkt6ilR03Ow4wlGOVzjxJOINKm0uSTAB5rlkogxKcG8byxyXJuWMBsQMA0xqqQY2l_eNFeAfxusYgRhsaKWRVQl2Vun8m_YbapfJyY_9DxThpU66LEZ8XXePDA_jU3uAGkXYRh9PjsLJTq97CqeeUJs" 
                alt="Plantation heatmap" 
              />
              <div className={styles.mapOverlay}></div>
              
              <div className={styles.mapControls}>
                <button className={styles.mapBtn}><span className="material-symbols-outlined">layers</span></button>
                <button className={styles.mapBtn}><span className="material-symbols-outlined">zoom_in</span></button>
                <button className={styles.mapBtn}><span className="material-symbols-outlined">zoom_out</span></button>
              </div>
            </div>
          </section>

          {/* AI Push Insights */}
          <section className={`${styles.alertsCol} ${styles.col4}`}>
            <h3 className={styles.cardTitle} style={{ marginBottom: '0.5rem' }}>Alertas de IA</h3>
            
            <div className={styles.alertCard}>
              <div className={styles.alertIcon}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
              </div>
              <div>
                <h4 className={styles.alertTitle}>Alerta de Estrés Hídrico</h4>
                <p className={styles.alertText}>Sector B-12 muestra niveles críticos. Recomendado riego de emergencia en 24h.</p>
              </div>
            </div>
            
            <div className={`${styles.alertCard} ${styles.alertCardPrimary}`}>
              <div className={`${styles.alertIcon} ${styles.alertIconPrimary}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
              <div>
                <h4 className={styles.alertTitlePrimary}>Ventana de Cosecha Óptima</h4>
                <p className={styles.alertText}>Predicción de maduración máxima entre el 12 y 15 de Noviembre.</p>
              </div>
            </div>
            
            <div className={styles.promoCard}>
              <div className={styles.promoBgIcon}>
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h4 className={styles.promoTitle}>¿Deseas optimizar tu fertilización?</h4>
              <p className={styles.promoText}>Nuestra IA puede recalcular tus costos basados en los precios actuales del mercado y la salud del suelo.</p>
              <button className={styles.promoBtn}>Ver Plan Optimizado</button>
            </div>
          </section>
        </div>
      </div>

      {/* Agro-Asesor IA Chat Window */}
      <div className={styles.chatContainer}>
        <div className={styles.chatBalloon}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div>
              <h5 className={styles.chatName}>Agro-Asesor IA</h5>
              <span className={styles.chatStatus}>
                <span className={styles.statusDot}></span> En línea
              </span>
            </div>
          </div>
          <p className={styles.chatText}>
            Hola, soy tu asistente IA. He analizado tus datos de NDVI y el pH actual. ¿Quieres saber cómo afectarán las lluvias de la próxima semana a tu cosecha?
          </p>
          <div className={styles.chatInputRow}>
            <input className={styles.chatInput} placeholder="Escribe tu duda..." type="text" />
            <button className={styles.chatMicBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mic</span>
            </button>
          </div>
        </div>
        
        <button className={styles.chatToggleBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>psychology</span>
        </button>
      </div>
    </ResearcherLayout>
  );
};

export default IAPredictiva;
