import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Sprout } from 'lucide-react';
import useAppStore from '@shared/store';
import AmbientBackground from '../AmbientBackground/AmbientBackground';
import logoSrc from '@assets/images/logo.png';
import './ProductorLayout.css';

const ProductorLayout = ({ children }) => {
  const navigate = useNavigate();
  const agregarToast = useAppStore((s) => s.agregarToast);

  const rol = sessionStorage.getItem('rol');

  useEffect(() => {
    if (rol !== 'productor' && rol !== 'investigador') navigate('/investigador/login');
  }, [rol, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('rol');
    agregarToast('Sesion cerrada correctamente', 'info');
    navigate('/investigador/login');
  };

  return (
    <div className="pl-root">
      <AmbientBackground />

      {/* Top Bar */}
      <header className="pl-topbar">
        <Link to="/investigador/analisis" className="pl-logo-wrap">
          <img src={logoSrc} alt="AgroCaribe IA" className="pl-logo" />
          <span className="pl-brand-text">AgroCaribe</span>
        </Link>

        <div className="pl-topbar-right">
          <Link to="/investigador/analisis" className="pl-nav-link">
            <Sprout size={17} />
            <span>Analisis de Parcela</span>
          </Link>
          <button onClick={handleLogout} className="pl-logout-btn">
            <LogOut size={17} />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pl-main">
        <div className="pl-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ProductorLayout;
