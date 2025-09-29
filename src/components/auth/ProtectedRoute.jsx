import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import SplashScreen from '../ui/SplashScreen.jsx'

/**
 * ProtectedRoute
 * - Restringe acceso a rutas que requieren autenticación
 * - roles?: array de roles permitidos (ej: ['docente','director'])
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <SplashScreen label="Validando sesión..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.rol)) {
    // Redirigir a un dashboard genérico o por rol
    return <Navigate to="/dashboard" replace />
  }

  return children
}