import {
  Crosshair, Leaf, Thermometer, Droplets, Wind,
  MapPin, AlertTriangle
} from 'lucide-react';

const ZONA_DATA = {
  ndvi: 0.68,
  temp: 29.2,
  hum: 63,
  precipitacion: 85,
  riesgo: 'Moderado',
};

const ZonePanel = ({ zona }) => {
  return (
    <div className={`mapa-zone-panel ${zona ? 'mapa-zone-panel-active' : ''}`}>
      <div className="mapa-zone-header">
        <Crosshair size={16} className="text-emerald-600" />
        <span>Zona Seleccionada</span>
      </div>
      {zona ? (
        <>
          <div className="mapa-zone-stats">
            <div className="mapa-zone-stat">
              <Leaf size={14} className="text-emerald-500" />
              <div>
                <span className="mapa-zone-stat-label">NDVI Promedio</span>
                <span className="mapa-zone-stat-value">{ZONA_DATA.ndvi}</span>
              </div>
            </div>
            <div className="mapa-zone-stat">
              <Thermometer size={14} className="text-amber-500" />
              <div>
                <span className="mapa-zone-stat-label">Temperatura</span>
                <span className="mapa-zone-stat-value">{ZONA_DATA.temp}°C</span>
              </div>
            </div>
            <div className="mapa-zone-stat">
              <Droplets size={14} className="text-sky-500" />
              <div>
                <span className="mapa-zone-stat-label">Humedad</span>
                <span className="mapa-zone-stat-value">{ZONA_DATA.hum}%</span>
              </div>
            </div>
            <div className="mapa-zone-stat">
              <Wind size={14} className="text-slate-500" />
              <div>
                <span className="mapa-zone-stat-label">Precipitación</span>
                <span className="mapa-zone-stat-value">{ZONA_DATA.precipitacion} mm</span>
              </div>
            </div>
          </div>
          <div className="mapa-zone-area">
            <MapPin size={12} />
            <span>Área: {zona.area} ha · Centro: {zona.center.lat.toFixed(4)}°, {zona.center.lng.toFixed(4)}°</span>
          </div>
          <div className="mapa-zone-risk">
            <AlertTriangle size={12} />
            <span>Riesgo: {ZONA_DATA.riesgo}</span>
          </div>
        </>
      ) : (
        <div className="mapa-zone-empty">
          <Crosshair size={24} className="text-slate-300" />
          <p>Usa las herramientas de dibujo (polígono o rectángulo) en la esquina superior derecha del mapa para delimitar una zona y ver sus variables ambientales.</p>
        </div>
      )}
    </div>
  );
};

export default ZonePanel;
