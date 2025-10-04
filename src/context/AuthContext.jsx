import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  validateToken as apiValidateToken,
  getParentContext as apiGetParentContext,
  getMe as apiGetMe,
} from '../services/authService.js'
import { toastError } from '../components/ui/Toast.jsx'
import { apiFetch } from '../services/api.js'

const STORAGE_TOKEN = 'auth_token'
const STORAGE_USER = 'auth_user'

// Normaliza estructura de permisos a la forma esperada por Sidebar/DocenteDashboard
// Acepta:
// - { comunicados: { estado_activo: bool }, encuestas: { estado_activo: bool } }  -> deja igual
// - { comunicados: bool, encuestas: bool }                                       -> mapea a {estado_activo}
// - Cualquier otra forma -> devuelve undefined
function normalizePerms(perms) {
  if (!perms || typeof perms !== 'object') return undefined
  const out = {}

  // Helper para mapear una key a { estado_activo }
  const mapKey = (key) => {
    const val = perms[key]
    if (val == null) return undefined
    if (typeof val === 'boolean') return { estado_activo: val }
    if (typeof val === 'object' && typeof val.estado_activo === 'boolean') return val
    return undefined
  }

  const comunicados = mapKey('comunicados')
  const encuestas = mapKey('encuestas')

  if (comunicados || encuestas) {
    if (comunicados) out.comunicados = comunicados
    if (encuestas) out.encuestas = encuestas
    return out
  }
  return undefined
}

// Merge robusto que preserva y normaliza permisos
function mergeUser(prev, next, extra = null) {
  const merged = { ...(prev || {}), ...(next || {}) }

  const incomingPerms =
    next?.permisos ??
    extra?.permisos ??
    prev?.permisos

  const normalized = normalizePerms(incomingPerms)
  if (normalized) {
    merged.permisos = normalized
  }

  return merged
}

async function fetchTeacherPermsById(tokenToUse, docenteId) {
  try {
    const res = await apiFetch('/teachers/permissions?limit=1000', {
      method: 'GET',
      token: tokenToUse,
    })
    const docentes = res?.data?.docentes || []
    const found = docentes.find((d) => d.id === docenteId)
    return normalizePerms(found?.permisos)
  } catch {
    return undefined
  }
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN) || '')
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!token && !!user

  // Persistencia
  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_TOKEN, token)
    else localStorage.removeItem(STORAGE_TOKEN)
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_USER)
  }, [user])

  // Auto-validar token al cargar app
  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        if (!token) return
        const res = await apiValidateToken(token)
        if (cancelled) return
        // Mantener y completar datos del usuario si API retorna info (incluye permisos si vienen)
        if (res?.data?.user) {
          // Fusionar con el usuario previo
          const baseUser = mergeUser(user, res.data.user, res?.data)
          setUser(baseUser)
          localStorage.setItem(STORAGE_USER, JSON.stringify(baseUser))

          // Si es docente, hidratar permisos actuales desde /teachers/permissions
          if (baseUser?.rol === 'docente') {
            const perms = await fetchTeacherPermsById(token, baseUser.id)
            if (perms) {
              const merged = mergeUser(baseUser, { permisos: perms })
              setUser(merged)
              localStorage.setItem(STORAGE_USER, JSON.stringify(merged))
            }
          }
        }
      } catch {
        // Token inválido: limpiar sesión
        clearSession()
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }
    bootstrap()
    if (!token) setIsBootstrapping(false)
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearSession = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
  }, [])

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    try {
      const res = await apiLogin(credentials)
      const data = res?.data || {}
      const tkn = data.token
      if (!tkn) throw new Error('Respuesta inválida del servidor')
      
      // Obtener información del usuario validada por el backend (puede incluir permisos)
      const userRes = await apiGetMe(tkn)
      const usr = userRes?.data?.user || data.user

      const merged = mergeUser(null, usr, userRes?.data)

      setToken(tkn)
      setUser(merged)
      // Persistir
      localStorage.setItem(STORAGE_USER, JSON.stringify(merged))

      // Si es docente, hidratar permisos desde /teachers/permissions para pintar el menú
      if (merged?.rol === 'docente') {
        const perms = await fetchTeacherPermsById(tkn, merged.id)
        if (perms) {
          const merged2 = mergeUser(merged, { permisos: perms })
          setUser(merged2)
          localStorage.setItem(STORAGE_USER, JSON.stringify(merged2))
        }
      }

      return data // incluye redirect_to, context, etc.
    } catch (err) {
      toastError(
        err?.response?.error?.message ||
          err?.message ||
          'No fue posible iniciar sesión'
      )
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiLogout(token).catch(() => {
          // Ignorar errores de red al cerrar sesión
        })
      }
    } finally {
      clearSession()
    }
  }, [token, clearSession])

  const validateToken = useCallback(async () => {
    if (!token) return { valid: false }
    try {
      const res = await apiValidateToken(token)
      return { valid: !!res?.data?.valid, data: res?.data }
    } catch {
      clearSession()
      return { valid: false }
    }
  }, [token, clearSession])

  const getParentContext = useCallback(
    async (userId) => {
      if (!token) return null
      try {
        const res = await apiGetParentContext(userId, token)
        return res?.data || null
      } catch {
        toastError('No fue posible obtener el contexto de padre')
        return null
      }
    },
    [token]
  )

  const updateUserPermissions = useCallback(
    async (options = {}) => {
      // Comportamiento por defecto: silencioso para evitar toasts en flujos no críticos
      const { silent = true } = options || {}
      if (!token) return null
      try {
        const res = await apiGetMe(token)
        const usr = res?.data?.user
        if (usr) {
          setUser((prev) => {
            const merged = mergeUser(prev, usr, res?.data)
            localStorage.setItem(STORAGE_USER, JSON.stringify(merged))
            return merged
          })

          // Si el usuario efectivo es docente, traer permisos actualizados para reflejar en el menú
          const docenteId = usr?.id || user?.id
          if ((usr?.rol === 'docente' || user?.rol === 'docente') && docenteId) {
            const perms = await fetchTeacherPermsById(token, docenteId)
            if (perms) {
              setUser((prev) => {
                const merged2 = mergeUser(prev, { permisos: perms })
                localStorage.setItem(STORAGE_USER, JSON.stringify(merged2))
                return merged2
              })
            }
          }
        }
        return usr
      } catch (err) {
        // Evitar toast en flujos donde la actualización es opcional (ej. director cambiando permisos de otro usuario)
        if (!silent) {
          toastError(err?.response?.error?.message || 'No fue posible actualizar la información del usuario')
        }
        return null
      }
    },
    [token]
  )

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading,
      isBootstrapping,
      login,
      logout,
      validateToken,
      getParentContext,
      updateUserPermissions,
    }),
    [
      token,
      user,
      isAuthenticated,
      isLoading,
      isBootstrapping,
      login,
      logout,
      validateToken,
      getParentContext,
      updateUserPermissions,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}