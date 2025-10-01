import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Bell, 
  ClipboardList, 
  HelpCircle,
  Upload,
  Users,
  Settings,
  Eye,
  Database,
  FileText,
  BarChart,
  Ticket,
  Download,
  Archive,
  List,
  X
} from 'lucide-react'

/**
 * Sidebar
 * - Navegación lateral con menú por rol
 * - Implementa CA-04 y CA-05 de HU-DASH-01
 */
export default function Sidebar({ isOpen, isMobile, onClose, userRole, userName }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  
  // En desktop, permitir modo colapsado (solo íconos)
  useEffect(() => {
    if (!isMobile) {
      const savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true'
      setCollapsed(savedCollapsed)
    } else {
      setCollapsed(false)
    }
  }, [isMobile])
  
  // Guardar preferencia de sidebar colapsado
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebar_collapsed', String(newCollapsed))
  }
  
  // Determinar menú según rol
  const getMenuItems = () => {
    switch (userRole) {
      case 'apoderado':
        return [
          { path: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
          { path: '/dashboard/calificaciones', icon: <BarChart size={20} />, label: 'Calificaciones' },
          { path: '/dashboard/asistencia', icon: <Calendar size={20} />, label: 'Asistencia' },
          { path: '/dashboard/mensajes', icon: <MessageSquare size={20} />, label: 'Mensajes' },
          { path: '/dashboard/comunicados', icon: <Bell size={20} />, label: 'Comunicados' },
          { path: '/dashboard/encuestas', icon: <ClipboardList size={20} />, label: 'Encuestas' },
          { path: '/dashboard/soporte', icon: <HelpCircle size={20} />, label: 'Soporte Técnico' },
        ]
      case 'docente':
        return [
          { path: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
          { path: '/dashboard/cursos', icon: <BookOpen size={20} />, label: 'Mis Cursos' },
          { 
            path: '/dashboard/cargar-datos', 
            icon: <Upload size={20} />, 
            label: 'Cargar Datos',
            submenu: [
              { path: '/dashboard/cargar-datos/calificaciones', label: 'Calificaciones' },
              { path: '/dashboard/cargar-datos/asistencia', label: 'Asistencia' },
            ]
          },
          { path: '/dashboard/mensajes', icon: <MessageSquare size={20} />, label: 'Mensajes' },
          { path: '/dashboard/comunicados', icon: <Bell size={20} />, label: 'Comunicados' },
          { path: '/dashboard/encuestas', icon: <ClipboardList size={20} />, label: 'Encuestas' },
          { path: '/dashboard/soporte', icon: <HelpCircle size={20} />, label: 'Soporte Técnico' },
        ]
      case 'director':
        return [
          { path: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
          { 
            path: '/dashboard/gestion-usuarios', 
            icon: <Users size={20} />, 
            label: 'Gestión de Usuarios',
            submenu: [
              { path: '/dashboard/gestion-usuarios/permisos-docentes', label: 'Permisos Docentes' },
              { path: '/dashboard/gestion-usuarios/todos', label: 'Ver Todos' },
            ]
          },
          { 
            path: '/dashboard/configuracion', 
            icon: <Settings size={20} />, 
            label: 'Configuración',
            submenu: [
              { path: '/dashboard/configuracion/evaluacion', label: 'Estructura de Evaluación' },
              { path: '/dashboard/configuracion/alertas', label: 'Umbrales de Alertas' },
              { path: '/dashboard/configuracion/periodos', label: 'Períodos Académicos' },
            ]
          },
          { 
            path: '/dashboard/cargar-datos', 
            icon: <Upload size={20} />, 
            label: 'Cargar Datos',
            submenu: [
              { path: '/dashboard/cargar-datos/calificaciones', label: 'Calificaciones' },
              { path: '/dashboard/cargar-datos/asistencia', label: 'Asistencia' },
            ]
          },
          { 
            path: '/dashboard/supervision', 
            icon: <Eye size={20} />, 
            label: 'Supervisión',
            submenu: [
              { path: '/dashboard/supervision/mensajeria', label: 'Mensajería' },
              { path: '/dashboard/supervision/actividad', label: 'Actividad del Sistema' },
            ]
          },
          { path: '/dashboard/mensajes', icon: <MessageSquare size={20} />, label: 'Mensajes' },
          { path: '/dashboard/comunicados', icon: <Bell size={20} />, label: 'Comunicados' },
          { path: '/dashboard/encuestas', icon: <ClipboardList size={20} />, label: 'Encuestas' },
        ]
      case 'administrador':
        return [
          { path: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
          { path: '/dashboard/soporte', icon: <Ticket size={20} />, label: 'Soporte Técnico' },
          { path: '/dashboard/usuarios', icon: <Users size={20} />, label: 'Usuarios del Sistema' },
          { path: '/dashboard/exportar', icon: <Download size={20} />, label: 'Exportar Datos' },
          { path: '/dashboard/backups', icon: <Archive size={20} />, label: 'Backups' },
          { path: '/dashboard/logs', icon: <List size={20} />, label: 'Logs del Sistema' },
          { path: '/dashboard/ayuda', icon: <HelpCircle size={20} />, label: 'Gestionar Ayuda' },
          { path: '/dashboard/configuracion-tecnica', icon: <Settings size={20} />, label: 'Configuración Técnica' },
        ]
      default:
        return [
          { path: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
          { path: '/dashboard/soporte', icon: <HelpCircle size={20} />, label: 'Soporte Técnico' },
        ]
    }
  }
  
  // Obtener menú según rol
  const menuItems = getMenuItems()
  
  // Expandir/colapsar submenús
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)
  
  // Verificar si una ruta está activa (incluyendo subrutas)
  const isActiveRoute = (path) => {
    if (path === '/dashboard' && location.pathname !== '/dashboard') {
      return false
    }
    return location.pathname.startsWith(path)
  }
  
  // Verificar si un submenú tiene una ruta activa
  const hasActiveSubmenuItem = (submenu) => {
    return submenu?.some(item => location.pathname === item.path)
  }
  
  // Clases para el contenedor del sidebar
  const sidebarClasses = `
    h-full bg-bg-sidebar border-r border-border-primary transition-all duration-300 z-30
    ${isMobile ? 'fixed left-0 top-0 bottom-0' : 'relative'}
    ${isOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : ''}
    ${collapsed && !isMobile ? 'w-20' : 'w-64'}
  `
  
  return (
    <>
      <aside className={sidebarClasses}>
        {/* Header del sidebar con nombre y rol */}
        <div className="p-4 border-b border-border-primary">
          {isMobile && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-nav-item-active-bg text-nav-item"
            >
              <X size={20} />
            </button>
          )}
          
          <div className="flex flex-col">
            <h2 className={`font-semibold text-text-primary truncate ${collapsed && !isMobile ? 'text-xs text-center' : 'text-base'}`}>
              {collapsed && !isMobile ? userName?.split(' ')[0] : userName}
            </h2>
            <span className={`text-nav-item ${collapsed && !isMobile ? 'text-xs text-center' : 'text-sm'}`}>
              {userRole === 'apoderado' ? 'Apoderado' : 
               userRole === 'docente' ? 'Docente' : 
               userRole === 'director' ? 'Director' : 
               userRole === 'administrador' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="p-2 overflow-y-auto h-[calc(100%-64px)]">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                {item.submenu ? (
                  // Elemento con submenú
                  <div>
                    <button
                      onClick={() => setExpandedSubmenu(expandedSubmenu === item.path ? null : item.path)}
                      className={`w-full flex items-center justify-between p-2 rounded-md transition-colors
                        ${isActiveRoute(item.path) || hasActiveSubmenuItem(item.submenu)
                          ? 'bg-nav-item-active-bg text-nav-item-active font-medium'
                          : 'text-nav-item hover:bg-nav-item-active-bg hover:text-nav-item-hover'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex">{item.icon}</span>
                        {(!collapsed || isMobile) && <span>{item.label}</span>}
                      </div>
                      {(!collapsed || isMobile) && (
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedSubmenu === item.path ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>
                    
                    {/* Submenú */}
                    {(!collapsed || isMobile) && expandedSubmenu === item.path && (
                      <ul className="pl-10 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.path}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) =>
                                `block p-2 rounded-md transition-colors ${
                                  isActive
                                    ? 'bg-nav-item-active-bg text-nav-item-active font-medium'
                                    : 'text-nav-item hover:bg-nav-item-active-bg hover:text-nav-item-hover'
                                }`
                              }
                            >
                              {subItem.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Elemento normal
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-nav-item-active-bg text-nav-item-active font-medium'
                          : 'text-nav-item hover:bg-nav-item-active-bg hover:text-nav-item-hover'
                      }`
                    }
                    title={collapsed && !isMobile ? item.label : ''}
                  >
                    <span className="inline-flex">{item.icon}</span>
                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Botón para colapsar/expandir (solo en desktop) */}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </aside>
      
      {/* Overlay para cerrar sidebar en mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-bg-overlay z-20"
          onClick={onClose}
        />
      )}
    </>
  )
}