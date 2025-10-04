import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { toastFromApiError, toastSuccess } from '../../components/ui/Toast'
import academicsService from '../../services/academicsService'
import { useAuth } from '../../hooks/useAuth'

// HU-ACAD-01 — Wizard de 4 pasos para carga de calificaciones mediante plantilla Excel exacta
// Endpoints y reglas según doc/Semana 5/DocumentacionAPI_datos1.md

const NIVEL_OPCIONES = ['Inicial', 'Primaria', 'Secundaria']
const TRIMESTRES = [1, 2, 3]

// Nota: Por simplicidad MVP, definimos grados 1..6 para Primaria/Secundaria; Inicial podría ser 3-5 (ajustable).
function gradosPorNivel(nivel) {
  if (nivel === 'Inicial') return ['3', '4', '5']
  return ['1', '2', '3', '4', '5', '6']
}

export default function CalificacionesWizard() {
  const { user } = useAuth() || {}
  const rol = user?.rol || '' // 'docente' | 'director' | ...
  const añoActual = new Date().getFullYear()

  // Paso actual
  const [step, setStep] = useState(1)

  // Contexto (Paso 1)
  const [nivel, setNivel] = useState('')
  const [grado, setGrado] = useState('')
  const [cursoId, setCursoId] = useState('')
  const [nivelGradoId, setNivelGradoId] = useState('')
  const [trimestre, setTrimestre] = useState('')
  const [componenteId, setComponenteId] = useState('')
  const [añoAcademico, setAñoAcademico] = useState(añoActual)

  // Datos auxiliares
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [cursos, setCursos] = useState([])
  const [loadingEstructura, setLoadingEstructura] = useState(false)
  const [componentes, setComponentes] = useState([])
  // NUEVO: restricciones por rol (docente) para nivel/grado
  const [allowedGradosByNivel, setAllowedGradosByNivel] = useState({})
  const [allowedNiveles, setAllowedNiveles] = useState([])
  // Derivado: componente seleccionado (nombre, tipo, peso) para mostrar en Paso 4 sin pedir otra ruta
  const componenteSeleccionado = useMemo(() => {
    if (!componenteId) return null
    return (componentes || []).find(c => c.id === componenteId) || null
  }, [componentes, componenteId])

  // Paso 2: Descarga de plantilla y carga de archivo
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [archivoExcel, setArchivoExcel] = useState(null)
  const [archivoNombre, setArchivoNombre] = useState('')
  const [archivoPeso, setArchivoPeso] = useState(0)

  // Paso 3: Validación
  const [validating, setValidating] = useState(false)
  const [validacion, setValidacion] = useState(null) // data de /calificaciones/validar

  // Paso 4: Procesamiento
  const [processing, setProcessing] = useState(false)
  const [proceso, setProceso] = useState(null) // data de /calificaciones/cargar

  // Helpers derivados
  const cursosFiltrados = useMemo(() => {
    if (rol === 'docente') {
      // Filtrar cursos asignados por nivel y grado seleccionados
      return (cursos || []).filter(c => {
        const ng = c?.nivel_grado
        return (!nivel || ng?.nivel === nivel) && (!grado || ng?.grado === String(grado))
      })
    }
    return cursos
  }, [cursos, grado, nivel, rol])

  // NUEVO: opciones por rol (docente restringido)
  const nivelOptions = useMemo(() => {
    return rol === 'docente' ? allowedNiveles : NIVEL_OPCIONES
  }, [rol, allowedNiveles])

  const gradosOptions = useMemo(() => {
    if (!nivel) return []
    if (rol === 'docente') {
      return allowedGradosByNivel[nivel] || []
    }
    return gradosPorNivel(nivel)
  }, [nivel, rol, allowedGradosByNivel])

  const contextoCompleto = useMemo(() => {
    console.log({ nivel, grado, cursoId, nivelGradoId, trimestre, componenteId })
    return Boolean(nivel && grado && cursoId && nivelGradoId && trimestre && componenteId)
  }, [nivel, grado, cursoId, nivelGradoId, trimestre, componenteId])

  // Cargar estructura de evaluación activa al montar
  useEffect(() => {
    const loadEstructura = async () => {
      try {
        setLoadingEstructura(true)
        const data = await academicsService.getEvaluationStructure(añoAcademico)
        const comps = data?.componentes || []
        setComponentes(comps)
      } catch (e) {
        // STRUCTURE_NOT_CONFIGURED u otros
        toastFromApiError(e)
        setComponentes([])
      } finally {
        setLoadingEstructura(false)
      }
    }
    loadEstructura()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [añoAcademico])

  // Cargar cursos según rol y selección
  useEffect(() => {
    const loadCursos = async () => {
      try {
        setLoadingCursos(true)
        if (rol === 'docente') {
          const data = await academicsService.getAssignedCourses(añoAcademico)
          const lista = data?.cursos || []
          setCursos(lista)
        } else if (rol === 'director') {
          if (!nivel || !grado) {
            setCursos([])
            return
          }
          const data = await academicsService.getCoursesByLevelGrade(nivel, grado, añoAcademico)
          const ng = data?.nivel_grado || null
          const lista = (data?.cursos || []).map(c => ({ ...c, nivel_grado: ng }))
          setCursos(lista)
        } else {
          setCursos([])
        }
      } catch (e) {
        toastFromApiError(e)
        setCursos([])
      } finally {
        setLoadingCursos(false)
      }
    }
    // Docente: siempre carga asignados; Director: cuando hay nivel y grado
    if (rol === 'docente' || (rol === 'director' && nivel && grado)) {
      loadCursos()
    } else {
      setCursos([])
    }
  }, [rol, nivel, grado, añoAcademico])

  // NUEVO: construir restricciones por rol (docente) a partir de cursos asignados
  useEffect(() => {
    if (rol !== 'docente') {
      setAllowedGradosByNivel({})
      setAllowedNiveles([])
      return
    }
    const tmp = {}
    for (const c of (cursos || [])) {
      const n = c?.nivel_grado?.nivel
      const g = String(c?.nivel_grado?.grado)
      if (!n || !g) continue
      if (!tmp[n]) tmp[n] = new Set()
      tmp[n].add(g)
    }
    const niveles = Object.keys(tmp)
    const obj = {}
    niveles.forEach(n => {
      obj[n] = Array.from(tmp[n]).sort((a, b) => Number(a) - Number(b))
    })
    setAllowedGradosByNivel(obj)
    setAllowedNiveles(niveles)

    // Si la selección actual queda fuera de lo permitido, resetearla
    if (nivel && !obj[nivel]) {
      setNivel('')
      setGrado('')
      setCursoId('')
      setNivelGradoId('')
    } else if (nivel && grado && obj[nivel] && !obj[nivel].includes(String(grado))) {
      setGrado('')
      setCursoId('')
      setNivelGradoId('')
    }
  }, [rol, cursos]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar curso seleccionado, derivar nivelGradoId
  useEffect(() => {
    if (!cursoId) {
      setNivelGradoId('')
      return
    }
    const curso = (cursos || []).find(c => c?.id === cursoId)
    // Fallback robusto:
    // - Director: cursos vienen sin nivel_grado por item; ya se inyectó desde data.nivel_grado (fix arriba).
    // - Si algún backend entrega nivel_grado_id plano, también lo consideramos.
    const ngid = curso?.nivel_grado?.id || curso?.nivel_grado_id || ''
    setNivelGradoId(ngid)
  }, [cursoId, cursos])

  // Handlers de Paso 2: archivo
  const onFileChange = (file) => {
    if (!file) return
    const name = file.name || ''
    const size = file.size || 0
    const ext = name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      toastFromApiError(new Error('El archivo debe ser formato Excel (.xlsx o .xls)'))
      return
    }
    if (size > 10 * 1024 * 1024) {
      toastFromApiError(new Error('El tamaño del archivo excede el límite de 10MB'))
      return
    }
    setArchivoExcel(file)
    setArchivoNombre(name)
    setArchivoPeso(size)
  }

  // Paso 1: continuar
  const handleContinuarPaso1 = () => {
    if (!contextoCompleto) return
    setStep(2)
  }

  // Paso 2: descargar plantilla
  const handleDescargarPlantilla = async () => {
    if (!contextoCompleto) return
    try {
      setDownloadingTemplate(true)
      const blob = await academicsService.downloadGradesTemplate({
        curso_id: cursoId,
        nivel_grado_id: nivelGradoId,
        trimestre: Number(trimestre),
        componente_id: componenteId,
        año_academico: Number(añoAcademico)
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // El backend devuelve Content-Disposition con nombre; aquí ponemos uno por defecto
      const nombreArchivo = `Calificaciones_${nivel}_${grado}_T${trimestre}_${new Date().toISOString().slice(0,10)}.xlsx`
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toastSuccess('Plantilla de calificaciones descargada')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setDownloadingTemplate(false)
    }
  }

  // Paso 3: validar archivo
  const handleValidarArchivo = async () => {
    if (!archivoExcel || !contextoCompleto) return
    try {
      setValidating(true)
      const data = await academicsService.validateGradesFile(
        {
          curso_id: cursoId,
          nivel_grado_id: nivelGradoId,
          trimestre: Number(trimestre),
          componente_id: componenteId,
          año_academico: Number(añoAcademico)
        },
        archivoExcel
      )
      setValidacion(data)
      toastSuccess('Validación completada')
      setStep(3)
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setValidating(false)
    }
  }

  // Paso 3: procesar registros válidos
  const handleProcesarValidos = async () => {
    if (!validacion?.validacion_id) return
    const totalValidos = validacion?.resumen?.validos || 0
    if (totalValidos <= 0) {
      toastFromApiError(new Error('No hay registros válidos para procesar'))
      return
    }
    try {
      setProcessing(true)
      const data = await academicsService.loadGrades({
        validacion_id: validacion.validacion_id,
        procesar_solo_validos: true,
        generar_alertas: true
      })
      setProceso(data)
      toastSuccess(`✅ ${data?.resumen?.insertados_exitosamente ?? 0} calificaciones registradas correctamente`)
      setStep(4)
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setProcessing(false)
    }
  }

  const handleDescargarErrores = async () => {
    const url = validacion?.archivo_errores_url
    if (!url) return
    try {
      const blob = await academicsService.downloadGradesErrorReport(url)
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `Errores_Calificaciones_${new Date().toISOString().slice(0,10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(href)
    } catch (e) {
      toastFromApiError(e)
    }
  }

  const resetAll = () => {
    setStep(1)
    setNivel('')
    setGrado('')
    setCursoId('')
    setNivelGradoId('')
    setTrimestre('')
    setComponenteId('')
    setAñoAcademico(añoActual)
    setCursos([])
    setComponentes([])
    setArchivoExcel(null)
    setArchivoNombre('')
    setArchivoPeso(0)
    setValidacion(null)
    setProceso(null)
  }

  return (
    <div className="container mx-auto space-y-6 px-4">
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Carga de Calificaciones
        </h1>
        <p className="text-text-secondary">
          Siga los 4 pasos para cargar calificaciones usando la plantilla exacta.
        </p>
      </div>

      {/* Stepper de Progreso (estandarizado con Asistencia) */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i <= step ? 'bg-primary-500' : 'bg-gray-300'}`}
          />
        ))}
      </div>

      {/* Paso 1: Selección de Contexto */}
      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">1. Selección de Contexto</h2>
            <p className="text-text-secondary text-sm">
              Complete el contexto antes de continuar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium mb-1">Nivel</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={nivel}
                onChange={(e) => { setNivel(e.target.value); setGrado(''); setCursoId('') }}
              >
                <option value="">Seleccione nivel</option>
                {nivelOptions.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Grado */}
            <div>
              <label className="block text-sm font-medium mb-1">Grado</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={grado}
                onChange={(e) => { setGrado(e.target.value); setCursoId('') }}
                disabled={!nivel}
              >
                <option value="">Seleccione grado</option>
                {gradosOptions.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Trimestre */}
            <div>
              <label className="block text-sm font-medium mb-1">Trimestre</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={trimestre}
                onChange={(e) => setTrimestre(e.target.value)}
              >
                <option value="">Seleccione trimestre</option>
                {TRIMESTRES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Curso */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Curso</label>
              <div className="flex items-center gap-3">
                <select
                  className="w-full border rounded px-3 py-2"
                  value={cursoId}
                  onChange={(e) => setCursoId(e.target.value)}
                  disabled={!nivel || !grado || loadingCursos}
                >
                  <option value="">{loadingCursos ? 'Cargando cursos...' : 'Seleccione curso'}</option>
                  {(cursosFiltrados || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c?.nivel_grado ? `— ${c.nivel_grado.nivel} ${c.nivel_grado.grado}` : ''}
                    </option>
                  ))}
                </select>
                {loadingCursos && <LoadingSpinner />}
              </div>
            </div>

            {/* Componente */}
            <div>
              <label className="block text-sm font-medium mb-1">Componente de Evaluación</label>
              <div className="flex items-center gap-3">
                <select
                  className="w-full border rounded px-3 py-2"
                  value={componenteId}
                  onChange={(e) => setComponenteId(e.target.value)}
                  disabled={loadingEstructura}
                >
                  <option value="">{loadingEstructura ? 'Cargando componentes...' : 'Seleccione componente'}</option>
                  {(componentes || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_item} ({c.tipo_evaluacion})
                    </option>
                  ))}
                </select>
                {loadingEstructura && <LoadingSpinner />}
              </div>
            </div>

            {/* Año académico (opcional visible) */}
            <div>
              <label className="block text-sm font-medium mb-1">Año académico</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={añoAcademico}
                onChange={(e) => setAñoAcademico(Number(e.target.value || añoActual))}
                min={2000}
                max={2100}
              />
            </div>
          </div>
          {rol === 'docente' && (
            <p className="text-xs text-text-muted">
              Como docente, solo puede seleccionar niveles, grados y cursos de sus asignaciones activas.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleContinuarPaso1} disabled={!contextoCompleto}>
              Continuar
            </Button>
          </div>
        </Card>
      )}

      {/* Paso 2: Descarga y Carga */}
      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">2. Descarga de Plantilla y Carga de Archivo</h2>
            <p className="text-text-secondary text-sm">
              Descargue la plantilla para el componente seleccionado y luego cargue el archivo Excel (.xlsx o .xls, máx 10MB).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleDescargarPlantilla} isLoading={downloadingTemplate} disabled={!contextoCompleto}>
              Descargar Plantilla
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
          </div>

          <div className="border-2 border-dashed border-border-secondary rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
            <p className="text-xs text-text-muted mt-2">Formatos aceptados: .xlsx, .xls. Límite: 10MB.</p>
          </div>

          {archivoNombre && (
            <div className="text-sm">
              <span className="font-medium">Archivo cargado:</span> {archivoNombre} {' '}
              <span className="text-text-muted">({(archivoPeso / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleValidarArchivo} isLoading={validating} disabled={!archivoExcel || !contextoCompleto}>
              Validar archivo
            </Button>
          </div>
        </Card>
      )}

      {/* Paso 3: Validación */}
      {step === 3 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">3. Reporte de Validación</h2>
              <p className="text-text-secondary text-sm">
                Revise el resultado. Procese únicamente los registros válidos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
              <Button onClick={handleProcesarValidos} isLoading={processing} disabled={(validacion?.resumen?.validos ?? 0) === 0}>
                Procesar registros válidos
              </Button>
            </div>
          </div>

          {!validacion ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Total filas</div>
                  <div className="text-2xl font-semibold">{validacion?.resumen?.total_filas ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Válidos</div>
                  <div className="text-2xl font-semibold text-success">{validacion?.resumen?.validos ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Con errores</div>
                  <div className="text-2xl font-semibold text-error">{validacion?.resumen?.con_errores ?? 0}</div>
                </Card>
              </div>

              {/* Advertencias */}
              {(validacion?.advertencias?.length || 0) > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Advertencias</h3>
                  <ul className="list-disc pl-6 text-sm">
                    {validacion.advertencias.slice(0, 10).map((a, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{a?.tipo || 'ADVERTENCIA'}:</span> {' '}
                        {a?.mensaje || JSON.stringify(a)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errores */}
              {(validacion?.registros_con_errores?.length || 0) > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Registros con errores</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 bg-border-light text-left">fila</th>
                          <th className="border px-2 py-1 bg-border-light text-left">codigo_estudiante</th>
                          <th className="border px-2 py-1 bg-border-light text-left">nombre_completo</th>
                          <th className="border px-2 py-1 bg-border-light text-left">errores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validacion.registros_con_errores.slice(0, 20).map((r, idx) => (
                          <tr key={idx}>
                            <td className="border px-2 py-1">{String(r?.fila ?? (idx + 1))}</td>
                            <td className="border px-2 py-1">{r?.codigo_estudiante}</td>
                            <td className="border px-2 py-1">{r?.nombre_completo}</td>
                            <td className="border px-2 py-1">
                              <div className="whitespace-pre-wrap text-xs">
                                {(r?.errores || []).map((e, i) => (
                                  <div key={i}>• {e?.campo ? `${e.campo}: ` : ''}{e?.mensaje || JSON.stringify(e)}{e?.valor ? ` (valor: ${e.valor})` : ''}</div>
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

              {/* Válidos (preview) */}
              {(validacion?.registros_validos?.length || 0) > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Registros válidos (preview)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 bg-border-light text-left">fila</th>
                          <th className="border px-2 py-1 bg-border-light text-left">codigo_estudiante</th>
                          <th className="border px-2 py-1 bg-border-light text-left">nombre_completo</th>
                          <th className="border px-2 py-1 bg-border-light text-left">calificacion</th>
                          <th className="border px-2 py-1 bg-border-light text-left">observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validacion.registros_validos.slice(0, 20).map((r, idx) => (
                          <tr key={idx}>
                            <td className="border px-2 py-1">{String(r?.fila ?? (idx + 1))}</td>
                            <td className="border px-2 py-1">{r?.codigo_estudiante}</td>
                            <td className="border px-2 py-1">{r?.nombre_completo}</td>
                            <td className="border px-2 py-1">{r?.calificacion}</td>
                            <td className="border px-2 py-1">{r?.observaciones || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-xs text-text-muted mt-2">Mostrando hasta 20 registros válidos</div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Paso 4: Procesamiento */}
      {step === 4 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">4. Procesamiento</h2>
              <p className="text-text-secondary text-sm">
                Resultado del procesamiento de calificaciones válidas.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setStep(3)}>Atrás</Button>
              <Button variant="outline" onClick={resetAll}>Nueva carga</Button>
            </div>
          </div>

          {!proceso ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Total procesados</div>
                  <div className="text-2xl font-semibold">{proceso?.resumen?.total_procesados ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Insertados exitosamente</div>
                  <div className="text-2xl font-semibold text-success">{proceso?.resumen?.insertados_exitosamente ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Omitidos</div>
                  <div className="text-2xl font-semibold text-error">{proceso?.resumen?.omitidos ?? 0}</div>
                </Card>
              </div>

              {/* Alertas generadas */}
              {proceso?.alertas_generadas && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold">Alertas generadas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card className="p-4">
                      <div className="text-xs text-text-secondary">Total alertas</div>
                      <div className="text-xl font-semibold">{proceso.alertas_generadas?.total ?? 0}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs text-text-secondary">Bajo rendimiento</div>
                      <div className="text-xl font-semibold text-error">{proceso.alertas_generadas?.bajo_rendimiento ?? 0}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs text-text-secondary">Estudiantes afectados</div>
                      <div className="text-xl font-semibold">{(proceso.alertas_generadas?.estudiantes_afectados || []).length}</div>
                    </Card>
                  </div>
                  {(proceso.alertas_generadas?.estudiantes_afectados?.length || 0) > 0 && (
                    <div className="mt-2">
                      <h4 className="font-medium text-sm mb-2">Detalle de afectados (top 10)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-xs">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1 bg-border-light text-left">Código</th>
                              <th className="border px-2 py-1 bg-border-light text-left">Nombre</th>
                              <th className="border px-2 py-1 bg-border-light text-left">Calificación</th>
                              <th className="border px-2 py-1 bg-border-light text-left">Apoderado</th>
                              <th className="border px-2 py-1 bg-border-light text-left">WhatsApp</th>
                              <th className="border px-2 py-1 bg-border-light text-left">Notif.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proceso.alertas_generadas.estudiantes_afectados.slice(0, 10).map((e, i) => (
                              <tr key={i}>
                                <td className="border px-2 py-1">{e.codigo_estudiante}</td>
                                <td className="border px-2 py-1">{e.nombre}</td>
                                <td className="border px-2 py-1">{e.calificacion}</td>
                                <td className="border px-2 py-1">{e.apoderado?.nombre || '-'}</td>
                                <td className="border px-2 py-1">{e.apoderado?.telefono || '-'}</td>
                                <td className="border px-2 py-1">{e.notificacion_enviada ? 'Enviada' : 'Pendiente'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-[11px] text-text-muted mt-1">Mostrando hasta 10 afectados</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contexto */}
              {proceso?.contexto && (
                <Card className="mt-6 p-4">
                  <h4 className="font-medium mb-3">Notas registradas en:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-text-secondary text-xs">Curso</div>
                      <div className="font-medium">{proceso.contexto?.curso || '-'}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs">Trimestre</div>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-border-light">
                          T{proceso.contexto?.trimestre ?? trimestre}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs">Componente</div>
                      <div className="font-medium">
                        {componenteSeleccionado?.nombre_item || proceso.contexto?.componente || componenteId}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs">Fecha de evaluación</div>
                      <div>{proceso.contexto?.fecha_evaluacion || '-'}</div>
                    </div>
                    {!!componenteSeleccionado && (
                      <>
                        <div>
                          <div className="text-text-secondary text-xs">Tipo de evaluación</div>
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded bg-bg-card border">
                              {componenteSeleccionado.tipo_evaluacion}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-text-secondary text-xs">Peso porcentual</div>
                          <div className="font-medium">{Number(componenteSeleccionado.peso_porcentual).toFixed(2)}%</div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}