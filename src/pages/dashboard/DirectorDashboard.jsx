import { useAuth } from '../../hooks/useAuth'

/**
 * DirectorDashboard
 * - Dashboard principal para directores
 * - Implementa HU-DASH-04 (parcial, solo estructura base)
 */
export default function DirectorDashboard() {
  const { user } = useAuth()
  
  // Datos de ejemplo para KPIs
  const kpisEjemplo = [
    { id: 1, titulo: 'Estudiantes Activos', valor: 450, tendencia: 'up', color: 'primary' },
    { id: 2, titulo: 'Promedio General', valor: '14.8', tendencia: 'stable', color: 'info' },
    { id: 3, titulo: 'Asistencia Mensual', valor: '92%', tendencia: 'up', color: 'success' },
    { id: 4, titulo: 'Comunicados Activos', valor: 8, tendencia: 'down', color: 'secondary' },
    { id: 5, titulo: 'Encuestas Activas', valor: 3, tendencia: 'up', color: 'tertiary' },
  ]
  
  // Datos de ejemplo para actividad reciente
  const actividadEjemplo = [
    { id: 1, tipo: 'calificacion', usuario: 'Prof. Carlos Mendoza', accion: 'cargó calificaciones de Matemáticas 5to Primaria', tiempo: '10 min' },
    { id: 2, tipo: 'comunicado', usuario: 'Dir. Ana Sánchez', accion: 'publicó comunicado "Reunión de Padres Octubre"', tiempo: '45 min' },
    { id: 3, tipo: 'mensaje', usuario: 'María Rodríguez', accion: 'envió mensaje sobre Ana Gómez 3ro Primaria', tiempo: '1h' },
    { id: 4, tipo: 'asistencia', usuario: 'Prof. Laura Torres', accion: 'registró asistencia de 4to Secundaria', tiempo: '2h' },
    { id: 5, tipo: 'encuesta', usuario: 'Dir. Ana Sánchez', accion: 'creó encuesta "Satisfacción Escolar 2025"', tiempo: '3h' },
  ]
  
  // Datos de ejemplo para alertas críticas
  const alertasEjemplo = [
    { id: 1, tipo: 'asistencia', descripcion: '5 estudiantes con 3+ faltas injustificadas consecutivas', prioridad: 'alta' },
    { id: 2, tipo: 'calificacion', descripcion: '3 cursos sin calificaciones cargadas en el trimestre', prioridad: 'media' },
    { id: 3, tipo: 'docente', descripcion: '2 docentes sin actividad reciente (>15 días)', prioridad: 'baja' },
  ]
  
  return (
    <div className="space-y-6">
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Bienvenido, {user?.nombres || user?.nombre_completo?.split(' ')[0] || 'Director'}
        </h1>
        <p className="text-text-secondary">
          Centro de supervisión y gestión institucional
        </p>
      </div>
      
      {/* Layout en grid adaptativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: KPIs */}
        <div className="space-y-6">
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-text-primary mb-4">Métricas Institucionales</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {kpisEjemplo.map((kpi) => (
                <div 
                  key={kpi.id}
                  className={`border-l-4 border-${kpi.color}-500 bg-${kpi.color}-50 p-4 rounded-r-lg`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">{kpi.titulo}</span>
                    <span className={`text-${kpi.color}-700`}>
                      {kpi.tendencia === 'up' ? '↑' : kpi.tendencia === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-1">
                    {kpi.valor}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Columna 2: Actividad + Alertas */}
        <div className="space-y-6">
          {/* Actividad Reciente */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-text-primary">Actividad Reciente</h2>
              <select className="text-sm border border-border-primary rounded-md px-3 py-1.5 bg-bg-main">
                <option value="">Todos los tipos</option>
                <option value="calificacion">Calificaciones</option>
                <option value="asistencia">Asistencia</option>
                <option value="comunicado">Comunicados</option>
                <option value="mensaje">Mensajes</option>
              </select>
            </div>
            
            <div className="space-y-4">
              {actividadEjemplo.map((actividad) => (
                <div 
                  key={actividad.id}
                  className="flex gap-3 border-b border-border-light pb-3 last:border-0 last:pb-0"
                >
                  <div className={`w-10 h-10 rounded-full bg-${
                    actividad.tipo === 'calificacion' ? 'info' : 
                    actividad.tipo === 'comunicado' ? 'secondary' : 
                    actividad.tipo === 'mensaje' ? 'primary' : 
                    actividad.tipo === 'asistencia' ? 'success' : 
                    actividad.tipo === 'encuesta' ? 'tertiary' : 'gray'
                  }-100 flex-shrink-0 flex items-center justify-center text-${
                    actividad.tipo === 'calificacion' ? 'info' : 
                    actividad.tipo === 'comunicado' ? 'secondary' : 
                    actividad.tipo === 'mensaje' ? 'primary' : 
                    actividad.tipo === 'asistencia' ? 'success' : 
                    actividad.tipo === 'encuesta' ? 'tertiary' : 'gray'
                  }-700`}>
                    <span className="text-lg">
                      {actividad.tipo === 'calificacion' ? '📚' : 
                       actividad.tipo === 'comunicado' ? '📢' : 
                       actividad.tipo === 'mensaje' ? '💬' : 
                       actividad.tipo === 'asistencia' ? '📋' : 
                       actividad.tipo === 'encuesta' ? '📊' : '📝'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-text-primary">{actividad.usuario}</span>
                      <span className="text-text-muted text-xs">{actividad.tiempo}</span>
                    </div>
                    <p className="text-text-secondary text-sm mt-1">
                      {actividad.accion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Ver más actividad
              </button>
            </div>
          </div>
          
          {/* Alertas Críticas */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md border-2 border-error">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-text-primary flex items-center gap-2">
                <span className="text-error">⚠️</span> Alertas Críticas
              </h2>
              <span className="text-sm text-text-muted">Actualizado: 10:30 AM</span>
            </div>
            
            <div className="space-y-3">
              {alertasEjemplo.map((alerta) => (
                <div 
                  key={alerta.id}
                  className={`p-3 rounded-md ${
                    alerta.prioridad === 'alta' ? 'bg-error-light border-l-4 border-error' : 
                    alerta.prioridad === 'media' ? 'bg-warning-light border-l-4 border-warning' : 
                    'bg-info-light border-l-4 border-info'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      alerta.prioridad === 'alta' ? 'text-error-dark' : 
                      alerta.prioridad === 'media' ? 'text-warning-dark' : 
                      'text-info-dark'
                    }`}>
                      {alerta.tipo === 'asistencia' ? 'Alerta de Asistencia' : 
                       alerta.tipo === 'calificacion' ? 'Alerta de Calificaciones' : 
                       alerta.tipo === 'docente' ? 'Alerta de Personal' : 'Alerta General'}
                    </span>
                    <button className="text-xs underline">Ver detalle</button>
                  </div>
                  <p className="text-text-secondary text-sm mt-1">
                    {alerta.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Columna 3: Herramientas */}
        <div className="space-y-6">
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-text-primary mb-4">Herramientas de Gestión</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 1, titulo: 'Gestionar Permisos de Docentes', icono: '🔑', color: 'primary' },
                { id: 2, titulo: 'Configurar Estructura de Evaluación', icono: '⚙️', color: 'secondary' },
                { id: 3, titulo: 'Configurar Umbrales de Alertas', icono: '📊', color: 'tertiary' },
                { id: 4, titulo: 'Supervisar Mensajería', icono: '👁️', color: 'info' },
                { id: 5, titulo: 'Crear Comunicado Institucional', icono: '📢', color: 'warning' },
                { id: 6, titulo: 'Crear Encuesta Institucional', icono: '📋', color: 'success' },
              ].map((herramienta) => (
                <div 
                  key={herramienta.id}
                  className={`bg-${herramienta.color}-50 p-4 rounded-lg border border-${herramienta.color}-200 hover:shadow-md transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-${herramienta.color}-100 flex items-center justify-center text-${herramienta.color}-700`}>
                      <span className="text-lg">{herramienta.icono}</span>
                    </div>
                    <span className="font-medium text-text-primary">{herramienta.titulo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}