// Servicio de Asistencia - HU-ACAD-02 (Carga de Asistencia Diaria)
// Endpoints exactos según doc/Semana 5/DocumentacionAPI_datos1.md
// Rutas base (local): http://localhost:3000
//
// Notas clave:
// - Todas las llamadas requieren Authorization: Bearer <token> (inyectado desde localStorage).
// - Descarga de plantilla: POST /asistencias/plantilla devuelve binario Excel.
// - Validación: POST /asistencias/validar (multipart/form-data) devuelve JSON con validacion_id, archivo_errores_url y detalles.
// - Carga: POST /asistencias/cargar (JSON) procesa registros válidos.
// - Reporte TXT: GET /asistencias/reporte-errores/{report_id} devuelve text/plain (descarga).
// - Verificación previa duplicados del día: GET /asistencias/verificar.
// - Estadísticas del día: GET /asistencias/estadisticas.

import { BASE_URL, fetchWithAuth, apiFetchBinary, buildHeaders, ApiError } from './api'

/**
 * Garantiza contrato { success: true, data: ... } y lanza ApiError si success === false
 * @param {any} json
 * @returns {any}
 */
function ensureSuccess(json) {
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success === false) {
      const code = json.error?.code || 'HTTP_ERROR'
      const message = json.error?.message || 'Error en la solicitud'
      throw new ApiError(message, 400, code, json)
    }
  }
  return json
}

/**
 * Construye query string con parámetros no nulos/indefinidos/''.
 * @param {Record<string, any>} params
 * @returns {string}
 */
function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  return `?${qs}`
}

/**
 * Obtiene token JWT desde localStorage (si existe).
 * @returns {string}
 */
function getToken() {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem('auth_token') || ''
}

/**
 * POST que envía JSON y espera Blob (Excel).
 * @param {string} path
 * @param {object} bodyObj
 * @returns {Promise<Blob>}
 */
async function postBinaryJson(path, bodyObj) {
  const isAbsolute = /^https?:/i.test(path)
  const url = isAbsolute ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const token = getToken()
  const headers = buildHeaders(token, { 'Content-Type': 'application/json; charset=utf-8' })
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj)
  })
  if (!res.ok) {
    let parsed
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json') || ct.includes('+json')) {
      try { parsed = await res.json() } catch { parsed = undefined }
    } else {
      try { parsed = await res.text() } catch { parsed = undefined }
    }
    const message = parsed?.error?.message || parsed?.message || res.statusText || 'Error en la solicitud'
    const code = parsed?.error?.code || 'HTTP_ERROR'
    throw new ApiError(message, res.status, code, parsed)
  }
  return await res.blob()
}

