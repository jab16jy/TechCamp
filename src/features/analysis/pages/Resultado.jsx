import useAppStore from '@shared/store';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import AnalysisResults from '@features/analysis/components/AnalysisResults';
import { useNavigate } from 'react-router-dom';

const Resultado = () => {
  const navigate = useNavigate();
  const { resultado, resetearFormulario, resetearResultado, agregarToast } = useAppStore();

  // Fallback data for demonstration if no result is in store
  const data = resultado || {
    clima: {
      temperatura: 28.4,
      precipitacion: 12,
      humedad: 76,
      radiacion_solar: 850,
      evapotranspiracion: 5.2
    },
    ubicacion: {
      municipio: 'Santa Marta',
      departamento: 'Magdalena',
      lat: 11.2408,
      lng: -74.1990,
      area_hectareas: 15.5,
      mes_siembra: 'Abril'
    },
    recomendaciones: [
      {
        cultivo: 'Maíz',
        score: 86,
        riesgo: 'Medio',
        justificacion: 'Las condiciones actuales de humedad del suelo y la proyección de precipitaciones sugieren un entorno favorable para el desarrollo del maíz híbrido. Se recomienda un monitoreo constante de la radiación solar en las próximas semanas para ajustar el ciclo de riego.'
      }
    ],
    indicadores_satelite: {
      ndvi: 0.42,
      ndwi: 0.18,
      cobertura_nube: 14.2,
      calidad_suelo: 'Alta'
    }
  };

  const handleNuevaConsulta = () => {
    resetearFormulario();
    resetearResultado();
    navigate('/investigador/analisis');
  };

  const handleDescargarPDF = () => {
    agregarToast('Generando reporte PDF...', 'info');
  };

  return (
    <ResearcherLayout activeTab="analisis">
      <AnalysisResults 
        data={data} 
        onNewAnalysis={handleNuevaConsulta} 
        onDownloadPDF={handleDescargarPDF} 
      />
    </ResearcherLayout>
  );
};

export default Resultado;
