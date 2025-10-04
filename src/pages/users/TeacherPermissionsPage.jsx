import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeachersPermissions } from '../../services/teacherService';
import PermissionSwitch from '../../components/users/PermissionSwitch';
import ConfirmPermissionModal from '../../components/users/ConfirmPermissionModal';
import { toastError } from '../../components/ui/Toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

/**
 * Página de gestión de permisos de docentes
 * Implementa HU-USERS-01: Activar/Desactivar Permisos de Comunicación y Encuestas
 */
export default function TeacherPermissionsPage() {
  // Estado para paginación y filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  
  // Estado para modal de confirmación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionToUpdate, setPermissionToUpdate] = useState(null);
  
  // Obtener lista de docentes con sus permisos
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['teachersPermissions', page, limit, search, filter],
    queryFn: () => getTeachersPermissions({ page, limit, search, filter }),
    keepPreviousData: true,
    staleTime: 30000, // 30 segundos
  });
  
  // Manejar errores de la consulta
  useEffect(() => {
    if (isError) {
      toastError(
        error?.response?.error?.message || 
        'No se pudo cargar la lista de docentes. Intente nuevamente.'
      );
    }
  }, [isError, error]);
  
  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  // Manejar cambio de límite
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Volver a la primera página al cambiar el límite
  };
  
  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements.search.value;
    setSearch(searchValue);
    setPage(1); // Volver a la primera página al buscar
  };
  
  // Manejar cambio de filtro
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Volver a la primera página al cambiar el filtro
  };
  
  // Manejar confirmación de cambio de permiso
  const handleConfirmPermission = () => {
    if (permissionToUpdate && permissionToUpdate.onConfirmed) {
      permissionToUpdate.onConfirmed();
    }
  };
  
  // Manejar actualización de permiso
  const handlePermissionUpdate = () => {
    // Refrescar datos después de actualizar un permiso
    refetch();
  };
  
  // Manejar solicitud de confirmación
  const handleConfirmRequest = (permissionData) => {
    setPermissionToUpdate(permissionData);
    setIsModalOpen(true);
  };
  
  // Renderizar tabla de docentes
  const renderTeachersTable = () => {
    if (!data?.data?.docentes || data.data.docentes.length === 0) {
      return (
        <div className="text-center py-8 bg-bg-card rounded-lg shadow-sm">
          <p className="text-text-muted">No se encontraron docentes con los filtros aplicados.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-primary">
          <thead className="bg-bg-sidebar">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">
                Docente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">
                Cursos Asignados
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-text-white uppercase tracking-wider">
                Comunicados
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-text-white uppercase tracking-wider">
                Encuestas
              </th>
            </tr>
          </thead>
          <tbody className="bg-bg-card divide-y divide-border-light">
            {data.data.docentes.map((docente) => (
              <tr key={docente.id} className="hover:bg-bg-hover-table transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      {docente.nombre.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-text-primary">
                        {docente.nombre} {docente.apellido}
                      </div>
                      <div className="text-sm text-text-muted">
                        {docente.telefono}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary">
                    {docente.cursos_asignados && docente.cursos_asignados.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {docente.cursos_asignados.map((curso) => (
                          <span 
                            key={curso.curso_id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {curso.nombre} - {curso.nivel} {curso.grado}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">Sin cursos asignados</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <PermissionSwitch
                    docenteId={docente.id}
                    tipoPermiso="comunicados"
                    estadoActivo={docente.permisos?.comunicados?.estado_activo || false}
                    onUpdate={handlePermissionUpdate}
                    onConfirm={handleConfirmRequest}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <PermissionSwitch
                    docenteId={docente.id}
                    tipoPermiso="encuestas"
                    estadoActivo={docente.permisos?.encuestas?.estado_activo || false}
                    onUpdate={handlePermissionUpdate}
                    onConfirm={handleConfirmRequest}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Renderizar paginación
  const renderPagination = () => {
    if (!data?.data?.pagination) return null;
    
    const { current_page, total_pages } = data.data.pagination;
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-bg-card sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(current_page - 1)}
            disabled={current_page === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-border-primary text-sm font-medium rounded-md ${
              current_page === 1
                ? 'text-text-muted bg-bg-disabled cursor-not-allowed'
                : 'text-text-primary bg-bg-main hover:bg-bg-sidebar'
            }`}
          >
            Anterior
          </button>
          <button
            onClick={() => handlePageChange(current_page + 1)}
            disabled={current_page === total_pages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-border-primary text-sm font-medium rounded-md ${
              current_page === total_pages
                ? 'text-text-muted bg-bg-disabled cursor-not-allowed'
                : 'text-text-primary bg-bg-main hover:bg-bg-sidebar'
            }`}
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary">
              Mostrando <span className="font-medium">{(current_page - 1) * limit + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(current_page * limit, data.data.pagination.total_records)}
              </span>{' '}
              de <span className="font-medium">{data.data.pagination.total_records}</span> docentes
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(current_page - 1)}
                disabled={current_page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-primary text-sm font-medium ${
                  current_page === 1
                    ? 'text-text-muted bg-bg-disabled cursor-not-allowed'
                    : 'text-text-primary bg-bg-main hover:bg-bg-sidebar'
                }`}
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Páginas */}
              {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border border-border-primary text-sm font-medium ${
                      current_page === pageNumber
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'text-text-primary bg-bg-main hover:bg-bg-sidebar'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(current_page + 1)}
                disabled={current_page === total_pages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-primary text-sm font-medium ${
                  current_page === total_pages
                    ? 'text-text-muted bg-bg-disabled cursor-not-allowed'
                    : 'text-text-primary bg-bg-main hover:bg-bg-sidebar'
                }`}
              >
                <span className="sr-only">Siguiente</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Permisos de Docentes
        </h1>
        <p className="text-text-secondary">
          Gestione los permisos de comunicación y encuestas para los docentes de la institución.
        </p>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="bg-bg-card p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex w-full">
              <input
                type="text"
                name="search"
                placeholder="Buscar docente..."
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-border-primary focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-l-0 border-border-primary rounded-r-md bg-primary-600 text-text-inverse hover:bg-primary-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-border-primary focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="todos">Todos</option>
              <option value="con_permisos">Con permisos</option>
              <option value="sin_permisos">Sin permisos</option>
            </select>
            
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="block w-full pl-3 pr-10 py-2 text-base border-border-primary focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Tabla de docentes */}
      <div className="bg-bg-card rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {renderTeachersTable()}
            {renderPagination()}
          </>
        )}
      </div>
      
      {/* Modal de confirmación */}
      <ConfirmPermissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPermission}
        permissionData={permissionToUpdate}
      />
    </div>
  );
}