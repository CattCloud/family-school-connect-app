import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import attendanceService from '../../services/attendanceService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { toastFromApiError, toastSuccess } from '../../components/ui/Toast'

// Wizard de 4 pasos para HU-ACAD-02 (Asistencia)
// Paso 1: Seleccin de Contexto + Fecha
// Paso 2: Descarga de Plantilla + Carga de Archivo
// Paso 3: Validacin (pre-insercin)
// Paso 4: Procesamiento (insercin y alertas)

function todayYmd() {
 const d = new Date()
 const mm = String(d.getMonth() + 1).padStart(2, '0')
 const dd = String(d.getDate()).padStart(2, '0')
 return `${d.getFullYear()}-${mm}-${dd}`
}

const NIVELES = ['Inicial', 'Primaria', 'Secundaria']

function gradosPorNivel(nivel) {
 if (nivel === 'Inicial') return ['3', '4', '5']
 if (nivel === 'Primaria') return ['1', '2', '3', '4', '5', '6']
 if (nivel === 'Secundaria') return ['1', '2', '3', '4', '5']
 return []
}

export default function AsistenciaWizard() {
 const [step, setStep] = useState(1)

 const { user } = useAuth()
 const rol = user?.rol

 // Contexto
 const [nivel, setNivel] = useState('')
 const [grado, setGrado] = useState('')
 const [nivelGradoId, setNivelGradoId] = useState('') // derivado de /cursos
 const [cursoId, setCursoId] = useState('') // ancla del grado (derivado, no visible)
 const [fecha, setFecha] = useState(todayYmd())
 const [aoAcademico, setAoAcademico] = useState(new Date().getFullYear())
 const [confirmReemplazo, setConfirmReemplazo] = useState(false)
 const [duplicateInfo, setDuplicateInfo] = useState(null)
 const [showDupModal, setShowDupModal] = useState(false)

 // Archivo
 const [archivo, setArchivo] = useState(null)

 // Validacin (respuesta backend)
 const [validacion, setValidacion] = useState(null)
 // Procesamiento (respuesta backend)
 const [proceso, setProceso] = useState(null)

 // UI
 const [loading, setLoading] = useState(false)
 // ESTADO AADIDO: Carga del contexto de cursos (useEffect)
 const [isContextSyncing, setIsContextSyncing] = useState(false)
 // NUEVO: Limitaciones por rol (docente): niveles y grados permitidos segun asignaciones
 const [allowedGradosByNivel, setAllowedGradosByNivel] = useState({})
 const [allowedNiveles, setAllowedNiveles] = useState([])

 // Opciones de grados segun rol: docente (solo asignados) / director (todos)
 const grados = useMemo(() => {
   if (!nivel) return []
   if (rol === 'docente') {
     return allowedGradosByNivel[nivel] || []
   }
   return gradosPorNivel(nivel)
 }, [nivel, rol, allowedGradosByNivel])

 // Opciones de niveles segun rol
 const nivelOptions = useMemo(() => {
   return rol === 'docente' ? allowedNiveles : NIVELES
 }, [rol, allowedNiveles])

 // Cargar asignaciones del docente para restringir selects de contexto
 useEffect(() => {
   async function loadAllowedByRole() {
     if (rol !== 'docente') {
       // Sin restricciones para director u otros
       setAllowedGradosByNivel({})
       setAllowedNiveles([])
       return
     }
     try {
       setIsContextSyncing(true)
       const data = await attendanceService.getAssignedCourses(aoAcademico)
       const cursos = data?.cursos || []
       // Construir mapa { nivel: [grados...] }
       const tmp = {}
       for (const c of cursos) {
         const n = c?.nivel_grado?.nivel
         const g = String(c?.nivel_grado?.grado)
         if (!n || !g) continue
         if (!tmp[n]) tmp[n] = new Set()
         tmp[n].add(g)
       }
       const niveles = Object.keys(tmp)
       const obj = {}
       niveles.forEach((n) => {
         obj[n] = Array.from(tmp[n]).sort((a, b) => Number(a) - Number(b))
       })
       setAllowedGradosByNivel(obj)
       setAllowedNiveles(niveles)

       // Si la selección actual queda fuera de lo permitido, resetearla
       if (nivel && !obj[nivel]) {
         setNivel('')
         setGrado('')
         setNivelGradoId('')
         setCursoId('')
       } else if (nivel && grado && obj[nivel] && !obj[nivel].includes(String(grado))) {
         setGrado('')
         setNivelGradoId('')
         setCursoId('')
       }
     } catch {
       // Silencioso para no saturar de toasts en el paso 1
     } finally {
       setIsContextSyncing(false)
     }
   }
   loadAllowedByRole()
 }, [rol, aoAcademico]) // eslint-disable-line react-hooks/exhaustive-deps

 // Carga de cursos por rol y derivacin de nivelGradoId/cursoId
 useEffect(() => {
  async function fetchCourses() {
   if (!nivel || !grado) {
    setNivelGradoId('')
    setCursoId('')
    return
   }
   
   // AADIDO: Iniciar la sincronizacin
   setIsContextSyncing(true)

   try {
    if (rol === 'director') {
     const data = await attendanceService.getCoursesByLevelGrade(nivel, grado, aoAcademico)
     const ng = data?.nivel_grado || null
     const cursos = data?.cursos || []
     setNivelGradoId(ng?.id || '')
     // Si existe un nico curso para el grado, lo usamos como ancla
     setCursoId(cursos.length === 1 ? cursos[0].id : '')
    } else if (rol === 'docente') {
     const data = await attendanceService.getAssignedCourses(aoAcademico)
     const all = data?.cursos || []
     const filtered = all.filter(
      (c) => c?.nivel_grado?.nivel === nivel && String(c?.nivel_grado?.grado) === String(grado)
     )
     setNivelGradoId(filtered[0]?.nivel_grado?.id || '')
     setCursoId(filtered.length === 1 ? filtered[0].id : '')
    } else {
     setNivelGradoId('')
     setCursoId('')
    }
   } catch {
    // silencioso en vista; se informar en acciones directas
   } finally {
    // AADIDO: Finalizar la sincronizacin
    setIsContextSyncing(false)
   }
  }
  fetchCourses()
 }, [nivel, grado, aoAcademico, rol])

 const contextoCompletoPaso1 = useMemo(() => {
  if (!nivel || !grado || !fecha) return false
  // Chequeo simple no-futuro en FE
  try {
   const sel = new Date(fecha)
   const hoy = new Date(todayYmd())
   if (sel.getTime() > hoy.getTime()) return false
  } catch {
   return false
  }
  return true
 }, [nivel, grado, fecha])

 const puedeContinuarPaso2 = useMemo(() => Boolean(archivo), [archivo])

 async function onNext() {
  if (step === 1) {
   // MODIFICADO: Bloquear si el contexto est cargando
   if (!contextoCompletoPaso1 || isContextSyncing) return
   
   // AHORA: Si el contexto no est cargando (isContextSyncing es false) 
   // y los IDs siguen vacos, podemos mostrar el toast con certeza.
   if (!nivelGradoId || !cursoId) {
    toastFromApiError(new Error('No hay cursos activos para este grado'))
    return
   }
   try {
    setLoading(true)
    const vr = await attendanceService.verifyAttendance(cursoId, nivelGradoId, fecha, aoAcademico)
    if (vr?.existe_registro) {
     setDuplicateInfo(vr)
     setShowDupModal(true)
     return
    }
    // Si no existe duplicado, avanzamos al Paso 2
    setStep(2)
   } catch (error) {
    // Captura errores de la verificacin de asistencia (API), no el error de sincrona
    console.error("Error al verificar asistencia:", error);
    // Errores como fecha futura se expondrn en validacin; continuamos a Paso 2 para permitir carga/validacin
    setStep(2)
   } finally {
    setLoading(false)
   }
   return
  }
  if (step === 2) {
   if (!puedeContinuarPaso2) return
   setStep(3)
   return
  }
  if (step === 3) {
   // El procesamiento se dispara con su propio botn
   return
  }
 }

 function onBack() {
  if (step > 1) setStep(step - 1)
 }

 function handleFileChange(e) {
  const f = e.target.files?.[0]
  if (!f) {
   setArchivo(null)
   return
  }
  const okExt = /\.(xlsx|xls)$/i.test(f.name)
  if (!okExt) {
   toastFromApiError(new Error('El archivo debe ser Excel (.xlsx o .xls)'))
   setArchivo(null)
   return
  }
  if (f.size > 5 * 1024 * 1024) {
   toastFromApiError(new Error('El tamao del archivo excede 5MB'))
   setArchivo(null)
   return
  }
  setArchivo(f)
 }

 async function handleDescargarPlantilla() {
  try {
   setLoading(true)
   if (!nivelGradoId || !cursoId) {
    toastFromApiError(new Error('Falta derivar curso y nivel/grado desde la API.'))
    return
   }
   const blob = await attendanceService.downloadTemplate({
    curso_id: cursoId,
    nivel_grado_id: nivelGradoId,
    fecha,
    año_academico: aoAcademico
   })
   const url = URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.href = url
   a.download = `Asistencia_${nivel}${grado}_${fecha.replaceAll('-', '')}.xlsx`
   document.body.appendChild(a)
   a.click()
   a.remove()
   URL.revokeObjectURL(url)
   toastSuccess('Plantilla descargada')
  } catch (err) {
   toastFromApiError(err)
  } finally {
   setLoading(false)
  }
 }

 async function handleValidarArchivo() {
  if (!archivo) {
   toastFromApiError(new Error('Seleccione un archivo Excel'))
   return
  }
  try {
   setLoading(true)
   if (!nivelGradoId || !cursoId) {
    toastFromApiError(new Error('Falta derivar curso y nivel/grado desde la API.'))
    return
   }
   const data = await attendanceService.validateFile(
    {
     curso_id: cursoId,
     nivel_grado_id: nivelGradoId,
     fecha,
     año_academico: aoAcademico
    },
    archivo
   )
   setValidacion(data)
   toastSuccess('Validacin completada')
   // Permanecemos en Paso 3 para permitir revisar y confirmar
   setStep(3)
  } catch (err) {
   toastFromApiError(err)
  } finally {
   setLoading(false)
  }
 }

 async function handleDescargarErrores() {
  const url = validacion?.archivo_errores_url
  if (!url) return
  try {
   const blob = await attendanceService.downloadErrorReport(url)
   const href = URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.href = href
   a.download = `Errores_Asistencia_${new Date().toISOString().slice(0, 10)}.txt`
   document.body.appendChild(a)
   a.click()
   document.body.removeChild(a)
   URL.revokeObjectURL(href)
   toastSuccess('Reporte de errores descargado')
  } catch (e) {
   toastFromApiError(e)
  }
 }

 async function handleProcesar() {
  try {
   setLoading(true)
   if (!validacion?.validacion_id) {
    toastFromApiError(new Error('No hay una validacin previa disponible'))
    return
   }
   const data = await attendanceService.loadAttendance({
    validacion_id: validacion.validacion_id,
    procesar_solo_validos: true,
    reemplazar_existente: confirmReemplazo,
    generar_alertas: true
   })
   setProceso(data)
   toastSuccess('Asistencia procesada correctamente')
   setStep(4)
  } catch (err) {
   toastFromApiError(err)
  } finally {
   setLoading(false)
  }
 }

 const resetAll = () => {
  setStep(1)
  setNivel('')
  setGrado('')
  setNivelGradoId('')
  setCursoId('')
  setFecha(todayYmd())
  setAoAcademico(new Date().getFullYear())
  setConfirmReemplazo(false)
  setDuplicateInfo(null)
  setShowDupModal(false)
  setArchivo(null)
  setValidacion(null)
  setProceso(null)
 }

 // Combinamos los estados de carga para el botn de continuar
 const isButtonDisabled = !contextoCompletoPaso1 || loading || isContextSyncing;
 const buttonLabel = isContextSyncing 
  ? 'Cargando contexto...' 
  : loading 
  ? 'Verificando...' 
  : 'Continuar';

 return (
  <div className="container mx-auto space-y-6 px-4">
   <div className="bg-bg-card p-6 rounded-lg shadow-md">
    <h1 className="text-2xl font-semibold text-text-primary mb-2">Carga de Asistencia</h1>
    <p className="text-text-secondary">Siga los 4 pasos para cargar asistencias usando la plantilla exacta.</p>
   </div>

   {/* Stepper de Progreso (estandarizado con Calificaciones) */}
   <div className="flex items-center gap-2">
    {[1, 2, 3, 4].map((i) => (
     <div key={i} className={`h-2 flex-1 rounded ${i <= step ? 'bg-primary-500' : 'bg-gray-300'}`} />
    ))}
   </div>

   {/* Paso 1: Contexto + Fecha */}
   {step === 1 && (
    <Card className="p-6 space-y-5">
     <div>
      <h2 className="text-lg font-semibold text-text-primary">1. Selección de Contexto</h2>
      <p className="text-text-secondary text-sm">Complete el contexto antes de continuar.</p>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
       <label className="block text-sm font-medium mb-1">Nivel</label>
       <select
        className="w-full border rounded px-3 py-2 bg-white"
        value={nivel}
        onChange={(e) => {
         setNivel(e.target.value)
         setGrado('')
         setCursoId('')
         setNivelGradoId('')
        }}
       >
        <option value="">Seleccione nivel</option>
        {nivelOptions.map((n) => (
         <option key={n} value={n}>
          {n}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="block text-sm font-medium mb-1">Grado</label>
       <select
        className="w-full border rounded px-3 py-2 bg-white"
        value={grado}
        onChange={(e) => setGrado(e.target.value)}
        disabled={!nivel}
       >
        <option value="">Seleccione grado</option>
        {grados.map((g) => (
         <option key={g} value={g}>
          {g}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="block text-sm font-medium mb-1">Fecha</label>
       <input
        type="date"
        className="w-full border rounded px-3 py-2 bg-white"
        value={fecha}
        max={todayYmd()}
        onChange={(e) => setFecha(e.target.value)}
       />
      </div>

      <div>
       <label className="block text-sm font-medium mb-1">Ao acadmico</label>
       <input
        type="number"
        className="w-full border rounded px-3 py-2 bg-white"
        value={aoAcademico}
        onChange={(e) => setAoAcademico(Number(e.target.value))}
        min={2000}
        max={2100}
       />
      </div>
     </div>
     {rol === 'docente' && (
      <p className="text-xs text-text-muted">
       Como docente, solo puede seleccionar niveles y grados de sus asignaciones activas.
      </p>
     )}

     <div className="flex items-center gap-3">
      <Button onClick={onNext} disabled={isButtonDisabled}>
       {buttonLabel}
      </Button>
      {loading && step === 1 && (
       <LoadingSpinner size="sm" label="Verificando si existe asistencia..." />
      )}
            {/* AADIDO: Indicador para la carga de contexto */}
            {isContextSyncing && step === 1 && !loading && (
       <LoadingSpinner size="sm" label="Espere un momento..." />
      )}
     </div>
    </Card>
   )}

   {/* Paso 2: Descarga + Carga */}
   {step === 2 && (
    <Card className="p-6 space-y-5">
     <div>
      <h2 className="text-lg font-semibold text-text-primary">2. Descarga de Plantilla y Carga de Archivo</h2>
      <p className="text-text-secondary text-sm">
       Descargue la plantilla y luego cargue el archivo Excel (.xlsx o .xls, mx 5MB).
      </p>
     </div>

     <div className="flex items-center gap-3">
      <Button onClick={handleDescargarPlantilla} disabled={loading}>
       Descargar Plantilla
      </Button>
      <Button variant="ghost" onClick={onBack} disabled={loading}>
       Atras
      </Button>
     </div>

     <div className="border-2 border-dashed border-border-secondary rounded-lg p-6 text-center">
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      <p className="text-xs text-text-muted mt-2">Formatos aceptados: .xlsx, .xls. Lmite: 5MB.</p>
      {loading && <LoadingSpinner size="sm" label="Descargando plantilla..." />}
     </div>

     {archivo && (
      <div className="text-sm">
       <span className="font-medium">Archivo cargado:</span> {archivo.name}
      </div>
     )}

     <div className="flex items-center gap-3">
      <Button onClick={handleValidarArchivo} disabled={!puedeContinuarPaso2 || loading}>
       {loading ? 'Validando...' : 'Validar archivo'}
      </Button>
      {loading && step === 2 && (
       <LoadingSpinner size="sm" label="Validando archivo..." />
      )}
     </div>
    </Card>
   )}

   {/* Paso 3: Validacin */}
   {step === 3 && (
    <Card className="p-6 space-y-5">
     <>
      <div className="flex items-center justify-between">
       <div>
        <h2 className="text-lg font-semibold text-text-primary">3. Reporte de Validacin</h2>
        <p className="text-text-secondary text-sm">Revise el resultado. Procese nicamente los registros vlidos.</p>
       </div>
       <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>
         Atrs
        </Button>
        <Button onClick={handleProcesar} disabled={(validacion?.resumen?.validos ?? 0) === 0 || loading}>
         {loading ? 'Procesando...' : 'Procesar registros vlidos'}
        </Button>
       </div>
      </div>
      {loading && step === 3 && (
       <LoadingSpinner size="sm" label="Procesando datos..." />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <Card className="p-4">
        <div className="text-sm text-text-secondary">Total filas</div>
        <div className="text-2xl font-semibold">{validacion?.resumen?.total_filas ?? 0}</div>
       </Card>
       <Card className="p-4">
        <div className="text-sm text-text-secondary">Vlidos</div>
        <div className="text-2xl font-semibold text-success">{validacion?.resumen?.validos ?? 0}</div>
       </Card>
       <Card className="p-4">
        <div className="text-sm text-text-secondary">Con errores</div>
        <div className="text-2xl font-semibold text-error">{validacion?.resumen?.con_errores ?? 0}</div>
       </Card>
      </div>

      {/* Desglose por estado () */}
      {validacion?.desglose_por_estado && (
       <div className="mt-4">
        <h3 className="font-medium text-text-primary mb-2">Desglose por estado</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
         <Card className="p-4">
          <div className="text-sm">Presentes</div>
          <div className="text-xl font-semibold text-green-600">
           {validacion.desglose_por_estado?.presente ?? 0}
          </div>
         </Card>
         <Card className="p-4">
          <div className="text-sm">Tardanzas</div>
          <div className="text-xl font-semibold text-yellow-600">
           {validacion.desglose_por_estado?.tardanza ?? 0}
          </div>
         </Card>
         <Card className="p-4">
          <div className="text-sm">Permisos</div>
          <div className="text-xl font-semibold text-blue-600">
           {validacion.desglose_por_estado?.permiso ?? 0}
          </div>
         </Card>
         <Card className="p-4">
          <div className="text-sm">Faltas Justificadas</div>
          <div className="text-xl font-semibold text-orange-600">
           {validacion.desglose_por_estado?.falta_justificada ?? 0}
          </div>
         </Card>
         <Card className="p-4">
          <div className="text-sm">Faltas Injustificadas</div>
          <div className="text-xl font-semibold text-red-600">
           {validacion.desglose_por_estado?.falta_injustificada ?? 0}
          </div>
         </Card>
        </div>
       </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <Card className="p-4">
        <h3 className="font-medium text-text-primary mb-2">Opciones</h3>
        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
         <input
          type="checkbox"
          checked={confirmReemplazo}
          onChange={(e) => setConfirmReemplazo(e.target.checked)}
         />
         Reemplazar si ya existe registro para la fecha
        </label>
       </Card>

       {validacion?.archivo_errores_url && (
        <Card className="p-4">
         <h3 className="font-medium text-text-primary mb-2">Reporte de errores</h3>
         <Button variant="outline" onClick={handleDescargarErrores}>
          Descargar reporte de errores (TXT)
         </Button>
        </Card>
       )}
      </div>

      {/* Errores detallados */}
      {(validacion?.registros_con_errores?.length || 0) > 0 && (
       <div className="mt-6">
        <h3 className="font-medium text-text-primary mb-2">Registros con errores</h3>
        <div className="overflow-x-auto">
         <table className="min-w-full border text-sm">
          <thead>
           <tr>
            <th className="border px-2 py-1 bg-border-light text-left">fila</th>
            <th className="border px-2 py-1 bg-border-light text-left">codigo_estudiante</th>
            <th className="border px-2 py-1 bg-border-light text-left">nombre_completo</th>
            <th className="border px-2 py-1 bg-border-light text-left">estado</th>
            <th className="border px-2 py-1 bg-border-light text-left">errores</th>
           </tr>
          </thead>
          <tbody>
           {validacion.registros_con_errores.slice(0, 20).map((r, idx) => (
            <tr key={idx}>
             <td className="border px-2 py-1">{String(r?.fila ?? (idx + 1))}</td>
             <td className="border px-2 py-1">{r?.codigo_estudiante || r?.estudiante_codigo || '-'}</td>
             <td className="border px-2 py-1">{r?.nombre_completo || r?.estudiante_nombre || '-'}</td>
             <td className="border px-2 py-1">{r?.estado || '-'}</td>
             <td className="border px-2 py-1">
              <div className="whitespace-pre-wrap text-xs">
               {(r?.errores || []).map((e, i) => (
                <div key={i}> {e?.campo ? `${e.campo}: ` : ''}{e?.mensaje || JSON.stringify(e)}{e?.valor ? ` (valor: ${e.valor})` : ''}</div>
               ))}
              </div>
             </td>
            </tr>
           ))}
          </tbody>
         </table>
         <div className="text-xs text-text-muted mt-2">Mostrando hasta 20 registros con errores</div>
        </div>
        {validacion?.archivo_errores_url && (
         <div className="mt-3">
          <Button variant="outline" onClick={handleDescargarErrores}>
           Descargar reporte de errores (TXT)
          </Button>
         </div>
        )}
       </div>
      )}

      {/* Registros vlidos (preview) */}
      {(validacion?.registros_validos?.length || 0) > 0 && (
       <div className="mt-6">
        <h3 className="font-medium text-text-primary mb-2">Registros vlidos (preview)</h3>
        <div className="overflow-x-auto">
         <table className="min-w-full border text-sm">
          <thead>
           <tr>
            <th className="border px-2 py-1 bg-border-light text-left">fila</th>
            <th className="border px-2 py-1 bg-border-light text-left">codigo_estudiante</th>
            <th className="border px-2 py-1 bg-border-light text-left">nombre_completo</th>
            <th className="border px-2 py-1 bg-border-light text-left">estado</th>
            <th className="border px-2 py-1 bg-border-light text-left">hora_llegada</th>
            <th className="border px-2 py-1 bg-border-light text-left">justificacion</th>
           </tr>
          </thead>
          <tbody>
           {validacion.registros_validos.slice(0, 20).map((r, idx) => (
            <tr key={idx}>
             <td className="border px-2 py-1">{String(r?.fila ?? (idx + 1))}</td>
             <td className="border px-2 py-1">{r?.codigo_estudiante}</td>
             <td className="border px-2 py-1">{r?.nombre_completo}</td>
             <td className="border px-2 py-1">{r?.estado}</td>
             <td className="border px-2 py-1">{r?.hora_llegada ?? ''}</td>
             <td className="border px-2 py-1">{r?.justificacion ?? ''}</td>
            </tr>
           ))}
          </tbody>
         </table>
         <div className="text-xs text-text-muted mt-2">Mostrando hasta 20 registros vlidos</div>
        </div>
       </div>
      )}
     </>
    </Card>
   )}

   {/* Paso 4: Procesamiento */}
   {step === 4 && (
    <Card className="p-6 space-y-5">
     <div className="flex items-center justify-between">
      <div>
       <h2 className="text-lg font-semibold text-text-primary">4. Procesamiento</h2>
       <p className="text-text-secondary text-sm">Resultado del procesamiento de asistencias vlidas.</p>
      </div>
      <div className="flex items-center gap-3">
       <Button variant="ghost" onClick={() => setStep(3)}>
        Atrs
       </Button>
       <Button variant="outline" onClick={resetAll}>
        Nueva carga
       </Button>
      </div>
     </div>

     {!proceso ? (
      <div className="flex justify-center py-10">
       <LoadingSpinner />
      </div>
     ) : (
      <>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
         <div className="text-sm text-text-secondary">Total procesados</div>
         <div className="text-2xl font-semibold">{proceso?.resumen?.total_procesados ?? 0}</div>
        </Card>
        <Card className="p-4">
         <div className="text-sm text-text-secondary">Insertados exitosamente</div>
         <div className="text-2xl font-semibold text-success">
          {proceso?.resumen?.insertados_exitosamente ?? 0}
         </div>
        </Card>
        <Card className="p-4">
         <div className="text-sm text-text-secondary">Omitidos</div>
         <div className="text-2xl font-semibold text-error">{proceso?.resumen?.omitidos ?? 0}</div>
        </Card>
       </div>

       {/* Contexto bsico y carga */}
       <Card className="mt-6 p-4">
        <h4 className="font-medium mb-2">Contexto</h4>
        <ul className="text-sm text-text-secondary space-y-1">
         <li>Fecha: {proceso?.contexto?.fecha ?? '-'}</li>
         <li>Da: {proceso?.contexto?.da_semana ?? '-'}</li>
         <li>Carga ID: {proceso?.carga_id ?? '-'}</li>
        </ul>
       </Card>
      </>
     )}
    </Card>
   )}

   {showDupModal && (
    <div className="fixed inset-0 z-50 overflow-y-auto">
     {/* Overlay semi-transparente */}
     <div
      // Usando un fondo oscuro estndar (como en el ejemplo anterior)
      className="fixed inset-0 bg-black/50 transition-opacity"
      onClick={() => setShowDupModal(false)}
     ></div>

     {/* Contenido del modal (centrado) */}
     <div className="flex min-h-full items-center justify-center p-4 text-center">
      <div className="relative transform overflow-hidden rounded-xl bg-bg-card px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">

       <div className="sm:flex sm:items-start">
        {/* Icono de Advertencia (Usando color Warning de tu tema) */}
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-warning-light sm:mx-0 sm:h-10 sm:w-10">
         {/* SVG de Advertencia */}
         <svg className="h-6 w-6 text-warning" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
         </svg>
        </div>

        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
         <h3 className="text-xl font-bold leading-6 text-text-primary">
          Registro de Asistencia Existente
         </h3>
         <div className="mt-2">
          <p className="text-sm text-text-secondary mb-3">
           Ya se registro la asistencia para {grado}-{nivel} con fecha {fecha}.
          </p>
          <p className="text-sm font-medium text-warning-dark mb-4">
           Desea continuar para reemplazar el registro existente?
          </p>
         </div>

         {duplicateInfo?.estadisticas && (
          <div className="mt-4 p-3 bg-bg-app rounded-lg border border-border-primary">
           <p className="text-sm font-semibold text-text-secondary mb-2">Detalles del registro a reemplazar:</p>
           {/* Grid para mostrar las estadsticas con colores de asistencia */}
           <div className="grid grid-cols-2 gap-y-1 text-sm">
            <div className="font-medium text-text-secondary">Presente:</div>
            <div className={`font-bold text-[var(--color-attendance-present)] text-right`}>{duplicateInfo.estadisticas.presente ?? 0}</div>

            <div className="font-medium text-text-secondary">Tardanza:</div>
            <div className={`font-bold text-[var(--color-attendance-late)] text-right`}>{duplicateInfo.estadisticas.tardanza ?? 0}</div>

            <div className="font-medium text-text-secondary">Permiso:</div>
            <div className={`font-bold text-[var(--color-attendance-excuse)] text-right`}>{duplicateInfo.estadisticas.permiso ?? 0}</div>

            <div className="font-medium text-text-secondary">Falta Justificada:</div>
            <div className={`font-bold text-[var(--color-attendance-justified)] text-right`}>{duplicateInfo.estadisticas.falta_justificada ?? 0}</div>

            <div className="font-medium text-text-secondary">Falta Injustificada:</div>
            <div className={`font-bold text-[var(--color-attendance-unjustified)] text-right`}>{duplicateInfo.estadisticas.falta_injustificada ?? 0}</div>
           </div>
          </div>
         )}
        </div>
       </div>

       {/* Botones de accin */}
       <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
        <button
         type="button"
         // Botn de accin peligrosa: Usando colores Error para enfatizar el reemplazo
         className="inline-flex w-full justify-center rounded-lg border border-transparent bg-error px-4 py-2 text-base font-semibold text-text-inverse shadow-sm hover:bg-error-dark focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition duration-150"
         onClick={() => {
          setConfirmReemplazo(true);
          setShowDupModal(false);
          setStep(2);
         }}
        >
         Continuar Registro
        </button>
        <button
         type="button"
         // Botn secundario: Usando colores neutros
         className="mt-3 inline-flex w-full justify-center rounded-lg border border-border-primary bg-bg-main px-4 py-2 text-base font-medium text-text-secondary shadow-sm hover:bg-bg-app focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm transition duration-150"
         onClick={() => setShowDupModal(false)}
        >
         Cancelar
        </button>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
