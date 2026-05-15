import { useState, useCallback } from 'react';
import L from 'leaflet';

export const iotIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#10b981;border:2px solid #fff;
    box-shadow:0 0 0 4px rgba(16,185,129,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const IOT_NODES = [
  { id: 'N01', lat: 10.383, lng: -75.477, nombre: 'Nodo Norte-01', hum: 72, temp: 28.4, ndvi: 0.73, estado: 'optimal' },
  { id: 'N02', lat: 10.371, lng: -75.461, nombre: 'Nodo Sur-02',   hum: 61, temp: 29.8, ndvi: 0.61, estado: 'warning' },
  { id: 'N03', lat: 10.377, lng: -75.450, nombre: 'Nodo Este-03',  hum: 55, temp: 31.2, ndvi: 0.54, estado: 'alert' },
];

export const ZONA_DATA = {
  ndvi: 0.68,
  temp: 29.2,
  hum: 63,
  precipitacion: 85,
  riesgo: 'Moderado',
};

export default function useMapZone() {
  const [zona, setZona] = useState(null);
  const [layerType, setLayerType] = useState('satellite');

  const handleZoneCreated = useCallback((data) => {
    setZona(data);
  }, []);

  const handleZoneCleared = useCallback(() => {
    setZona(null);
  }, []);

  return {
    zona,
    layerType,
    setLayerType,
    handleZoneCreated,
    handleZoneCleared,
    IOT_NODES,
    ZONA_DATA,
    iotIcon,
  };
}
