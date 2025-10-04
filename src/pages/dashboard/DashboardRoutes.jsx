import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PadreDashboard from './PadreDashboard';
import DocenteDashboard from './DocenteDashboard';
import DirectorDashboard from './DirectorDashboard';
import AdminDashboard from './AdminDashboard';
import TeacherPermissionsPage from '../users/TeacherPermissionsPage';
import EvaluationRoutes from '../evaluation/EvaluationRoutes';
import UserImportPage from '../admin/UserImportPage';
import CalificacionesWizard from '../academic/CalificacionesWizard';
import AsistenciaWizard from '../attendance/AsistenciaWizard';

/**
 * DashboardRoutes
 * - Configura las rutas anidadas dentro del dashboard
 * - Renderiza diferentes rutas según el rol del usuario
 */
export default function DashboardRoutes() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Rutas para director
  if (user.rol === 'director') {
    return (
      <Routes>
        <Route path="/" element={<DirectorDashboard />} />
        <Route path="/gestion-usuarios/permisos-docentes" element={<TeacherPermissionsPage />} />
        <Route path="/evaluation/*" element={<EvaluationRoutes />} />
        <Route path="cargar-datos/calificaciones" element={<CalificacionesWizard />} />
        <Route path="cargar-datos/asistencia" element={<AsistenciaWizard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }
  
  // Rutas para docente
  if (user.rol === 'docente') {
    return (
      <Routes>
        <Route path="/" element={<DocenteDashboard />} />
        <Route path="cargar-datos/calificaciones" element={<CalificacionesWizard />} />
        <Route path="cargar-datos/asistencia" element={<AsistenciaWizard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }
  
  // Rutas para apoderado
  if (user.rol === 'apoderado') {
    return (
      <Routes>
        <Route path="/" element={<PadreDashboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }
  
  // Rutas para administrador
  if (user.rol === 'administrador') {
    return (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="admin/importar-usuarios" element={<UserImportPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }
  
  // Dashboard genérico para cualquier otro rol
  return (
    <Routes>
      <Route path="/" element={
        <div className="p-6 bg-bg-card rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold text-text-primary mb-4">
            Bienvenido, {user?.nombres || user?.nombre_completo || 'Usuario'}
          </h1>
          <p className="text-text-secondary">
            No hay un dashboard específico para tu rol. Contacta al administrador si crees que esto es un error.
          </p>
        </div>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}