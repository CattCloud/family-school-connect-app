import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PadreDashboard from './PadreDashboard'
import DocenteDashboard from './DocenteDashboard'
import DirectorDashboard from './DirectorDashboard'
import AdminDashboard from './AdminDashboard'

/**
 * DashboardRouter
 * - Renderiza el dashboard correspondiente según el rol del usuario
 */
export default function DashboardRouter() {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Renderizar dashboard según rol
  switch (user.rol) {
    case 'apoderado':
      return <PadreDashboard />
    case 'docente':
      return <DocenteDashboard />
    case 'director':
      return <DirectorDashboard />
    case 'administrador':
      return <AdminDashboard />
    default:
      // Dashboard genérico para cualquier otro rol
      return (
        <div className="p-6 bg-bg-card rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold text-text-primary mb-4">
            Bienvenido, {user?.nombres || user?.nombre_completo || 'Usuario'}
          </h1>
          <p className="text-text-secondary">
            No hay un dashboard específico para tu rol. Contacta al administrador si crees que esto es un error.
          </p>
        </div>
      )
  }
}