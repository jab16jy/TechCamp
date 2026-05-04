// App.jsx — Raíz de la aplicación AgroCaribe AI
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Toast from './components/Toast/Toast';
import Home from './pages/Home/Home';
import Consulta from './pages/Consulta/Consulta';
import Resultado from './pages/Resultado/Resultado';
import Historial from './pages/Historial/Historial';

const App = () => (
  <BrowserRouter>
    <Navbar />
    <main style={{ flex: 1 }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/resultado" element={<Resultado />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="*" element={
          <div style={{ paddingTop: 'var(--navbar-h)', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '3rem' }}>🌾</p>
            <h2 style={{ fontFamily: 'var(--font-titulo)' }}>Página no encontrada</h2>
            <a href="/" className="btn-primario">Volver al inicio</a>
          </div>
        } />
      </Routes>
    </main>
    <Footer />
    <Toast />
  </BrowserRouter>
);

export default App;
