import { useState } from 'react';
import { updateTeacherPermission } from '../../services/teacherService';
import { toastSuccess, toastError } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

/**
 * Switch para activar/desactivar permisos de docentes
 * @param {Object} props - Propiedades del componente
 * @param {string} props.docenteId - ID del docente
 * @param {string} props.tipoPermiso - Tipo de permiso: comunicados | encuestas
 * @param {boolean} props.estadoActivo - Estado actual del permiso
 * @param {Function} props.onUpdate - Función a ejecutar después de actualizar el permiso
 * @param {Function} props.onConfirm - Función para mostrar modal de confirmación
 */
export default function PermissionSwitch({ 
  docenteId, 
  tipoPermiso, 
  estadoActivo = false, 
  onUpdate,
  onConfirm
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(estadoActivo);
  const { updateUserPermissions, user } = useAuth();
  
  // Texto para el tipo de permiso
  const tipoPermisoText = tipoPermiso === 'comunicados' ? 'Comunicados' : 'Encuestas';
  
  // Manejar cambio de estado
  const handleToggle = async () => {
    // Si hay función de confirmación, usarla
    if (onConfirm) {
      onConfirm({
        docenteId,
        tipoPermiso,
        estadoActual: isActive,
        nuevoEstado: !isActive,
        onConfirmed: updatePermission
      });
      return;
    }
    
    // Si no hay función de confirmación, actualizar directamente
    await updatePermission();
  };
  
  // Actualizar permiso en la API
  const updatePermission = async () => {
    setIsLoading(true);
    try {
      // Calcular el nuevo estado basado en el estado actual
      const nuevoEstado = !isActive;
      await updateTeacherPermission(docenteId, tipoPermiso, nuevoEstado);
      
      // Actualizar estado local
      setIsActive(nuevoEstado);
      
      // Mostrar notificación de éxito
      const mensaje = nuevoEstado
        ? `Permiso de ${tipoPermisoText} activado correctamente`
        : `Permiso de ${tipoPermisoText} desactivado correctamente`;
      toastSuccess(mensaje);
      
      // Ejecutar callback si existe
      if (onUpdate) {
        onUpdate(docenteId, tipoPermiso, nuevoEstado);
      }
      
      // Actualizar permisos del usuario SOLO si el propio docente modificó SU permiso
      // Evita llamar /auth/me cuando el director cambia permisos de otro usuario
      if (user?.rol === 'docente' && user?.id === docenteId) {
        await updateUserPermissions({ silent: true }).catch(err => {
          console.debug('updateUserPermissions silencioso falló:', err);
        });
      }
    } catch (error) {
      // Mostrar notificación de error
      toastError(
        error?.response?.error?.message ||
        'No se pudo actualizar el permiso. Intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 
          border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
          ${isActive ? 'bg-success' : 'bg-gray-200'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        role="switch"
        aria-checked={isActive}
      >
        <span className="sr-only">
          {isActive ? `Desactivar permiso de ${tipoPermisoText}` : `Activar permiso de ${tipoPermisoText}`}
        </span>
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isActive ? 'translate-x-5' : 'translate-x-0'}
          `}
        >
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-3 w-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
        </span>
      </button>
      <span className={`ml-2 text-sm ${isActive ? 'text-success-dark font-medium' : 'text-text-muted'}`}>
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  );
}