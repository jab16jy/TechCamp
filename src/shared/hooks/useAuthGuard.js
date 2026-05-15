import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAuthGuard(requiredRole) {
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rol = sessionStorage.getItem('rol');
    if (!rol) {
      navigate('/');
    } else if (rol === 'productor') {
      navigate('/investigador/analisis');
    } else if (rol === requiredRole) {
      setAuthorized(true);
    } else {
      navigate('/');
    }
  }, [requiredRole, navigate]);

  return authorized;
}
