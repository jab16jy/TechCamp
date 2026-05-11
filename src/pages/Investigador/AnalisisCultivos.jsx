import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import AnalysisService from '../../services/analysisService';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import MapSelector from '../../components/analysis/MapSelector';
import { MapPin, Mountain, CalendarDays, Sparkles, Zap } from 'lucide-react';

const AnalisisCultivos = () => {
  const navigate = useNavigate();
  const { 
    formulario, 
    actualizarFormulario, 
    setCargandoAnalisis, 
    setResultado, 
    agregarToast 
  } = useAppStore();

  const [municipiosLista, setMunicipiosLista] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

  useEffect(() => {
    AnalysisService.getAvailableLocations().then((data) => {
      setMunicipiosLista(data);
      if (data.length > 0) {
        const uniqueDeps = [...new Set(data.map(m => m.departamento))].sort();
        setDepartamentos(uniqueDeps);
      }
    });
  }, []);

  useEffect(() => {
    if (formulario.departamento && municipiosLista.length > 0) {
      const filtered = municipiosLista
        .filter(m => m.departamento === formulario.departamento)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setMunicipiosFiltrados(filtered);
    } else {
      setMunicipiosFiltrados([]);
    }
  }, [formulario.departamento, municipiosLista]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    actualizarFormulario({ [name]: value });
  };

  const handleMapChange = (latlng) => {
    actualizarFormulario({
      lat: latlng.lat,
      lng: latlng.lng
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const required = ['departamento', 'municipio', 'tipo_suelo', 'mes_siembra', 'area_hectareas'];
    const missing = required.filter(f => !formulario[f]);
    
    if (missing.length > 0 || !formulario.lat || !formulario.lng) {
      agregarToast('Faltan campos obligatorios o ubicación en el mapa', 'error');
      return;
    }

    setCargandoAnalisis(true);
    try {
      const resultado = await AnalysisService.performAnalysis(formulario);
      setResultado(resultado);
      agregarToast('Análisis completado', 'success');
      navigate('/resultado');
    } catch (error) {
      agregarToast('Error al procesar el análisis', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return (
    <ResearcherLayout activeTab="analisis">
      <div className="p-8 max-w-[1400px] mx-auto w-full h-full flex flex-col">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-slate-900 tracking-tight leading-tight">
            Análisis de Cultivos Estándar
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure los parámetros de su parcela para el análisis geolocalizado.
          </p>
        </div>

        {/* Bento Grid Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-5 flex-1 min-h-0">
          
          {/* Left Column: Inputs */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
            
            {/* Bento Card: Ubicación */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <MapPin size={18} strokeWidth={2.5} />
                <h3 className="font-serif text-lg text-slate-900 font-bold tracking-tight">Ubicación</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Departamento
                  </label>
                  <select 
                    name="departamento" 
                    value={formulario.departamento || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                  >
                    <option value="" disabled>Seleccione...</option>
                    {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Municipio
                  </label>
                  <select 
                    name="municipio" 
                    value={formulario.municipio || ''} 
                    onChange={handleInputChange} 
                    required 
                    disabled={!formulario.departamento}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                  >
                    <option value="" disabled>Seleccione...</option>
                    {municipiosFiltrados.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Bento Card: Terreno */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Mountain size={18} strokeWidth={2.5} />
                <h3 className="font-serif text-lg text-slate-900 font-bold tracking-tight">Terreno</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Tipo de Suelo
                  </label>
                  <select 
                    name="tipo_suelo" 
                    value={formulario.tipo_suelo || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                  >
                    <option value="" disabled>Clasificación...</option>
                    <option value="Arcilloso">Arcilloso</option>
                    <option value="Arenoso">Arenoso</option>
                    <option value="Francos">Francos</option>
                    <option value="Franco-Arcilloso">Franco-Arcilloso</option>
                    <option value="Limoso">Limoso</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Área (Hectáreas)
                  </label>
                  <input 
                    type="number" 
                    name="area_hectareas" 
                    value={formulario.area_hectareas || ''} 
                    onChange={handleInputChange} 
                    placeholder="Ej. 15.5" 
                    required 
                    step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Bento Card: Temporalidad */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <CalendarDays size={18} strokeWidth={2.5} />
                <h3 className="font-serif text-lg text-slate-900 font-bold tracking-tight">Temporalidad</h3>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mes de Siembra
                </label>
                <div className="relative">
                  <select 
                    name="mes_siembra" 
                    value={formulario.mes_siembra || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 pl-9 text-[13px] text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                  >
                    <option value="" disabled>Seleccione el mes...</option>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Map & CTA */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
            
            {/* Bento Card: Map */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col relative min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <MapPin size={18} strokeWidth={2.5} />
                  <h3 className="font-serif text-lg text-slate-900 font-bold tracking-tight">Geolocalización</h3>
                </div>
                {/* AI Insight Tooltip/Badge */}
                <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                  <Sparkles size={13} className="text-indigo-600" />
                  <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
                    IA-Mapping Insight: Humedad de suelo óptima (Sentinel-2)
                  </span>
                </div>
              </div>
              
              <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 relative">
                <MapSelector 
                  position={{ lat: formulario.lat, lng: formulario.lng }}
                  onPositionChange={handleMapChange}
                  height="100%"
                />
              </div>
            </div>

            {/* Bento Card: CTA */}
            <button 
              type="submit" 
              className="group bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl p-6 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 border border-emerald-400/50"
            >
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black tracking-widest uppercase text-emerald-100 mb-1">
                  Modelo Agro-IA Listo
                </span>
                <span className="text-2xl font-serif font-bold tracking-tight group-hover:translate-x-1 transition-transform">
                  Analizar con IA
                </span>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap size={24} className="text-white fill-white" />
              </div>
            </button>

          </div>

        </form>
      </div>
    </ResearcherLayout>
  );
};

export default AnalisisCultivos;
