import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import WeightSumIndicator from '../../components/evaluation/WeightSumIndicator';
import EvaluationStructureModal from '../../components/evaluation/EvaluationStructureModal';
import { toastSuccess, toastFromApiError } from '../../components/ui/Toast';
import evaluationService from '../../services/evaluationService';

/**
 * HU-USERS-02 — Definir Estructura de Evaluación Institucional (Director)
 * - Página principal: muestra estructura actual (hasta 5 componentes)
 * - Botón "Crear Estructura" abre modal con formulario para editar toda la estructura a la vez
 * - Validación: suma de pesos debe ser exactamente 100% (validado en el modal)
 * - Soporte para "Usar plantilla predeterminada" dentro del modal
 * - Persistencia vía PUT /evaluation-structure (sintaxis de DocumentacionAPI.md)
 */
export default function EvaluationStructurePage() {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const queryClient = useQueryClient();

  // Carga estructura actual (incluye meta consolidada)
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['evaluationStructure'],
    queryFn: evaluationService.getEvaluationStructure,
  });

  const components = data?.components ?? [];
  const meta = data?.meta ?? {
    año_academico: new Date().getFullYear(),
    suma_pesos: 0,
    total_componentes: 0,
    configuracion_bloqueada: false,
    fecha_bloqueo: null,
  };

  // Mutación para Guardar estructura completa (PUT /evaluation-structure)
  const saveMutation = useMutation({
    mutationFn: (items) => evaluationService.updateFullStructure(items),
    onSuccess: () => {
      toastSuccess('Estructura de evaluación registrada correctamente');
      queryClient.invalidateQueries({ queryKey: ['evaluationStructure'] });
    },
    onError: (err) => {
      toastFromApiError(err);
    },
  });

  // Cálculos de UI
  const totalWeight = useMemo(() => Number(meta?.suma_pesos ?? 0), [meta?.suma_pesos]);
  const isValidWeight = useMemo(() => Math.abs(totalWeight - 100) < 0.01, [totalWeight]);

  // Callback: obtener plantilla predeterminada para el modal
  const handleApplyTemplate = async () => {
    const templates = await evaluationService.getTemplates();
    const tpl = templates.find((t) => t.id === 'template_001') || templates[0];
    if (!tpl) throw new Error('No hay plantillas disponibles');
    // Devuelve lista estilo UI para el modal
    return (tpl.componentes || []).slice(0, 5).map((c, idx) => ({
      id: c.id,
      nombre: c.nombre_item,
      peso: c.peso_porcentual,
      tipo: c.tipo_evaluacion,
      orden: c.orden_visualizacion ?? idx + 1,
      activo: true,
    }));
  };

  // Guardar desde modal
  const handleSaveStructure = async (items) => {
    await saveMutation.mutateAsync(items);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 bg-error-light border-error">
        <h2 className="text-xl font-semibold text-error mb-2">Error al cargar la estructura</h2>
        <p className="text-error">{error?.message || 'No se pudo cargar la estructura de evaluación'}</p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['evaluationStructure'] })}
        >
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Estructura de Evaluación Institucional
          </h1>
          <p className="text-text-secondary mt-1">
            Defina los componentes de evaluación y sus pesos para toda la institución.
          </p>
          <p className="text-xs text-text-muted mt-1">
            Año académico: <span className="font-medium">{meta?.año_academico}</span>
            {meta?.configuracion_bloqueada ? (
              <span className="ml-2 text-error font-medium">(Bloqueada)</span>
            ) : null}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            onClick={() => setIsEditOpen(true)}
            disabled={!!meta?.configuracion_bloqueada}
          >
            Crear Estructura
          </Button>
        </div>
      </div>

      {/* Indicador de suma de pesos */}
      <Card className="mb-6 p-4">
        <WeightSumIndicator sum={totalWeight} isValid={isValidWeight} />
        {meta?.configuracion_bloqueada && (
          <p className="text-warning text-sm mt-3 text-center">
            La configuración está bloqueada para el año académico actual.
          </p>
        )}
      </Card>

      {/* Listado de componentes actuales (solo lectura) */}
      {components.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-muted mb-4">
            No hay componentes de evaluación definidos para el año actual.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => setIsEditOpen(true)} disabled={!!meta?.configuracion_bloqueada}>
              Crear Estructura
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components
            .slice()
            .sort((a, b) => (a?.orden ?? 0) - (b?.orden ?? 0))
            .map((c) => (
              <Card key={c.id ?? `${c.nombre}-${c.orden}`} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-text-primary">{c.nombre}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      c.activo ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                    }`}
                  >
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-text-secondary">
                  <div>
                    <span className="font-medium">Peso:</span> {Number(c.peso ?? 0).toFixed(2)}%
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span>{' '}
                    {String(c.tipo) === 'unica' ? 'Única' : 'Recurrente'}
                  </div>
                  <div>
                    <span className="font-medium">Orden:</span> {c.orden}
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Modal para crear estructura completa */}
      <EvaluationStructureModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialComponents={components}
        onSave={handleSaveStructure}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  );
}