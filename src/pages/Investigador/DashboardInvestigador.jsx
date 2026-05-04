// ============================================
// DashboardInvestigador.jsx — Panel de métricas para investigadores
// Accessible only after authentication via LoginInvestigador.
// Shows: model KPIs, prediction charts (placeholder), historical
// queries table, quick access to the map/form, and export options.
// ============================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import styles from './DashboardInvestigador.module.css';

// ── Datos de métricas del modelo (simulados / placeholder) ──
const METRICAS = [
  { icono: '🎯', valor: '91.3%', label: 'Accuracy global', delta: '+2.1%', positivo: true },
  { icono: '📊', valor: '0.887', label: 'F1-Score macro', delta: '+0.04', positivo: true },
  { icono: '🗂️', valor: '4 218', label: 'Consultas totales', delta: '+134 este mes', positivo: true },
  { icono: '⚡', valor: '1.2 s', label: 'Latencia media', delta: '-0.3 s', positivo: true },
];

// ── Rendimiento por cultivo (placeholder para gráfico de barras) ──
const RENDIMIENTO_CULTIVOS = [
  { cultivo: 'Maíz',    precision: 94, recall: 91, color: '#e8b84b' },
  { cultivo: 'Yuca',    precision: 89, recall: 87, color: '#4ab86a' },
  { cultivo: 'Plátano', precision: 92, recall: 95, color: '#2d9e4f' },
  { cultivo: 'Arroz',   precision: 88, recall: 83, color: '#0d3d1c' },
  { cultivo: 'Frijol',  precision: 86, recall: 84, color: '#f96167' },
  { cultivo: 'Ñame',    precision: 90, recall: 88, color: '#7b61ff' },
];

// ── Historial de consultas recientes (simulado) ──
const HISTORIAL_DEMO = [
  { id: 'C-0421', fecha: '2025-04-21', municipio: 'Montería', cultivo: 'Maíz',    score: 94, estado: 'Exitosa' },
  { id: 'C-0420', fecha: '2025-04-20', municipio: 'Barranquilla', cultivo: 'Plátano', score: 88, estado: 'Exitosa' },
  { id: 'C-0419', fecha: '2025-04-19', municipio: 'Sincelejo', cultivo: 'Yuca',   score: 76, estado: 'Exitosa' },
  { id: 'C-0418', fecha: '2025-04-18', municipio: 'Valledupar', cultivo: 'Arroz', score: 91, estado: 'Exitosa' },
  { id: 'C-0417', fecha: '2025-04-17', municipio: 'Magangué',   cultivo: 'Frijol', score: 63, estado: 'Baja confianza' },
  { id: 'C-0416', fecha: '2025-04-16', municipio: 'Sahagún',    cultivo: 'Maíz',   score: 85, estado: 'Exitosa' },
];

// ── Íconos para los tipos de exportación ──
const EXPORTACIONES = [
  { icono: '📄', label: 'CSV de consultas', desc: 'Todas las predicciones en formato tabular' },
  { icono: '📊', label: 'Reporte PDF', desc: 'Resumen ejecutivo del modelo y métricas' },
  { icono: '🗃️', label: 'Dataset JSON', desc: 'Datos crudos para re-entrenamiento' },
];

