import { useEffect, useMemo, useState } from 'react';
import { Trash2, PlusCircle, LayoutTemplate, AlertTriangle } from 'lucide-react'; 

/**
 * COMPONENTES AUXILIARES INTEGRADOS (Para resolver errores de importacin)
 * Estos deben estar definidos en el mismo archivo para que el componente principal compile.
 */

// 1. Componente Button
const Button = ({ children, onClick, variant = 'primary', size = 'default', disabled = false, className = '' }) => {
  let baseStyle = "font-semibold rounded-lg transition-all duration-150 flex items-center justify-center whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2";
  let variantStyle = "";
  let sizeStyle = "";

  switch (variant) {
    case 'primary':
      variantStyle = "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
      break;
    case 'secondary':
      variantStyle = "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500";
      break;
    case 'danger':
      variantStyle = "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500";
      break;
    case 'outline':
      variantStyle = "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-indigo-500";
      break;
    default:
      variantStyle = "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
  }

  switch (size) {
    case 'icon':
      sizeStyle = "p-2"; // Para botones que solo contienen un icono
      break;
    case 'sm':
      sizeStyle = "px-3 py-1 text-sm";
      break;
    case 'lg':
      sizeStyle = "px-6 py-3 text-lg";
      break;
    case 'default':
    default:
      sizeStyle = "px-4 py-2 text-base";
  }
  
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${disabledStyle} ${className}`}
    >
      {children}
    </button>
  );
};

// 2. Componente Modal
const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-4xl' }) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-bg-overlay bg-opacity-75 transition-opacity z-50"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Truco para centrar el contenido del modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${maxWidth}`}>
          {/* Header del Modal */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900" id="modal-title">
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          {/* Contenido del Modal */}
          <div className="pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Componente WeightSumIndicator
const WeightSumIndicator = ({ sum, isValid }) => {
    const isClose = Math.abs(sum - 100) < 1; // Advertencia si est cerca
    
    let colorClass = 'bg-red-100 border-red-400 text-red-700';
    let message = `Suma total: ${sum.toFixed(2)}%. La suma DEBE ser exactamente 100%.`;

    if (isValid) {
        colorClass = 'bg-green-100 border-green-400 text-green-700';
        message = `Suma total: ${sum.toFixed(2)}%. El peso es correcto (100%)!`;
    } else if (isClose) {
        colorClass = 'bg-yellow-100 border-yellow-400 text-yellow-700';
        message = `Suma total: ${sum.toFixed(2)}%. Ajusta para que sea 100%.`;
    }

    return (
        <div className={`p-3 rounded-lg border flex items-center space-x-2 ${colorClass}`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{message}</span>
        </div>
    );
};


/**
 * COMPONENTE PRINCIPAL: Evaluacin de Estructura
 * - Ancho expandido a max-w-7xl para mejor experiencia en escritorio.
 */
export default function EvaluationStructureModal({
 isOpen,
 onClose,
 initialComponents = [],
 onSave, // (componentsUI) => Promise or void
 onApplyTemplate, // opcional () => Promise<componentsUI> | componentsUI
}) {
 const [items, setItems] = useState([]);
 const [isSaving, setIsSaving] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');
 const [isConfirmOpen, setIsConfirmOpen] = useState(false);

 // Cargar componentes iniciales al abrir
 useEffect(() => {
  if (isOpen) {
   // Normalizar a UI esperada: { id?, nombre, peso, tipo, orden, activo }
   const norm = (initialComponents || []).map((c, idx) => ({
    id: c.id,
    nombre: c.nombre ?? '',
    peso: Number(c.peso ?? 0),
    tipo: c.tipo ?? 'recurrente',
    orden: Number(c.orden ?? idx + 1),
    activo: typeof c.activo === 'boolean' ? c.activo : true,
   }));
   setItems(norm);
   setErrorMsg('');
   setIsSaving(false);
  }
 }, [isOpen, initialComponents]);

 // Suma de pesos y validaciones (Lgica INTACTA)
 const { sum, isSumValid, nameError, weightErrors, orderErrors, uniqueNameError, countError } = useMemo(() => {
  const s = items.reduce((acc, it) => acc + (Number(it.peso) || 0), 0);
  const sumValid = Math.abs(s - 100) < 0.01;

  let nameErr = '';
  let uniqueErr = '';
  let countErr = '';
  const wErrors = {};
  const oErrors = {};

  if (items.length < 1 || items.length > 5) {
   countErr = 'Debe existir entre 1 y 5 componentes';
  }

  // Validaciones por componente
  const names = items.map((it) => (it.nombre || '').trim().toLowerCase());
  const nameSet = new Set();
  names.forEach((n) => {
   if (n.length === 0) nameErr = 'Todos los componentes requieren un nombre';
   if (n.length > 50) nameErr = 'Nombre no debe exceder 50 caracteres';
   if (nameSet.has(n)) uniqueErr = 'Nombres de componentes deben ser nicos';
   nameSet.add(n);
  });

  items.forEach((it, idx) => {
   const peso = Number(it.peso);
   if (isNaN(peso) || peso < 0 || peso > 100) {
    wErrors[idx] = 'Peso invlido (0-100)';
   }
   const orden = Number(it.orden);
   if (isNaN(orden) || orden < 1 || orden > 5) {
    oErrors[idx] = 'Orden invlido (1-5)';
   }
   if (!['unica', 'recurrente'].includes(String(it.tipo))) {
    oErrors[idx] = (oErrors[idx] ? `${oErrors[idx]} - ` : '') + 'Tipo invlido';
   }
  });

  return {
   sum: s,
   isSumValid: sumValid,
   nameError: nameErr,
   uniqueNameError: uniqueErr,
   weightErrors: wErrors,
   orderErrors: oErrors,
   countError: countErr,
  };
 }, [items]);

 const hasAnyError = useMemo(() => {
  return (
   !isSumValid ||
   !!nameError ||
   !!uniqueNameError ||
   !!countError ||
   Object.keys(weightErrors).length > 0 ||
   Object.keys(orderErrors).length > 0
  );
 }, [isSumValid, nameError, uniqueNameError, countError, weightErrors, orderErrors]);

 const handleAdd = () => {
  if (items.length >= 5) return;
  setItems((prev) => [
   ...prev,
   {
    nombre: '',
    peso: 0,
    tipo: 'recurrente',
    orden: prev.length + 1,
    activo: true,
   },
  ]);
 };

 const handleRemove = (index) => {
  // Aseguramos que el orden se reajuste despus de eliminar
  setItems((prev) => prev.filter((_, i) => i !== index).map((it, idx) => ({ ...it, orden: idx + 1 })));
 };

 const handleChange = (index, field, value) => {
  setItems((prev) => {
   const next = [...prev];
   next[index] = { ...next[index], [field]: value };
   return next;
  });
 };

 const handleApplyTemplateClick = async () => {
  if (!onApplyTemplate) return;
  try {
   const r = await onApplyTemplate();
   if (Array.isArray(r)) {
    const norm = r.slice(0, 5).map((c, idx) => ({
     id: c.id,
     nombre: c.nombre ?? c.nombre_item ?? '',
     peso: Number(c.peso ?? c.peso_porcentual ?? 0),
     tipo: c.tipo ?? c.tipo_evaluacion ?? 'recurrente',
     orden: Number(c.orden ?? c.orden_visualizacion ?? idx + 1),
     activo: typeof c.activo === 'boolean' ? c.activo : (typeof c.estado_activo === 'boolean' ? c.estado_activo : true),
    }));
    setItems(norm);
    setErrorMsg('');
   }
  } catch (e) {
   setErrorMsg(e?.message || 'No se pudo aplicar la plantilla');
  }
 };

 const handleSave = async () => {
  setErrorMsg('');
  if (hasAnyError) {
   setErrorMsg('Corrija las validaciones antes de guardar. La suma debe ser exactamente 100% y los campos válidos.');
   return;
  }
  // Abrir confirmación antes de persistir
  setIsConfirmOpen(true);
 };

 // Confirmar y persistir cambios
 const performSave = async () => {
  setErrorMsg('');
  try {
   setIsSaving(true);
   await onSave(items);
   setIsConfirmOpen(false);
   onClose();
  } catch (e) {
   setErrorMsg(e?.message || 'No se pudo guardar la configuración');
  } finally {
   setIsSaving(false);
  }
 };

 return (
  <>
 
  <Modal open={isOpen} onClose={onClose} title="Crear Estructura de Evaluacion" maxWidth="max-w-7xl">
   <div className="p-6 space-y-6"> {/* Mayor padding y espaciado */}
    
    {/* Indicador de Suma y Errores Globales */}
    <div className="space-y-3">
     <WeightSumIndicator sum={sum} isValid={isSumValid} />
     {errorMsg && (
      <p className="text-red-600 text-sm p-2 bg-red-50 rounded-lg border border-red-200">{errorMsg}</p>
     )}
     {(nameError || uniqueNameError || countError) && (
      <div className="text-red-600 text-sm">
       {nameError && <p> {nameError}</p>}
       {uniqueNameError && <p> {uniqueNameError}</p>}
       {countError && <p> {countError}</p>}
      </div>
     )}
    </div>

    {/* Contenedor de Componentes de Evaluacin (Scrollable) */}
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
     
     {/* Encabezados de Columna (Solo en escritorio) */}
     <div className="hidden lg:grid grid-cols-12 text-xs font-semibold text-gray-500 pb-2 border-b">
      <div className="col-span-4">Nombre del tem</div>
      <div className="col-span-2">Peso %</div>
      <div className="col-span-3">Tipo de Evaluacin</div>
      <div className="col-span-1">Orden</div>
      <div className="col-span-1 text-center">Activo</div>
      <div className="col-span-1"></div> {/* Columna para eliminar */}
     </div>

     {/* Mapeo de Items */}
     {items.map((it, idx) => (
      <div 
       key={idx} 
       className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
      >
       
       {/* DISEO RESPONSIVE: 12 columnas en Lg, apilado en mvil */}
       <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 items-start">
        
        {/* 1. Nombre del tem (Ocupa ms espacio en mvil) */}
        <div className="col-span-2 lg:col-span-4">
         <label className="lg:hidden text-xs font-medium text-gray-500 block mb-1">Nombre del tem</label>
         <input
          type="text"
          maxLength={50}
          value={it.nombre}
          onChange={(e) => handleChange(idx, 'nombre', e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Ej: Examen Final"
         />
        </div>

        {/* 2. Peso % */}
        <div className="lg:col-span-2 col-span-1">
         <label className="lg:hidden text-xs font-medium text-gray-500 block mb-1">Peso %</label>
         <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={it.peso}
          onChange={(e) => handleChange(idx, 'peso', Number(e.target.value))}
          className={`w-full border rounded-md px-3 py-2 text-sm ${weightErrors[idx] ? 'border-red-500' : 'border-gray-300'}`}
         />
         {weightErrors[idx] && <p className="text-red-500 text-xs mt-1">{weightErrors[idx]}</p>}
        </div>

        {/* 3. Tipo de evaluacin */}
        <div className="lg:col-span-3 col-span-1">
         <label className="lg:hidden text-xs font-medium text-gray-500 block mb-1">Tipo de Evaluacin</label>
         <select
          value={it.tipo}
          onChange={(e) => handleChange(idx, 'tipo', e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
         >
          <option value="unica">Unica (Un solo registro de nota)</option>
          <option value="recurrente">Recurrente (Mltiples notas, promedio)</option>
         </select>
        </div>

        {/* 4. Orden */}
        <div className="lg:col-span-1 col-span-1">
         <label className="lg:hidden text-xs font-medium text-gray-500 block mb-1">Orden</label>
         <input
          type="number"
          min="1"
          max="5"
          value={it.orden}
          onChange={(e) => handleChange(idx, 'orden', Number(e.target.value))}
          className={`w-full border rounded-md px-3 py-2 text-sm text-center ${orderErrors[idx] ? 'border-red-500' : 'border-gray-300'}`}
         />
         {orderErrors[idx] && <p className="text-red-500 text-xs mt-1">{orderErrors[idx]}</p>}
        </div>

        {/* 5. Activo (Centrado en escritorio) */}
        <div className="lg:col-span-1 col-span-1 flex lg:justify-center items-center h-full">
         <label className="inline-flex items-center space-x-2">
          <input
           type="checkbox"
           checked={!!it.activo}
           onChange={(e) => handleChange(idx, 'activo', e.target.checked)}
           className="form-checkbox text-indigo-600 rounded"
          />
          <span className="text-sm lg:hidden font-medium text-gray-700">Activo</span>
         </label>
        </div>

        {/* 6. Botn de Eliminar (Columna final en desktop, o abajo en mobile) */}
        <div className="lg:col-span-1 col-span-2 flex justify-end">
         <Button
          variant="danger"
          size="icon"
          onClick={() => handleRemove(idx)}
          disabled={items.length <= 1}
          className="w-8 h-8 p-1 text-red-500 hover:bg-red-50 disabled:opacity-50"
         >
          <Trash2 className="w-4 h-4" />
         </Button>
        </div>
       </div>
      </div>
     ))}
    </div>

    {/* Footer: Acciones y Botones */}
    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200">
     
     {/* Grupo de Botones de Agregar/Plantilla */}
     <div className="flex gap-3 mb-4 sm:mb-0">
      <Button 
       variant="secondary" 
       onClick={handleAdd} 
       disabled={items.length >= 5}
      >
       <PlusCircle className="w-5 h-5 mr-2" />
       Agregar componente ({items.length}/5)
      </Button>
      {onApplyTemplate && (
       <Button variant="outline" onClick={handleApplyTemplateClick}>
        <LayoutTemplate className="w-5 h-5 mr-2" />
        Usar plantilla
       </Button>
      )}
     </div>

     {/* Botones de Accin Principal */}
     <div className="flex gap-2">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button 
       variant="primary" 
       onClick={handleSave} 
       disabled={isSaving || hasAnyError}
      >
       {isSaving ? 'Guardando...' : 'Guardar Configuración'}
      </Button>
     </div>
    </div>
   </div>
  </Modal>
  <Modal open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirmar configuración" maxWidth="max-w-md">
    <div className="p-6 space-y-4">
      <div className="text-sm text-text-secondary">
        Esta seguro de crear la estructura de evaluacion, una vez generado no se podra cambiar hasta fin de año
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
        <Button
          variant="primary"
          onClick={performSave}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? 'Guardando...' : 'Confirmar'}
        </Button>
      </div>
    </div>
  </Modal>
  </>
 );
}
