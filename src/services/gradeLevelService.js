import { fetchWithAuth } from './api.js';

const GRADES_BASE = '/grados';
const LEVELS_PATH = '/nivel-grado';

/**
 * Servicio para gestionar niveles educativos y grados
 * Basado en DocumentacionAPI.md:
 * - GET /nivel-grado  -> lista de niveles con sus grados
 * 
 * NOTA: Endpoints específicos por grado para estructura de evaluación
 * no están definidos en el documento compartido. Se mantienen rutas
 * bajo '/grados/{id}/evaluacion' como supuestos y quedan sujetos a
 * ajuste cuando el backend confirme la sintaxis final.
 */
const gradeLevelService = {
  /**
   * Obtiene todos los niveles y grados (aplanado para la UI)
   * Fuente: GET /nivel-grado
   * @returns {Promise<Array>} [{ id, nombre, grado, nivel, nivel_educativo }]
   */
  async getAllGradeLevels() {
    const res = await fetchWithAuth(LEVELS_PATH);
    const niveles = res?.data?.niveles || [];
    const grados = [];

    for (const nivel of niveles) {
      const levelName = nivel?.nivel || 'Sin nivel';
      for (const g of (nivel?.grados || [])) {
        grados.push({
          id: g.id,
          nombre: g.descripcion || `Grado ${g.grado}`,
          grado: g.grado,
          nivel: levelName,
          nivel_educativo: levelName,
        });
      }
    }

    return grados;
  },

  /**
   * SUPUESTO (no en doc actual): Obtener estructura por grado
   * @param {string|number} gradeId
   */
  async getGradeEvaluationStructure(gradeId) {
    return fetchWithAuth(`${GRADES_BASE}/${gradeId}/evaluacion`);
  },

  /**
   * SUPUESTO (no en doc actual): Actualizar estructura por grado
   * @param {string|number} gradeId
   * @param {Array} components
   */
  async updateGradeEvaluationStructure(gradeId, components) {
    return fetchWithAuth(`${GRADES_BASE}/${gradeId}/evaluacion`, {
      method: 'PUT',
      body: { componentes: components },
    });
  },

  /**
   * SUPUESTO (no en doc actual): Copiar estructura entre grados
   * @param {string|number} sourceGradeId
   * @param {string|number} targetGradeId
   */
  async copyEvaluationStructure(sourceGradeId, targetGradeId) {
    return fetchWithAuth(`${GRADES_BASE}/${sourceGradeId}/evaluacion/copiar`, {
      method: 'POST',
      body: { grado_destino: targetGradeId },
    });
  },

  /**
   * SUPUESTO (no en doc actual): Aplicar estructura institucional a un grado
   * @param {string|number} gradeId
   */
  async applyInstitutionalStructure(gradeId) {
    return fetchWithAuth(`${GRADES_BASE}/${gradeId}/evaluacion/aplicar-institucional`, {
      method: 'POST',
    });
  },

  /**
   * Placeholder: resumen por grado (no especificado en doc)
   * Se retorna objeto vacío para compatibilidad
   */
  async getEvaluationStructureSummary() {
    return {};
  },
};

export default gradeLevelService;