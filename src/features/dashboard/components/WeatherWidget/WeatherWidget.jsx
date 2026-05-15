const glassPanel = 'bg-white shadow-sm border border-white/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';

const WeatherWidget = ({ weather }) => (
  <div className={`${glassPanel} p-5`}>
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Condiciones Meteorológicas · Ahora</p>
      <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-1 rounded-full border border-white/40">NASA POWER API</span>
    </div>
    <div className="grid grid-cols-4 gap-4">
      {weather.map((w, i) => (
        <div key={i} className="text-center bg-white rounded-xl p-3 border border-white/40 shadow-sm">
          <div className="flex justify-center mb-2">{w.icon}</div>
          <p className="text-lg font-bold text-slate-800">{w.value}</p>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mt-1">{w.label}</p>
        </div>
      ))}
    </div>
  </div>
);

export default WeatherWidget;
