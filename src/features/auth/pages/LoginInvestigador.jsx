import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '@shared/store';
import loginImg from '@assets/images/login-investigador.jpg';
import styles from './LoginInvestigador.module.css';

// ── Credenciales demo (en producción usar JWT/API real) ──
const USUARIO_DEMO = { usuario: 'investigador@techcamp.co', clave: 'AgroCaribe2025' };

const LoginInvestigador = () => {
  const navigate = useNavigate();
  const agregarToast = useAppStore((s) => s.agregarToast);

  const [form, setForm] = useState({ usuario: '', clave: '' });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

  // ── Validación de campos ──
  const validar = () => {
    const nuevosErrores = {};
    if (!form.usuario.trim()) {
      nuevosErrores.usuario = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.usuario)) {
      nuevosErrores.usuario = 'Ingresa un correo válido';
    }
    if (!form.clave.trim()) {
      nuevosErrores.clave = 'La contraseña es obligatoria';
    }
    return nuevosErrores;
  };

  // ── Manejador de cambio en inputs ──
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Manejador de envío ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setCargando(true);
    // Simulación de delay de API
    await new Promise((r) => setTimeout(r, 1200));

    if (
      form.usuario === USUARIO_DEMO.usuario &&
      form.clave === USUARIO_DEMO.clave
    ) {
      sessionStorage.setItem('rol', 'investigador');
      agregarToast('¡Bienvenido al panel de investigación! 🔬', 'exito');
      navigate('/investigador/dashboard');
    } else {
      setErrores({ general: 'Credenciales incorrectas. Intente de nuevo.' });
      agregarToast('Acceso denegado', 'error');
    }
    setCargando(false);
  };

  return (
    <div className={styles.page}>
      {/* ── PANEL IZQUIERDO: LOGIN ── */}
      <section className={styles.formSection}>
        <header className={styles.logoHeader}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" className={styles.logoSvg}>
            <path d="M10 35c0-10 5-15 15-15s15 5 15 15" fill="none" stroke="#2D5A27" strokeWidth="3" />
            <circle cx="25" cy="20" r="4" fill="#2D5A27" />
            <path d="M45 25a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" fill="none" stroke="#5D4037" strokeWidth="2" strokeDasharray="2 1" />
            <text x="60" y="35" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="24" fill="#2D5A27">AgroCaribe</text>
          </svg>
        </header>

        <div className={styles.formContainer}>
          <div className={styles.headerContent}>
            <p className={styles.preTitle}>IMPULSANDO EL FUTURO DEL CAMPO</p>
            <h1 className={styles.title}>Inicio de Sesión</h1>
            <p className={styles.subtitle}>Acceda a sus métricas y predicciones de cultivo en tiempo real.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {errores.general && (
              <div style={{ color: 'var(--m3-error)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                {errores.general}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="usuario">Correo Electrónico de Usuario</label>
              <div className={styles.inputWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
                <input
                  className={`${styles.input} ${errores.usuario ? styles.inputError : ''}`}
                  id="usuario"
                  name="usuario"
                  type="email"
                  placeholder="nombre@agrocaribe.com"
                  value={form.usuario}
                  onChange={handleChange}
                  required
                />
              </div>
              {errores.usuario && <span className={styles.errorText}>{errores.usuario}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="clave">Contraseña</label>
              <div className={styles.inputWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
                <input
                  className={`${styles.input} ${errores.clave ? styles.inputError : ''}`}
                  id="clave"
                  name="clave"
                  type={mostrarClave ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.clave}
                  onChange={handleChange}
                  required
                />
                <button
                  className={styles.toggleClave}
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                >
                  <span className="material-symbols-outlined">
                    {mostrarClave ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errores.clave && <span className={styles.errorText}>{errores.clave}</span>}
            </div>

            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input className={styles.checkbox} type="checkbox" />
                <span className={styles.rememberLabel}>Recordar dispositivo</span>
              </label>
              <a className={styles.forgotLink} href="#">¿Olvidó su contraseña?</a>
            </div>

            <button className={styles.submitBtn} type="submit" disabled={cargando}>
              {cargando ? 'Accediendo...' : 'ENTRAR A LA PLATAFORMA'}
            </button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>o inicia sesión con</span>
          </div>

          <button className={styles.googleBtn} type="button">
            <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continuar con Google
          </button>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¿Nuevo en AgroCaribe? <Link className={styles.registerLink} to="/consulta">Regístrate aquí</Link>
            </p>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '10px', color: 'var(--m3-outline)', textAlign: 'center' }}>
            User: investigador@techcamp.co / Pass: AgroCaribe2025
          </div>
        </div>

        <div className={styles.copyright}>
          <p>© 2026 AgroCaribe S.A. Todos los derechos reservados.</p>
        </div>
      </section>

      {/* ── PANEL DERECHO: IDENTIDAD VISUAL ── */}
      <section className={styles.imageSection}>
        <img
          className={styles.heroImage}
          src={loginImg}
          alt="Agricultura de precisión"
        />
        <div className={styles.imageOverlay}></div>
        <div className={styles.topographicPattern}>
          <div className={styles.quoteCard}>
            <h2 className={styles.quote}>"La precisión del mañana, sembrada hoy."</h2>
            <p className={styles.quoteAuthor}>Optimice sus procesos mediante el análisis predictivo de suelos y clima, garantizando una cosecha sostenible y rentable.</p>
          </div>

          <div className={styles.dots}>
            <div className={`${styles.dot} ${styles.dotActive}`}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginInvestigador;
