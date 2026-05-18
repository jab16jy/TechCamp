import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Globe, Database, Trash2,
  HardDrive, Server, Activity, Download, Upload,
  Wrench, Thermometer, Droplets, Radio, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAuthGuard from '@shared/hooks/useAuthGuard';
import useSettings from '@features/settings/hooks/useSettings';
import './Ajustes.css';

const Ajustes = () => {
  const authorized = useAuthGuard('investigador');
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const {
    finca, saveFinca,
    apiUrl, saveApiUrl,
    backendStatus, testing, testBackend,
    exportData, importData, clearCache,
  } = useSettings();

  if (!authorized) return null;

  return (
    <ResearcherLayout activeTab="">
      <div className="aj-root">
        <header className="aj-header">
          <button className="aj-back-btn" onClick={() => navigate('/investigador/dashboard')}>
            <ArrowLeft size={13} /> Volver
          </button>
          <div className="aj-header-main">
            <div className="aj-title-wrap">
              <div className="aj-title-icon">
                <Wrench size={26} />
              </div>
              <div>
                <h1 className="aj-title">Ajustes</h1>
                <p className="aj-subtitle">Configuracion de finca, API, datos y sistema</p>
              </div>
            </div>
          </div>
        </header>

        <div className="aj-grid">
          {/* MI FINCA */}
          <section className="aj-card">
            <div className="aj-card-head">
              <MapPin size={18} /> <h2>Mi Finca</h2>
              <span className="aj-card-badge">Por defecto</span>
            </div>
            <p className="aj-card-desc">Estas coordenadas se usan como ubicacion por defecto en todos los modulos de la aplicacion.</p>
            <div className="aj-row">
              <div className="aj-field">
                <label>Nombre</label>
                <input type="text" value={finca.nombre} onChange={(e) => saveFinca({ nombre: e.target.value })} />
              </div>
            </div>
            <div className="aj-row aj-row-2">
              <div className="aj-field">
                <label>Latitud</label>
                <input type="number" step="0.0001" value={finca.lat} onChange={(e) => saveFinca({ lat: Number(e.target.value) })} />
              </div>
              <div className="aj-field">
                <label>Longitud</label>
                <input type="number" step="0.0001" value={finca.lng} onChange={(e) => saveFinca({ lng: Number(e.target.value) })} />
              </div>
            </div>
            <div className="aj-finca-preview">
              <div className="aj-finca-stat">
                <Thermometer size={14} />
                <span>{finca.lat.toFixed(4)} N</span>
              </div>
              <div className="aj-finca-stat">
                <Radio size={14} />
                <span>{finca.lng.toFixed(4)} W</span>
              </div>
            </div>
          </section>

          {/* API */}
          <section className="aj-card">
            <div className="aj-card-head">
              <Server size={18} /> <h2>Servidor API</h2>
              <span className="aj-card-badge">Backend</span>
            </div>
            <p className="aj-card-desc">URL del backend FastAPI. Cambiala si usas Docker, Supabase remoto o un servidor diferente.</p>
            <div className="aj-row">
              <div className="aj-field aj-field-full">
                <label>URL del Backend</label>
                <div className="aj-input-group">
                  <Globe size={14} className="aj-input-icon" />
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                  />
                  <button className="aj-save-btn" onClick={() => saveApiUrl(apiUrl)}>Aplicar</button>
                </div>
              </div>
            </div>
            <div className="aj-api-status">
              <button className="aj-test-btn" onClick={testBackend} disabled={testing}>
                {testing ? <Loader2 size={14} className="spin" /> : <Activity size={14} />}
                {testing ? 'Probando...' : 'Probar conexion'}
              </button>
              {backendStatus && (
                <div className={`aj-status-badge ${backendStatus.ok ? 'ok' : 'fail'}`}>
                  {backendStatus.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  <span>{backendStatus.ok ? `Conectado v${backendStatus.version}` : backendStatus.error}</span>
                </div>
              )}
            </div>
          </section>

          {/* DATOS */}
          <section className="aj-card">
            <div className="aj-card-head">
              <Database size={18} /> <h2>Datos</h2>
              <span className="aj-card-badge">Backup</span>
            </div>
            <p className="aj-card-desc">Exporta tu historial y configuracion como archivo JSON, o restaura desde un backup anterior.</p>
            <div className="aj-row aj-row-2">
              <button className="aj-action-btn export" onClick={exportData}>
                <Download size={15} /> Exportar datos
              </button>
              <button className="aj-action-btn import" onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Importar backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
              />
            </div>
          </section>

          {/* SISTEMA */}
          <section className="aj-card">
            <div className="aj-card-head">
              <HardDrive size={18} /> <h2>Sistema</h2>
              <span className="aj-card-badge">Mantenimiento</span>
            </div>
            <p className="aj-card-desc">Limpia la cache local, el historial y todos los datos guardados en este navegador.</p>
            <div className="aj-row">
              <button className="aj-action-btn danger" onClick={clearCache}>
                <Trash2 size={15} /> Limpiar cache y reiniciar
              </button>
            </div>
            <div className="aj-info-row">
              <span>AgroCaribe IA v1.0</span>
              <span className="aj-dot">·</span>
              <span>React 19 + FastAPI</span>
              <span className="aj-dot">·</span>
              <span>{navigator.userAgent.includes('Win') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'Mac' : 'Navegador'}</span>
            </div>
          </section>
        </div>
      </div>
    </ResearcherLayout>
  );
};

export default Ajustes;
