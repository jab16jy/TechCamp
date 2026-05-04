// ============================================
// Acceso.jsx — Pantalla de selección de perfil
// Primera pantalla que ve el usuario al ingresar.
// Permite elegir entre Productor (acceso directo)
// o Investigador (con autenticación).
// ============================================

import { Link } from 'react-router-dom';
import styles from './Acceso.module.css';

const Acceso = () => (
  <div className={styles.pagina}>

    {/* ── Fondo decorativo con patrón agrícola ── */}
    <div className={styles.fondo} aria-hidden="true">
      <div className={styles.fondoCirculo1} />
      <div className={styles.fondoCirculo2} />
      <div className={styles.fondoGrilla} />
    </div>

    {/* ── Cabecera con logo ── */}
    <header className={styles.cabecera}>
      <div className={styles.logo}>
        <span className={styles.logoIcono}>🌿</span>
        <div className={styles.logoTexto}>
          <span className={styles.logoNombre}>AgroCaribe AI</span>
          <span className={styles.logoSub}>TECHCAMP · 2025</span>
        </div>
      </div>
    </header>

    {/* ── Contenido principal ── */}
    <main className={styles.main}>
      <div className={styles.intro}>
        {/* Badge de bienvenida */}
        <span className={styles.badge}>
          <span>🌾</span> Sistema de recomendación de cultivos
        </span>

        <h1 className={styles.titulo}>
          ¿Cómo quieres <span className={styles.tituloAcento}>ingresar?</span>
        </h1>
        <p className={styles.subtitulo}>
          Selecciona tu perfil para continuar. Cada acceso está diseñado
          para darte exactamente lo que necesitas.
        </p>
      </div>

      {/* ── Tarjetas de perfil ── */}
      <div className={styles.tarjetasGrid} role="list">

        {/* === PERFIL PRODUCTOR === */}
        <article className={`${styles.tarjeta} ${styles.tarjetaProductor}`} role="listitem">
          {/* Ícono grande visible desde el celular */}
          <div className={styles.tarjetaIcono} aria-hidden="true">🧑‍🌾</div>

          <div className={styles.tarjetaContenido}>
            <span className={styles.tarjetaBadge}>Acceso rápido · Sin registro</span>
            <h2 className={styles.tarjetaTitulo}>Soy Productor</h2>
            <p className={styles.tarjetaDesc}>
              Entra directo al mapa y descubre qué sembrar en tu parcela.
              Rápido, fácil y sin complicaciones.
            </p>

            {/* Beneficios clave en lenguaje sencillo */}
            <ul className={styles.beneficios} aria-label="Beneficios del perfil productor">
              <li><span className={styles.checkmark}>✓</span> Sin contraseñas</li>
              <li><span className={styles.checkmark}>✓</span> Mapa interactivo</li>
              <li><span className={styles.checkmark}>✓</span> Recomendación inmediata</li>
            </ul>
          </div>

          {/* CTA principal — va directo al frontend existente */}
          <Link
            to="/consulta"
            className={styles.btnProductor}
            id="btn-acceso-productor"
            aria-label="Ingresar como productor agrícola"
          >
            <span>🗺️</span>
            <span>¡Quiero saber qué sembrar!</span>
          </Link>
        </article>

        {/* === PERFIL INVESTIGADOR === */}
        <article className={`${styles.tarjeta} ${styles.tarjetaInvestigador}`} role="listitem">
          <div className={styles.tarjetaIcono} aria-hidden="true">🔬</div>

          <div className={styles.tarjetaContenido}>
            <span className={styles.tarjetaBadgeInv}>Acceso completo · Con autenticación</span>
            <h2 className={styles.tarjetaTituloInv}>Soy Investigador</h2>
            <p className={styles.tarjetaDescInv}>
              Accede al panel de métricas del modelo, exporta datos históricos
              y analiza el rendimiento del sistema de IA.
            </p>

            <ul className={styles.beneficiosInv} aria-label="Beneficios del perfil investigador">
              <li><span className={styles.checkmarkInv}>✓</span> Dashboard de métricas</li>
              <li><span className={styles.checkmarkInv}>✓</span> Datos históricos</li>
              <li><span className={styles.checkmarkInv}>✓</span> Exportar resultados</li>
            </ul>
          </div>

          {/* CTA investigador — redirige al login */}
          <Link
            to="/investigador/login"
            className={styles.btnInvestigador}
            id="btn-acceso-investigador"
            aria-label="Ingresar como investigador con autenticación"
          >
            <span>🔐</span>
            <span>Iniciar sesión</span>
          </Link>
        </article>

      </div>

      {/* ── Nota de privacidad ── */}
      <p className={styles.nota}>
        🔒 Tus datos son tratados con confidencialidad según la Ley 1581 de 2012 · Colombia
      </p>
    </main>
  </div>
);

export default Acceso;
