import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Componente para seleccionar un grado
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.grades - Lista de grados disponibles
 * @param {Object} props.selectedGrade - Grado seleccionado actualmente
 * @param {Function} props.onSelectGrade - Función a ejecutar al seleccionar un grado
 * @param {boolean} props.isLoading - Indica si está cargando los datos
 */
export default function GradeSelector({ 
  grades = [], 
  selectedGrade, 
  onSelectGrade,
  isLoading = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.grade-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Agrupar grados por nivel educativo
  const groupedGrades = grades.reduce((acc, grade) => {
    const level = grade.nivel_educativo || 'Sin nivel';
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(grade);
    return acc;
  }, {});
  
  // Manejar selección de grado
  const handleSelectGrade = (grade) => {
    onSelectGrade(grade);
    setIsOpen(false);
  };
  
  return (
    <div className="grade-selector relative">
      <button
        type="button"
        className={`
          flex items-center justify-between w-full px-4 py-2 text-left
          bg-bg-card border border-border-primary rounded-lg shadow-sm
          hover:bg-bg-sidebar focus:outline-none focus:ring-2 focus:ring-primary-300
          ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
        `}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <span className="flex flex-col">
          <span className="font-medium">
            {selectedGrade ? selectedGrade.nombre : 'Seleccionar grado'}
          </span>
          {selectedGrade && (
            <span className="text-text-muted text-sm">
              {selectedGrade.nivel_educativo}
            </span>
          )}
        </span>
        <ChevronDown 
          size={20} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {Object.entries(groupedGrades).map(([level, levelGrades]) => (
            <div key={level} className="p-1">
              <div className="px-3 py-1 text-xs font-semibold text-text-muted bg-bg-sidebar rounded-md">
                {level}
              </div>
              <div className="mt-1">
                {levelGrades.map((grade) => (
                  <button
                    key={grade.id}
                    type="button"
                    className={`
                      block w-full px-4 py-2 text-left hover:bg-bg-sidebar rounded-md
                      ${selectedGrade?.id === grade.id ? 'bg-primary-50 text-primary-700' : ''}
                    `}
                    onClick={() => handleSelectGrade(grade)}
                  >
                    {grade.nombre}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {grades.length === 0 && (
            <div className="p-4 text-center text-text-muted">
              No hay grados disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
}