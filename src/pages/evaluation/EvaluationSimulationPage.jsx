import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toastSuccess, toastError, toastFromApiError } from '../../components/ui/Toast';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import WeightSumIndicator from '../../components/evaluation/WeightSumIndicator';
import evaluationService from '../../services/evaluationService';

/**
 * Página para simular el impacto de cambios en la estructura de evaluación
 */
export default function EvaluationSimulationPage() {
  // Estado para componentes de evaluación
  const [components, setComponents] = useState([]);
  // Estado para resultados de simulación
  const [simulationResults, setSimulationResults] = useState(null);
  // Estado para indicar si se está editando
  const [isEditing, setIsEditing] = useState(true);
  
  // Calcular suma de pesos y validez
  const totalWeight = components.reduce((acc, comp) => acc + (parseFloat(comp.peso) || 0), 0);
  const isValidWeight = Math.abs(totalWeight - 100) < 0.01; // Tolerancia de 0.01 para errores de redondeo
  
  // Mutación para simular impacto
  const simulationMutation = useMutation({
    mutationFn: (components) => evaluationService.simulateEvaluationImpact(components),
    onSuccess: (data) => {
      setSimulationResults(data);
      setIsEditing(false);
      toastSuccess('Simulación completada');
    },
    onError: (err) => {
      toastFromApiError(err);
    }
  });
  
  // Manejador para agregar componente
  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        id: `temp-${Date.now()}`,
        nombre: '',
        peso: 0,
      }
    ]);
  };
  
  // Manejador para eliminar componente
  const handleRemoveComponent = (index) => {
    const newComponents = [...components];
    newComponents.splice(index, 1);
    setComponents(newComponents);
  };
  
  // Manejador para actualizar componente
  const handleUpdateComponent = (index, field, value) => {
    const newComponents = [...components];
    
    if (field === 'peso') {
      // Convertir a número y validar
      value = parseFloat(value) || 0;
    }
    
    newComponents[index] = {
      ...newComponents[index],
      [field]: value
    };
    
    setComponents(newComponents);
  };
  
  // Manejador para ejecutar simulación
  const handleRunSimulation = () => {
    if (!isValidWeight) {
      toastError('Los pesos deben sumar exactamente 100%');
      return;
    }
    
    // Validar que todos los componentes tengan nombre
    const hasEmptyNames = components.some(comp => !comp.nombre.trim());
    if (hasEmptyNames) {
      toastError('Todos los componentes deben tener un nombre');
      return;
    }
    
    simulationMutation.mutate(components);
  };
  
  // Manejador para volver a editar
  const handleEditAgain = () => {
    setIsEditing(true);
    setSimulationResults(null);
  };
  
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
            Simulación de Impacto
          </h1>
          <p className="text-text-secondary mt-1">
            Evalúa cómo afectarían los cambios en la estructura a las calificaciones
          </p>
        </div>
      </div>
      
      {isEditing ? (
        <>
          {/* Editor de componentes */}
          <Card className="mb-6 p-4">
            <h2 className="text-lg font-semibold mb-4">
              Estructura de evaluación a simular
            </h2>
            
            <WeightSumIndicator sum={totalWeight} isValid={isValidWeight} />
            
            <div className="mt-6 space-y-4">
              {components.map((component, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-border-primary rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="Nombre del componente"
                      value={component.nombre}
                      onChange={(e) => handleUpdateComponent(index, 'nombre', e.target.value)}
                    />
                  </div>
                  
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Peso %"
                      value={component.peso}
                      onChange={(e) => handleUpdateComponent(index, 'peso', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  
                  <Button
                    variant="icon"
                    onClick={() => handleRemoveComponent(index)}
                    className="text-error hover:bg-error-light"
                  >
                    <AlertTriangle size={18} />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddComponent}
              >
                Agregar componente
              </Button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                className="flex items-center"
                onClick={handleRunSimulation}
                disabled={!isValidWeight || components.length === 0 || simulationMutation.isPending}
              >
                {simulationMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <BarChart3 size={18} className="mr-2" />
                )}
                Ejecutar simulación
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Resultados de simulación */}
          <Card className="mb-6 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Resultados de la simulación
              </h2>
              
              <Button
                variant="outline"
                className="flex items-center"
                onClick={handleEditAgain}
              >
                <RefreshCw size={18} className="mr-2" />
                Simular otra estructura
              </Button>
            </div>
            
            {simulationResults && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-success-light border-success">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Check size={18} className="mr-2 text-success" />
                      Impacto positivo
                    </h3>
                    <p className="text-sm mb-2">
                      {simulationResults.impacto_positivo || 0} estudiantes mejorarían su calificación
                    </p>
                    <div className="h-2 bg-bg-disabled rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success"
                        style={{ width: `${(simulationResults.impacto_positivo / simulationResults.total_estudiantes) * 100}%` }}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-error-light border-error">
                    <h3 className="font-medium mb-2 flex items-center">
                      <AlertTriangle size={18} className="mr-2 text-error" />
                      Impacto negativo
                    </h3>
                    <p className="text-sm mb-2">
                      {simulationResults.impacto_negativo || 0} estudiantes bajarían su calificación
                    </p>
                    <div className="h-2 bg-bg-disabled rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-error"
                        style={{ width: `${(simulationResults.impacto_negativo / simulationResults.total_estudiantes) * 100}%` }}
                      />
                    </div>
                  </Card>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Estructura simulada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {components.map((component, index) => (
                      <Card key={index} className="p-3">
                        <h4 className="font-medium">{component.nombre}</h4>
                        <div className="text-primary-600 font-bold">{component.peso}%</div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {simulationResults.detalles_por_grado && (
                  <div>
                    <h3 className="font-medium mb-3">Impacto por grado</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-bg-sidebar">
                            <th className="p-2 text-left">Grado</th>
                            <th className="p-2 text-right">Mejoran</th>
                            <th className="p-2 text-right">Empeoran</th>
                            <th className="p-2 text-right">Sin cambio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(simulationResults.detalles_por_grado).map(([grado, datos]) => (
                            <tr key={grado} className="border-b border-border-primary">
                              <td className="p-2">{grado}</td>
                              <td className="p-2 text-right text-success">{datos.mejoran || 0}</td>
                              <td className="p-2 text-right text-error">{datos.empeoran || 0}</td>
                              <td className="p-2 text-right">{datos.sin_cambio || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}