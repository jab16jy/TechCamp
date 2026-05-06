import { 
  analizarUbicacion, 
  getMunicipios, 
  getClima, 
  getIndicadoresSatelite, 
  getHistorial 
} from './api';

/**
 * AnalysisService — Centralized logic for crop analysis.
 * Separates business logic from UI components.
 */
const AnalysisService = {
  /**
   * Performs a complete analysis of a location.
   * @param {Object} formData - Form data including lat, lng, soil type, etc.
   * @returns {Promise<Object>} Analysis results including climate, satellite, and recommendations.
   */
  async performAnalysis(formData) {
    // Process form data if necessary (e.g. type conversions)
    const payload = {
      ...formData,
      area_hectareas: Number(formData.area_hectareas) || 0,
      ph_suelo: formData.ph_suelo ? Number(formData.ph_suelo) : null,
      materia_organica: formData.materia_organica ? Number(formData.materia_organica) : null,
    };

    try {
      const results = await analizarUbicacion(payload);
      
      // We can add extra processing here, like client-side NDVI refinement if needed
      // or formatting the recommendations for the UI.
      
      return results;
    } catch (error) {
      console.error('Error in AnalysisService.performAnalysis:', error);
      throw error;
    }
  },

  /**
   * Fetches available municipalities.
   */
  async getAvailableLocations() {
    return await getMunicipios();
  },

  /**
   * Fetches climate data specifically.
   */
  async getClimateData(lat, lng) {
    return await getClima(lat, lng);
  },

  /**
   * Fetches satellite indicators (NDVI, NDWI, etc.).
   */
  async getSatelliteIndicators(lat, lng) {
    return await getIndicadoresSatelite(lat, lng);
  },

  /**
   * Fetches query history.
   */
  async getHistory() {
    return await getHistorial();
  },

  /**
   * Helper to determine NDVI color/status (Business Logic)
   */
  getNdviStatus(ndvi) {
    if (ndvi < 0.2) return { label: 'Bajo', color: 'var(--riesgo-alto)', class: 'alerta' };
    if (ndvi <= 0.5) return { label: 'Medio', color: 'var(--riesgo-medio)', class: 'normal' };
    return { label: 'Alto', color: 'var(--riesgo-bajo)', class: 'optimo' };
  }
};

export default AnalysisService;
