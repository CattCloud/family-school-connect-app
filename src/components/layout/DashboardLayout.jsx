import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'
import MainContent from './MainContent'

/**
 * DashboardLayout
 * - Contenedor principal con estructura fija para todas las rutas protegidas
 * - Implementa HU-DASH-01: Interfaz base responsive con navegación adaptada por rol
 */
export default function DashboardLayout({ children }) {
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar tamaño de pantalla para modo responsive
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    // Verificar al cargar
    checkIfMobile()

    // Verificar al cambiar tamaño de ventana
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-bg-app overflow-hidden">
      {/* Sidebar - colapsable en desktop, oculto en mobile */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
        userRole={user?.rol}
        userName={user?.nombre_completo || `${user?.nombres || ''} ${user?.apellidos || ''}`}
      />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />
        
        {/* Área de contenido principal */}
        <MainContent>
          {children}
        </MainContent>
      </div>

      {/* Overlay para cerrar sidebar en mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-bg-overlay z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}