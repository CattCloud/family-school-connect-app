import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Modal para confirmar la aplicación de la estructura institucional a un grado
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función a ejecutar al cerrar el modal
 * @param {Object} props.grade - Grado al que se aplicará la estructura
 * @param {Function} props.onConfirm - Función a ejecutar al confirmar
 */
export default function ApplyInstitutionalModal({
  isOpen,
  onClose,
  grade,
  onConfirm
}) {
  if (!grade) return null;
  
  const handleConfirm = () => {
    onConfirm(grade);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aplicar estructura institucional"
    >
      <div className="p-4">
        <div className="flex items-center justify-center mb-4 text-warning">
          <AlertTriangle size={48} />
        </div>
        
        <p className="text-center mb-2 text-lg font-medium">
          ¿Está seguro que desea aplicar la estructura institucional?
        </p>
        
        <div className="bg-bg-card border border-border-primary rounded-lg p-3 my-4">
          <p className="font-medium">{grade.nombre}</p>
          <p className="text-sm text-text-secondary mt-1">{grade.nivel_educativo}</p>
        </div>
        
        <p className="text-warning text-sm mb-6">
          Esta acción reemplazará la estructura de evaluación específica del grado 
          por la estructura institucional. Los pesos se aplicarán exactamente como 
          están definidos a nivel institucional.
        </p>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          
          <Button
            variant="warning"
            onClick={handleConfirm}
          >
            Aplicar estructura institucional
          </Button>
        </div>
      </div>
    </Modal>
  );
}