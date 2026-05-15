import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const NODES = [
  { id: '01', sector: 'Sector Norte', rssi: -72, battery: 96, online: true,  hum: 42, temp: 26.1, ce: 1.4 },
  { id: '02', sector: 'Sector Norte', rssi: -88, battery: 12, online: true,  hum: 38, temp: 26.8, ce: 1.3 },
  { id: '03', sector: 'Sector Centro',rssi: -81, battery: 71, online: true,  hum: 51, temp: 27.2, ce: 1.1 },
  { id: '04', sector: 'Sector Sur',   rssi: -93, battery: 85, online: true,  hum: 24, temp: 28.0, ce: 1.2 },
  { id: '05', sector: 'Sector Este',  rssi: -78, battery: 63, online: true,  hum: 45, temp: 27.5, ce: 1.5 },
  { id: '06', sector: 'Sector Oeste', rssi: -99, battery: 34, online: false, hum: 0,  temp: 0,    ce: 0   },
];

export const LOGS = [
  { icon: 'battery_alert',  type: 'error',   title: 'Nodo 02 · Batería Crítica (12%)', desc: 'Reemplazo sugerido. Sin acción → pérdida de datos.', time: 'hace 12 min' },
  { icon: 'sprinkler',      type: 'success',  title: 'Riego Sector Norte · Activado',   desc: 'Iniciado automáticamente por IA Predictiva.', time: 'hace 28 min' },
  { icon: 'sync_alt',       type: 'info',     title: 'Sincronización Completa',          desc: '12 nodos reportando sin pérdida de paquetes.', time: 'hace 1h' },
  { icon: 'satellite_alt',  type: 'info',     title: 'Sentinel-2 · Imagen Actualizada', desc: 'NDVI recalculado. Cobertura 100%.', time: 'hace 2h' },
];

export function useSensoresIoT() {
  const navigate = useNavigate();
  const [showNdvi, setShowNdvi]       = useState(false);
  const [pulse, setPulse]             = useState(true);
  const [valveActive, setValveActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState('04');

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(id);
  }, []);

  const sel = NODES.find(n => n.id === selectedNode) || NODES[3];

  const handleShowNdviChange = (e) => setShowNdvi(e.target.checked);
  const handleValveToggle = () => setValveActive(v => !v);

  return {
    // Estados
    showNdvi,
    setShowNdvi,
    pulse,
    valveActive,
    setValveActive,
    selectedNode,
    setSelectedNode,
    // Datos
    NODES,
    LOGS,
    sel,
    // Handlers
    handleShowNdviChange,
    handleValveToggle,
    // Navegación
    navigate,
  };
}
