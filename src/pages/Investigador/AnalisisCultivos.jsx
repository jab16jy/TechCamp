import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../context/useAppStore';
import AnalysisService from '../../services/analysisService';
import ResearcherLayout from '../../components/ResearcherLayout/ResearcherLayout';
import MapSelector from '../../components/analysis/MapSelector';
import AnalysisForm from '../../components/analysis/AnalysisForm';
import styles from './AnalisisCultivos.module.css';

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
  const rol = sessionStorage.getItem('rol');
  const isProductor = rol === 'productor';
  const [mode, setMode] = useState(isProductor ? 'simple' : 'simple'); // default to simple

  useEffect(() => {
    if (isProductor) setMode('simple');
  }, [isProductor]);

  useEffect(() => {
    AnalysisService.getAvailableLocations().then(setMunicipiosLista);
  }, []);

  const handleFormChange = (newFields) => {
    actualizarFormulario(newFields);
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
      agregarToast('Por favor, completa todos los campos y selecciona la ubicación en el mapa', 'error');
      return;
    }

    setCargandoAnalisis(true);
    try {
      const resultado = await AnalysisService.performAnalysis(formulario);
      setResultado(resultado);
      agregarToast('Análisis completado exitosamente', 'success');
      navigate('/resultado');
    } catch (error) {
      agregarToast('Error al procesar el análisis. Inténtalo de nuevo.', 'error');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  return (
    <ResearcherLayout activeTab="analisis">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className="premium-font">Análisis de Cultivos</h1>
          <p>Potencie su producción con recomendaciones basadas en IA y datos geoespaciales.</p>
        </header>

        {/* Mode Selector Tabs - Only for investigators */}
        {!isProductor && (
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${mode === 'simple' ? styles.tabBtnActive : ''}`}
              onClick={() => setMode('simple')}
            >
              Análisis Estándar
            </button>
            <button 
              className={`${styles.tabBtn} ${mode === 'advanced' ? styles.tabBtnActive : ''}`}
              onClick={() => setMode('advanced')}
            >
              Configuración Avanzada
              <span className={styles.tabBadge}>SUELO</span>
            </button>
          </div>
        )}

        <form className={styles.gridMain} onSubmit={handleSubmit}>
          {/* Map Column */}
          <div className={styles.colMap}>
            <div className={styles.premiumCard}>
              <div className={styles.cardHeader}>
                <span className="material-symbols-outlined">map</span>
                <h3>Ubicación Geográfica</h3>
              </div>
              <p className={styles.cardDesc}>Seleccione el polígono o punto exacto de la parcela en el mapa.</p>
              
              <MapSelector 
                position={{ lat: formulario.lat, lng: formulario.lng }}
                onPositionChange={handleMapChange}
                height={380}
              />

              <div className={styles.insightBox}>
                <span className="material-symbols-outlined">tips_and_updates</span>
                <p>
                  <strong>Tip Pro:</strong> El análisis es más preciso si selecciona el centro de la zona cultivable.
                </p>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className={styles.colForm}>
            <div className={styles.premiumCard}>
              <div className={styles.cardHeader}>
                <span className="material-symbols-outlined">settings_input_component</span>
                <h3>Parámetros del Cultivo</h3>
              </div>
              
              <AnalysisForm 
                data={formulario}
                onChange={handleFormChange}
                municipalities={municipiosLista}
                mode={mode}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.colCta}>
            <div className={styles.ctaCard}>
              <span className={`material-symbols-outlined ${styles.ctaBgIcon}`}>analytics</span>
              <div className={styles.ctaContent}>
                <div className={styles.ctaIconBox}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div className={styles.ctaText}>
                  <h4>Procesar Modelos Predictivos</h4>
                  <p>Iniciará el cálculo de afinidad basado en clima, NDVI y series históricas.</p>
                </div>
              </div>
              <button type="submit" className={styles.btnAnalyze}>
                Iniciar Análisis
              </button>
            </div>
          </div>

          {/* Model Status */}
          <div className={styles.colStatus}>
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <p>MODELO AGRO-IA</p>
                <span className={styles.badgeOptimo}>ACTIVO</span>
              </div>
              <div className={styles.statusBody}>
                <div className={styles.accRow}>
                  <span>Confianza del modelo</span>
                  <strong>94.2%</strong>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: '94.2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ResearcherLayout>
  );
};

export default AnalisisCultivos;
