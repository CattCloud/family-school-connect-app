/**
 * MainContent
 * - Área principal dinámica según el módulo activo
 * - Implementa parte del CA-02 de HU-DASH-01
 */
export default function MainContent({ children }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg-app">
      <div className="container mx-auto">
        {children}
      </div>
    </main>
  )
}