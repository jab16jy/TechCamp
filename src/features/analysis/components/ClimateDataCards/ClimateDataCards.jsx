import {
  Thermometer,
  Droplets,
  CloudRain,
} from 'lucide-react';

const ClimateDataCards = ({ clima, selectedParcela }) => {
  if (!selectedParcela) return null;

  return (
    <div className="ac-climate-data">
      <div className="ac-climate-card">
        <div className="ac-climate-card-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
          <Thermometer size={18} />
        </div>
        <div className="ac-climate-card-body">
          <div className="ac-climate-card-top">
            <span className="ac-climate-card-label">Temperatura</span>
            <span className="ac-climate-badge">AUTO</span>
          </div>
          <span className="ac-climate-card-value">{clima.temperatura}°C</span>
          <span className="ac-climate-card-source">NASA POWER · {selectedParcela.split(' - ')[0]}</span>
        </div>
      </div>
      <div className="ac-climate-card">
        <div className="ac-climate-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
          <Droplets size={18} />
        </div>
        <div className="ac-climate-card-body">
          <div className="ac-climate-card-top">
            <span className="ac-climate-card-label">Humedad Relativa</span>
            <span className="ac-climate-badge ac-climate-badge--sensor">SENSOR</span>
          </div>
          <span className="ac-climate-card-value">{clima.humedad}%</span>
          <span className="ac-climate-card-source">Sensores IoT · {selectedParcela.split(' - ')[0]}</span>
        </div>
      </div>
      <div className="ac-climate-card">
        <div className="ac-climate-card-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
          <CloudRain size={18} />
        </div>
        <div className="ac-climate-card-body">
          <div className="ac-climate-card-top">
            <span className="ac-climate-card-label">Precipitación Anual</span>
            <span className="ac-climate-badge">AUTO</span>
          </div>
          <span className="ac-climate-card-value">{clima.precipitacion} mm</span>
          <span className="ac-climate-card-source">NASA POWER · {selectedParcela.split(' - ')[0]}</span>
        </div>
      </div>
    </div>
  );
};

export default ClimateDataCards;
