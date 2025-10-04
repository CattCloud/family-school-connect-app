import { fetchWithAuth } from './api.js';

/**
 * Obtiene la lista de docentes con sus permisos
 * @param {Object} options - Opciones de filtrado y paginación
 * @param {number} options.page - Número de página
 * @param {number} options.limit - Registros por página
 * @param {string} options.search - Búsqueda por nombre
 * @param {string} options.filter - Filtro: todos | con_permisos | sin_permisos
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const getTeachersPermissions = async (options = {}) => {
  const { page = 1, limit = 20, search = '', filter = 'todos' } = options;
  
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(filter !== 'todos' && { filter })
  }).toString();
  
  return fetchWithAuth(`/teachers/permissions?${queryParams}`);
};

/**
 * Actualiza el permiso de un docente
 * @param {string} docenteId - ID del docente
 * @param {string} tipoPermiso - Tipo de permiso: comunicados | encuestas
 * @param {boolean} estadoActivo - Estado del permiso: true | false
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const updateTeacherPermission = async (docenteId, tipoPermiso, estadoActivo) => {
  // Validar que tipoPermiso sea uno de los valores permitidos
  if (tipoPermiso !== 'comunicados' && tipoPermiso !== 'encuestas') {
    throw new Error('Tipo de permiso inválido. Debe ser "comunicados" o "encuestas"');
  }
  
  // Asegurar que estadoActivo sea un booleano
  const estadoBoolean = Boolean(estadoActivo);
  console.log({
      tipo_permiso: tipoPermiso,
      estado_activo: estadoBoolean
  });


  return fetchWithAuth(`/teachers/${docenteId}/permissions`, {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      tipo_permiso: tipoPermiso,
      estado_activo: estadoBoolean
    })
  });
};

/**
 * Obtiene el historial de permisos de un docente
 * @param {string} docenteId - ID del docente
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const getTeacherPermissionsHistory = async (docenteId) => {
  return fetchWithAuth(`/teachers/${docenteId}/permissions/history`);
};