// Base API client usando fetch nativo (sin axios)

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Error estándar para respuestas HTTP no exitosas
 */
class ApiError extends Error {
  constructor(message, status, code, response) {
    super(message || 'API Error')
    this.name = 'ApiError'
    this.status = status
    this.code = code || 'HTTP_ERROR'
    this.response = response
  }
}

/**
 * Construye headers unificando Authorization y extras
 * @param {string|undefined} token
 * @param {Record<string,string>} extra
 * @returns {Headers}
 */
function buildHeaders(token, extra = {}) {
  const headers = new Headers()
  // Content-Type se agrega condicionalmente según el body
  if (token) headers.set('Authorization', `Bearer ${token}`)
  Object.entries(extra).forEach(([k, v]) => {
    if (v != null) headers.set(k, v)
  })
  return headers
}

/**
 * Determina si la respuesta es JSON (por cabecera)
 * @param {Response} res
 */
function isJson(res) {
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') || ct.includes('+json')
}

/**
 * apiFetch: wrapper sobre fetch con:
 * - BASE_URL configurable (VITE_API_BASE_URL || http://localhost:3000/api)
 * - Manejo de body JSON vs FormData
 * - Errores estandarizados (ApiError)
 * - Parseo automático de JSON
 *
 * @param {string} path - '/auth/login' o URL absoluta
 * @param {object} options
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [options.method='GET']
 * @param {object} [options.body] - objeto JSON o FormData o string
 * @param {string} [options.token] - JWT para Authorization
 * @param {HeadersInit} [options.headers] - headers adicionales
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<any>} data parseada (JSON si aplica) o texto
 */
async function apiFetch(
  path,
  { method = 'GET', body, token, headers = {}, signal } = {}
) {
  const isAbsolute = /^https?:/i.test(path)
  const url = isAbsolute
    ? path
    : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const hdrs = buildHeaders(token, headers)

  let payload = undefined
  const methodHasBody = !['GET', 'HEAD'].includes(method.toUpperCase())

  if (methodHasBody && body != null) {
    if (body instanceof FormData) {
      // Para FormData, NO seteamos Content-Type (el navegador lo hará con boundary)
      payload = body
    } else if (typeof body === 'string') {
      // Cadenas crudas (por ejemplo, text/plain)
      if (!hdrs.has('Content-Type')) {
        hdrs.set('Content-Type', 'text/plain; charset=utf-8')
      }
      payload = body
    } else {
      // Objeto JS -> JSON
      if (!hdrs.has('Content-Type')) {
        hdrs.set('Content-Type', 'application/json; charset=utf-8')
      }
      payload = JSON.stringify(body)
    }
  }

  const res = await fetch(url, {
    method,
    headers: hdrs,
    body: methodHasBody ? payload : undefined,
    signal,
    // No usamos cookies; JWT via Authorization header
    // credentials: 'include'
  })

  // 204 No Content
  if (res.status === 204) {
    return { success: true, data: null }
  }

  let parsed
  if (isJson(res)) {
    try {
      parsed = await res.json()
    } catch {
      parsed = undefined
    }
  } else {
    // Intentar texto si no es JSON
    try {
      parsed = await res.text()
    } catch {
      parsed = undefined
    }
  }

  if (!res.ok) {
    const message =
      parsed?.error?.message ||
      parsed?.message ||
      res.statusText ||
      'Error en la solicitud'
    const code = parsed?.error?.code || 'HTTP_ERROR'
    throw new ApiError(message, res.status, code, parsed)
  }

  return parsed
}

async function apiFetchBinary(
  path,
  { method = 'GET', token, headers = {}, signal } = {}
) {
  const isAbsolute = /^https?:/i.test(path)
  const url = isAbsolute
    ? path
    : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const hdrs = buildHeaders(token, headers)

  const res = await fetch(url, {
    method,
    headers: hdrs,
    signal
  })

  // Manejo de errores similar a apiFetch, intentando parsear JSON o texto
  let parsed
  const ct = res.headers.get('content-type') || ''
  if (!res.ok) {
    if (ct.includes('application/json') || ct.includes('+json')) {
      try {
        parsed = await res.json()
      } catch {
        parsed = undefined
      }
    } else {
      try {
        parsed = await res.text()
      } catch {
        parsed = undefined
      }
    }
    const message =
      parsed?.error?.message ||
      parsed?.message ||
      res.statusText ||
      'Error en la solicitud'
    const code = parsed?.error?.code || 'HTTP_ERROR'
    throw new ApiError(message, res.status, code, parsed)
  }

  return await res.blob()
}

/**
 * Azúcar sintáctico para cabecera Authorization
 * @param {string} token
 */
function withAuth(token) {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Wrapper conveniente que inyecta automáticamente el JWT desde localStorage
 * y delega en apiFetch. Permite seguir usando servicios que no reciben token explícito.
 * @param {string} path
 * @param {object} [options]
 * @returns {Promise<any>}
 */
function fetchWithAuth(path, options = {}) {
  // Mantener compatibilidad: si options.token viene, respetarlo; si no, leer storage
  const storageToken = typeof localStorage !== 'undefined'
    ? localStorage.getItem('auth_token')
    : ''
  const token = options.token ?? storageToken ?? ''
  return apiFetch(path, { ...options, token })
}

export { BASE_URL, apiFetch, apiFetchBinary, ApiError, buildHeaders, withAuth, fetchWithAuth }