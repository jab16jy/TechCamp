import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componentes compartidos
import Toast from './components/Toast/Toast';
import FloatingAIButton from './components/FloatingAIButton/FloatingAIButton';

// Páginas del flujo principal
import Resultado from './pages/Resultado/Resultado';

// ── Nuevas páginas de acceso y panel investigador ──
import Acceso from './pages/Acceso/Acceso';
import LoginInvestigador from './pages/Investigador/LoginInvestigador';
import DashboardInvestigador from './pages/Investigador/DashboardInvestigador';
import AnalisisCultivosInvestigador from './pages/Investigador/AnalisisCultivos';
import ResultadoAvanzado from './pages/Investigador/ResultadoAvanzado';
import IAPredictiva from './pages/Investigador/IAPredictiva';
import SensoresIoT from './pages/Investigador/SensoresIoT';
import GestionReportes from './pages/Investigador/GestionReportes';

const App = () => (
  <BrowserRouter>
    {/* Toast global — disponible en todas las rutas */}
    <Toast />

    {/* Botón flotante persistente para Agro-Asesor */}
    <FloatingAIButton />

    <Routes>
      {/* ── Pantalla de selección de perfil (landing principal) ── */}
      <Route path="/" element={<Acceso />} />

      {/* ── Rutas del investigador (sin Navbar/Footer, tienen su propio layout) ── */}
      <Route path="/investigador/login" element={<LoginInvestigador />} />
      <Route path="/investigador/dashboard" element={<DashboardInvestigador />} />
      <Route path="/dashboard" element={<DashboardInvestigador />} /> {/* Atajo solicitado */}
      <Route path="/investigador/analisis" element={<AnalisisCultivosInvestigador />} />
      <Route path="/investigador/resultado-avanzado" element={<ResultadoAvanzado />} />
      <Route path="/investigador/ia" element={<IAPredictiva />} />
      <Route path="/investigador/sensores" element={<SensoresIoT />} />
      <Route path="/investigador/reportes" element={<GestionReportes />} />

      {/* ── Rutas compartidas (usadas por investigador y productor) ── */}
      <Route path="/resultado" element={<Resultado />} />

      {/* ── 404 ── */}
      <Route path="*" element={
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#f8fafc' }}>
          <p style={{ fontSize: '3rem' }}>🌾</p>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#1e293b' }}>Página no encontrada</h2>
          <p style={{ color: '#64748b' }}>Lo sentimos, la ruta que buscas no existe o ha sido movida.</p>
          <a href="/" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#059669', color: 'white', borderRadius: '0.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
            Volver al inicio
          </a>
        </div>
      } />
    </Routes>
  </BrowserRouter>
);

export default App;
