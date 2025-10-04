import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

/**
 * Componente para editar un componente de evaluación
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.component - Componente de evaluación a editar
 * @param {Function} props.onSave - Función a ejecutar al guardar cambios
 * @param {Function} props.onCancel - Función a ejecutar al cancelar
 * @param {number} props.maxWeight - Peso máximo disponible (para validación)
 */
export default function EvaluationComponentEditor({ 
  component, 
  onSave, 
  onCancel,
  maxWeight = 100 
}) {
  // Estado local para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    peso: 0,
  });
  
  // Estado de errores de validación
  const [errors, setErrors] = useState({});
  
  // Cargar datos iniciales cuando cambia el componente
  useEffect(() => {
    if (component) {
      setFormData({
        nombre: component.nombre || '',
        descripcion: component.descripcion || '',
        peso: component.peso || 0,
      });
    }
  }, [component]);
  
  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para el campo de peso, convertir a número y validar
    if (name === 'peso') {
      const numValue = parseFloat(value) || 0;
      setFormData({
        ...formData,
        [name]: numValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (formData.peso <= 0) {
      newErrors.peso = 'El peso debe ser mayor a 0';
    }
    
    if (formData.peso > maxWeight) {
      newErrors.peso = `El peso no puede exceder ${maxWeight}%`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...component,
        ...formData,
        peso: parseFloat(formData.peso),
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del componente"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        error={errors.nombre}
        placeholder="Ej: Exámenes, Trabajos, Participación"
        required
      />
      
      <div className="mb-4">
        <label className="block text-text-secondary mb-1">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
          placeholder="Descripción detallada del componente de evaluación"
          rows={3}
        />
      </div>
      
      <Input
        label="Peso (%)"
        name="peso"
        type="number"
        value={formData.peso}
        onChange={handleChange}
        error={errors.peso}
        min="0"
        max="100"
        step="0.1"
        required
      />
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit">
          Guardar
        </Button>
      </div>
    </form>
  );
}