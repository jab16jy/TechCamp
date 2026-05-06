// App.jsx — Raíz de la aplicación AgroCaribe AI
// ─────────────────────────────────────────────────────────────
// Estructura de rutas:
//   /                       → Acceso (selección de perfil) ← NUEVO
//   /consulta               → Consulta (mapa + formulario)
//   /resultado              → Resultado del análisis
//   /historial              → Historial de consultas
//   /home                   → Home / Landing informativa
//   /investigador/login     → Login investigador ← NUEVO
//   /investigador/dashboard → Dashboard investigador ← NUEVO
// ─────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componentes compartidos
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Toast from './components/Toast/Toast';

// Páginas del flujo principal (con Navbar/Footer)
import Home from './pages/Home/Home';
import Consulta from './pages/Consulta/Consulta';
import Resultado from './pages/Resultado/Resultado';
import Historial from './pages/Historial/Historial';

// ── Nuevas páginas de acceso y panel investigador ──
import Acceso from './pages/Acceso/Acceso';
import LoginInvestigador from './pages/Investigador/LoginInvestigador';
import DashboardInvestigador from './pages/Investigador/DashboardInvestigador';
import AnalisisCultivosInvestigador from './pages/Investigador/AnalisisCultivos';

// ── Layout con Navbar + Footer (para las páginas del app) ──
const LayoutApp = ({ children }) => (
  <>
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </>
);

const App = () => (
  <BrowserRouter>
    {/* Toast global — disponible en todas las rutas */}
    <Toast />

    <Routes>
      {/* ── Pantalla de selección de perfil (landing principal) ── */}
      <Route path="/" element={<Acceso />} />

      {/* ── Rutas del investigador (sin Navbar/Footer, tienen su propio layout) ── */}
      <Route path="/investigador/login"     element={<LoginInvestigador />} />
      <Route path="/investigador/dashboard" element={<DashboardInvestigador />} />
      <Route path="/investigador/analisis"  element={<AnalisisCultivosInvestigador />} />

      {/* ── Rutas del app principal (con Navbar + Footer) ── */}
      <Route path="/home" element={
        <LayoutApp><Home /></LayoutApp>
      } />
      <Route path="/consulta" element={
        <LayoutApp><Consulta /></LayoutApp>
      } />
      <Route path="/resultado" element={
        <LayoutApp><Resultado /></LayoutApp>
      } />
      <Route path="/historial" element={
        <LayoutApp><Historial /></LayoutApp>
      } />

      {/* ── 404 ── */}
      <Route path="*" element={
        <LayoutApp>
          <div style={{ paddingTop: 'var(--navbar-h)', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '3rem' }}>🌾</p>
            <h2 style={{ fontFamily: 'var(--font-titulo)' }}>Página no encontrada</h2>
            <a href="/" className="btn-primario">Volver al inicio</a>
          </div>
        </LayoutApp>
      } />
    </Routes>
  </BrowserRouter>
);

export default App;
