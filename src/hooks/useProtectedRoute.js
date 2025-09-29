import { useMemo } from 'react'
import { useAuth } from './useAuth.js'

/**
 * useProtectedRoute
 * - Determina acceso a una ruta autenticada y/o restringida por rol
 * - roles?: array<string> de roles permitidos (ej: ['docente','director'])
 *
 * Retorna:
 * - isBootstrapping: boolean (validando sesión inicial)
 * - isAuthenticated: boolean
 * - isAllowed: boolean (true si pasa autenticación + rol)
 * - redirectTo: string | null (ruta sugerida para redirección)
 */
export default function useProtectedRoute(roles) {
  const { isBootstrapping, isAuthenticated, user } = useAuth()

  const { isAllowed, redirectTo } = useMemo(() => {
    // Aún validando token/estado
    if (isBootstrapping) return { isAllowed: false, redirectTo: null }

    // No autenticado → debe ir a /login
    if (!isAuthenticated) return { isAllowed: false, redirectTo: '/login' }

    // Si hay restricción por roles y el usuario no pertenece → envía a /dashboard
    if (roles && roles.length > 0 && user && !roles.includes(user.rol)) {
      return { isAllowed: false, redirectTo: '/dashboard' }
    }

    // Permitido
    return { isAllowed: true, redirectTo: null }
  }, [isBootstrapping, isAuthenticated, roles, user])

  return { isBootstrapping, isAuthenticated, isAllowed, redirectTo }
}