import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSensores, getLecturasSensor, getModelMetrics } from '@shared/services/api';

export function useSensoresIoT() {
  const navigate = useNavigate();
  const [showNdvi, setShowNdvi] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [valveActive, setValveActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState('');
  const [nodes, setNodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelMetrics, setModelMetrics] = useState(null);

  useEffect(() => {
    getModelMetrics().then(setModelMetrics).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    getSensores()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            id: s.nodo_id || s.id?.slice(0, 8),
            sector: s.nombre || s.nodo_id || '—',
            lat: s.lat,
            lng: s.lng,
            rssi: -70 - Math.floor(Math.random() * 30),
            battery: s.estado === 'critical' ? 12 : s.estado === 'warn' ? 45 : 85 + Math.floor(Math.random() * 15),
            online: s.estado !== 'critical',
            estado: s.estado,
            hum: s.ultima_lectura?.humedad ?? 0,
            temp: s.ultima_lectura?.temperatura ?? 0,
            ndvi: s.ultima_lectura?.ndvi ?? 0,
            ce: 1.0 + (s.ultima_lectura?.humedad ?? 50) / 50,
            sensorId: s.id,
          }));
          setNodes(mapped);
          if (mapped.length > 0 && !selectedNode) {
            setSelectedNode(mapped[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedNode]);

  useEffect(() => {
    if (!selectedNode) return;
    const node = nodes.find((n) => n.id === selectedNode);
    if (!node?.sensorId) return;

    getLecturasSensor(node.sensorId, 3).then((data) => {
      if (Array.isArray(data)) {
        const mapped = data.map((l, i) => {
          const types = ['error', 'success', 'info'];
          return {
            icon: l.ndvi && l.ndvi < 0.4 ? 'battery_alert' : l.humedad && l.humedad < 50 ? 'sprinkler' : 'sync_alt',
            type: types[i % 3],
            title: `Lectura sensor ${node.id}`,
            desc: `NDVI: ${l.ndvi ?? '—'}, Hum: ${l.humedad ?? '—'}%, Temp: ${l.temperatura ?? '—'}C`,
            time: l.created_at ? new Date(l.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
          };
        });
        setLogs(mapped);
      }
    });
  }, [selectedNode, nodes]);

  const sel = nodes.find((n) => n.id === selectedNode) || nodes[0] || {};

  const handleShowNdviChange = (e) => setShowNdvi(e.target.checked);
  const handleValveToggle = () => setValveActive((v) => !v);

  return {
    showNdvi, setShowNdvi,
    pulse,
    valveActive, setValveActive,
    selectedNode, setSelectedNode,
    NODES: nodes,
    LOGS: logs,
    sel, loading,
    modelMetrics,
    handleShowNdviChange, handleValveToggle,
    navigate,
  };
}
