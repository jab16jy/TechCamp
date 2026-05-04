// Home — Landing page completa de AgroCaribe AI
import { Link } from 'react-router-dom';
import ParticleCanvas from '../../components/ParticleCanvas/ParticleCanvas';
import WeatherMockup from '../../components/WeatherMockup/WeatherMockup';
import styles from './Home.module.css';

const PASOS = [
  { numero: '01', icono: '📍', titulo: 'Selecciona tu zona', desc: 'Marca tu parcela en el mapa interactivo o escribe tu municipio en el Caribe colombiano.' },
  { numero: '02', icono: '🛰️', titulo: 'Análisis satelital', desc: 'Procesamos imágenes MODIS/Sentinel para extraer NDVI, humedad del suelo y cobertura vegetal.' },
  { numero: '03', icono: '🤖', titulo: 'IA recomienda', desc: 'Nuestro modelo analiza 80+ variables climáticas e históricas para predecir los mejores cultivos.' },
  { numero: '04', icono: '🌾', titulo: 'Toma decisiones', desc: 'Recibe un ranking de cultivos con score de confianza, nivel de riesgo y calendario de siembra.' },
];

const CULTIVOS = [
  { emoji: '🌽', nombre: 'Maíz', desc: 'Cultivo base del Caribe. Alta demanda local y ciclo corto de 90 días.', tags: ['90 días', '4-6 t/ha', 'Sequía media'] },
  { emoji: '🍠', nombre: 'Ñame', desc: 'Patrimonio culinario de la región. Crece bien en suelos francos con buena materia orgánica.', tags: ['210 días', '12-18 t/ha', 'Nativo'] },
  { emoji: '🌾', nombre: 'Arroz', desc: 'Ideal para zonas con acceso a riego. Excelente rendimiento en valles del Magdalena y Sinú.', tags: ['120 días', '5-7 t/ha', 'Con riego'] },
  { emoji: '🍌', nombre: 'Plátano', desc: 'Cultivo permanente de gran rentabilidad. Tolerante a lluvias tropicales abundantes.', tags: ['Permanente', '20-25 t/ha', 'Alta humedad'] },
  { emoji: '🫘', nombre: 'Frijol', desc: 'Ciclo corto ideal para rotaciones. Alta demanda en mercados locales de la costa.', tags: ['75 días', '1.5-2 t/ha', 'Rotación'] },
  { emoji: '🥔', nombre: 'Yuca', desc: 'La reina de la seguridad alimentaria caribeña. Tolerante a sequía y suelos pobres.', tags: ['270 días', '15-20 t/ha', 'Resistente'] },
];

const STATS = [
  { valor: '1 km²', label: 'Resolución espacial' },
  { valor: '85–94%', label: 'Precisión del modelo' },
  { valor: '1940', label: 'Datos históricos desde' },
  { valor: '6', label: 'Cultivos analizados' },
];

const Home = () => (
  <div className={styles.pagina}>

    {/* HERO */}
    <section className={styles.hero}>
      <ParticleCanvas />
      <div className={styles.heroInner}>
        <div className={styles.heroContenido}>
          <div className={styles.badge}>
            <span className={styles.badgeIcono}>🌿</span>
            <span className={styles.badgeTexto}>Tecnología agrícola para el Caribe</span>
          </div>
          <h1 className={styles.heroTitulo}>
            Siembra con <span className={styles.heroTituloVerde}>inteligencia</span>
            <br />en el <span className={styles.heroTituloDorado}>Caribe colombiano</span>
          </h1>
          <p className={styles.heroSubtitulo}>
            AgroCaribe AI analiza datos satelitales, climáticos e históricos para
            recomendarte los cultivos con mayor potencial de éxito en tu parcela.
            Decisiones informadas, cosechas mejores.
          </p>
          <div className={styles.heroAcciones}>
            <Link to="/consulta" className={styles.btnHeroPrimario}>🗺️ Analizar mi zona</Link>
            <Link to="/historial" className={styles.btnHeroSecundario}>Ver historial →</Link>
          </div>
          <div className={styles.scrollHint}>
            <div className={styles.scrollLinea} />
            <span className={styles.scrollTexto}>Explorar más abajo</span>
          </div>
        </div>
        <div className={styles.heroTarjeta}>
          <WeatherMockup />
        </div>
      </div>
    </section>

    {/* STATS */}
    <section className={styles.stats}>
      <div className={styles.statsInner}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ display: 'contents' }}>
            <div className={styles.statItem}>
              <span className={styles.statValor}>{s.valor}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
            {i < STATS.length - 1 && <div className={styles.statDivider} />}
          </div>
        ))}
      </div>
    </section>

    {/* CÓMO FUNCIONA */}
    <section className={styles.comoFunciona}>
      <div className={styles.seccionCabecera}>
        <span className={styles.seccionBadge}>Proceso</span>
        <h2 className={styles.seccionTitulo}>¿Cómo funciona AgroCaribe AI?</h2>
        <p className={styles.seccionDesc}>
          En cuatro pasos simples obtienes recomendaciones precisas basadas en ciencia satelital e inteligencia artificial.
        </p>
      </div>
      <div className={styles.pasosGrid}>
        {PASOS.map((paso) => (
          <div key={paso.numero} className={styles.pasoCard}>
            <div className={styles.pasoNumero}>{paso.numero}</div>
            <span className={styles.pasoIcono}>{paso.icono}</span>
            <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
            <p className={styles.pasoDesc}>{paso.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CULTIVOS */}
    <section className={styles.cultivos}>
      <div className={styles.seccionCabecera}>
        <span className={styles.seccionBadge}>Cobertura</span>
        <h2 className={styles.seccionTitulo}>Cultivos del Caribe colombiano</h2>
        <p className={styles.seccionDesc}>Nuestro modelo está entrenado con datos específicos de la región Caribe.</p>
      </div>
      <div className={styles.cultivosGrid}>
        {CULTIVOS.map((c) => (
          <div key={c.nombre} className={styles.cultivoCard}>
            <span className={styles.cultivoEmoji}>{c.emoji}</span>
            <div className={styles.cultivoInfo}>
              <h3 className={styles.cultivoNombre}>{c.nombre}</h3>
              <p className={styles.cultivoDesc}>{c.desc}</p>
              <div className={styles.cultivoTags}>
                {c.tags.map((t) => <span key={t} className={styles.cultivoTag}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* CTA FINAL */}
    <section className={styles.ctaFinal}>
      <div className={styles.ctaContenido}>
        <h2 className={styles.ctaTitulo}>¿Listo para sembrar con datos?</h2>
        <p className={styles.ctaDesc}>
          Analiza tu zona gratuitamente. Solo necesitas marcar tu parcela en el mapa y nuestro sistema hace el resto.
        </p>
        <div className={styles.ctaAcciones}>
          <Link to="/consulta" className="btn-dorado">🚀 Comenzar análisis gratuito</Link>
          <Link to="/historial" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', background: 'transparent', color: 'rgba(250,248,242,0.7)', fontSize: '0.95rem', fontWeight: '600', borderRadius: 'var(--radio-md)', border: '2px solid rgba(250,248,242,0.2)', transition: 'all var(--transicion)', fontFamily: 'var(--font-cuerpo)' }}>
            Ver consultas anteriores
          </Link>
        </div>
      </div>
    </section>

  </div>
);

export default Home;
