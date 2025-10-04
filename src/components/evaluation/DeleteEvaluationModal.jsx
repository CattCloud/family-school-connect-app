import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Modal para confirmar eliminación de un componente de evaluación
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función a ejecutar al cerrar el modal
 * @param {Object} props.component - Componente de evaluación a eliminar
 * @param {Function} props.onConfirm - Función a ejecutar al confirmar eliminación
 */
export default function DeleteEvaluationModal({
  isOpen,
  onClose,
  component,
  onConfirm
}) {
  if (!component) return null;
  
  const handleConfirm = () => {
    onConfirm(component);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar componente de evaluación"
    >
      <div className="p-4">
        <div className="flex items-center justify-center mb-4 text-warning">
          <AlertTriangle size={48} />
        </div>
        
        <p className="text-center mb-2 text-lg font-medium">
          ¿Está seguro que desea eliminar este componente?
        </p>
        
        <div className="bg-bg-card border border-border-primary rounded-lg p-3 my-4">
          <p className="font-medium">{component.nombre}</p>
          <p className="text-sm text-text-secondary mt-1">Peso: {component.peso}%</p>
        </div>
        
        <p className="text-error text-sm mb-6">
          Esta acción no se puede deshacer. Si este componente está siendo utilizado en evaluaciones existentes, 
          podría afectar los cálculos de notas.
        </p>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          
          <Button
            variant="danger"
            onClick={handleConfirm}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}