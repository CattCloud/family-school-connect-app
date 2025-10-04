import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import DashboardRoutes from './DashboardRoutes'

/**
 * DashboardRouter
 * - Componente principal para el enrutamiento del dashboard
 * - Verifica autenticación y renderiza las rutas anidadas
 */
export default function DashboardRouter() {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <DashboardRoutes />
}