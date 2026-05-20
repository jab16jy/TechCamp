import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componentes compartidos
import Toast from '@shared/ui/Toast/Toast';
import FloatingAIButton from '@shared/layout/FloatingAIButton/FloatingAIButton';

// ── Páginas de acceso ──
import Acceso from '@features/auth/pages/Acceso';
import LoginInvestigador from '@features/auth/pages/LoginInvestigador';

// ── Páginas del panel investigador ──
import DashboardInvestigador from '@features/dashboard/pages/DashboardInvestigador';
import AgroAsesor from '@features/chat/pages/AgroAsesor';
import AnalisisCultivosInvestigador from '@features/analysis/pages/AnalisisCultivos';
import ResultadoAvanzado from '@features/analysis/pages/ResultadoAvanzado';
import IAPredictiva from '@features/predictions/pages/IAPredictiva';
import SensoresIoT from '@features/sensors/pages/SensoresIoT';
import GestionReportes from '@features/reports/pages/GestionReportes';
import Historial from '@features/history/pages/Historial';
import Ajustes from '@features/settings/pages/Ajustes';

// ── Páginas compartidas ──
import Resultado from '@features/analysis/pages/Resultado';

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    {/* Toast global — disponible en todas las rutas */}
    <Toast />

    {/* Botón flotante persistente para Agro-Asesor */}
    <FloatingAIButton />

    <Routes>
      {/* ── Pantalla de selección de perfil (landing principal) ── */}
      <Route path="/" element={<Acceso />} />

      {/* ── Rutas del investigador ── */}
      <Route path="/investigador/login" element={<LoginInvestigador />} />
      <Route path="/investigador" element={<DashboardInvestigador />} />
      <Route path="/investigador/dashboard" element={<DashboardInvestigador />} />
      <Route path="/dashboard" element={<DashboardInvestigador />} />
      <Route path="/investigador/mapas" element={<AgroAsesor />} />
      <Route path="/investigador/historial" element={<Historial />} />
      <Route path="/investigador/ajustes" element={<Ajustes />} />
      <Route path="/investigador/analisis" element={<AnalisisCultivosInvestigador />} />
      <Route path="/investigador/resultado-avanzado" element={<ResultadoAvanzado />} />
      <Route path="/investigador/ia" element={<IAPredictiva />} />
      <Route path="/investigador/sensores" element={<SensoresIoT />} />
      <Route path="/investigador/reportes" element={<GestionReportes />} />

      {/* ── Rutas compartidas ── */}
      <Route path="/resultado" element={<Resultado />} />

      {/* ── 404 ── */}
      <Route path="*" element={
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#F9FAF9' }}>
          <p style={{ fontSize: '3rem' }}>🌾</p>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', color: '#1A1C1A' }}>Página no encontrada</h2>
          <p style={{ color: '#64748b' }}>Lo sentimos, la ruta que buscas no existe o ha sido movida.</p>
          <a href="/" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#2D5A27', color: 'white', borderRadius: '0.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
            Volver al inicio
          </a>
        </div>
      } />
    </Routes>
  </BrowserRouter>
);

export default App;
