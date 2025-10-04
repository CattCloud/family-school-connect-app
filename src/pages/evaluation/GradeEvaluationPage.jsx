import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Copy, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Info,
  BarChart3
} from 'lucide-react';
import { toastSuccess, toastFromApiError } from '../../components/ui/Toast';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import GradeSelector from '../../components/evaluation/GradeSelector';
import EvaluationComponentItem from '../../components/evaluation/EvaluationComponentItem';
import EvaluationComponentModal from '../../components/evaluation/EvaluationComponentModal';
import DeleteEvaluationModal from '../../components/evaluation/DeleteEvaluationModal';
import WeightSumIndicator from '../../components/evaluation/WeightSumIndicator';
import ApplyInstitutionalModal from '../../components/evaluation/ApplyInstitutionalModal';
import CopyStructureModal from '../../components/evaluation/CopyStructureModal';

import gradeLevelService from '../../services/gradeLevelService';
import evaluationService from '../../services/evaluationService';

/**
 * Página para asignar pesos a componentes de evaluación por grado
 */
export default function GradeEvaluationPage() {
  // Estado para grado seleccionado
  const [selectedGrade, setSelectedGrade] = useState(null);
  
  // Estado para modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  
  // Cliente de React Query
  const queryClient = useQueryClient();
  
  // Obtener todos los grados
  const { 
    data: grades = [], 
    isLoading: isLoadingGrades,
  } = useQuery({
    queryKey: ['gradeLevels'],
    queryFn: gradeLevelService.getAllGradeLevels,
  });
  
  // Obtener estructura institucional
  const { 
    data: institutionalComponents = [], 
    isLoading: isLoadingInstitutional,
  } = useQuery({
    queryKey: ['evaluationStructure'],
    queryFn: evaluationService.getEvaluationStructure,
  });
  
  // Obtener estructura de evaluación del grado seleccionado
  const { 
    data: gradeComponents = [], 
    isLoading: isLoadingGradeComponents,
    isError: isErrorGradeComponents,
    error: errorGradeComponents,
    refetch: refetchGradeComponents
  } = useQuery({
    queryKey: ['gradeEvaluationStructure', selectedGrade?.id],
    queryFn: () => gradeLevelService.getGradeEvaluationStructure(selectedGrade?.id),
    enabled: !!selectedGrade?.id,
  });
  
  // Obtener resumen de estructuras por grado
  const { 
    data: structureSummary = {}, 
    isLoading: isLoadingSummary,
  } = useQuery({
    queryKey: ['evaluationStructureSummary'],
    queryFn: gradeLevelService.getEvaluationStructureSummary,
  });
  
  // Calcular suma de pesos y validez
  const { totalWeight, isValidWeight } = useMemo(() => {
    const sum = gradeComponents.reduce((acc, comp) => acc + (comp.peso || 0), 0);
    return {
      totalWeight: sum,
      isValidWeight: Math.abs(sum - 100) < 0.01, // Tolerancia de 0.01 para errores de redondeo
    };
  }, [gradeComponents]);
  
  // Mutación para actualizar componente
  const updateMutation = useMutation({
    mutationFn: (component) => 
      gradeLevelService.updateGradeEvaluationStructure(
        selectedGrade.id, 
        gradeComponents.map(c => c.id === component.id ? component : c)
      ),
    onSuccess: () => {
      toastSuccess('Componente actualizado correctamente');
      queryClient.invalidateQueries({ 
        queryKey: ['gradeEvaluationStructure', selectedGrade?.id] 
      });
    },
    onError: (err) => {
      toastFromApiError(err);
    }
  });
  
  // Mutación para eliminar componente
  const deleteMutation = useMutation({
    mutationFn: (component) => 
      gradeLevelService.updateGradeEvaluationStructure(
        selectedGrade.id, 
        gradeComponents.filter(c => c.id !== component.id)
      ),
    onSuccess: () => {
      toastSuccess('Componente eliminado correctamente');
      queryClient.invalidateQueries({ 
        queryKey: ['gradeEvaluationStructure', selectedGrade?.id] 
      });
    },
    onError: (err) => {
      toastFromApiError(err);
    }
  });
  
  // Mutación para aplicar estructura institucional
  const applyInstitutionalMutation = useMutation({
    mutationFn: (grade) => 
      gradeLevelService.applyInstitutionalStructure(grade.id),
    onSuccess: () => {
      toastSuccess('Estructura institucional aplicada correctamente');
      queryClient.invalidateQueries({ 
        queryKey: ['gradeEvaluationStructure', selectedGrade?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['evaluationStructureSummary'] 
      });
    },
    onError: (err) => {
      toastFromApiError(err);
    }
  });
  
  // Mutación para copiar estructura
  const copyStructureMutation = useMutation({
    mutationFn: ({ sourceGrade, targetGrade }) => 
      gradeLevelService.copyEvaluationStructure(sourceGrade.id, targetGrade.id),
    onSuccess: () => {
      toastSuccess('Estructura copiada correctamente');
      queryClient.invalidateQueries({ 
        queryKey: ['evaluationStructureSummary'] 
      });
    },
    onError: (err) => {
      toastFromApiError(err);
    }
  });
  
  // Manejadores de eventos
  const handleEditComponent = (component) => {
    setSelectedComponent(component);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteComponent = (component) => {
    setSelectedComponent(component);
    setIsDeleteModalOpen(true);
  };
  
  const handleUpdateComponent = (component) => {
    updateMutation.mutate(component);
  };
  
  const handleConfirmDelete = (component) => {
    deleteMutation.mutate(component);
  };
  
  const handleApplyInstitutional = () => {
    setIsApplyModalOpen(true);
  };
  
  const handleConfirmApply = (grade) => {
    applyInstitutionalMutation.mutate(grade);
  };
  
  const handleCopyStructure = () => {
    setIsCopyModalOpen(true);
  };
  
  const handleConfirmCopy = (sourceGrade, targetGrade) => {
    copyStructureMutation.mutate({ sourceGrade, targetGrade });
  };
  
  // Verificar si el grado usa la estructura institucional
  const usesInstitutionalStructure = useMemo(() => {
    if (!selectedGrade || !structureSummary.grados_con_estructura_institucional) {
      return false;
    }
    return structureSummary.grados_con_estructura_institucional.includes(selectedGrade.id);
  }, [selectedGrade, structureSummary]);
  
  // Renderizar página
  const isLoading = isLoadingGrades || isLoadingInstitutional || isLoadingSummary;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link to="/dashboard/evaluation/structure" className="mr-4">
          <Button variant="icon" className="h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Evaluación por Grado
          </h1>
          <p className="text-text-secondary mt-1">
            Asigne pesos específicos a los componentes de evaluación para cada grado
          </p>
        </div>
      </div>
      
      {/* Selector de grado */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-text-secondary mb-2">
              Seleccione un grado:
            </label>
            <GradeSelector
              grades={grades}
              selectedGrade={selectedGrade}
              onSelectGrade={setSelectedGrade}
              isLoading={isLoadingGrades}
            />
          </div>
          
          {selectedGrade && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={handleCopyStructure}
                disabled={!selectedGrade}
              >
                <Copy size={18} className="mr-1" />
                Copiar a otro grado
              </Button>
              
              <Button
                variant={usesInstitutionalStructure ? 'outline' : 'default'}
                className="flex items-center"
                onClick={handleApplyInstitutional}
                disabled={!selectedGrade || 
                  (usesInstitutionalStructure && institutionalComponents.length === 0)}
              >
                <RefreshCw size={18} className="mr-1" />
                {usesInstitutionalStructure ? 'Actualizar desde institucional' : 'Aplicar estructura institucional'}
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Contenido principal */}
      {!selectedGrade ? (
        <Card className="p-8 text-center">
          <p className="text-text-muted mb-4">
            Seleccione un grado para ver y editar su estructura de evaluación
          </p>
        </Card>
      ) : (
        <>
          {isLoadingGradeComponents ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : isErrorGradeComponents ? (
            <Card className="p-6 bg-error-light border-error">
              <div className="flex items-center text-error mb-4">
                <AlertTriangle className="mr-2" />
                <h2 className="text-xl font-semibold">Error al cargar datos</h2>
              </div>
              <p>{errorGradeComponents?.message || 'No se pudo cargar la estructura de evaluación'}</p>
              <Button 
                className="mt-4" 
                onClick={() => refetchGradeComponents()}
              >
                Reintentar
              </Button>
            </Card>
          ) : (
            <>
              {/* Información de estructura */}
              <Card className="mb-6 p-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <span>Estructura de evaluación: {selectedGrade.nombre}</span>
                      {usesInstitutionalStructure && (
                        <span className="ml-2 px-2 py-1 bg-info-light text-info-dark text-xs rounded-full">
                          Institucional
                        </span>
                      )}
                    </h2>
                    
                    {usesInstitutionalStructure && (
                      <div className="mb-4 p-3 bg-info-light rounded-lg flex items-start">
                        <Info size={20} className="text-info mr-2 mt-0.5" />
                        <p className="text-sm">
                          Este grado utiliza la estructura de evaluación institucional. 
                          Los cambios realizados en la estructura institucional se reflejarán 
                          automáticamente en este grado.
                        </p>
                      </div>
                    )}
                    
                    <WeightSumIndicator sum={totalWeight} isValid={isValidWeight} />
                    
                    {!isValidWeight && (
                      <p className="text-warning text-sm mt-3">
                        {totalWeight < 100 
                          ? `Aún debe asignar ${(100 - totalWeight).toFixed(2)}% para completar 100%` 
                          : 'Debe ajustar los pesos para que sumen exactamente 100%'}
                      </p>
                    )}
                  </div>
                  
                  <div className="md:w-64">
                    <h3 className="font-medium mb-2">Componentes institucionales</h3>
                    {institutionalComponents.length === 0 ? (
                      <p className="text-text-muted text-sm">
                        No hay componentes definidos a nivel institucional
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {institutionalComponents.map((component) => (
                          <div key={component.id} className="p-2 bg-bg-sidebar rounded-lg">
                            <div className="font-medium text-sm">{component.nombre}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-text-muted">Peso institucional</span>
                              <span className="text-primary-600 font-medium text-sm">{component.peso}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Lista de componentes */}
              {gradeComponents.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-text-muted mb-4">
                    No hay componentes de evaluación definidos para este grado
                  </p>
                  <Button onClick={handleApplyInstitutional}>
                    Aplicar estructura institucional
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gradeComponents.map((component) => (
                    <EvaluationComponentItem
                      key={component.id}
                      component={component}
                      onEdit={handleEditComponent}
                      onDelete={handleDeleteComponent}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* Modales */}
      <EvaluationComponentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        component={selectedComponent}
        onSave={handleUpdateComponent}
        maxWeight={isValidWeight ? selectedComponent?.peso : 100}
        isNew={false}
      />
      
      <DeleteEvaluationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        component={selectedComponent}
        onConfirm={handleConfirmDelete}
      />
      
      <ApplyInstitutionalModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        grade={selectedGrade}
        onConfirm={handleConfirmApply}
      />
      
      <CopyStructureModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceGrade={selectedGrade}
        grades={grades}
        onCopy={handleConfirmCopy}
        isLoading={copyStructureMutation.isPending}
      />
    </div>
  );
}