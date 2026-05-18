import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@shared/store';
import { getAlertas, getHistorial, exportarReporte } from '@shared/services/api';

export default function useReportManager() {
  const { agregarToast } = useAppStore();
  const [alertas, setAlertas] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [exportData, setExportData] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAlertas(),
      getHistorial(),
    ]).then(([alertsData, historyData]) => {
      if (alertsData?.alertas) setAlertas(alertsData.alertas);
      if (Array.isArray(historyData)) setAnalyses(historyData.slice(0, 10));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleExport = useCallback(async (analysisId) => {
    setExporting(true);
    setSelectedAnalysis(analysisId);
    try {
      const data = await exportarReporte(analysisId);
      if (data) {
        setExportData(data);
        agregarToast('Reporte generado. Usa Ctrl+P para guardar como PDF.', 'exito');
      } else {
        agregarToast('No se pudo generar el reporte', 'error');
      }
    } catch {
      agregarToast('Error al exportar', 'error');
    } finally {
      setExporting(false);
    }
  }, [agregarToast]);

  const clearExport = useCallback(() => setExportData(null), []);

  return {
    alertas, analyses, loading, exporting, selectedAnalysis,
    exportData, handleExport, clearExport,
  };
}
