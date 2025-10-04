import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, User, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import evaluationService from '../../services/evaluationService';

/**
 * Página para visualizar el historial de cambios en la estructura de evaluación
 */
export default function EvaluationHistoryPage() {
  // Estado para filtros
  const [filter, setFilter] = useState('all');
  
  // Obtener historial de cambios
  const { 
    data: historyItems = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['evaluationHistory'],
    queryFn: evaluationService.getStructureHistory,
  });
  
  // Filtrar historial según selección
  const filteredHistory = historyItems.filter(item => {
    if (filter === 'all') return true;
    return item.tipo_cambio === filter;
  });
  
  // Función para formatear fecha
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };
  
  // Función para obtener ícono según tipo de cambio
  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'creacion':
        return <FileText size={18} className="text-success" />;
      case 'actualizacion':
        return <Clock size={18} className="text-warning" />;
      case 'eliminacion':
        return <AlertTriangle size={18} className="text-error" />;
      default:
        return <Clock size={18} />;
    }
  };
  
  // Función para obtener texto según tipo de cambio
  const getChangeText = (changeType) => {
    switch (changeType) {
      case 'creacion':
        return 'Creación';
      case 'actualizacion':
        return 'Actualización';
      case 'eliminacion':
        return 'Eliminación';
      default:
        return 'Cambio';
    }
  };
  
  // Renderizar página
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
        <div className="flex items-center text-error mb-4">
          <AlertTriangle className="mr-2" />
          <h2 className="text-xl font-semibold">Error al cargar datos</h2>
        </div>
        <p>{error?.message || 'No se pudo cargar el historial de cambios'}</p>
        <Link to="/dashboard/evaluation/structure">
          <Button className="mt-4">
            Volver a Estructura de Evaluación
          </Button>
        </Link>
      </Card>
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
            Historial de Cambios
          </h1>
          <p className="text-text-secondary mt-1">
            Registro de modificaciones a la estructura de evaluación
          </p>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilter('all')}
          className="text-sm"
        >
          Todos
        </Button>
        <Button 
          variant={filter === 'creacion' ? 'default' : 'outline'} 
          onClick={() => setFilter('creacion')}
          className="text-sm"
        >
          Creaciones
        </Button>
        <Button 
          variant={filter === 'actualizacion' ? 'default' : 'outline'} 
          onClick={() => setFilter('actualizacion')}
          className="text-sm"
        >
          Actualizaciones
        </Button>
        <Button 
          variant={filter === 'eliminacion' ? 'default' : 'outline'} 
          onClick={() => setFilter('eliminacion')}
          className="text-sm"
        >
          Eliminaciones
        </Button>
      </div>
      
      {/* Lista de historial */}
      {filteredHistory.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-muted mb-4">
            No hay registros de cambios {filter !== 'all' ? 'de este tipo' : ''}
          </p>
          <Link to="/dashboard/evaluation/structure">
            <Button>
              Volver a Estructura de Evaluación
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  {getChangeIcon(item.tipo_cambio)}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h3 className="font-semibold text-text-primary">
                      {getChangeText(item.tipo_cambio)}: {item.componente?.nombre || 'Componente'}
                    </h3>
                    
                    <span className="text-text-muted text-sm">
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-text-secondary mb-2">
                    {item.descripcion || 'Sin descripción'}
                  </div>
                  
                  {item.detalles && (
                    <div className="bg-bg-sidebar p-3 rounded-md text-sm mt-2">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(item.detalles, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex items-center mt-3 text-text-muted text-xs">
                    <User size={14} className="mr-1" />
                    <span>
                      {item.usuario?.nombre || 'Usuario'} ({item.usuario?.rol || 'Director'})
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}