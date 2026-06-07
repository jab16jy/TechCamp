import { useState } from 'react';
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import ProductorLayout from '@shared/layout/ProductorLayout/ProductorLayout';
import AnalysisResults from '@features/analysis/components/AnalysisResults';
import useResultado from '@features/analysis/hooks/useResultado';
import { setAnalysisFeedback } from '@shared/services/api';
import useAppStore from '@shared/store';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const Resultado = () => {
  const { data, handleNuevaConsulta, handleDescargarPDF } = useResultado();
  const { agregarToast, setResultado } = useAppStore();
  const rol = sessionStorage.getItem('rol');
  const Layout = rol === 'productor' ? ProductorLayout : ResearcherLayout;
  const layoutProps = rol === 'productor' ? {} : { activeTab: 'analisis' };

  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackExito, setFeedbackExito] = useState(false);
  const [rendimientoReal, setRendimientoReal] = useState('');
  const [sending, setSending] = useState(false);

  const analysisId = data?.id || data?.analysis_id;

  const handleFeedback = async (exito) => {
    if (!analysisId) {
      agregarToast('No se pudo identificar el análisis', 'error');
      return;
    }
    setSending(true);
    const result = await setAnalysisFeedback(analysisId, {
      exito,
      rendimiento_real: rendimientoReal ? Number(rendimientoReal) : undefined,
    });
    setSending(false);

    if (result?.success === false) {
      agregarToast(result.message || 'Error al enviar feedback', 'error');
      return;
    }

    setFeedbackSent(true);
    setFeedbackExito(exito);
    agregarToast(
      exito
        ? '¡Gracias! Reportaste este análisis como exitoso.'
        : 'Gracias por tu reporte. Ayudará a mejorar nuestras predicciones.',
      'exito',
    );

    if (data) {
      setResultado({ ...data, feedback: { enviado: true, exito, rendimiento_real: rendimientoReal } });
    }
  };

  return (
    <Layout {...layoutProps}>
      <AnalysisResults
        data={data}
        onNewAnalysis={handleNuevaConsulta}
        onDownloadPDF={handleDescargarPDF}
      />

      {analysisId && !feedbackSent && (
        <div className="mt-4 bg-white/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm p-5">
          <h3 className="text-[#1A1C1A] font-bold text-sm mb-4">
            Reportar resultado del cultivo
          </h3>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => handleFeedback(true)}
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] hover:bg-[#1e3f1c] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <ThumbsUp size={16} /> Reportar éxito
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <ThumbsDown size={16} /> Reportar fallo
            </button>
          </div>

          <div>
            <label className="text-[#707973] text-xs font-semibold block mb-1.5 uppercase tracking-wider">
              Rendimiento real (kg/ha) <span className="normal-case font-normal text-[#94a3b8]">— opcional</span>
            </label>
            <input
              type="number"
              value={rendimientoReal}
              onChange={(e) => setRendimientoReal(e.target.value)}
              placeholder="Ej: 4500"
              disabled={sending}
              className="w-full max-w-xs px-3.5 py-2 bg-white/40 border border-white/30 rounded-lg text-[#1A1C1A] placeholder-[#94a3b8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]/40 disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {analysisId && feedbackSent && (
        <div className="mt-4 bg-white/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            {feedbackExito ? (
              <ThumbsUp size={22} className="text-[#2D5A27]" />
            ) : (
              <ThumbsDown size={22} className="text-[#dc2626]" />
            )}
            <div>
              <p className="text-[#1A1C1A] font-bold text-sm">
                {feedbackExito ? 'Reportado como exitoso' : 'Reportado como fallo'}
              </p>
              <p className="text-[#707973] text-xs mt-0.5">
                Gracias por tu retroalimentación
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Resultado;
