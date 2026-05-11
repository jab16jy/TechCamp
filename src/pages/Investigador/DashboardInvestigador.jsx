// ============================================
// DashboardInvestigador.jsx — Panel de Agro-Asesor
// ============================================

import { useState } from 'react';
import useAppStore from '../../context/useAppStore';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';

// ── Datos de métricas del modelo (simulados) ──
const METRICAS = [
  { icono: 'insights', valor: '94.2%', label: 'Precisión', color: 'text-emerald-600' },
  { icono: 'speed', valor: '124ms', label: 'Latencia', color: 'text-blue-600' },
  { icono: 'database', valor: '4.2k', label: 'Muestras', color: 'text-amber-600' },
];

const EXPORTACIONES = [
  { icono: 'table_view', label: 'CSV Consultas', desc: 'Tabular' },
  { icono: 'picture_as_pdf', label: 'Reporte PDF', desc: 'Resumen' },
];

const DashboardInvestigador = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const agregarToast = useAppStore((s) => s.agregarToast);

  const handleExportar = (tipo) => {
    agregarToast(`Preparando ${tipo}…`, 'info');
  };

  return (
    <ResearcherLayout activeTab="dashboard">
      <div className="flex flex-row-reverse w-full h-[calc(100vh-70px)] bg-slate-50 overflow-hidden font-sans">
        
        {/* ── BARRA LATERAL DERECHA (Métricas y Exportar) ── */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} border-l bg-white flex flex-col transition-all duration-300 overflow-hidden relative shadow-xl z-10`}>
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">analytics</span>
              Panel Técnico
            </h3>
            <button onClick={() => setSidebarOpen(false)} className="hover:bg-slate-200 p-1 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-500">chevron_right</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {/* Métricas del Modelo */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salud del Modelo IA</h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Estable</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {METRICAS.map((m, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-xl hover:border-emerald-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white shadow-sm ${m.color}`}>
                        <span className="material-symbols-outlined text-lg">{m.icono}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase">{m.label}</p>
                        <p className="text-lg font-bold text-slate-800">{m.valor}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Acciones de Exportación */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Herramientas de Datos</h4>
              <div className="space-y-2">
                {EXPORTACIONES.map((exp, i) => (
                  <button 
                    key={i}
                    onClick={() => handleExportar(exp.label)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-600 transition-colors">{exp.icono}</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-700">{exp.label}</p>
                        <p className="text-[10px] text-slate-400">{exp.desc}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 text-sm group-hover:translate-x-1 transition-transform">download</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Quick Map Preview */}
            <section className="pt-4">
              <div className="rounded-2xl overflow-hidden relative group">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkRiuTuLPfG1E0Kzq99oA_lQTXVQdYEZsGjaFKXaFNLvQO56A3VbxQzWwCGNIez9PMGvlo0vqrpKvsd1yGeYr5Mq3ix9QSDslr8inZk8fWjkupEsxFs-zm3dt8U-80uQm3ROCsg9UN-xIwBICc0egrcmZCBIdy5J3WKroTzN98Row2QT7uC5jV-rGdhI_X92Riln0ric69xD3F6YWVbsteTddQMBv360q2aOwP0eT755s4QU1xPXeWzs7xU-Fo0kbB0vep2AAVyUE" alt="Turbaco Map" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 to-transparent flex items-end p-3">
                  <p className="text-[10px] font-bold text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span> Sector Norte, Turbaco
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="p-4 border-t bg-slate-50 shrink-0">
             <p className="text-[10px] text-center text-slate-400 font-medium italic">AgroCaribe Engine v4.2 Pro</p>
          </div>
        </aside>

        {/* Botón para reabrir sidebar si está cerrado */}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-20 right-4 z-20 bg-white border shadow-md p-2 rounded-full hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-slate-600">menu_open</span>
          </button>
        )}

        {/* ── INTERFAZ DE CHAT FULL SCREEN (Agro-Asesor) ── */}
        <main className="flex-1 flex flex-col relative bg-white h-full">
          {/* Header del Chat */}
          <header className="p-4 border-b flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 leading-tight">Agro-Asesor Inteligente</h2>
                <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                  <span className="animate-pulse block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Conectado • Análisis Satelital Activo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
               </button>
            </div>
          </header>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            
            {/* Mensaje IA */}
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </div>
              <div className="space-y-1">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 leading-relaxed">
                  <p>Hola, he sincronizado los últimos datos de <strong>Sentinel-2</strong> y tus sensores de suelo. 🛰️</p>
                  <p className="mt-2">Hoy la humedad en Turbaco es del <strong>28%</strong>. El NDVI muestra una salud foliar estable en el sector norte, pero detecto una anomalía térmica leve. ¿Quieres que analicemos el riesgo de estrés hídrico?</p>
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase px-1 tracking-tighter">10:24 AM • Procesado por IA</span>
              </div>
            </div>

            {/* Mensaje Usuario (Simulado) */}
            <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
               <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
              <div className="space-y-1 text-right">
                <div className="bg-emerald-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md text-sm leading-relaxed">
                  <p>¿Cuál es la recomendación de fertilización para el lote B?</p>
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase px-1 tracking-tighter">10:26 AM • Enviado</span>
              </div>
            </div>

          </div>

          {/* Footer / Entrada del Chat */}
          <footer className="p-4 border-t bg-slate-50/80 backdrop-blur-md shrink-0">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Sugerencias Rápidas */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['Ver riesgos climáticos', 'Estado de sensores', 'Optimizar fertilización', 'Ver mapas NDVI'].map((s, i) => (
                  <button key={i} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
              
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Escribe tu consulta al Agro-Asesor..." 
                  className="w-full bg-white border border-slate-200 pl-4 pr-24 py-4 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow-md transition-all active:scale-95">
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </main>

      </div>
    </ResearcherLayout>
  );
};

export default DashboardInvestigador;

