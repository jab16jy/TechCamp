// ============================================================
// AgroAsesor.jsx — Módulo de Mapa Interactivo + Chatbot
// Diseño: Mapa a pantalla completa con panel chat glassmorphism
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import {
  Send, Bot, ChevronDown, Satellite, Wifi, RefreshCw,
  Leaf, Thermometer, Droplets, ZapIcon, MapPin,
} from 'lucide-react';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const iotIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:12px;height:12px;border-radius:50%;
    background:#10b981;border:2px solid #fff;
    box-shadow:0 0 0 3px rgba(16,185,129,0.4);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const IOT_NODES = [
  { id: 'N01', lat: 10.383, lng: -75.477, nombre: 'Nodo Norte-01', hum: 72, temp: 28.4, ndvi: 0.73 },
  { id: 'N02', lat: 10.371, lng: -75.461, nombre: 'Nodo Sur-02',   hum: 61, temp: 29.8, ndvi: 0.61 },
  { id: 'N03', lat: 10.377, lng: -75.450, nombre: 'Nodo Este-03',  hum: 55, temp: 31.2, ndvi: 0.54 },
];

const SUGERENCIAS = [
  '¿Cuál es el NDVI actual del Sector Norte?',
  'Recomendación de fertilización para Lote B',
  '¿Cuándo es el próximo frente de lluvia?',
  'Riesgo de estrés hídrico en Nodo S-03',
];

const CHAT_INIT = [
  {
    rol: 'ia',
    texto: 'Bienvenido al **Agro-Asesor IA** 🛰️\n\nHe sincronizado los últimos datos de Sentinel-2 y tus sensores IoT. El **NDVI en Sector Norte** es 0.73 (salud foliar óptima). Detecto una anomalía térmica en el **Nodo Este-03** (31.2°C). ¿Analizamos el riesgo de estrés hídrico?',
    hora: '10:24',
  },
];

const IA_RESPONSES = [
  'Procesando datos satelitales Sentinel-2 y correlacionando con sensores IoT… 🛰️\n\nSegún el análisis multiespectral, el **Lote B** presenta un índice NDWI de 0.18, indicando estrés hídrico moderado. Recomiendo activar riego por goteo en las próximas **2 horas**.',
  'El modelo Random Forest v4.2 indica una **probabilidad de lluvia del 73%** para las próximas 36 horas en la zona norte. Sugiero posponer la fertilización nitrogenada hasta después del evento climático.',
  'Para **Lote B** recomiendo:\n- **N:** +12 kg/ha (déficit detectado por NDVI)\n- **P:** Nivel adecuado ✅\n- **K:** +5 kg/ha (leve déficit)\n\nAplicar en las próximas 48h antes del frente de lluvia previsto.',
];

