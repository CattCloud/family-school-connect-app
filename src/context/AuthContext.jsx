import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  validateToken as apiValidateToken,
  getParentContext as apiGetParentContext,
} from '../services/authService.js'
import { toastError } from '../components/ui/Toast.jsx'

const STORAGE_TOKEN = 'auth_token'
const STORAGE_USER = 'auth_user'

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
        // Mantener datos básicos del usuario si API retorna info
        if (res?.data?.user) {
          setUser((prev) => ({ ...prev, ...res.data.user }))
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
      const usr = data.user
      if (!tkn || !usr) throw new Error('Respuesta inválida del servidor')
      setToken(tkn)
      setUser(usr)
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
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}