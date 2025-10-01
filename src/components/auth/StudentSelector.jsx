import { useState, useRef, useEffect } from 'react'
import useStudentSelector from '../../hooks/useStudentSelector'
import { ChevronDown } from 'lucide-react'

/**
 * StudentSelector
 * - Dropdown para padres con múltiples hijos
 * - Implementa HU-AUTH-05
 */
export default function StudentSelector() {
  const { isParent, children, selectedChild, selectChild, isLoading } = useStudentSelector()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Si no es padre o no tiene hijos, no mostrar nada
  if (!isParent || children.length === 0) {
    return null
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-bg-card border border-border-primary hover:bg-nav-item-active-bg transition-colors"
      >
        <span className="hidden sm:inline">Estudiante:</span>
        {isLoading ? (
          <span className="animate-pulse bg-border-light rounded h-4 w-20"></span>
        ) : (
          <span className="font-medium text-primary-700 max-w-[120px] sm:max-w-[150px] truncate">
            {selectedChild?.nombre || 'Seleccionar'}
          </span>
        )}
        <ChevronDown size={16} />
      </button>
      
      {/* Dropdown */}
      {isOpen && children.length > 0 && (
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
                  setIsOpen(false)
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
  )
}