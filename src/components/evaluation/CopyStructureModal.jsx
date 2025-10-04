import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import GradeSelector from './GradeSelector';
import { Copy, AlertTriangle } from 'lucide-react';

/**
 * Modal para copiar la estructura de evaluación de un grado a otro
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función a ejecutar al cerrar el modal
 * @param {Object} props.sourceGrade - Grado origen de la estructura
 * @param {Array} props.grades - Lista de grados disponibles
 * @param {Function} props.onCopy - Función a ejecutar al confirmar copia
 * @param {boolean} props.isLoading - Indica si está cargando
 */
export default function CopyStructureModal({
  isOpen,
  onClose,
  sourceGrade,
  grades = [],
  onCopy,
  isLoading = false
}) {
  const [targetGrade, setTargetGrade] = useState(null);
  const [error, setError] = useState('');
  
  // Filtrar el grado origen de la lista de grados disponibles
  const availableGrades = grades.filter(grade => 
    grade.id !== sourceGrade?.id
  );
  
  // Manejar selección de grado destino
  const handleSelectGrade = (grade) => {
    setTargetGrade(grade);
    setError('');
  };
  
  // Manejar confirmación de copia
  const handleConfirm = () => {
    if (!targetGrade) {
      setError('Debe seleccionar un grado destino');
      return;
    }
    
    onCopy(sourceGrade, targetGrade);
    onClose();
  };
  
  // Limpiar estado al cerrar
  const handleClose = () => {
    setTargetGrade(null);
    setError('');
    onClose();
  };
  
  if (!sourceGrade) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Copiar estructura de evaluación"
    >
      <div className="p-4">
        <div className="flex items-center justify-center mb-4 text-primary-500">
          <Copy size={48} />
        </div>
        
        <p className="text-center mb-4">
          Copiar la estructura de evaluación del grado <strong>{sourceGrade.nombre}</strong> a otro grado.
        </p>
        
        <div className="mb-6">
          <label className="block text-text-secondary mb-2">
            Seleccione el grado destino:
          </label>
          
          <GradeSelector
            grades={availableGrades}
            selectedGrade={targetGrade}
            onSelectGrade={handleSelectGrade}
            isLoading={isLoading}
          />
          
          {error && (
            <p className="mt-2 text-error text-sm">
              {error}
            </p>
          )}
        </div>
        
        {targetGrade && (
          <div className="mb-4 p-3 bg-warning-light border border-warning rounded-lg flex items-start">
            <AlertTriangle size={20} className="text-warning mr-2 mt-0.5" />
            <p className="text-sm">
              Esta acción sobrescribirá la estructura de evaluación actual del grado 
              <strong> {targetGrade.nombre}</strong>. Los pesos se copiarán exactamente 
              como están definidos en el grado origen.
            </p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleConfirm}
            disabled={!targetGrade || isLoading}
          >
            {isLoading ? (
              <>Copiando...</>
            ) : (
              <>Copiar estructura</>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}