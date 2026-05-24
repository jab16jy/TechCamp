import { Download } from 'lucide-react';

export default function ExportPlanButton({ proyeccion, plan, disabled }) {
  const handleExport = () => {
    const content = {
      titulo: 'Plan de Implementacion Agronomica',
      fecha: new Date().toISOString(),
      ubicacion: proyeccion?.ubicacion || {},
      proyeccion: proyeccion?.meses || [],
      cultivo_optimo: proyeccion?.mejor_cultivo || '',
      mejor_mes: proyeccion?.mejor_mes || '',
      alertas: proyeccion?.alertas_globales || [],
      alertas_patrones: proyeccion?.alertas_patrones || [],
      plan_riego: plan || null,
    };

    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plan_Implementacion_${content.cultivo_optimo || 'AgroCaribe'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      className="ia-generate-btn"
      style={{ background: disabled ? '#9ca3af' : '#75584d', opacity: disabled ? 0.6 : 1 }}
    >
      <Download size={15} />
      Exportar Plan de Implementacion (JSON)
    </button>
  );
}
