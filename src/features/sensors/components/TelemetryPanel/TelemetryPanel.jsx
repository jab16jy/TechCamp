import React from 'react';
import { Droplets, Thermometer, Zap } from 'lucide-react';
import Spark from '@features/sensors/components/Spark/Spark';

const humSpark = [38, 35, 32, 30, 27, 25, 24, 24];
const tempSpark = [26.5, 27, 27.3, 27.8, 28, 28.1, 28, 28];
const ceSpark = [1.1, 1.1, 1.2, 1.2, 1.2, 1.3, 1.2, 1.2];

function TelemetryPanel({ selectedNode }) {
  return (
    <>
      <div className="iot-gauge-card">
        <div className="iot-gauge-row">
          <div className="iot-gauge-icon-box blue">
            <Droplets size={18} />
          </div>
          <div className="iot-gauge-info">
            <p className="iot-gauge-label">Humedad del Suelo</p>
            <div className="iot-gauge-val-row">
              <span className="iot-gauge-val blue">{selectedNode.hum}%</span>
              <span className="iot-gauge-trend down">↓</span>
              <span className="iot-gauge-compare">vs NASA Hist.</span>
            </div>
          </div>
          <Spark vals={humSpark} color="#3b82f6" />
        </div>
        <div className="iot-mini-bar">
          <div className="iot-mini-fill blue" style={{width:`${selectedNode.hum}%`}}></div>
        </div>
      </div>

      <div className="iot-gauge-card">
        <div className="iot-gauge-row">
          <div className="iot-gauge-icon-box amber">
            <Thermometer size={18} />
          </div>
          <div className="iot-gauge-info">
            <p className="iot-gauge-label">Temperatura Ambiente</p>
            <div className="iot-gauge-val-row">
              <span className="iot-gauge-val amber">{selectedNode.temp}°C</span>
              <span className="iot-gauge-trend up">↑</span>
              <span className="iot-gauge-compare">vs 27.2°C NASA</span>
            </div>
          </div>
          <Spark vals={tempSpark} color="#f59e0b" />
        </div>
        <div className="iot-mini-bar">
          <div className="iot-mini-fill amber" style={{width:`${(selectedNode.temp/40)*100}%`}}></div>
        </div>
      </div>

      <div className="iot-gauge-card">
        <div className="iot-gauge-row">
          <div className="iot-gauge-icon-box green">
            <Zap size={18} />
          </div>
          <div className="iot-gauge-info">
            <p className="iot-gauge-label">Conductividad Eléctrica</p>
            <div className="iot-gauge-val-row">
              <span className="iot-gauge-val green">{selectedNode.ce} dS/m</span>
              <span className="iot-tag-optimal">ÓPTIMO</span>
            </div>
          </div>
          <Spark vals={ceSpark} color="#10b981" />
        </div>
        <div className="iot-mini-bar">
          <div className="iot-mini-fill green" style={{width:`${(selectedNode.ce/3)*100}%`}}></div>
        </div>
      </div>
    </>
  );
}

export default TelemetryPanel;
