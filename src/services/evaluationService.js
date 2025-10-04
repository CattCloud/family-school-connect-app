import { fetchWithAuth } from './api.js';

const EVAL_PATH = '/evaluation-structure';

/**
 * Mapeos entre API y UI para componentes de evaluación
 */
function mapApiToUi(api) {
  return {
    id: api.id,
    nombre: api.nombre_item,
    peso: api.peso_porcentual,
    tipo: api.tipo_evaluacion,
    orden: api.orden_visualizacion,
    activo: api.estado_activo,
    fecha_configuracion: api.fecha_configuracion,
  };
}

function mapUiToApi(ui, index = 0) {
  return {
    id: ui.id, // el backend puede ignorarlo si no corresponde
    nombre_item: ui.nombre ?? ui.nombre_item,
    peso_porcentual: Number(ui.peso ?? ui.peso_porcentual ?? 0),
    tipo_evaluacion: ui.tipo ?? ui.tipo_evaluacion ?? 'recurrente',
    orden_visualizacion: ui.orden ?? ui.orden_visualizacion ?? index + 1,
    estado_activo: ui.activo ?? ui.estado_activo ?? true,
  };
}

/**
 * Servicio para gestionar la Estructura de Evaluación según DocumentacionAPI.md
 * Endpoints base:
 * - GET    /evaluation-structure?año=2025
 * - PUT    /evaluation-structure
 */
const evaluationService = {
  /**
   * Obtiene la estructura de evaluación actual (mapeada a UI) + metadatos
   * @param {number} [year]
   * @returns {Promise<{components: Array, meta: Object}>}
   */
  async getEvaluationStructure(year) {
    const y = Number.isInteger(year) ? year : new Date().getFullYear();
    const params = new URLSearchParams();
    // Usar estrictamente el parámetro documentado
    params.set('año', String(y));
    try {
      const res = await fetchWithAuth(`${EVAL_PATH}?${params.toString()}`);
      const comps = res?.data?.componentes || [];
      const meta = {
        año_academico: res?.data?.año_academico ?? y,
        suma_pesos: res?.data?.suma_pesos ?? comps.reduce((a, c) => a + (c?.peso_porcentual || 0), 0),
        total_componentes: res?.data?.total_componentes ?? comps.length,
        configuracion_bloqueada: res?.data?.configuracion_bloqueada ?? false,
        fecha_bloqueo: res?.data?.fecha_bloqueo ?? null,
      };
      return {
        components: comps.map(mapApiToUi),
        meta,
      };
    } catch (err) {
      // Si no existe estructura configurada para el año, devolver estructura vacía y meta por defecto
      if (err?.code === 'STRUCTURE_NOT_CONFIGURED' || err?.status === 404) {
        return {
          components: [],
          meta: {
            año_academico: y,
            suma_pesos: 0,
            total_componentes: 0,
            configuracion_bloqueada: false,
            fecha_bloqueo: null,
          },
        };
      }
      throw err;
    }
  },

  /**
   * Crea un nuevo componente agregándolo a la estructura (PUT completa)
   * @param {Object} component - componente UI parcial {nombre, peso, ...}
   * @param {number} [year]
   * @returns {Promise<Array>} Lista actualizada de componentes UI
   */
  async createEvaluationComponent(component, year) {
    const current = await this.getEvaluationStructure(year);
    const list = [...current, component];
    return this.updateFullStructure(list, year);
  },

  /**
   * Actualiza un componente por id dentro de la estructura (PUT completa)
   * @param {string|number} id
   * @param {Object} component
   * @param {number} [year]
   * @returns {Promise<Array>} Lista actualizada de componentes UI
   */
  async updateEvaluationComponent(id, component, year) {
    const current = await this.getEvaluationStructure(year);
    const list = current.map((c) => (c.id === id ? { ...c, ...component, id } : c));
    return this.updateFullStructure(list, year);
  },

  /**
   * Elimina un componente por id (PUT completa)
   * @param {string|number} id
   * @param {number} [year]
   * @returns {Promise<Array>} Lista actualizada de componentes UI
   */
  async deleteEvaluationComponent(id, year) {
    const current = await this.getEvaluationStructure(year);
    const list = current.filter((c) => c.id !== id);
    return this.updateFullStructure(list, year);
  },

  /**
   * Activa/Inactiva un componente por id (PUT completa)
   * @param {string|number} id
   * @param {boolean} active
   * @param {number} [year]
   * @returns {Promise<Array>} Lista actualizada de componentes UI
   */
  async toggleComponentStatus(id, active, year) {
    const current = await this.getEvaluationStructure(year);
    const list = current.map((c) => (c.id === id ? { ...c, activo: active } : c));
    return this.updateFullStructure(list, year);
  },

  /**
   * Actualiza toda la estructura (PUT /evaluation-structure)
   * @param {Array} components - Lista de componentes UI
   * @param {number} [year]
   * @returns {Promise<Array>} Lista actualizada de componentes UI
   */
  async updateFullStructure(components, year) {
    const y = Number.isInteger(year) ? year : new Date().getFullYear();
    const payload = {
      'año_academico': y,
      componentes: components.map((c, idx) => mapUiToApi(c, idx)),
    };

    const res = await fetchWithAuth(EVAL_PATH, {
      method: 'PUT',
      body: payload,
    });

    const comps = res?.data?.componentes || [];
    return comps.map(mapApiToUi);
  },


  /**
   * Plantillas predefinidas (GET /evaluation-structure/templates)
   * @returns {Promise<Array>} Lista de plantillas [{id, nombre, descripcion, componentes:[...]}]
   */
  async getTemplates() {
    const res = await fetchWithAuth(`${EVAL_PATH}/templates`);
    return res?.data?.templates || [];
  },

};

export default evaluationService;