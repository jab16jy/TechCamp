import { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Tooltip informativo reutilizable con ícono de info.
 * Muestra un texto explicativo al pasar el mouse sobre el ícono.
 */
const InfoTip = ({ text, className = 'ac-tooltip-wrap', iconClassName = 'ac-info-icon' }) => {
  const [show, setShow] = useState(false);

  return (
    <span
      className={className}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={14} className={iconClassName} />
      {show && <div className="ac-tooltip">{text}</div>}
    </span>
  );
};

export default InfoTip;
