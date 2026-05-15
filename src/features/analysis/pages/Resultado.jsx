import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import AnalysisResults from '@features/analysis/components/AnalysisResults';
import useResultado from '@features/analysis/hooks/useResultado';

const Resultado = () => {
  const { data, handleNuevaConsulta, handleDescargarPDF } = useResultado();

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
