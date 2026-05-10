import React, { useState } from 'react';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './GestionReportes.module.css';

const GestionReportes = () => {
  // Estado para el mes activo del mini mapa NDVI
  const [activeMonth, setActiveMonth] = useState('Julio');

  // Datos de los minimapas
  const miniMaps = [
    { month: 'Marzo', value: '0.62', trend: 'up', active: false, img: 'https://cdn.discordapp.com/attachments/1113524673322123304/1336048184517656686/Captura_de_pantalla_2025-02-04_140026.png?ex=67a26244&is=67a110c4&hm=7a39ba4737d976daef472c918a2283eab998f4bbd0505bdf0e56689d04732dbf&' },
    { month: 'Abril', value: '0.68', trend: 'up', active: false, img: 'https://cdn.discordapp.com/attachments/1113524673322123304/1336048184517656686/Captura_de_pantalla_2025-02-04_140026.png?ex=67a26244&is=67a110c4&hm=7a39ba4737d976daef472c918a2283eab998f4bbd0505bdf0e56689d04732dbf&' },
    { month: 'Mayo', value: '0.74', trend: 'up', active: false, img: 'https://cdn.discordapp.com/attachments/1113524673322123304/1336048184517656686/Captura_de_pantalla_2025-02-04_140026.png?ex=67a26244&is=67a110c4&hm=7a39ba4737d976daef472c918a2283eab998f4bbd0505bdf0e56689d04732dbf&' },
    { month: 'Junio', value: '0.81', trend: 'up', active: false, img: 'https://cdn.discordapp.com/attachments/1113524673322123304/1336048184517656686/Captura_de_pantalla_2025-02-04_140026.png?ex=67a26244&is=67a110c4&hm=7a39ba4737d976daef472c918a2283eab998f4bbd0505bdf0e56689d04732dbf&' },
    { month: 'Julio', value: '0.85', trend: 'max', active: true, img: 'https://cdn.discordapp.com/attachments/1113524673322123304/1336048184517656686/Captura_de_pantalla_2025-02-04_140026.png?ex=67a26244&is=67a110c4&hm=7a39ba4737d976daef472c918a2283eab998f4bbd0505bdf0e56689d04732dbf&' },
    { month: 'Agosto', value: '0.78', trend: 'down', active: false, img: 'https://cdn.discordapp.com/attachments/1113524673322123304/1336048184517656686/Captura_de_pantalla_2025-02-04_140026.png?ex=67a26244&is=67a110c4&hm=7a39ba4737d976daef472c918a2283eab998f4bbd0505bdf0e56689d04732dbf&' },
  ];

  // Datos para gráfico hidrológico
  const hydroData = [
    { label: 'Ene', value: 45, px: '10%', py: '70%' },
    { label: 'Feb', value: 55, px: '25%', py: '55%' },
    { label: 'Mar', value: 65, px: '40%', py: '40%' },
    { label: 'Abr', value: 85, px: '55%', py: '25%' },
    { label: 'May', value: 95, px: '70%', py: '15%' },
    { label: 'Jun', value: 75, px: '85%', py: '30%' },
  ];

  const renderTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <span className={`material-symbols-outlined ${styles.trendIcon}`}>trending_up</span>;
      case 'down': return <span className={`material-symbols-outlined ${styles.trendIcon}`}>trending_down</span>;
      case 'max': return <span className={`material-symbols-outlined ${styles.trendIcon}`}>stars</span>;
      default: return null;
    }
  };

  const getTrendClass = (trend) => {
    switch (trend) {
      case 'up': return styles.trendUp;
      case 'down': return styles.trendDown;
      case 'max': return styles.trendMax;
      default: return '';
    }
  };

  return (
    <ResearcherLayout activeTab="reportes">
      <div className={styles.container}>
        
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gestión y Reportes</h1>
            <p className={styles.subtitle}>Análisis consolidado del Sector Norte - Parcela 4</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.dateBadge}>
              <span className={`material-symbols-outlined ${styles.dateIcon}`}>calendar_today</span>
              <span className={styles.dateText}>Agosto 2024</span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.iconBtn}>
                <span className="material-symbols-outlined">print</span>
              </button>
              <button className={styles.iconBtn}>
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className={styles.grid}>
          
          {/* Eficiencia Global */}
          <div className={`${styles.card} ${styles.col4} ${styles.efficiencyCard}`}>
            <h2 className={styles.cardTitle}>Eficiencia de Parcela</h2>
            <div className={styles.gaugeContainer}>
              <svg className={styles.gaugeSvg} viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="80" className={styles.gaugeBg} />
                <circle cx="90" cy="90" r="80" className={styles.gaugeValue} />
              </svg>
              <div className={styles.gaugeCenter}>
                <span className={styles.gaugeScore}>82</span>
                <span className={styles.gaugeLabel}>Índice OEE</span>
              </div>
            </div>
            <div className={styles.badgeOptimal}>
              Rendimiento Óptimo
            </div>
          </div>

          {/* Evolución NDVI */}
          <div className={`${styles.card} ${styles.col8}`}>
            <div className={styles.ndviHeader}>
              <h2 className={styles.cardTitle} style={{marginBottom: 0}}>Evolución del Vigor (NDVI)</h2>
              <span className={styles.ndviBadge}>Semestre I</span>
            </div>
            <div className={styles.ndviGrid}>
              {miniMaps.map((map, index) => (
                <div 
                  key={index} 
                  className={activeMonth === map.month ? styles.miniMapCardActive : styles.miniMapCard}
                  onClick={() => setActiveMonth(map.month)}
                >
                  <img src={map.img} alt={`NDVI ${map.month}`} className={styles.miniMapImg} />
                  <div className={styles.miniMapRow}>
                    <span className={activeMonth === map.month ? styles.miniMapMonthActive : styles.miniMapMonth}>{map.month}</span>
                    <span className={activeMonth === map.month ? styles.miniMapValueActive : styles.miniMapValue}>{map.value}</span>
                  </div>
                  <div className={`${styles.trendRow} ${getTrendClass(map.trend)}`}>
                    {renderTrendIcon(map.trend)}
                    <span style={{marginLeft: '0.125rem'}}>{map.trend === 'up' ? '+5%' : map.trend === 'down' ? '-8%' : 'Pico'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones Recomendadas */}
          <div className={`${styles.card} ${styles.col5} ${styles.actionCard}`}>
            <div className={styles.actionHeader}>
              <span className={`material-symbols-outlined ${styles.actionHeaderIcon}`}>psychology</span>
              <h2 className={styles.cardTitle} style={{marginBottom: 0}}>Acciones Recomendadas por IA</h2>
            </div>
            <div className={styles.actionList}>
              <div className={styles.actionItem}>
                <input type="checkbox" className={styles.actionCheckbox} />
                <div className={styles.actionContent}>
                  <div className={styles.actionRow}>
                    <p className={styles.actionTitle}>Ajuste de Riego Sector B</p>
                    <span className={styles.priorityHigh}>Alta</span>
                  </div>
                  <p className={styles.actionDesc}>Reducir 15% el caudal. Detección de saturación en suelo profundo.</p>
                </div>
              </div>

              <div className={styles.actionItem}>
                <input type="checkbox" className={styles.actionCheckbox} />
                <div className={styles.actionContent}>
                  <div className={styles.actionRow}>
                    <p className={styles.actionTitleNormal}>Fertilización Nitrogenada</p>
                    <span className={styles.priorityMed}>Media</span>
                  </div>
                  <p className={styles.actionDesc}>Aplicar en ventana de 48h según pronóstico de lluvia leve.</p>
                </div>
              </div>

              <div className={styles.actionItem}>
                <input type="checkbox" className={styles.actionCheckbox} />
                <div className={styles.actionContent}>
                  <div className={styles.actionRow}>
                    <p className={styles.actionTitleNormal}>Revisión de Drenaje</p>
                    <span className={styles.priorityLow}>Baja</span>
                  </div>
                  <p className={styles.actionDesc}>Mantenimiento preventivo en canaleta principal sur.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Análisis Hidrológico */}
          <div className={`${styles.card} ${styles.col7}`}>
            <div className={styles.hydroHeader}>
              <div>
                <h2 className={styles.hydroTitle}>Análisis Hidrológico Cruzado</h2>
                <p className={styles.hydroSubtitle}>Precipitación vs. Humedad Retenida</p>
              </div>
              <div className={styles.hydroLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDotRain}></div>
                  <span className={styles.legendLabel}>Lluvia (mm)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDotSoil}></div>
                  <span className={styles.legendLabel}>Humedad Suelo (%)</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              {hydroData.map((data, idx) => (
                <div key={idx} className={styles.chartBarContainer} style={{ height: `${data.value}%` }}>
                  <div className={styles.chartBarTooltip}>{data.value}mm</div>
                </div>
              ))}

              <svg className={styles.chartLineOverlay} preserveAspectRatio="none">
                <path 
                  d={`M ${hydroData.map(d => `${d.px} ${d.py}`).join(' L ')}`} 
                  fill="none" 
                  stroke="#a3c19b" 
                  strokeWidth="3"
                />
                {hydroData.map((data, idx) => (
                  <circle key={`c-${idx}`} cx={data.px} cy={data.py} r="4" fill="#1a4d3a" stroke="#ffffff" strokeWidth="2" />
                ))}
              </svg>
            </div>
            
            <div className={styles.chartXAxis}>
              {hydroData.map(d => <span key={d.label}>{d.label}</span>)}
            </div>
          </div>

          {/* Exportar Reporte */}
          <div className={`${styles.col12} ${styles.exportCard}`}>
            <svg className={styles.exportBgPattern} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 C30,80 70,120 100,50 L100,100 Z" fill="#ffffff"/>
              <path d="M0,100 C40,60 60,140 100,30 L100,100 Z" fill="#ffffff" opacity="0.5"/>
            </svg>
            <div className={styles.exportContent}>
              <div className={styles.exportTitleRow}>
                <div className={styles.exportIconWrapper}>
                  <span className="material-symbols-outlined">description</span>
                </div>
                <h2 className={styles.exportTitle}>Reporte Técnico Mensual</h2>
              </div>
              <p className={styles.exportDesc}>
                Generar un documento consolidado (PDF) con todas las métricas, mapas NDVI alta resolución y log de acciones sugeridas por la IA para auditoría RSPO.
              </p>
            </div>
            <div className={styles.exportAction}>
              <button className={styles.exportBtn}>
                <span className="material-symbols-outlined">download</span>
                Descargar PDF
              </button>
              <span className={styles.exportMeta}>Generado con AgroCaribe IA</span>
            </div>
          </div>

        </div>
      </div>
    </ResearcherLayout>
  );
};

export default GestionReportes;
