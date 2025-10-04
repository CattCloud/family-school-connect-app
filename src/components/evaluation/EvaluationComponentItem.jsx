import { Trash2, Edit, Info } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Componente para mostrar un componente de evaluación en la lista
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.component - Componente de evaluación a mostrar
 * @param {Function} props.onEdit - Función a ejecutar al editar
 * @param {Function} props.onDelete - Función a ejecutar al eliminar
 */
export default function EvaluationComponentItem({ component, onEdit, onDelete }) {
  if (!component) return null;
  
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary">
            {component.nombre}
          </h3>
          
          {component.descripcion && (
            <p className="text-text-secondary mt-1 text-sm">
              {component.descripcion}
            </p>
          )}
          
          <div className="mt-3 flex items-center">
            <div className="bg-primary-100 text-primary-800 font-medium px-3 py-1 rounded-full text-sm">
              {component.peso}%
            </div>
            
            {component.activo !== undefined && (
              <span className={`ml-3 text-sm ${component.activo ? 'text-success' : 'text-error'}`}>
                {component.activo ? 'Activo' : 'Inactivo'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="icon"
            onClick={() => onEdit(component)}
            title="Editar componente"
          >
            <Edit size={18} />
          </Button>
          
          <Button
            variant="icon"
            onClick={() => onDelete(component)}
            title="Eliminar componente"
            className="text-error hover:bg-error-light"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>
      
      {/* Barra de peso visual */}
      <div className="mt-3 h-2 bg-bg-disabled rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-500"
          style={{ width: `${component.peso}%` }}
        />
      </div>
    </div>
  );
}