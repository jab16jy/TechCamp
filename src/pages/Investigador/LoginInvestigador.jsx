// ============================================
// LoginInvestigador.jsx — Formulario de autenticación
// Solo accesible para investigadores del sistema.
// Incluye validación básica y feedback visual.
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import styles from './LoginInvestigador.module.css';

// ── Credenciales demo (en producción usar JWT/API real) ──
const USUARIO_DEMO = { usuario: 'investigador@techcamp.co', clave: 'AgroCaribe2025' };

const LoginInvestigador = () => {
  const navigate = useNavigate();
  const agregarToast = useAppStore((s) => s.agregarToast);

  // Estado del formulario
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
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

    // Simular llamada a API (reemplazar con fetch/axios real)
    await new Promise((r) => setTimeout(r, 1200));

    if (
      form.usuario === USUARIO_DEMO.usuario &&
      form.clave === USUARIO_DEMO.clave
    ) {
      // Login exitoso — guardar sesión mínima en sessionStorage
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
    <div className={styles.pagina}>

      {/* ── Fondo dividido verde/crema ── */}
      <div className={styles.fondoVerde} aria-hidden="true">
        <div className={styles.fondoPatron} />
      </div>

      {/* ── Volver atrás ── */}
      <Link to="/" className={styles.btnVolver} id="btn-volver-acceso">
        ← Volver al inicio
      </Link>

      {/* ── Tarjeta de login centrada ── */}
      <main className={styles.main}>
        <div className={styles.tarjeta}>

          {/* Encabezado de la tarjeta */}
          <div className={styles.tarjetaCabecera}>
            <div className={styles.tarjetaIcono} aria-hidden="true">🔬</div>
            <div>
              <h1 className={styles.tarjetaTitulo}>Acceso Investigador</h1>
              <p className={styles.tarjetaSubtitulo}>
                Panel de análisis y métricas del modelo IA
              </p>
            </div>
          </div>

          {/* ── Formulario ── */}
          <form
            className={styles.formulario}
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulario de autenticación investigador"
          >

            {/* Error general (credenciales incorrectas) */}
            {errores.general && (
              <div className={styles.errorGeneral} role="alert">
                <span>⚠️</span> {errores.general}
              </div>
            )}

            {/* Campo usuario/correo */}
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="usuario">
                Correo electrónico
              </label>
              <input
                id="usuario"
                name="usuario"
                type="email"
                className={`${styles.input} ${errores.usuario ? styles.inputError : ''}`}
                placeholder="tu@correo.com"
                value={form.usuario}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                aria-describedby={errores.usuario ? 'error-usuario' : undefined}
                aria-invalid={!!errores.usuario}
              />
              {errores.usuario && (
                <span id="error-usuario" className={styles.errorMsg} role="alert">
                  {errores.usuario}
                </span>
              )}
            </div>

            {/* Campo contraseña */}
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="clave">
                Contraseña
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="clave"
                  name="clave"
                  type={mostrarClave ? 'text' : 'password'}
                  className={`${styles.input} ${errores.clave ? styles.inputError : ''}`}
                  placeholder="••••••••"
                  value={form.clave}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-describedby={errores.clave ? 'error-clave' : undefined}
                  aria-invalid={!!errores.clave}
                />
                {/* Toggle visibilidad de contraseña */}
                <button
                  type="button"
                  className={styles.toggleClave}
                  onClick={() => setMostrarClave((v) => !v)}
                  aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarClave ? '🙈' : '👁️'}
                </button>
              </div>
              {errores.clave && (
                <span id="error-clave" className={styles.errorMsg} role="alert">
                  {errores.clave}
                </span>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className={styles.btnLogin}
              disabled={cargando}
              id="btn-submit-login"
            >
              {cargando ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Verificando...
                </>
              ) : (
                <>🔐 Iniciar sesión</>
              )}
            </button>

          </form>

          {/* ── Credenciales demo visibles para evaluadores ── */}
          <div className={styles.demoBox} aria-label="Credenciales de demostración">
            <span className={styles.demoBadge}>Demo</span>
            <div className={styles.demoCredenciales}>
              <span><b>Usuario:</b> investigador@techcamp.co</span>
              <span><b>Clave:</b> AgroCaribe2025</span>
            </div>
          </div>

          {/* Separador + enlace a productor */}
          <p className={styles.alternativa}>
            ¿Eres productor?{' '}
            <Link to="/consulta" className={styles.enlaceAlternativa}>
              Entra sin registro →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginInvestigador;
