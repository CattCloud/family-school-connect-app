import { fetchWithAuth, ApiError } from './api'

/**
 * Servicio de Importación Masiva (Administrador)
 * Implementa los endpoints documentados en doc/DocumentacionAPI.md (Sección 3 y 4):
 * - GET    /admin/templates/{tipo}
 * - POST   /admin/import/validate
 * - POST   /admin/import/execute
 * - POST   /admin/import/validate-relationships
 * - POST   /admin/import/create-relationships
 * - GET    /admin/verify/relationships
 * - POST   /admin/import/credentials/generate
 *
 * Notas:
 * - Todas las rutas requieren Authorization: Bearer <token> (inyectado por fetchWithAuth)
 * - Este servicio NO gestiona UI; solo las llamadas y normalizaciones mínimas
 */

const VALID_TYPES = ['padres', 'docentes', 'estudiantes', 'relaciones']

/**
 * Lanza ApiError coherente si la respuesta JSON viene con success=false,
 * aun cuando el HTTP status sea 200 (defensivo, por si el backend no usa 4xx)
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

const adminImportService = {
  /**
   * Obtener plantilla de cabeceras y ejemplo para un tipo dado
   * GET /admin/templates/{tipo}
   * @param {'padres'|'docentes'|'estudiantes'|'relaciones'} tipo
   * @returns {Promise<{ headers: string[], sample: any[] }>}
   */
  async getTemplate(tipo) {
    if (!VALID_TYPES.includes(tipo)) {
      throw new ApiError('Tipo de plantilla inválido', 400, 'INVALID_TEMPLATE_TYPE')
    }
    const res = await fetchWithAuth(`/admin/templates/${encodeURIComponent(tipo)}`, {
      method: 'GET'
    })
    const json = ensureSuccess(res)
    const data = json?.data ?? json ?? {}
    return {
      headers: data.headers ?? [],
      sample: data.sample ?? []
    }
  },

  /**
   * Validar archivo de importación (registros) antes de ejecutar
   * POST /admin/import/validate
   * @param {'padres'|'docentes'|'estudiantes'|'relaciones'} tipo
   * @param {Array<Record<string, any>>} registros
   * @returns {Promise<{
   *   validacion_id?: string,
   *   tipo: string,
   *   resumen: { total_filas: number, validos: number, con_errores: number },
   *   registros_validos: any[],
   *   registros_con_errores: any[]
   * }>}
   */
  async validateImport(tipo, registros) {
    if (!VALID_TYPES.includes(tipo)) {
      throw new ApiError('Tipo inválido en importación', 400, 'INVALID_TYPE')
    }
    const body = { tipo, registros }
    const res = await fetchWithAuth('/admin/import/validate', {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Ejecutar importación con los registros válidos resultantes de validate
   * POST /admin/import/execute
   * Nota: La documentación ejemplo usa { tipo, registros_validos } en el body.
   * @param {'padres'|'docentes'|'estudiantes'|'relaciones'} tipo
   * @param {Array<Record<string, any>>} registrosValidos
   * @returns {Promise<{
   *   import_id: string,
   *   resumen: { total_procesados: number, exitosos: number, fallidos: number },
   *   detalles_por_tipo?: Record<string, number>,
   *   exitosos: any[],
   *   fallidos: any[],
   *   año_academico: number
   * }>}
   */
  async executeImport(tipo, registrosValidos) {
    if (!VALID_TYPES.includes(tipo)) {
      throw new ApiError('Tipo inválido en importación', 400, 'INVALID_TYPE')
    }
    const body = { tipo, registros_validos: registrosValidos }
    const res = await fetchWithAuth('/admin/import/execute', {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Validar relaciones familiares (previo a crear)
   * POST /admin/import/validate-relationships
   * @param {Array<{ nro_documento_padre: string, codigo_estudiante: string, tipo_relacion: 'padre'|'madre'|'apoderado'|'tutor' }>} relaciones
   * @returns {Promise<any>}
   */
  async validateRelationships(relaciones) {
    const body = { relaciones }
    const res = await fetchWithAuth('/admin/import/validate-relationships', {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Crear relaciones familiares
   * POST /admin/import/create-relationships
   * @param {Array<{ nro_documento_padre: string, codigo_estudiante: string, tipo_relacion: 'padre'|'madre'|'apoderado'|'tutor' }>} relaciones
   * @returns {Promise<any>}
   */
  async createRelationships(relaciones) {
    const body = { relaciones }
    const res = await fetchWithAuth('/admin/import/create-relationships', {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Verificar integridad de relaciones (estudiantes con apoderado)
   * GET /admin/verify/relationships
   * @returns {Promise<any>}
   */
  async verifyRelationships() {
    const res = await fetchWithAuth('/admin/verify/relationships', {
      method: 'GET'
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Generar vista previa de credenciales (JSON) para usuarios recién creados
   * POST /admin/import/credentials/generate
   * @param {Array<{ nro_documento: string, nombre: string, apellido: string, telefono: string, rol: 'apoderado'|'docente'|'estudiante' }>} usuarios
   * @returns {Promise<{ credentials_id: string, total_credenciales: number, excel_preview: any[] }>}
   */
  async generateCredentialsPreview(usuarios) {
    const body = { usuarios }
    const res = await fetchWithAuth('/admin/import/credentials/generate', {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * HU-USERS-06 — Generar credenciales iniciales (endpoints actualizados)
   * POST /admin/import/generate-credentials
   * @param {string} importId
   * @param {{ incluir_excel?: boolean, incluir_whatsapp?: boolean, incluir_pdfs?: boolean }} options
   * @returns {Promise<{ credentials_id: string, total_credenciales: number, archivo_excel_url?: string|null, pdfs_zip_url?: string|null }>}
   */
  async generateCredentials(importId, options = {}) {
    if (!importId) {
      throw new ApiError('import_id requerido', 400, 'INVALID_INPUT')
    }
    const body = {
      import_id: importId,
      incluir_excel: options.incluir_excel ?? true,
      incluir_whatsapp: options.incluir_whatsapp ?? false,
      incluir_pdfs: options.incluir_pdfs ?? false
    }
    const res = await fetchWithAuth('/admin/import/generate-credentials', {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Descargar archivo Excel de credenciales (binario)
   * GET /admin/import/credentials/{credentials_id}/download
   * @param {string} credentialsId
   * @returns {Promise<Blob>}
   */
  async downloadCredentialsExcel(credentialsId) {
    if (!credentialsId) {
      throw new ApiError('credentials_id requerido', 400, 'INVALID_INPUT')
    }
    // MVP: esta ruta retorna JSON (excel_preview), NO binario Excel.
    // Ver feedback de backend: usarlo como vista previa en FE.
    const res = await fetchWithAuth(`/admin/import/credentials/${encodeURIComponent(credentialsId)}/download`, {
      method: 'GET'
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Enviar credenciales por WhatsApp
   * POST /admin/import/credentials/{credentials_id}/send-whatsapp
   * @param {string} credentialsId
   * @param {string[]} usuariosSeleccionados - IDs de usuarios a enviar
   * @returns {Promise<any>}
   */
  async sendCredentialsWhatsapp(credentialsId, usuariosSeleccionados = []) {
    if (!credentialsId) {
      throw new ApiError('credentials_id requerido', 400, 'INVALID_INPUT')
    }
    const body = { usuarios_seleccionados: usuariosSeleccionados }
    const res = await fetchWithAuth(`/admin/import/credentials/${encodeURIComponent(credentialsId)}/send-whatsapp`, {
      method: 'POST',
      body
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  },

  /**
   * Generar PDFs individuales (ZIP)
   * POST /admin/import/credentials/{credentials_id}/generate-pdfs
   * @param {string} credentialsId
   * @returns {Promise<{ total_pdfs: number, zip_url: string, pdfs_individuales?: Array<{ usuario_id: string, pdf_url: string }> }>}
   */
  async generateCredentialPDFs(credentialsId) {
    if (!credentialsId) {
      throw new ApiError('credentials_id requerido', 400, 'INVALID_INPUT')
    }
    const res = await fetchWithAuth(`/admin/import/credentials/${encodeURIComponent(credentialsId)}/generate-pdfs`, {
      method: 'POST'
    })
    const json = ensureSuccess(res)
    return json?.data ?? json
  }
}

export default adminImportService