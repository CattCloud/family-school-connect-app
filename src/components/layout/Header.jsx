import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import useStudentSelector from '../../hooks/useStudentSelector'
import Button from '../ui/Button'

// Importamos íconos de Lucide React
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react'

/**
 * Header
 * - Barra superior fija con identidad del usuario y acciones globales
 * - Implementa CA-03 de HU-DASH-01
 */
export default function Header({ toggleSidebar, isSidebarOpen, isMobile }) {
  const { user, logout } = useAuth()
  const { isParent, children, selectedChild, selectChild } = useStudentSelector()
  
  // Estado para dropdown de usuario
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  
  // Estado para dropdown de selector de hijo
  const [isChildSelectorOpen, setIsChildSelectorOpen] = useState(false)
  const childSelectorRef = useRef(null)
  
  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (childSelectorRef.current && !childSelectorRef.current.contains(event.target)) {
        setIsChildSelectorOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Función para manejar logout
  const handleLogout = async () => {
    await logout()
    // La redirección la maneja el AuthContext
  }
  
  return (
    <header className="sticky top-0 z-10 bg-bg-header border-b border-border-primary px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between h-14">
        {/* Lado izquierdo: Toggle sidebar + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-text-muted hover:bg-nav-item-active-bg hover:text-nav-item-active transition-colors"
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMobile || !isSidebarOpen ? <Menu size={24} /> : <X size={24} />}
          </button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src="/src/assets/logo.png" 
              alt="I.E.P. Las Orquídeas" 
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold text-primary-800 hidden md:block">
              I.E.P. Las Orquídeas
            </span>
          </Link>
        </div>
        
        {/* Lado derecho: Selector de hijo + Notificaciones + Usuario */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Selector de hijo (solo para padres con múltiples hijos) */}
          {isParent && children.length > 0 && (
            <div className="relative" ref={childSelectorRef}>
              <button
                onClick={() => setIsChildSelectorOpen(!isChildSelectorOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-bg-card border border-border-primary hover:bg-nav-item-active-bg transition-colors"
              >
                <span className="hidden sm:inline">Estudiante:</span>
                <span className="font-medium text-primary-700 max-w-[120px] sm:max-w-[150px] truncate">
                  {selectedChild?.nombre || 'Seleccionar'}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {/* Dropdown de selector de hijo */}
              {isChildSelectorOpen && children.length > 0 && (
                <div className="absolute right-0 mt-1 w-56 bg-bg-card rounded-md shadow-lg border border-border-primary z-20">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-text-muted border-b border-border-light">
                      Seleccionar estudiante
                    </div>
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          selectChild(child.id)
                          setIsChildSelectorOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-nav-item-active-bg transition-colors ${
                          selectedChild?.id === child.id
                            ? 'bg-nav-item-active-bg text-nav-item-active font-medium'
                            : 'text-text-secondary'
                        }`}
                      >
                        {child.nombre}
                        <div className="text-xs text-text-muted">
                          {child.grado} {child.nivel}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Icono de notificaciones */}
          <button className="relative p-2 rounded-md text-header-item hover:bg-nav-item-active-bg hover:text-nav-item-active transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-error text-text-inverse text-xs flex items-center justify-center rounded-full">
              3
            </span>
          </button>
          
          {/* Avatar/Icono de usuario con dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-nav-item-active-bg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                {user?.nombres?.charAt(0) || user?.nombre_completo?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium text-text-primary">
                {user?.nombre_completo || `${user?.nombres || ''} ${user?.apellidos || ''}`}
              </span>
              <ChevronDown size={16} className="hidden md:block text-header-item hover:text-nav-item-active" />
            </button>
            
            {/* Dropdown de usuario */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-bg-card rounded-md shadow-lg border border-border-primary z-20">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-text-muted border-b border-border-light">
                    {user?.rol === 'apoderado' ? 'Apoderado' : 
                     user?.rol === 'docente' ? 'Docente' : 
                     user?.rol === 'director' ? 'Director' : 
                     user?.rol === 'administrador' ? 'Administrador' : 'Usuario'}
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-nav-item-active-bg  hover:text-text-inverse flex items-center gap-2 cursor-pointer  transition-colors"
                  >
                    <User size={16} />
                    <span>Ver perfil</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-light cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}