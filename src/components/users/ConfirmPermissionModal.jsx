import { useRef, useEffect } from 'react';
import Button from '../ui/Button';

/**
 * Modal de confirmación para activar/desactivar permisos
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onConfirm - Función a ejecutar al confirmar
 * @param {Object} props.permissionData - Datos del permiso a modificar
 */
export default function ConfirmPermissionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  permissionData 
}) {
  const confirmButtonRef = useRef(null);
  
  // Enfocar el botón de confirmar al abrir el modal
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);
  
  // Si el modal no está abierto o no hay datos de permiso, no mostrar nada
  if (!isOpen || !permissionData) return null;
  
  const { tipoPermiso, nuevoEstado } = permissionData;
  
  // Texto para el tipo de permiso
  const tipoPermisoText = tipoPermiso === 'comunicados' ? 'Comunicados' : 'Encuestas';
  
  // Texto para la acción
  const accionText = nuevoEstado ? 'activar' : 'desactivar';
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay semi-transparente */}
      <div 
        className="fixed inset-0 bg-bg-overlay bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Contenido del modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-bg-card px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-text-primary">
                Confirmar cambio de permiso
              </h3>
              <div className="mt-2">
                <p className="text-sm text-text-secondary">
                  ¿Está seguro que desea {accionText} el permiso de <strong>{tipoPermisoText}</strong> para este docente?
                </p>
                {nuevoEstado && (
                  <p className="mt-2 text-sm text-text-secondary">
                    Al activar este permiso, el docente podrá crear {tipoPermisoText.toLowerCase()} para sus cursos asignados.
                  </p>
                )}
                {!nuevoEstado && (
                  <p className="mt-2 text-sm text-text-secondary">
                    Al desactivar este permiso, el docente ya no podrá crear {tipoPermisoText.toLowerCase()}.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <Button
              ref={confirmButtonRef}
              variant={nuevoEstado ? "primary" : "outline"}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full sm:w-auto sm:ml-3"
            >
              Confirmar
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}