import React from 'react';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './ResultadoAvanzado.module.css';

const ResultadoAvanzado = () => {
  return (
    <ResearcherLayout activeTab="analisis">
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <nav className={styles.breadcrumb}>
              <span>Reportes</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <span className={styles.breadcrumbActive}>Análisis Avanzado</span>
            </nav>
            <div className={styles.headerBadges}>
              <span className={styles.badgeAvanzado}>MODO AVANZADO</span>
              <span className={styles.refCode}>REF: #SOIL-ADV-2024-X1</span>
            </div>
            <h1 className={styles.title}>
              Calidad del Suelo <span className={styles.titleMuted}>(Modo Avanzado)</span>
            </h1>
            <p className={styles.location}>
              <span className="material-symbols-outlined">location_on</span>
              Sector Norte • Hacienda El Sol • Lat: 10.42° N Long: -75.54° W
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary}>
              <span className="material-symbols-outlined">science</span> Exportar CSV
            </button>
            <button className={styles.btnPrimary}>
              <span className="material-symbols-outlined">picture_as_pdf</span> Informe Técnico
            </button>
          </div>
        </div>

        {/* Advanced Soil Parameters Grid */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className="material-symbols-outlined">biotech</span> Parámetros Químicos del Suelo
            </h2>
            <span className={styles.lastCalibration}>Última calibración: 24/05/2024 08:30 AM</span>
          </div>
          <div className={styles.parametersGrid}>
            {/* Nitrógeno */}
            <div className={styles.organicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Nitrógeno (N)</span>
                <span className="material-symbols-outlined">water_drop</span>
              </div>
              <div className={styles.cardValueContainer}>
                <span className={styles.cardValue}>42</span>
                <span className={styles.cardUnit}>mg/kg</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '75%', backgroundColor: '#2d9e4f' }}></div>
              </div>
              <div className={styles.cardFooter}>
                <span>35</span>
                <span className={styles.statusOptimo}>ÓPTIMO</span>
                <span>50</span>
              </div>
            </div>

            {/* Fósforo */}
            <div className={styles.organicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Fósforo (P)</span>
                <span className="material-symbols-outlined">flare</span>
              </div>
              <div className={styles.cardValueContainer}>
                <span className={styles.cardValue}>18</span>
                <span className={styles.cardUnit}>mg/kg</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '40%', backgroundColor: '#4ab86a' }}></div>
              </div>
              <div className={styles.cardFooter}>
                <span>15</span>
                <span className={styles.statusEstable}>ESTABLE</span>
                <span>25</span>
              </div>
            </div>

            {/* Potasio */}
            <div className={styles.organicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Potasio (K)</span>
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div className={styles.cardValueContainer}>
                <span className={styles.cardValue}>156</span>
                <span className={styles.cardUnit}>mg/kg</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '60%', backgroundColor: '#1A4D3A' }}></div>
              </div>
              <div className={styles.cardFooter}>
                <span>140</span>
                <span className={styles.statusAlto}>ALTO</span>
                <span>180</span>
              </div>
            </div>

            {/* pH */}
            <div className={styles.organicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Acidez (pH)</span>
                <span className="material-symbols-outlined">experiment</span>
              </div>
              <div className={styles.cardValueContainer}>
                <span className={styles.cardValue}>6.4</span>
                <span className={styles.cardUnit}>pH</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '65%', backgroundColor: '#2d9e4f' }}></div>
              </div>
              <div className={styles.cardFooter}>
                <span>5.5</span>
                <span className={styles.statusOptimo}>ÓPTIMO</span>
                <span>7.0</span>
              </div>
            </div>

            {/* Conductividad */}
            <div className={styles.organicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Conductividad</span>
                <span className="material-symbols-outlined">flash_on</span>
              </div>
              <div className={styles.cardValueContainer}>
                <span className={styles.cardValue}>1.2</span>
                <span className={styles.cardUnit}>dS/m</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '30%', backgroundColor: '#8e6b5e' }}></div>
              </div>
              <div className={styles.cardFooter}>
                <span>0.8</span>
                <span className={styles.statusBajo}>BAJO</span>
                <span>2.0</span>
              </div>
            </div>

            {/* Materia Orgánica */}
            <div className={styles.organicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Mat. Orgánica</span>
                <span className="material-symbols-outlined">compost</span>
              </div>
              <div className={styles.cardValueContainer}>
                <span className={styles.cardValue}>3.8</span>
                <span className={styles.cardUnit}>%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '80%', backgroundColor: '#2d9e4f' }}></div>
              </div>
              <div className={styles.cardFooter}>
                <span>2.5</span>
                <span className={styles.statusExcelente}>EXCELENTE</span>
                <span>4.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Visualization Section */}
        <div className={styles.vizGrid}>
          {/* Radar Chart */}
          <div className={`${styles.organicCard} ${styles.vizCard}`}>
            <div className={styles.vizCardHeader}>
              <h3 className={styles.vizCardTitle}>Comparativa Nutricional vs Objetivo</h3>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={styles.dotActual}></div>
                  <span>ACTUAL</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.dotObjetivo}></div>
                  <span>OBJETIVO</span>
                </div>
              </div>
            </div>
            <div className={styles.radarContainer}>
              <svg className={styles.radarSvg} viewBox="-40 -40 180 180">
                {/* Concentric Grid Lines */}
                <polygon className={styles.radarGrid} points="50,5 93,30 93,80 50,95 7,80 7,30"></polygon>
                <polygon className={styles.radarGrid} points="50,12.5 82.25,31.25 82.25,68.75 50,80 17.75,68.75 17.75,31.25"></polygon>
                <polygon className={styles.radarGrid} points="50,20 80,37 80,72 50,83 20,72 20,37"></polygon>
                <polygon className={styles.radarGrid} points="50,27.5 72.25,40.75 72.25,59.25 50,67.5 27.75,59.25 27.75,40.75"></polygon>
                <polygon className={styles.radarGrid} points="50,35 65,44 65,64 50,71 35,64 35,44"></polygon>

                {/* Axis lines */}
                <line x1="50" y1="50" x2="50" y2="5" className={styles.radarGrid} />
                <line x1="50" y1="50" x2="93" y2="30" className={styles.radarGrid} />
                <line x1="50" y1="50" x2="93" y2="80" className={styles.radarGrid} />
                <line x1="50" y1="50" x2="50" y2="95" className={styles.radarGrid} />
                <line x1="50" y1="50" x2="7" y2="80" className={styles.radarGrid} />
                <line x1="50" y1="50" x2="7" y2="30" className={styles.radarGrid} />

                {/* Target Area */}
                <polygon className={styles.radarAreaTarget} points="50,10 85,35 85,75 50,90 15,75 15,35"></polygon>

                {/* Current Area */}
                <polygon className={styles.radarAreaCurrent} points="50,15 90,40 70,70 50,85 20,65 15,45"></polygon>

                {/* Vertex Markers for Current */}
                <circle cx="50" cy="15" r="1.5" fill="#1A4D3A" />
                <circle cx="90" cy="40" r="1.5" fill="#1A4D3A" />
                <circle cx="70" cy="70" r="1.5" fill="#1A4D3A" />
                <circle cx="50" cy="85" r="1.5" fill="#1A4D3A" />
                <circle cx="20" cy="65" r="1.5" fill="#1A4D3A" />
                <circle cx="15" cy="45" r="1.5" fill="#1A4D3A" />

                {/* Labels and Values - Positions adjusted to be outside the radar even more */}
                <text className={styles.radarText} textAnchor="middle" x="50" y="-15">NITRÓGENO (85%)</text>
                <text className={styles.radarText} textAnchor="start" x="100" y="25">FÓSFORO (90%)</text>
                <text className={styles.radarText} textAnchor="start" x="100" y="85">POTASIO (75%)</text>
                <text className={styles.radarText} textAnchor="middle" x="50" y="115">pH (92%)</text>
                <text className={styles.radarText} textAnchor="end" x="0" y="85">COND. (60%)</text>
                <text className={styles.radarText} textAnchor="end" x="0" y="25">M.ORG. (80%)</text>
              </svg>
            </div>
          </div>

          {/* Heatmap with Isolines */}
          <div className={`${styles.organicCard} ${styles.heatmapCard}`}>
            <div className={styles.heatmapBg}>
              <svg className={styles.heatmapSvg} viewBox="0 0 400 300" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="grad1" cx="30%" cy="40%" r="50%">
                    <stop offset="0%" style={{ stopColor: 'var(--m3-primary)', stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad1)" />
                <path className={styles.isoline} d="M 50 150 Q 100 100 200 150 T 350 150" />
                <path className={styles.isoline} d="M 30 180 Q 120 120 220 180 T 370 180" />
                <path className={styles.isoline} d="M 70 210 Q 150 150 250 210 T 330 210" />
                <circle className={styles.isoline} cx="120" cy="130" r="40" strokeDasharray="4" />
                <circle className={styles.isoline} cx="280" cy="180" r="60" />
              </svg>
            </div>
            <div className={styles.heatmapOverlay}></div>
            <div className={styles.heatmapBadgeContainer}>
              <span className={styles.glassBadge}>CAPA TÉCNICA: ISOLÍNEAS</span>
            </div>
            <div className={styles.heatmapFooter}>
              <div>
                <h4 className={styles.heatmapTitle}>Mapa de Calor de Nutrientes</h4>
                <p className={styles.heatmapSubtitle}>Distribución espacial de Nitrógeno (N) total</p>
              </div>
              <button className={styles.glassButton}>Interactivo</button>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <section className={styles.recommendationsSection}>
          <div className={styles.sectionDivider}>
            <h2 className={styles.recTitle}>Recomendaciones del Laboratorio</h2>
            <div className={styles.divider}></div>
          </div>
          <div className={styles.recommendationsGrid}>
            {/* Riego Card */}
            <div className={`${styles.organicCard} ${styles.recCardRiego}`}>
              <div className={styles.recCardHeader}>
                <div className={styles.recIconBoxRiego}>
                  <span className="material-symbols-outlined">waves</span>
                </div>
                <span className={styles.recBadgeRiego}>HIDRO-ANALÍTICA</span>
              </div>
              <h4 className={styles.recCardTitle}>Protocolo de Riego Diferenciado</h4>
              <p className={styles.recCardDesc}>
                Optimizar balance hídrico (VPD 1.2 kPa). Incrementar flujo en zonas con alta conductividad eléctrica (&gt;1.5 dS/m) para lixiviación controlada.
              </p>
              <div className={styles.recCardFooter}>
                <span className={styles.recFooterLabel}>Eficacia Estimada</span>
                <span className={styles.recFooterValue}>+12% biomasa</span>
              </div>
            </div>

            {/* Plagas Card */}
            <div className={`${styles.organicCard} ${styles.recCardPlagas}`}>
              <div className={styles.recCardHeader}>
                <div className={styles.recIconBoxPlagas}>
                  <span className="material-symbols-outlined">pest_control_rodent</span>
                </div>
                <span className={styles.recBadgePlagas}>ALERTA PATÓGENA</span>
              </div>
              <h4 className={styles.recCardTitle}>Intervención de Bio-Control</h4>
              <p className={styles.recCardDesc}>
                Detección de estresores abióticos vinculados a 'H. hampei'. Aplicar suspensión biológica (2.5L/ha) en sector noreste según mapa térmico.
              </p>
              <div className={styles.recAlertBox}>
                <span className="material-symbols-outlined">warning</span>
                <span>ACCIÓN REQUERIDA ANTES DE 48H</span>
              </div>
            </div>

            {/* Fertilizacion Card */}
            <div className={`${styles.organicCard} ${styles.recCardFertilizacion}`}>
              <div className={styles.recCardHeader}>
                <div className={styles.recIconBoxFertilizacion}>
                  <span className="material-symbols-outlined">science</span>
                </div>
                <span className={styles.recBadgeFertilizacion}>AJUSTE QUÍMICO</span>
              </div>
              <h4 className={styles.recCardTitle}>Balance Nutricional <span className={styles.textTertiary}>NPK</span></h4>
              <p className={styles.recCardDesc}>
                Aplicar fórmula <span className={styles.textBoldTertiary}>NPK 15-15-15</span> quelatada. Reducción de urea en 5% para compensar pico de mineralización orgánica.
              </p>
              <button className={styles.btnConfig}>
                Configurar Dosificación <span className="material-symbols-outlined">tune</span>
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h3 className={styles.ctaTitle}>Motor de Simulación Estocástica</h3>
          <p className={styles.ctaDesc}>
            Proyecte el rendimiento de su cultivo ajustando variables de precipitación y fertilización avanzada con nuestro motor IA de precisión.
          </p>
          <div className={styles.ctaActions}>
            <button className={styles.btnCtaWhite}>
              <span className="material-symbols-outlined">analytics</span> Iniciar Simulación
            </button>
            <button className={styles.glassButtonLarge}>
              <span className="material-symbols-outlined">history</span> Ver Modelos Previos
            </button>
          </div>
        </section>
      </div>
    </ResearcherLayout>
  );
};

export default ResultadoAvanzado;
