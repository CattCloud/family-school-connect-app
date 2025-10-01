import { useAuth } from '../../hooks/useAuth'
import useStudentSelector from '../../hooks/useStudentSelector'

/**
 * PadreDashboard
 * - Dashboard principal para padres/apoderados
 * - Implementa HU-DASH-02 (parcial, solo estructura base)
 */
export default function PadreDashboard() {
  const { user } = useAuth()
  const { selectedChild } = useStudentSelector()
  
  return (
    <div className="space-y-6">
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Bienvenido, {user?.nombres || user?.nombre_completo?.split(' ')[0] || 'Apoderado'}
        </h1>
        <p className="text-text-secondary">
          {selectedChild ? (
            <>
              Estás viendo información de <span className="font-medium text-primary-700">{selectedChild.nombre}</span> - {selectedChild.grado} {selectedChild.nivel}
            </>
          ) : (
            'Selecciona un estudiante para ver su información'
          )}
        </p>
      </div>
      
      {/* Placeholder para el contenido real que se implementará en HU-DASH-02 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-bg-card p-6 rounded-lg shadow-md border-l-4 border-primary-500">
          <h2 className="text-lg font-medium text-text-primary mb-3">Resumen Académico</h2>
          <p className="text-text-muted">Aquí se mostrará el resumen académico del estudiante.</p>
        </div>
        
        <div className="bg-bg-card p-6 rounded-lg shadow-md border-l-4 border-secondary-500">
          <h2 className="text-lg font-medium text-text-primary mb-3">Estado de Asistencia</h2>
          <p className="text-text-muted">Aquí se mostrará el estado de asistencia del estudiante.</p>
        </div>
        
        <div className="bg-bg-card p-6 rounded-lg shadow-md border-l-4 border-tertiary-500">
          <h2 className="text-lg font-medium text-text-primary mb-3">Notificaciones Recientes</h2>
          <p className="text-text-muted">Aquí se mostrarán las notificaciones recientes.</p>
        </div>
        
        <div className="md:col-span-2 lg:col-span-3 bg-bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-text-primary mb-3">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {['Calificaciones', 'Asistencia', 'Mensajes', 'Comunicados', 'Encuestas', 'Soporte'].map((item) => (
              <div 
                key={item}
                className="bg-bg-main p-4 rounded-md shadow-sm border border-border-light hover:border-primary-200 hover:shadow transition-all text-center cursor-pointer"
              >
                <div className="text-primary-600 mb-2">
                  {/* Placeholder para íconos */}
                  <div className="w-10 h-10 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{item.charAt(0)}</span>
                  </div>
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}