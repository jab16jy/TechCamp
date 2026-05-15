import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import ProductorLayout from '@shared/layout/ProductorLayout/ProductorLayout';
import AnalysisResults from '@features/analysis/components/AnalysisResults';
import useResultado from '@features/analysis/hooks/useResultado';

const Resultado = () => {
  const { data, handleNuevaConsulta, handleDescargarPDF } = useResultado();
  const rol = sessionStorage.getItem('rol');
  const Layout = rol === 'productor' ? ProductorLayout : ResearcherLayout;
  const layoutProps = rol === 'productor' ? {} : { activeTab: 'analisis' };

  return (
    <Layout {...layoutProps}>
      <AnalysisResults
        data={data}
        onNewAnalysis={handleNuevaConsulta}
        onDownloadPDF={handleDescargarPDF}
      />
    </Layout>
  );
};

export default Resultado;