const AgroAsesor = () => {
  const [mensajes, setMensajes]     = useState(CHAT_INIT);
  const [input,    setInput]        = useState('');
  const [chatOpen, setChatOpen]     = useState(true);
  const [loading,  setLoading]      = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = useCallback(() => {
    if (!input.trim()) return;
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setMensajes((p) => [...p, { rol: 'usuario', texto: input, hora }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const resp = IA_RESPONSES[Math.floor(Math.random() * IA_RESPONSES.length)];
      const horaResp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setMensajes((p) => [...p, { rol: 'ia', texto: resp, hora: horaResp }]);
    }, 1400);
  }, [input]);

  return (
    <ResearcherLayout activeTab="mapas">
      {/* Contenedor relativo para posicionar el mapa y el chat sobre él */}
      <div className="relative w-full h-full" style={{ minHeight: 'calc(100vh - 64px)' }}>

        {/* ── MAPA FONDO ─────────────────────────────────────── */}
        <div className="absolute inset-0">
          <MapContainer
            center={[10.377, -75.461]}
            zoom={14}
            className="w-full h-full z-0"
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Satélite ESRI">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri, Maxar, Earthstar"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OpenStreetMap">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* NDVI Overlay */}
            <Circle center={[10.377, -75.461]} radius={600}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.18, weight: 1.5, dashArray: '6 4' }}
            />
            <Circle center={[10.371, -75.450]} radius={300}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 1.5 }}
            />

            {/* IoT Nodes */}
            {IOT_NODES.map((node) => (
              <Marker key={node.id} position={[node.lat, node.lng]} icon={iotIcon}>
                <Popup>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '12px', minWidth: '140px' }}>
                    <p style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{node.nombre}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span>💧 Humedad: <b>{node.hum}%</b></span>
                      <span>🌡️ Temp: <b>{node.temp}°C</b></span>
                      <span>🌿 NDVI: <b>{node.ndvi}</b></span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* ── CHIPS SUPERIORES (glassmorphism) ─────────────── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] flex gap-2 flex-wrap justify-center pointer-events-none">
          {[
            { icon: <Satellite size={11} />, text: 'Sector Norte · Turbaco, Bolívar' },
            { icon: <Leaf size={11} className="text-emerald-300" />, text: 'NDVI: 0.73 · Salud óptima' },
            { icon: <Thermometer size={11} className="text-amber-300" />, text: '28.6°C · 72% HR' },
          ].map((chip, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-emerald-100"
              style={{
                background: 'rgba(15,23,18,0.72)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(16,185,129,0.25)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              {chip.icon} {chip.text}
            </div>
          ))}
        </div>

        {/* ── LEYENDA NDVI ─────────────────────────────────── */}
        <div
          className="absolute bottom-5 left-5 z-[500] rounded-xl p-3"
          style={{ background: 'rgba(15,23,18,0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p className="text-[9px] font-black text-emerald-100 uppercase tracking-[0.15em] mb-2">NDVI</p>
          <div className="w-28 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #84cc16, #10b981)' }} />
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-emerald-100/90 font-mono">0 Estrés</span>
            <span className="text-[8px] text-emerald-100/90 font-mono">1.0 Óptimo</span>
          </div>
        </div>

        {/* ── PANEL CHAT FLOTANTE (glassmorphism) ─────────── */}
        <div className="absolute top-4 right-4 z-[600] w-80" style={{ fontFamily: "'Manrope', sans-serif" }}>

          {/* Toggle header */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer select-none"
            style={{
              background: 'rgba(15,31,23,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: chatOpen ? '16px 16px 0 0' : '16px',
            }}
            onClick={() => setChatOpen((p) => !p)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[12px] font-black text-white">Agro-Asesor IA</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider">Conectado · Sentinel-2</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <span className="text-[9px] font-bold text-white">94.2%</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-white transition-transform duration-200 ${chatOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>

          {/* Chat Body */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    background: 'rgba(10,20,15,0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                  }}
                >
                  {/* Messages */}
                  <div className="h-64 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(16,185,129,0.3) transparent' }}>
                    {mensajes.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.rol === 'usuario' ? 'flex-row-reverse' : ''}`}>
                        {msg.rol === 'ia' && (
                          <div className="w-6 h-6 shrink-0 rounded-lg mt-0.5 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <Bot size={12} className="text-emerald-400" />
                          </div>
                        )}
                        <div
                          className="max-w-[80%] px-3 py-2 rounded-xl text-[11.5px] leading-relaxed"
                          style={
                            msg.rol === 'ia'
                              ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '4px 12px 12px 12px' }
                              : { background: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff', borderRadius: '12px 4px 12px 12px' }
                          }
                        >
                          <p
                            dangerouslySetInnerHTML={{
                              __html: msg.texto
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>'),
                            }}
                          />
                          <span className="block text-[8.5px] mt-1" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                            {msg.hora}
                          </span>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                          <Bot size={12} className="text-emerald-400" />
                        </div>
                        <div className="px-3 py-2 rounded-xl flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          {[0, 1, 2].map((j) => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestions */}
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {SUGERENCIAS.slice(0, 2).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="text-[9.5px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex gap-2 px-3 pb-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && enviar()}
                      placeholder="Consulta al Agro-Asesor…"
                      className="flex-1 rounded-xl px-3 py-2 text-[12px] outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                      }}
                    />
                    <button
                      onClick={enviar}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: input.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </ResearcherLayout>
  );
};

export default AgroAsesor;
