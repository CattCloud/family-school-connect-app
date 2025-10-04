import Modal from '../ui/Modal';
import EvaluationComponentEditor from './EvaluationComponentEditor';

/**
 * Modal para editar un componente de evaluación
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función a ejecutar al cerrar el modal
 * @param {Object} props.component - Componente de evaluación a editar
 * @param {Function} props.onSave - Función a ejecutar al guardar cambios
 * @param {number} props.maxWeight - Peso máximo disponible (para validación)
 * @param {boolean} props.isNew - Indica si es un nuevo componente
 */
export default function EvaluationComponentModal({
  isOpen,
  onClose,
  component,
  onSave,
  maxWeight = 100,
  isNew = false
}) {
  // Título del modal según si es nuevo o edición
  const modalTitle = isNew 
    ? 'Agregar componente de evaluación' 
    : 'Editar componente de evaluación';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <div className="p-4">
        <EvaluationComponentEditor
          component={component}
          onSave={(updatedComponent) => {
            onSave(updatedComponent);
            onClose();
          }}
          onCancel={onClose}
          maxWeight={maxWeight}
        />
      </div>
    </Modal>
  );
}