const DashboardInvestigador = () => {
  const navigate = useNavigate();
  const agregarToast = useAppStore((s) => s.agregarToast);

  // ── Guardia de autenticación simple ──
  // En producción usar JWT + contexto de auth real
  useEffect(() => {
    const rol = sessionStorage.getItem('rol');
    if (rol !== 'investigador') {
      navigate('/investigador/login');
    }
  }, [navigate]);

  // Estado de la pestaña activa
  const [tabActiva, setTabActiva] = useState('metricas');

  // ── Cerrar sesión ──
  const cerrarSesion = () => {
    sessionStorage.removeItem('rol');
    agregarToast('Sesión cerrada', 'info');
    navigate('/');
  };

  // ── Simular exportación ──
  const handleExportar = (tipo) => {
    agregarToast(`Preparando ${tipo}… (función en desarrollo)`, 'info');
  };

  return (
    <div className={styles.pagina}>

      {/* ══════════════════════════════════
          SIDEBAR de navegación
          ══════════════════════════════════ */}
      <aside className={styles.sidebar} aria-label="Navegación del panel">

        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <span className={styles.sidebarLogoIcono}>🌿</span>
          <div>
            <span className={styles.sidebarLogoNombre}>AgroCaribe AI</span>
            <span className={styles.sidebarLogoRol}>Panel Investigador</span>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <nav className={styles.sidebarNav} aria-label="Secciones del dashboard">
          {[
            { id: 'metricas',    icono: '📊', label: 'Métricas del modelo' },
            { id: 'historial',   icono: '🗂️', label: 'Historial de consultas' },
            { id: 'exportar',    icono: '📤', label: 'Exportar datos' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`${styles.sidebarItem} ${tabActiva === tab.id ? styles.sidebarItemActivo : ''}`}
              onClick={() => setTabActiva(tab.id)}
              aria-current={tabActiva === tab.id ? 'page' : undefined}
            >
              <span className={styles.sidebarItemIcono}>{tab.icono}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Acceso rápido al mapa */}
        <div className={styles.sidebarAccesoMapa}>
          <Link to="/consulta" className={styles.btnMapa} id="btn-dashboard-mapa">
            <span>🗺️</span>
            <span>Ir al mapa</span>
          </Link>
        </div>

        {/* Footer del sidebar */}
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUsuario}>
            <span className={styles.sidebarAvatar}>🔬</span>
            <div>
              <span className={styles.sidebarUsuarioNombre}>Investigador</span>
              <span className={styles.sidebarUsuarioEmail}>TECHCAMP · 2025</span>
            </div>
          </div>
          <button
            className={styles.btnCerrarSesion}
            onClick={cerrarSesion}
            id="btn-cerrar-sesion"
            aria-label="Cerrar sesión"
          >
            🚪 Salir
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════
          CONTENIDO PRINCIPAL
          ══════════════════════════════════ */}
      <main className={styles.contenido} role="main">

        {/* Cabecera del contenido */}
        <header className={styles.contenidoCabecera}>
          <div>
            <h1 className={styles.contenidoTitulo}>
              {tabActiva === 'metricas'  && '📊 Métricas del Modelo IA'}
              {tabActiva === 'historial' && '🗂️ Historial de Consultas'}
              {tabActiva === 'exportar'  && '📤 Exportar Datos'}
            </h1>
            <p className={styles.contenidoSubtitulo}>
              {tabActiva === 'metricas'  && 'Rendimiento en producción · Datos actualizados hoy'}
              {tabActiva === 'historial' && 'Predicciones recientes del sistema · Últimos 30 días'}
              {tabActiva === 'exportar'  && 'Descarga datos del modelo y consultas históricas'}
            </p>
          </div>
          {/* Badge de estado API */}
          <div className={styles.apiBadge}>
            <span className={styles.apiDot} />
            API conectada
          </div>
        </header>

        {/* ─── TAB: MÉTRICAS DEL MODELO ─── */}
        {tabActiva === 'metricas' && (
          <section className={styles.seccion} aria-label="Métricas del modelo">

            {/* Tarjetas KPI */}
            <div className={styles.kpiGrid} role="list">
              {METRICAS.map((m) => (
                <div key={m.label} className={styles.kpiCard} role="listitem">
                  <div className={styles.kpiIcono}>{m.icono}</div>
                  <div className={styles.kpiValor}>{m.valor}</div>
                  <div className={styles.kpiLabel}>{m.label}</div>
                  <div className={`${styles.kpiDelta} ${m.positivo ? styles.kpiDeltaPos : styles.kpiDeltaNeg}`}>
                    {m.positivo ? '▲' : '▼'} {m.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico de barras por cultivo (CSS puro — placeholder elegante) */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitulo}>Precisión y Recall por cultivo</h2>
              <p className={styles.panelDesc}>
                Métricas de clasificación evaluadas sobre el conjunto de validación (n = 840 muestras).
              </p>

              <div className={styles.barrasContainer} aria-label="Gráfico de barras de métricas por cultivo">
                {RENDIMIENTO_CULTIVOS.map((c) => (
                  <div key={c.cultivo} className={styles.barraFila}>
                    <span className={styles.barraLabel}>{c.cultivo}</span>
                    <div className={styles.barrasDobles}>
                      {/* Barra Precision */}
                      <div className={styles.barraWrapper} title={`Precisión: ${c.precision}%`}>
                        <div
                          className={styles.barra}
                          style={{ width: `${c.precision}%`, background: c.color }}
                          role="meter"
                          aria-label={`${c.cultivo} precisión ${c.precision}%`}
                          aria-valuenow={c.precision}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                        <span className={styles.barraPct}>{c.precision}%</span>
                      </div>
                      {/* Barra Recall */}
                      <div className={styles.barraWrapper} title={`Recall: ${c.recall}%`}>
                        <div
                          className={styles.barra}
                          style={{ width: `${c.recall}%`, background: c.color, opacity: 0.55 }}
                          role="meter"
                          aria-label={`${c.cultivo} recall ${c.recall}%`}
                          aria-valuenow={c.recall}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                        <span className={styles.barraPct}>{c.recall}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leyenda */}
              <div className={styles.leyenda} aria-label="Leyenda del gráfico">
                <span className={styles.leyendaItem}>
                  <span className={styles.leyendaColor} style={{ opacity: 1 }} /> Precisión
                </span>
                <span className={styles.leyendaItem}>
                  <span className={styles.leyendaColor} style={{ opacity: 0.55 }} /> Recall
                </span>
              </div>
            </div>

            {/* Placeholder para gráfico temporal */}
            <div className={`${styles.panel} ${styles.panelPlaceholder}`}>
              <div className={styles.placeholderIcono}>📈</div>
              <h3 className={styles.placeholderTitulo}>Evolución temporal del modelo</h3>
              <p className={styles.placeholderDesc}>
                Gráfico de accuracy a lo largo del tiempo (próxima versión — integrar Chart.js o Recharts)
              </p>
              <span className={styles.placeholderBadge}>En desarrollo</span>
            </div>

          </section>
        )}

        {/* ─── TAB: HISTORIAL DE CONSULTAS ─── */}
        {tabActiva === 'historial' && (
          <section className={styles.seccion} aria-label="Historial de consultas">
            <div className={styles.panel}>
              <div className={styles.panelAcciones}>
                <h2 className={styles.panelTitulo}>Consultas recientes</h2>
                <button
                  className={styles.btnSecundario}
                  onClick={() => handleExportar('CSV de historial')}
                  id="btn-exportar-historial"
                >
                  📄 Exportar CSV
                </button>
              </div>

              {/* Tabla de historial */}
              <div className={styles.tablaWrapper} role="region" aria-label="Tabla de consultas históricas">
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Municipio</th>
                      <th scope="col">Cultivo rec.</th>
                      <th scope="col">Score IA</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORIAL_DEMO.map((fila) => (
                      <tr key={fila.id} className={styles.tablaFila}>
                        <td className={styles.tablaId}>{fila.id}</td>
                        <td>{fila.fecha}</td>
                        <td>{fila.municipio}</td>
                        <td><span className={styles.tablaCultivo}>{fila.cultivo}</span></td>
                        <td>
                          <span
                            className={`${styles.tablaScore} ${
                              fila.score >= 85 ? styles.scoreAlto :
                              fila.score >= 70 ? styles.scoreMedio : styles.scoreBajo
                            }`}
                          >
                            {fila.score}%
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.tablaEstado} ${
                            fila.estado === 'Exitosa' ? styles.estadoExitoso : styles.estadoAviso
                          }`}>
                            {fila.estado}
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles.btnTablaAccion}
                            onClick={() => agregarToast(`Detalle de ${fila.id} (próximamente)`, 'info')}
                            aria-label={`Ver detalle de consulta ${fila.id}`}
                          >
                            Ver →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className={styles.tablaNota}>
                Mostrando 6 de 4 218 consultas. Filtra por fecha, municipio o cultivo en la versión completa.
              </p>
            </div>
          </section>
        )}

        {/* ─── TAB: EXPORTAR DATOS ─── */}
        {tabActiva === 'exportar' && (
          <section className={styles.seccion} aria-label="Exportar datos">
            <div className={styles.exportGrid}>
              {EXPORTACIONES.map((exp) => (
                <div key={exp.label} className={styles.exportCard}>
                  <span className={styles.exportIcono}>{exp.icono}</span>
                  <h3 className={styles.exportLabel}>{exp.label}</h3>
                  <p className={styles.exportDesc}>{exp.desc}</p>
                  <button
                    className={styles.btnExportar}
                    onClick={() => handleExportar(exp.label)}
                    id={`btn-exportar-${exp.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Descargar
                  </button>
                </div>
              ))}
            </div>

            {/* Placeholder configuración de exportación */}
            <div className={`${styles.panel} ${styles.panelPlaceholder}`}>
              <div className={styles.placeholderIcono}>⚙️</div>
              <h3 className={styles.placeholderTitulo}>Configurar exportación avanzada</h3>
              <p className={styles.placeholderDesc}>
                Filtros por fecha, municipio, departamento y tipo de cultivo (próxima versión)
              </p>
              <span className={styles.placeholderBadge}>En desarrollo</span>
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default DashboardInvestigador;
