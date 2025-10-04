import { useAuth } from '../../hooks/useAuth'

/**
 * DocenteDashboard
 * - Dashboard principal para docentes
 * - Implementa HU-DASH-03 (parcial, solo estructura base)
 */
export default function DocenteDashboard() {
  const { user } = useAuth()
  
  // Datos de ejemplo para asignaciones
  const asignacionesEjemplo = [
    { id: 1, curso: 'Matemáticas', grado: '3ro', nivel: 'Primaria', estudiantes: 28 },
    { id: 2, curso: 'Comunicación', grado: '3ro', nivel: 'Primaria', estudiantes: 28 },
    { id: 3, curso: 'Ciencias Naturales', grado: '4to', nivel: 'Primaria', estudiantes: 30 },
    { id: 4, curso: 'Historia', grado: '5to', nivel: 'Primaria', estudiantes: 32 },
  ]
  
  // Datos de ejemplo para mensajes
  const mensajesEjemplo = [
    { id: 1, padre: 'María Rodríguez', estudiante: 'Ana Gómez', fecha: '2025-09-28', noLeidos: 2 },
    { id: 2, padre: 'Juan Pérez', estudiante: 'Carlos Pérez', fecha: '2025-09-27', noLeidos: 0 },
    { id: 3, padre: 'Laura Torres', estudiante: 'Sofía Torres', fecha: '2025-09-26', noLeidos: 1 },
  ]
  
  return (
    <div className="space-y-6">
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Bienvenido, {user?.nombres || user?.nombre_completo?.split(' ')[0] || 'Docente'}
        </h1>
        <p className="text-text-secondary">
          Aquí puedes gestionar tus cursos asignados y comunicarte con los apoderados.
        </p>
      </div>
      
      {/* Layout en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mis Asignaciones Actuales */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-text-primary">Mis Asignaciones Actuales</h2>
              <div className="flex gap-2">
                <select className="text-sm border border-border-primary rounded-md px-3 py-1.5 bg-bg-main">
                  <option value="">Todos los grados</option>
                  <option value="3ro">3ro Primaria</option>
                  <option value="4to">4to Primaria</option>
                  <option value="5to">5to Primaria</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asignacionesEjemplo.map((asignacion) => (
                <div 
                  key={asignacion.id}
                  className="border border-border-primary rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-primary-700">{asignacion.curso}</h3>
                  <p className="text-text-secondary text-sm">
                    {asignacion.grado} {asignacion.nivel}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-text-muted text-sm">
                      {asignacion.estudiantes} estudiantes
                    </span>
                    <button className="text-sm bg-primary-50 text-primary-700 px-3 py-1.5 rounded-md hover:bg-primary-100 transition-colors">
                      Cargar Datos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mensajes Pendientes */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-text-primary">Mensajes Pendientes</h2>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Ver todos
              </button>
            </div>
            
            <div className="space-y-3">
              {mensajesEjemplo.map((mensaje) => (
                <div 
                  key={mensaje.id}
                  className="border-b border-border-light last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-text-primary">{mensaje.padre}</h3>
                      <p className="text-text-secondary text-sm">
                        Sobre: {mensaje.estudiante}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-text-muted text-xs">
                        {new Date(mensaje.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      {mensaje.noLeidos > 0 && (
                        <span className="ml-2 bg-error text-text-inverse text-xs px-1.5 py-0.5 rounded-full">
                          {mensaje.noLeidos}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Columna lateral (30%) */}
        <div className="space-y-6">
          {/* Permisos y Herramientas */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-text-primary mb-4">Permisos y Herramientas</h2>
            
            <div className="space-y-3">
              <div className="border border-border-primary rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    <span className="text-lg">📤</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Cargar Calificaciones</h3>
                    <p className="text-text-muted text-sm">Registrar notas por curso</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-border-primary rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    <span className="text-lg">📋</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Cargar Asistencia</h3>
                    <p className="text-text-muted text-sm">Registrar asistencia diaria</p>
                  </div>
                </div>
              </div>
              
              <div className={`border border-border-primary rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all ${user?.permisos?.comunicados?.estado_activo ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    <span className="text-lg">📢</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Crear Comunicado</h3>
                    <p className="text-text-muted text-sm">
                      {user?.permisos?.comunicados?.estado_activo ? (
                        <span className="text-success-dark">Con permiso</span>
                      ) : (
                        <span className="text-error-dark">Sin permiso</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-border-primary rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    <span className="text-lg">❓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Soporte Técnico</h3>
                    <p className="text-text-muted text-sm">Solicitar ayuda</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}