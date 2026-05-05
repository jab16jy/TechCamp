import { Link } from 'react-router-dom';
import styles from './Acceso.module.css';

const Acceso = () => (
  <div className={styles.page}>
    <main className={styles.mainContainer}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <span className={`material-symbols-outlined ${styles.logoIcon}`}>agriculture</span>
          <h1 className={styles.logoTitle}>AgroCaribe IA</h1>
        </div>
        <h2 className={styles.mainHeading}>¿Cómo quieres ingresar?</h2>
        <p className={styles.subHeading}>
          Selecciona tu perfil para continuar. Cada acceso está diseñado para darte exactamente lo que necesitas.
        </p>
        <div className={styles.infoBox}>
          <p>
            <strong>AgroCaribe IA</strong> es la plataforma líder en agricultura de precisión para el Caribe, utilizando inteligencia artificial para optimizar cultivos, predecir rendimientos y promover la sostenibilidad en cada parcela.
          </p>
        </div>
      </header>

      {/* Selection Bento Grid */}
      <div className={styles.grid}>
        {/* Producer Card */}
        <div className={styles.card}>
          <div className={styles.cardImageContainer}>
            <img 
              alt="Productor Agrícola" 
              className={styles.cardImage} 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFOMWv2MzmsZ4YCp2KofSrNcPGdbLYtCYpmC4YFRPPZq3zkk6ar_jD9TlPlebQq0N3Zs3VL4t5rN-dJKOWzUOY8KPtJuRJmTlW9tPlW-c8douwRs7rtDp_oFDjBeNgqwtpvXlhB3ZuQA6xG6xR_-CrIVHjnPMKBIByK17xrzPWd9uiqiAFl5H-NjcY9WMRMixyLekFezUJ2AQ1P1wIoMFi52T6mbD1RwIbOuvaRjRX-JUH5CY_Fe0k06m1bNjrLwWEmi6MurCtHAI"
            />
            <div className={styles.imageOverlay}></div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardBadges}>
              <span className={styles.badgeProducer}>Sin Registro</span>
              <span className={`material-symbols-outlined ${styles.badgeIconProducer}`}>rocket_launch</span>
            </div>
            <h3 className={styles.cardTitle}>Soy Productor</h3>
            <p className={styles.cardDesc}>
              Entra directo al mapa y descubre qué sembrar en tu parcela. Rápida, fácil y sin complicaciones.
            </p>
            <div className={styles.cardFooter}>
              <Link to="/consulta" className={styles.btnProducer}>
                ¡Quiero saber qué sembrar!
                <span className={`material-symbols-outlined ${styles.btnIcon}`}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Researcher Card */}
        <div className={styles.card}>
          <div className={styles.cardImageContainer}>
            <img 
              alt="Investigador de Datos" 
              className={styles.cardImage} 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaDHOg0ym0lJdmik8TRtB8n33jXEVoZUniV6BqWV2ZWLp5C_WaVJWwYq2k8VSqwjdYBBp8JJJDrUcM6Y_45J8aslpEC1kCqbjVfhcUHxpD8ASsq3AHypn6mlw7ss946_txX3HMr0ukf5Xxa7B708qYKoyXHJgoLhpTG1SuPz49k0RjbTuwO1DkCcden-poBuLqhwVTn9hM5zVuy7VsLdwnDJufkNXJeMGL2KOKWWxkUlTm6kfP1LOJAT7TSVaOxhrRGAsDXCKJjd4"
            />
            <div className={styles.imageOverlay}></div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardBadges}>
              <span className={styles.badgeResearcher}>Acceso Analítico</span>
              <span className={`material-symbols-outlined ${styles.badgeIconResearcher}`}>science</span>
            </div>
            <h3 className={styles.cardTitle}>Soy Investigador</h3>
            <p className={styles.cardDesc}>
              Accede al panel de métricas del modelo, exporta datos históricos y analiza el rendimiento del sistema de IA.
            </p>
            <div className={styles.cardFooter}>
              <Link to="/investigador/login" className={styles.btnResearcher}>
                Iniciar sesión
                <span className="material-symbols-outlined">login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight Footer */}
      <footer className={styles.footer}>
        <div className={styles.insightBox}>
          <span className={`material-symbols-outlined ${styles.insightIcon}`}>lightbulb</span>
          <div>
            <h4 className={styles.insightTitle}>Dato del día</h4>
            <p className={styles.insightText}>
              "La agricultura de precisión puede aumentar el rendimiento de los cultivos en un 20% reduciendo el uso de agua en el Caribe."
            </p>
          </div>
        </div>
        <div className={styles.footerIcons}>
          <span className="material-symbols-outlined">eco</span>
          <span className="material-symbols-outlined">psychology</span>
          <span className="material-symbols-outlined">travel_explore</span>
        </div>
      </footer>
    </main>
  </div>
);

export default Acceso;
