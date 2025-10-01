import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

/**
 * AdminDashboard
 * - Dashboard principal para administradores
 * - Implementa HU-DASH-05 (parcial, solo estructura base)
 */
export default function AdminDashboard() {
  const { user } = useAuth()
  
  // Datos de ejemplo para estado del sistema
  const estadoSistemaEjemplo = [
    { id: 1, titulo: 'Usuarios Activos', valor: 85, descripcion: 'Última sesión < 24h', icono: '👥' },
    { id: 2, titulo: 'Total Usuarios', valor: 520, descripcion: 'Por rol: 380 padres, 120 docentes, 15 directores, 5 admins', icono: '👤' },
    { id: 3, titulo: 'Espacio Cloudinary', valor: '2.8 GB', descripcion: '70% disponible', icono: '📦' },
    { id: 4, titulo: 'Tamaño BD', valor: '450 MB', descripcion: 'PostgreSQL', icono: '🗄️' },
    { id: 5, titulo: 'Último Backup', valor: '28/09/2025', descripcion: '10:00 PM (automático)', icono: '🔄' },
  ]
  
  // Datos de ejemplo para tickets de soporte
  const ticketsEjemplo = {
    pendientes: [
      { id: 1, usuario: 'María Rodríguez', rol: 'Apoderado', categoria: 'Acceso', prioridad: 'Alta', fecha: '2025-09-29', asunto: 'No puedo iniciar sesión' },
      { id: 2, usuario: 'Carlos Mendoza', rol: 'Docente', categoria: 'Datos', prioridad: 'Media', fecha: '2025-09-28', asunto: 'Error al cargar calificaciones' },
      { id: 3, usuario: 'Ana Sánchez', rol: 'Director', categoria: 'Configuración', prioridad: 'Baja', fecha: '2025-09-27', asunto: 'Cambiar umbrales de alertas' },
    ],
    enProceso: [
      { id: 4, usuario: 'Juan Pérez', rol: 'Apoderado', categoria: 'Mensajería', prioridad: 'Media', fecha: '2025-09-26', asunto: 'No recibo notificaciones' },
      { id: 5, usuario: 'Laura Torres', rol: 'Docente', categoria: 'Reportes', prioridad: 'Baja', fecha: '2025-09-25', asunto: 'Formato incorrecto en PDF' },
    ],
    resueltos: [
      { id: 6, usuario: 'Pedro Gómez', rol: 'Apoderado', categoria: 'Acceso', prioridad: 'Alta', fecha: '2025-09-24', asunto: 'Restablecer contraseña' },
      { id: 7, usuario: 'Sofía Ramírez', rol: 'Docente', categoria: 'Datos', prioridad: 'Media', fecha: '2025-09-23', asunto: 'Corregir registro duplicado' },
    ],
  }
  
  // Estado para tabs de tickets
  const [activeTab, setActiveTab] = useState('pendientes')
  
  return (
    <div className="space-y-6">
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Bienvenido, {user?.nombres || user?.nombre_completo?.split(' ')[0] || 'Administrador'}
        </h1>
        <p className="text-text-secondary">
          Centro de gestión técnica y soporte
        </p>
      </div>
      
      {/* Layout en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal (70%): Tickets de soporte */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-text-primary mb-4">Tickets de Soporte</h2>
            
            {/* Tabs */}
            <div className="border-b border-border-primary mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('pendientes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pendientes'
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Pendientes
                  <span className="ml-2 bg-error text-text-inverse text-xs px-1.5 py-0.5 rounded-full">
                    {ticketsEjemplo.pendientes.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('enProceso')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'enProceso'
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  En Proceso
                  <span className="ml-2 bg-warning text-text-inverse text-xs px-1.5 py-0.5 rounded-full">
                    {ticketsEjemplo.enProceso.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('resueltos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'resueltos'
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Resueltos
                </button>
              </div>
            </div>
            
            {/* Tabla de tickets */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-primary">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-main divide-y divide-border-light">
                  {ticketsEjemplo[activeTab].map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-bg-sidebar transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">#{ticket.id}</div>
                        <div className="text-xs text-text-muted truncate max-w-[150px]">
                          {ticket.asunto}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">{ticket.usuario}</div>
                        <div className="text-xs text-text-muted">{ticket.rol}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.categoria === 'Acceso' ? 'bg-primary-100 text-primary-800' :
                          ticket.categoria === 'Datos' ? 'bg-info-light text-info-dark' :
                          ticket.categoria === 'Mensajería' ? 'bg-secondary-100 text-secondary-800' :
                          ticket.categoria === 'Reportes' ? 'bg-tertiary-100 text-tertiary-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.categoria}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.prioridad === 'Alta' ? 'bg-error-light text-error-dark' :
                          ticket.prioridad === 'Media' ? 'bg-warning-light text-warning-dark' :
                          'bg-success-light text-success-dark'
                        }`}>
                          {ticket.prioridad}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(ticket.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm">
                        <button className={`px-3 py-1 rounded-md ${
                          activeTab === 'pendientes' ? 'bg-primary-600 text-white hover:bg-primary-700' :
                          activeTab === 'enProceso' ? 'bg-warning text-white hover:bg-warning-dark' :
                          'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}>
                          {activeTab === 'pendientes' ? 'Atender' :
                           activeTab === 'enProceso' ? 'Continuar' :
                           'Ver Detalle'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {ticketsEjemplo[activeTab].length === 0 && (
              <div className="text-center py-8 text-text-muted">
                No hay tickets {activeTab === 'pendientes' ? 'pendientes' : activeTab === 'enProceso' ? 'en proceso' : 'resueltos'} en este momento.
              </div>
            )}
          </div>
        </div>
        
        {/* Columna lateral (30%): Estado del sistema + Herramientas */}
        <div className="space-y-6">
          {/* Estado del Sistema */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-text-primary mb-4">Estado del Sistema</h2>
            
            <div className="space-y-4">
              {estadoSistemaEjemplo.map((estado) => (
                <div key={estado.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                    <span className="text-lg">{estado.icono}</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-text-primary">{estado.titulo}</h3>
                      <span className="text-lg font-semibold text-primary-700">{estado.valor}</span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      {estado.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Herramientas Administrativas */}
          <div className="bg-bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-text-primary mb-4">Herramientas Administrativas</h2>
            
            <div className="space-y-3">
              {[
                { id: 1, titulo: 'Exportar Datos', descripcion: 'CSV/SQL', icono: '📥' },
                { id: 2, titulo: 'Backup Manual', descripcion: 'Base de datos completa', icono: '🔄' },
                { id: 3, titulo: 'Ver Logs del Sistema', descripcion: 'Actividad y errores', icono: '📋' },
                { id: 4, titulo: 'Gestionar FAQ/Guías', descripcion: 'Documentación de ayuda', icono: '❓' },
                { id: 5, titulo: 'Ver Todos los Usuarios', descripcion: 'Administración de cuentas', icono: '👥' },
              ].map((herramienta) => (
                <div 
                  key={herramienta.id}
                  className="border border-border-primary rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                      <span className="text-lg">{herramienta.icono}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{herramienta.titulo}</h3>
                      <p className="text-text-muted text-xs">
                        {herramienta.descripcion}
                      </p>
                    </div>
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