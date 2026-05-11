// ============================================================
// DashboardInvestigador.jsx — Centro de Mando AgroCaribe IA
// Diseño: Scientific Brutalist Precision | Bento-Grid
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useAppStore from '../../context/useAppStore';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import styles from './DashboardInvestigador.module.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── IoT Node Icon ──────────────────────────────────────────
const iotIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#10b981;border:2px solid #fff;
    box-shadow:0 0 0 3px rgba(16,185,129,0.35);
    animation: pulse-iot 2s ease-in-out infinite;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ── Datos Estáticos ───────────────────────────────────────
const IOT_NODES = [
  { id: 'N01', lat: 10.383, lng: -75.477, nombre: 'Nodo Norte-01', hum: 72, temp: 28.4 },
  { id: 'N02', lat: 10.371, lng: -75.461, nombre: 'Nodo Sur-02',   hum: 61, temp: 29.8 },
  { id: 'N03', lat: 10.377, lng: -75.450, nombre: 'Nodo Este-03',  hum: 55, temp: 31.2 },
];

const SUGERENCIAS = [
  { icono: 'cloud_alert',       texto: 'Riesgos climáticos' },
  { icono: 'science',           texto: 'Optimizar fertilización' },
  { icono: 'satellite_alt',     texto: 'Ver mapas NDVI' },
  { icono: 'water_drop',        texto: 'Estado de riego' },
];

const CHAT_INICIAL = [
  {
    rol: 'ia',
    texto: 'He sincronizado los últimos datos de **Sentinel-2** y tus sensores. 🛰️\n\nEl NDVI en Sector Norte es **0.73** (salud foliar óptima). Detecto una anomalía térmica leve en el Nodo Este-03. ¿Analizamos el riesgo de estrés hídrico?',
    hora: '10:24 AM',
  },
  {
    rol: 'usuario',
    texto: '¿Cuál es la recomendación de fertilización para el lote B?',
    hora: '10:26 AM',
  },
  {
    rol: 'ia',
    texto: 'Para el **Lote B** recomiendo:\n- **N:** +12 kg/ha (déficit detectado)\n- **P:** Nivel adecuado ✅\n- **K:** +5 kg/ha (leve déficit)\n\nAplicar en las próximas 48h antes del frente de lluvia previsto.',
    hora: '10:26 AM',
  },
];

