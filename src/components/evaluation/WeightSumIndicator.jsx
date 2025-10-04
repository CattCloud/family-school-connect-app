/**
 * Componente para mostrar la suma de los pesos de los componentes de evaluación
 * @param {Object} props - Propiedades del componente
 * @param {number} props.sum - Suma de los pesos
 * @param {boolean} props.isValid - Indica si la suma es válida (100%)
 */
export default function WeightSumIndicator({ sum, isValid }) {
  // Formatear suma con 2 decimales
  const formattedSum = parseFloat(sum).toFixed(2);
  
  // Determinar color según validez
  const getColorClass = () => {
    if (isValid) return 'text-success bg-success-light border-success';
    if (sum > 100) return 'text-error bg-error-light border-error';
    return 'text-warning bg-warning-light border-warning';
  };
  
  // Determinar mensaje según validez
  const getMessage = () => {
    if (isValid) return 'Suma correcta: 100%';
    if (sum > 100) return `Excede el 100% por ${(sum - 100).toFixed(2)}%`;
    return `Falta ${(100 - sum).toFixed(2)}% para completar 100%`;
  };
  
  return (
    <div className={`p-4 rounded-lg border ${getColorClass()} text-center`}>
      <div className="text-3xl font-bold mb-1">
        {formattedSum}%
      </div>
      <div className="text-sm">
        {getMessage()}
      </div>
      
      {/* Barra de progreso */}
      <div className="mt-2 h-2 bg-bg-disabled rounded-full overflow-hidden">
        <div 
          className={`h-full ${isValid ? 'bg-success' : sum > 100 ? 'bg-error' : 'bg-warning'}`}
          style={{ width: `${Math.min(sum, 100)}%` }}
        />
      </div>
    </div>
  );
}