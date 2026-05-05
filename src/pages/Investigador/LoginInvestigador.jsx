import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
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
    } else if (form.clave.length < 6) {
      nuevosErrores.clave = 'Mínimo 6 caracteres';
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

    await new Promise((r) => setTimeout(r, 1200));

    if (
      form.usuario === USUARIO_DEMO.usuario &&
      form.clave === USUARIO_DEMO.clave
    ) {
      sessionStorage.setItem('rol', 'investigador');
      agregarToast('Bienvenido al panel de investigación 🔬', 'exito');
      navigate('/investigador/dashboard');
    } else {
      setErrores({ general: 'Credenciales incorrectas. Verifica tu usuario y contraseña.' });
      agregarToast('Acceso denegado', 'error');
    }

    setCargando(false);
  };

  return (
    <div className={styles.page}>
      {/* Left Side: Immersive Visual */}
      <section className={styles.leftSection}>
        <img 
          className={styles.heroImage}
          alt="Granja sostenible" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfrp3H79E2ymZvrFwEw4sM4S7KK4ukvw01eODI2zxw6ZHBvac_JOotcY-pioZw3UqL6gIIDiss3qt-KG6INouaAebPkMcB9YDzSUZFhhTlXIrhhYztfDVCrvaFfdhRFfKNlaHDUK49p_Iy-5NGcYTPtycP-J1DFMYqgtFlFI6pzzcnL3XX-GVwfGkOfby96qDKXVAEl-ckUJlYXophfR5Hf3XjyQHl07VLTNO8L0m0L15KcTJnlaczIiA5UB5yKWQx_ZA37V6uzxc"
        />
        <div className={styles.heroContent}>
          <div className={styles.heroTextContainer}>
            <h2 className={styles.heroTitle}>AgroCaribe IA</h2>
            <p className={styles.heroDesc}>
              El futuro de la agricultura sostenible potenciado por inteligencia artificial. Monitoreo en tiempo real y análisis predictivo para el Caribe.
            </p>
            <div className={styles.heroBadges}>
              <div className={styles.badgePrimary}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>energy_savings_leaf</span>
                <span>Tecnología de Punta</span>
              </div>
              <div className={styles.badgeTertiary}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>eco</span>
                <span>Impacto Ecológico</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <main className={styles.mainContent}>
        <div className={styles.loginCard}>
          {/* Subtle Organic Decoration */}
          <div className={styles.decorTopRight}></div>
          <div className={styles.decorBottomLeft}></div>

          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Bienvenido</h1>
            <p className={styles.subtitle}>Ingrese sus credenciales para acceder al portal del investigador.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Error General */}
            {errores.general && (
              <div className={styles.errorGeneral}>
                {errores.general}
              </div>
            )}

            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="usuario" className={styles.label}>Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
                <input 
                  id="usuario"
                  name="usuario"
                  type="email" 
                  className={`${styles.input} ${errores.usuario ? styles.inputError : ''}`}
                  placeholder="investigador@agrocaribe.ia"
                  value={form.usuario}
                  onChange={handleChange}
                  required 
                />
              </div>
              {errores.usuario && <span className={styles.errorText}>{errores.usuario}</span>}
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="clave" className={styles.label}>Contraseña</label>
                <a href="#" className={styles.forgotLink}>¿Olvidó su contraseña?</a>
              </div>
              <div className={styles.inputWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>key</span>
                <input 
                  id="clave"
                  name="clave"
                  type={mostrarClave ? 'text' : 'password'}
                  className={`${styles.input} ${errores.clave ? styles.inputError : ''}`}
                  placeholder="••••••••••••"
                  value={form.clave}
                  onChange={handleChange}
                  required 
                />
                <button
                  type="button"
                  className={styles.toggleClave}
                  onClick={() => setMostrarClave((v) => !v)}
                  aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined">
                    {mostrarClave ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errores.clave && <span className={styles.errorText}>{errores.clave}</span>}
            </div>

            {/* Remember Me */}
            <div className={styles.rememberGroup}>
              <input type="checkbox" id="remember" className={styles.checkbox} />
              <label htmlFor="remember" className={styles.rememberLabel}>Mantener sesión iniciada</label>
            </div>

            {/* Login Button */}
            <button type="submit" className={styles.submitBtn} disabled={cargando}>
              <span>{cargando ? 'Verificando...' : 'Entrar'}</span>
              {!cargando && <span className={`material-symbols-outlined ${styles.submitIcon}`}>chevron_right</span>}
            </button>
            
            {/* Demo Credentials Hint */}
            <div className={styles.demoHint}>
              <span className={styles.demoBadge}>Demo</span> user: investigador@techcamp.co / pass: AgroCaribe2025
            </div>
          </form>

          {/* Registration Link */}
          <div className={styles.registerContainer}>
            <p className={styles.registerText}>
              ¿No tiene una cuenta? 
              <Link to="/consulta" className={styles.registerLink}>
                Solicitar Acceso
              </Link>
            </p>
          </div>

          {/* Branding Tag (Mobile/Fallback) */}
          <div className={styles.mobileBranding}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>potted_plant</span>
            <span className={styles.mobileBrandingText}>AgroCaribe IA</span>
          </div>
        </div>

        {/* Footer Help Links */}
        <div className={styles.footerLinks}>
          <a href="#">Términos de Servicio</a>
          <span className={styles.footerDot}>•</span>
          <a href="#">Privacidad</a>
          <span className={styles.footerDot}>•</span>
          <a href="#">Soporte Técnico</a>
        </div>
      </main>
    </div>
  );
};

export default LoginInvestigador;
