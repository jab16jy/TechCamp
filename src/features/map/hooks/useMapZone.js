import { useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { getSensores, getClima } from '@shared/services/api';

const DEFAULT_CENTER = [10.377, -75.461];

export const iotIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 0 0 4px rgba(16,185,129,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const warnIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const critIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 4px rgba(239,68,68,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const iconForEstado = (estado) => {
  if (estado === 'critical') return critIcon;
  if (estado === 'warn') return warnIcon;
  return iotIcon;
};

export default function useMapZone() {
  const [zona, setZona] = useState(null);
  const [layerType, setLayerType] = useState('satellite');
  const [sensors, setSensors] = useState([]);
  const [climate, setClimate] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [loadingSensors, setLoadingSensors] = useState(true);

  useEffect(() => {
    getSensores().then((data) => {
      if (Array.isArray(data)) {
        const mapped = data.filter((s) => s.lat && s.lng).map((s) => ({
          id: s.nodo_id || s.id?.slice(0, 8),
          lat: s.lat,
          lng: s.lng,
          nombre: s.nombre || s.nodo_id,
          estado: s.estado || 'ok',
          hum: s.ultima_lectura?.humedad ?? null,
          temp: s.ultima_lectura?.temperatura ?? null,
          ndvi: s.ultima_lectura?.ndvi ?? null,
          icon: iconForEstado(s.estado),
        }));
        setSensors(mapped);
        if (mapped.length > 0) {
          setMapCenter([mapped[0].lat, mapped[0].lng]);
        }
      }
      setLoadingSensors(false);
    }).catch(() => setLoadingSensors(false));
  }, []);

  useEffect(() => {
    getClima(mapCenter[0], mapCenter[1]).then((data) => {
      if (data) setClimate(data);
    });
  }, [mapCenter]);

  const handleZoneCreated = useCallback((data) => {
    setZona(data);
    if (data.center) {
      setMapCenter([data.center.lat, data.center.lng]);
    }
  }, []);

  const handleZoneCleared = useCallback(() => {
    setZona(null);
  }, []);

  return {
    zona, setZona,
    layerType, setLayerType,
    sensors, climate, mapCenter,
    loadingSensors,
    handleZoneCreated, handleZoneCleared,
    iconForEstado,
  };
}