const attendanceService = {
  // ==============================
  // Contexto (Cursos / Estudiantes)
  // ==============================

  /**
   * Docente: Obtener cursos asignados (año actual por defecto).
   * GET /cursos/asignados?año_academico=2025
   * @param {number} [año_academico]
   * @returns {Promise<any>}
   */
  async getAssignedCourses(año_academico) {
    const qs = buildQuery({ año_academico })
    const res = await fetchWithAuth(`/cursos/asignados${qs}`, { method: 'GET' })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Director: Obtener cursos por nivel y grado.
   * GET /cursos?nivel={nivel}&grado={grado}&año_academico=2025
   * @param {"Inicial"|"Primaria"|"Secundaria"|string} nivel
   * @param {string|number} grado
   * @param {number} [año_academico]
   * @returns {Promise<any>}
   */
  async getCoursesByLevelGrade(nivel, grado, año_academico) {
    if (!nivel || !grado) {
      throw new ApiError("Los parámetros 'nivel' y 'grado' son requeridos", 400, 'MISSING_PARAMETERS')
    }
    const qs = buildQuery({ nivel, grado, año_academico })
    const res = await fetchWithAuth(`/cursos${qs}`, { method: 'GET' })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Obtener estudiantes activos por curso.
   * GET /estudiantes?curso_id={id}&nivel_grado_id={id}&año_academico=2025
   * @param {string} curso_id
   * @param {string} nivel_grado_id
   * @param {number} [año_academico]
   * @returns {Promise<any>}
   */
  async getStudentsByCourse(curso_id, nivel_grado_id, año_academico) {
    if (!curso_id || !nivel_grado_id) {
      throw new ApiError('curso_id y nivel_grado_id son requeridos', 400, 'INVALID_PARAMETERS')
    }
    const qs = buildQuery({ curso_id, nivel_grado_id, año_academico })
    const res = await fetchWithAuth(`/estudiantes${qs}`, { method: 'GET' })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  // ==============================
  // Verificación de duplicados del día
  // ==============================

  /**
   * Verificar si ya existe asistencia para fecha y contexto.
   * GET /asistencias/verificar?curso_id={id}&nivel_grado_id={id}&fecha=YYYY-MM-DD&año_academico=2025
   * @param {string} curso_id
   * @param {string} nivel_grado_id
   * @param {string} fecha YYYY-MM-DD
   * @param {number} [año_academico]
   * @returns {Promise<any>}
   */
  async verifyAttendance(curso_id, nivel_grado_id, fecha, año_academico) {
    if (!curso_id || !nivel_grado_id || !fecha) {
      throw new ApiError('curso_id, nivel_grado_id y fecha son requeridos', 400, 'MISSING_PARAMETERS')
    }
    const qs = buildQuery({ curso_id, nivel_grado_id, fecha, año_academico })
    const res = await fetchWithAuth(`/asistencias/verificar${qs}`, { method: 'GET' })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  // ==============================
  // Plantilla de Asistencia (Excel)
  // ==============================

  /**
   * Descargar plantilla Excel de asistencia.
   * POST /asistencias/plantilla → Blob (Excel)
   * Body JSON:
   * {
   *   "curso_id": "cur_001",
   *   "nivel_grado_id": "ng_006",
   *   "fecha": "2025-02-10",
   *   "año_academico": 2025
   * }
   * @param {{curso_id:string, nivel_grado_id:string, fecha:string, año_academico?:number}} payload
   * @returns {Promise<Blob>}
   */
  async downloadTemplate(payload) {
    const required = ['curso_id', 'nivel_grado_id', 'fecha']
    for (const k of required) {
      if (!payload || payload[k] === undefined || payload[k] === null || payload[k] === '') {
        throw new ApiError(`Campo requerido faltante: ${k}`, 400, 'MISSING_REQUIRED_FIELDS')
      }
    }
    return await postBinaryJson('/asistencias/plantilla', payload)
  },

  // ==============================
  // Validación de Archivo (multipart/form-data)
  // ==============================

  /**
   * Validar archivo Excel de asistencia sin insertar.
   * POST /asistencias/validar (multipart/form-data)
   * Campos requeridos:
   * - curso_id, nivel_grado_id, fecha, año_academico (opcional), archivo (Excel)
   * @param {{curso_id:string, nivel_grado_id:string, fecha:string, año_academico?:number}} context
   * @param {File|Blob} archivoExcel
   * @returns {Promise<{
   *   validacion_id: string,
   *   contexto: any,
   *   resumen: { total_filas: number, validos: number, con_errores: number },
   *   registros_validos: any[],
   *   registros_con_errores: any[],
   *   advertencias?: any[],
   *   desglose_por_estado?: {
   *     presente?: number,
   *     tardanza?: number,
   *     permiso?: number,
   *     falta_justificada?: number,
   *     falta_injustificada?: number
   *   },
   *   archivo_errores_url?: string
   * }>}
   */
  async validateFile(context, archivoExcel) {
    const required = ['curso_id', 'nivel_grado_id', 'fecha']
    for (const k of required) {
      if (!context || context[k] === undefined || context[k] === null || context[k] === '') {
        throw new ApiError(`Campo requerido faltante: ${k}`, 400, 'MISSING_REQUIRED_FIELDS')
      }
    }
    if (!archivoExcel) {
      throw new ApiError('El archivo Excel es requerido', 400, 'MISSING_FILE')
    }

    const fd = new FormData()
    fd.append('curso_id', String(context.curso_id))
    fd.append('nivel_grado_id', String(context.nivel_grado_id))
    fd.append('fecha', String(context.fecha)) // YYYY-MM-DD
    if (context.año_academico !== undefined && context.año_academico !== null) {
      fd.append('año_academico', String(context.año_academico))
    }
    // Campo 'archivo' es el que el backend espera
    fd.append('archivo', archivoExcel, (archivoExcel && archivoExcel.name) ? archivoExcel.name : 'asistencia.xlsx')

    const res = await fetchWithAuth('/asistencias/validar', {
      method: 'POST',
      body: fd
      // api.js NO setea Content-Type para FormData (correcto)
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  // ==============================
  // Carga / Procesamiento
  // ==============================

  /**
   * Procesar e insertar asistencias válidas.
   * POST /asistencias/cargar (JSON)
   * Body:
   * {
   *   "validacion_id": "val_asi_20250210_001",
   *   "procesar_solo_validos": true,
   *   "reemplazar_existente": false,
   *   "generar_alertas": true
   * }
   * @param {{ validacion_id:string, procesar_solo_validos?:boolean, reemplazar_existente?:boolean, generar_alertas?:boolean }} payload
   * @returns {Promise<any>}
   */
  async loadAttendance(payload) {
    if (!payload?.validacion_id) {
      throw new ApiError('validacion_id es requerido', 400, 'INVALID_INPUT')
    }
    const res = await fetchWithAuth('/asistencias/cargar', {
      method: 'POST',
      body: {
        validacion_id: payload.validacion_id,
        procesar_solo_validos: payload.procesar_solo_validos ?? true,
        reemplazar_existente: payload.reemplazar_existente ?? false,
        generar_alertas: payload.generar_alertas ?? true
      }
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  // ==============================
  // Reporte TXT de Errores (descarga)
  // ==============================

  /**
   * Descargar reporte TXT de errores de validación de asistencia.
   * GET /asistencias/reporte-errores/{report_id} (text/plain)
   * @param {string} reportUrlOrId - Puede ser un path absoluto/relativo o solo report_id.
   * @returns {Promise<Blob>} Blob de tipo text/plain
   */
  async downloadErrorReport(reportUrlOrId) {
    if (!reportUrlOrId) {
      throw new ApiError('report_id o URL requerido', 400, 'INVALID_INPUT')
    }
    const isPathOrUrl = String(reportUrlOrId).startsWith('/') || /^https?:/i.test(String(reportUrlOrId))
    const path = isPathOrUrl
      ? String(reportUrlOrId)
      : `/asistencias/reporte-errores/${encodeURIComponent(String(reportUrlOrId))}`

    const token = getToken()
    return await apiFetchBinary(path, {
      method: 'GET',
      token
    })
  },

  // ==============================
  // Estadísticas del día
  // ==============================

  /**
   * Obtener estadísticas de asistencia del día.
   * GET /asistencias/estadisticas?curso_id={id}&nivel_grado_id={id}&fecha=YYYY-MM-DD&año_academico=2025
   * @param {string} curso_id
   * @param {string} nivel_grado_id
   * @param {string} fecha YYYY-MM-DD
   * @param {number} [año_academico]
   * @returns {Promise<any>}
   */
  async getDayStats(curso_id, nivel_grado_id, fecha, año_academico) {
    if (!curso_id || !nivel_grado_id || !fecha) {
      throw new ApiError('curso_id, nivel_grado_id y fecha son requeridos', 400, 'MISSING_PARAMETERS')
    }
    const qs = buildQuery({ curso_id, nivel_grado_id, fecha, año_academico })
    const res = await fetchWithAuth(`/asistencias/estadisticas${qs}`, { method: 'GET' })
    const json = ensureSuccess(res)
    return json?.data ?? json
  }
}

export default attendanceService