// ── Radar Nutricional SVG ─────────────────────────────────
const RadarNutricional = ({ actual, objetivo }) => {
  const cx = 100, cy = 100, r = 75;
  const labels = ['N', 'P', 'K', 'Ca', 'Mg', 'S'];
  const n = labels.length;

  const polarToXY = (angle, radius) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const makePolygon = (values) =>
    values
      .map((v, i) => {
        const pt = polarToXY((2 * Math.PI * i) / n, (v / 100) * r);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');

  return (
    <svg viewBox="0 0 200 200" className={styles.radarSvg}>
      {/* Grid rings */}
      {[25, 50, 75, 100].map((pct) => (
        <polygon
          key={pct}
          points={makePolygon(Array(n).fill(pct))}
          fill="none"
          stroke="rgba(100,116,139,0.2)"
          strokeWidth="0.8"
        />
      ))}
      {/* Axes */}
      {labels.map((_, i) => {
        const end = polarToXY((2 * Math.PI * i) / n, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(100,116,139,0.25)" strokeWidth="0.8" />;
      })}
      {/* Objetivo */}
      <polygon
        points={makePolygon(objetivo)}
        fill="rgba(16,185,129,0.08)"
        stroke="rgba(16,185,129,0.5)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      {/* Actual */}
      <polygon
        points={makePolygon(actual)}
        fill="rgba(16,185,129,0.2)"
        stroke="#10b981"
        strokeWidth="2"
      />
      {/* Labels */}
      {labels.map((label, i) => {
        const pt = polarToXY((2 * Math.PI * i) / n, r + 12);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" className={styles.radarLabel}>
            {label}
          </text>
        );
      })}
    </svg>
  );
};

// ── Gauge OEE ────────────────────────────────────────────
const GaugeOEE = ({ valor = 82 }) => {
  const angulo = -120 + (valor / 100) * 240;
  const r = 52, cx = 70, cy = 70;
  const arcLength = (240 / 360) * 2 * Math.PI * r;
  const offset = arcLength - (valor / 100) * arcLength;

  const color = valor >= 80 ? '#10b981' : valor >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 140 100" className={styles.gaugeSvg}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="10"
        strokeDasharray={`${(240 / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
        strokeDashoffset={0}
        transform={`rotate(150 ${cx} ${cy})`}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(240 / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
        strokeDashoffset={offset}
        transform={`rotate(150 ${cx} ${cy})`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" className={styles.gaugeValue}>{valor}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className={styles.gaugeLabel}>OEE Parcela</text>
    </svg>
  );
};

// ── Sparkline SVG ─────────────────────────────────────────
const Sparkline = ({ data, color = '#10b981' }) => {
  const w = 80, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min + 0.001)) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className={styles.sparkline}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
};

// ── Componente Principal ──────────────────────────────────
const DashboardInvestigador = () => {
  const agregarToast = useAppStore((s) => s.agregarToast);

  // Chat state
  const [mensajes, setMensajes] = useState(CHAT_INICIAL);
  const [inputChat, setInputChat] = useState('');
  const chatEndRef = useRef(null);

  // Slider simulador
  const [riego, setRiego] = useState(65);
  const [fertilizacion, setFertilizacion] = useState(80);
  const cosechaProyectada = (4.2 + (riego - 50) * 0.03 + (fertilizacion - 50) * 0.04).toFixed(1);

  // Válvulas IoT
  const [valvulas, setValvulas] = useState({ v1: true, v2: false, v3: true });

  // Telemetría dinámica
  const [telemetria, setTelemetria] = useState({
    humedad: [68, 70, 72, 71, 69, 72, 74, 72],
    temperatura: [27.8, 28.1, 28.4, 28.9, 29.1, 28.7, 28.4, 28.6],
  });

  // NPK actual vs objetivo
  const [npkActual] = useState([72, 85, 68, 90, 60, 75]);
  const [npkObjetivo] = useState([85, 85, 80, 90, 75, 80]);

  // Telemetría simulada cada 4s
  useEffect(() => {
    const id = setInterval(() => {
      setTelemetria((prev) => ({
        humedad: [...prev.humedad.slice(1), Math.round(65 + Math.random() * 15)],
        temperatura: [...prev.temperatura.slice(1), +(27 + Math.random() * 4).toFixed(1)],
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Autoscroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = useCallback(() => {
    if (!inputChat.trim()) return;
    const nuevo = { rol: 'usuario', texto: inputChat, hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) };
    setMensajes((prev) => [...prev, nuevo]);
    setInputChat('');
    setTimeout(() => {
      setMensajes((prev) => [
        ...prev,
        { rol: 'ia', texto: 'Procesando tu consulta con los datos satelitales más recientes… 🛰️ Dame un momento.', hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }, 1200);
  }, [inputChat]);

  const toggleValvula = (key) => {
    setValvulas((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      agregarToast(`Válvula ${key.toUpperCase()}: ${next[key] ? 'Abierta' : 'Cerrada'}`, next[key] ? 'success' : 'info');
      return next;
    });
  };

  return (
    <ResearcherLayout activeTab="dashboard">
      <div className={styles.comandoWrapper}>

        {/* ══ COLUMNA IZQUIERDA: Copiloto IA ══════════════════════ */}
        <aside className={styles.copiloColumn}>
          {/* Header Agro-Asesor */}
          <div className={styles.copiloHeader}>
            <div className={styles.copiloAvatar}>
              <span className="material-symbols-outlined">smart_toy</span>
              <span className={styles.onlineIndicator} />
            </div>
            <div>
              <p className={styles.copiloTitle}>Agro-Asesor</p>
              <p className={styles.copiloStatus}>
                <span className={styles.pulseDot} />
                Conectado · Sentinel-2 activo
              </p>
            </div>
          </div>

          {/* Badges IA Metrics */}
          <div className={styles.iaBadges}>
            <span className={styles.badge}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>insights</span>
              94.2% precisión
            </span>
            <span className={`${styles.badge} ${styles.badgeBlue}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>speed</span>
              124ms
            </span>
          </div>

          {/* Chat History */}
          <div className={styles.chatHistory}>
            {mensajes.map((msg, i) => (
              <div key={i} className={`${styles.chatMsg} ${msg.rol === 'usuario' ? styles.chatMsgUser : styles.chatMsgIA}`}>
                {msg.rol === 'ia' && (
                  <div className={styles.chatAvatar}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
                  </div>
                )}
                <div className={styles.chatBubble}>
                  <p dangerouslySetInnerHTML={{
                    __html: msg.texto
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                  <span className={styles.chatHora}>{msg.hora}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Sugerencias */}
          <div className={styles.sugerenciasRow}>
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                className={styles.sugerenciaBtn}
                onClick={() => setInputChat(s.texto)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{s.icono}</span>
                {s.texto}
              </button>
            ))}
          </div>

          {/* Input Chat */}
          <div className={styles.chatInputRow}>
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
              placeholder="Consulta al Agro-Asesor…"
              className={styles.chatInput}
            />
            <button onClick={enviarMensaje} className={styles.chatSendBtn} aria-label="Enviar">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </aside>

        {/* ══ COLUMNA CENTRAL: Mapa Maestro ═══════════════════════ */}
        <section className={styles.mapColumn}>
          {/* Overlay superior glassmorphism */}
          <div className={styles.mapOverlayTop}>
            <div className={styles.mapInfoChip}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>satellite_alt</span>
              Sector Norte · Turbaco, Bolívar
            </div>
            <div className={styles.mapInfoChip}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>eco</span>
              NDVI: 0.73 · Salud óptima
            </div>
            <div className={styles.mapInfoChip}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#f59e0b' }}>thermostat</span>
              28.6°C · 72% HR
            </div>
          </div>

          {/* Leaflet Map */}
          <MapContainer
            center={[10.377, -75.461]}
            zoom={14}
            className={styles.leafletMap}
            zoomControl={false}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Satélite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri, Maxar, Earthstar Geographics"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Mapa estándar">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* NDVI Overlay (simulado con círculo coloreado) */}
            <Circle
              center={[10.377, -75.461]}
              radius={600}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.18, weight: 1.5, dashArray: '6 4' }}
            />
            <Circle
              center={[10.371, -75.450]}
              radius={300}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 1.5 }}
            />

            {/* Nodos IoT */}
            {IOT_NODES.map((node) => (
              <Marker key={node.id} position={[node.lat, node.lng]} icon={iotIcon}>
                <Popup className={styles.iotPopup}>
                  <strong>{node.nombre}</strong><br />
                  💧 Humedad: {node.hum}%<br />
                  🌡️ Temp: {node.temp}°C
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Leyenda NDVI */}
          <div className={styles.ndviLegend}>
            <span className={styles.legendTitle}>NDVI</span>
            <div className={styles.legendBar} />
            <div className={styles.legendLabels}>
              <span>0.0 Estrés</span>
              <span>0.5</span>
              <span>1.0 Óptimo</span>
            </div>
          </div>
        </section>

        {/* ══ COLUMNA DERECHA: Analítica ═══════════════════════════ */}
        <aside className={styles.analyticsColumn}>

          {/* GAUGE OEE */}
          <div className={styles.analyticsCard}>
            <p className={styles.cardLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>donut_large</span>
              Eficiencia de Parcela
            </p>
            <GaugeOEE valor={82} />
          </div>

          {/* RADAR NPK */}
          <div className={styles.analyticsCard}>
            <div className={styles.cardLabelRow}>
              <p className={styles.cardLabel}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>radar</span>
                Radar Nutricional
              </p>
              <div className={styles.radarLegend}>
                <span className={styles.legendDot} style={{ background: '#10b981' }} /> Actual
                <span className={styles.legendDot} style={{ background: 'rgba(16,185,129,0.4)', border: '1px dashed #10b981' }} /> Objetivo
              </div>
            </div>
            <RadarNutricional actual={npkActual} objetivo={npkObjetivo} />
          </div>

          {/* SIMULADOR PREDICTIVO */}
          <div className={styles.analyticsCard}>
            <p className={styles.cardLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>model_training</span>
              Simulador Predictivo
            </p>
            <div className={styles.simulatorBody}>
              <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>water_drop</span>
                  Riego <strong>{riego}%</strong>
                </label>
                <input type="range" min="0" max="100" value={riego} onChange={(e) => setRiego(+e.target.value)} className={styles.slider} />
              </div>
              <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>science</span>
                  Fertilización <strong>{fertilizacion}%</strong>
                </label>
                <input type="range" min="0" max="100" value={fertilizacion} onChange={(e) => setFertilizacion(+e.target.value)} className={styles.slider} />
              </div>
              <div className={styles.proyeccionBox}>
                <span className={styles.proyeccionLabel}>Cosecha proyectada</span>
                <span className={styles.proyeccionValor}>{cosechaProyectada} <small>ton/ha</small></span>
              </div>
            </div>
          </div>

          {/* TELEMETRÍA IOT */}
          <div className={styles.analyticsCard}>
            <p className={styles.cardLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>sensors</span>
              Telemetría en Tiempo Real
            </p>
            <div className={styles.telemetriaGrid}>
              <div className={styles.telemetriaItem}>
                <div className={styles.telemetriaTop}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#3b82f6' }}>water_drop</span>
                  <span className={styles.telemetriaValor}>{telemetria.humedad.at(-1)}%</span>
                </div>
                <p className={styles.telemetriaLabel}>Humedad</p>
                <Sparkline data={telemetria.humedad} color="#3b82f6" />
              </div>
              <div className={styles.telemetriaItem}>
                <div className={styles.telemetriaTop}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#f59e0b' }}>thermostat</span>
                  <span className={styles.telemetriaValor}>{telemetria.temperatura.at(-1)}°C</span>
                </div>
                <p className={styles.telemetriaLabel}>Temperatura</p>
                <Sparkline data={telemetria.temperatura} color="#f59e0b" />
              </div>
            </div>

            {/* Válvulas de riego */}
            <div className={styles.valvulasGrid}>
              {Object.entries(valvulas).map(([key, open]) => (
                <button
                  key={key}
                  onClick={() => toggleValvula(key)}
                  className={`${styles.valvulaBtn} ${open ? styles.valvulaOpen : styles.valvulaClosed}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    {open ? 'valve' : 'valve'}
                  </span>
                  <span>{key.toUpperCase()}</span>
                  <span className={styles.valvulaStatus}>{open ? 'ABIERTA' : 'CERRADA'}</span>
                </button>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </ResearcherLayout>
  );
};

export default DashboardInvestigador;
