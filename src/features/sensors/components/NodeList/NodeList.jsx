import React from 'react';
import { Network, Battery } from 'lucide-react';
import RssiBar from '@features/sensors/components/RssiBar/RssiBar';

function NodeList({ nodes, selectedNode, onSelectNode }) {
  return (
    <aside className="iot-node-col">
      <div className="iot-node-col-header">
        <Network size={16} className="iot-col-icon" />
        <h2 className="iot-col-title">Estado de Nodos</h2>
      </div>
      <div className="iot-node-list">
        {nodes.map(n => (
          <button
            key={n.id}
            onClick={() => onSelectNode(n.id)}
            className={`iot-node-item ${selectedNode === n.id ? 'iot-node-selected' : ''} ${!n.online ? 'iot-node-offline' : ''}`}
          >
            <div className="iot-node-top">
              <div className="iot-node-id-wrap">
                <span className={`iot-node-status-dot ${n.online ? (n.battery < 20 ? 'dot-warn' : 'dot-ok') : 'dot-off'}`}></span>
                <span className="iot-node-id">Nodo {n.id}</span>
              </div>
              <span className="iot-node-sector">{n.sector}</span>
            </div>
            <RssiBar rssi={n.rssi} />
            <div className="iot-node-stats">
              <span className="iot-node-stat">
                <Battery size={12} style={{color:'#64748b'}} />
                {n.online ? `${n.battery}%` : '–'}
              </span>
              <span className={`iot-node-tag ${n.online ? (n.battery < 20 ? 'tag-warn' : 'tag-ok') : 'tag-off'}`}>
                {n.online ? (n.battery < 20 ? 'BATERÍA BAJA' : 'ONLINE') : 'OFFLINE'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default NodeList;
