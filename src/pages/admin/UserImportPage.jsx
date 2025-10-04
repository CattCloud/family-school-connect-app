import { useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { toastFromApiError, toastSuccess } from '../../components/ui/Toast'
import adminImportService from '../../services/adminImportService'
import { BASE_URL } from '../../services/api'

/**
 * Página: Importación Masiva de Usuarios (Administrador)
 * HU-USERS-04 — Implementa el flujo del wizard:
 *  1) Seleccionar tipo y descargar plantilla
 *  2) Subir CSV y validar (POST /admin/import/validate)
 *  3) Resumen y procesamiento (POST /admin/import/execute)
 *  4) Resultados, y opcional: generar vista previa de credenciales
 *
 * Nota MVP:
 * - Soporte para CSV simple (sin comillas escapadas complejas). XLSX pendiente (backlog).
 * - Descarga de plantilla construye un CSV con headers retornados por GET /admin/templates/{tipo}.
 */

const VALID_TYPES = [
  { value: 'padres', label: 'Padres / Apoderados' },
  { value: 'docentes', label: 'Docentes' },
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'relaciones', label: 'Relaciones Familiares (apoderado-estudiante)' }
]

// CSV Parser muy simple (MVP); asume delimitador coma, sin comillas escapadas
function parseCsvSimple(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  // Asegurar eliminación de BOM en el primer header si existiera
  if (headers.length > 0) {
    headers[0] = headers[0].replace(/^\uFEFF/, '')
  }
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cols[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

// Decodificador con fallback de codificación para CSV (UTF-8 o Windows-1252)
function decodeTextWithEncodingFallback(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  // Detectar BOM UTF-8
  const hasUtf8Bom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF

  const decode = (enc) => {
    try {
      // Nota: algunos navegadores aceptan 'windows-1252' y 'iso-8859-1'
      return new TextDecoder(enc, { fatal: false }).decode(bytes)
    } catch {
      return null
    }
  }

  let utf8 = decode('utf-8') ?? ''
  if (utf8.charCodeAt(0) === 0xFEFF) utf8 = utf8.slice(1)

  if (hasUtf8Bom) {
    return utf8
  }

  const win1252 = decode('windows-1252') ?? decode('iso-8859-1') ?? ''

  const repCount = (s) => (s.match(/\uFFFD/g) || []).length
  // Elegir la decodificación con menos caracteres de reemplazo
  if (repCount(utf8) > repCount(win1252)) {
    return win1252
  }
  return utf8
}

// Helpers de presentación para errores de validación (formato legible)
function truncate(str, max = 140) {
  const s = String(str ?? '')
  return s.length > max ? s.slice(0, max) + '…' : s
}

function formatCellValue(value) {
  if (value == null) return ''
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) => {
      if (item == null) return ''
      const ti = typeof item
      if (ti === 'string' || ti === 'number' || ti === 'boolean') return String(item)
      if (ti === 'object') {
        // Formatos comunes: { campo/mensaje }, { code/message }
        if (item.campo || item.field) {
          const campo = item.campo || item.field
          const msg = item.mensaje || item.message || JSON.stringify(item)
          return `${campo}: ${msg}`
        }
        if (item.code || item.message) {
          return `${item.code ? '[' + item.code + '] ' : ''}${item.message || ''}`
        }
        const entries = Object.entries(item).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        return entries.join(', ')
      }
      return JSON.stringify(item)
    })
    return truncate(parts.join('; '))
  }
  if (t === 'object') {
    if (value.message || value.code) {
      return truncate(`${value.code ? '[' + value.code + '] ' : ''}${value.message || ''}`)
    }
    const entries = Object.entries(value).map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}: ${v.map(x => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('|')}`
      }
      if (typeof v === 'object' && v !== null) {
        return `${k}: ${JSON.stringify(v)}`
      }
      return `${k}: ${String(v)}`
    })
    return truncate(entries.join('; '))
  }
  return ''
}

function downloadErrorReport(errors, tipo = '') {
  try {
    const lines = []
    lines.push(`Reporte de Errores de Validación`)
    lines.push(`Tipo: ${tipo}`)
    lines.push(`Fecha: ${new Date().toISOString()}`)
    lines.push('----------------------------------------')
    ;(errors || []).forEach((r, i) => {
      const fila = r?.fila ?? r?.row ?? (i + 1)
      const errores = formatCellValue(r?.errores ?? r?.error ?? r?.errors)
      const datos = typeof r?.datos === 'object'
        ? JSON.stringify(r.datos)
        : formatCellValue(r?.datos ?? r?.row_data ?? r?.input)
      lines.push(`Fila: ${fila}`)
      if (errores) lines.push(`Errores: ${errores}`)
      if (datos) lines.push(`Datos: ${datos}`)
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_errores_${tipo || 'import'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Error al generar reporte de errores', e)
  }
}

// Convierte un arreglo de objetos en CSV (con BOM) para descarga local
function buildCsvFromObjects(objs) {
  const rows = Array.isArray(objs) ? objs : []
  if (rows.length === 0) return '\uFEFF'
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach(k => set.add(k))
    return set
  }, new Set()))
  const esc = v => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csvLines = []
  csvLines.push(headers.join(','))
  for (const r of rows) {
    csvLines.push(headers.map(h => esc(r[h])).join(','))
  }
  return '\uFEFF' + csvLines.join('\n')
}

function downloadCsv(name, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name.endsWith('.csv') ? name : `${name}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Construir arreglo de relaciones desde el CSV cargado (HU-USERS-05)
function buildRelacionesFromParsed(rows) {
  return (rows || []).map(r => ({
    nro_documento_padre: String(r?.nro_documento_padre ?? '').trim(),
    codigo_estudiante: String(r?.codigo_estudiante ?? '').trim(),
    tipo_relacion: String(r?.tipo_relacion ?? '').trim()
  }))
}

export default function UserImportPage() {
  const [step, setStep] = useState(1)
  const [tipo, setTipo] = useState('padres')

  // Estado de plantilla
  const [tplLoading, setTplLoading] = useState(false)


  // Estado de archivo cargado/parseado
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState({ headers: [], rows: [] })

  // Validación
  const [validLoading, setValidLoading] = useState(false)
  const [validation, setValidation] = useState(null)

  // Ejecución
  const [execLoading, setExecLoading] = useState(false)
  const [executeResult, setExecuteResult] = useState(null)

  // Credenciales (preview)
  const [credLoading, setCredLoading] = useState(false)
  const [credPreview, setCredPreview] = useState(null)
  // HU-USERS-06 — Estados y resultados de generación/distribución de credenciales
  const [credGenLoading, setCredGenLoading] = useState(false)
  const [credGenResult, setCredGenResult] = useState(null)
  const [credExcelDownloading, setCredExcelDownloading] = useState(false)
  const [credWhatsSending, setCredWhatsSending] = useState(false)
  const [credPdfsLoading, setCredPdfsLoading] = useState(false)
  const [credOptions, setCredOptions] = useState({ excel: true, whatsapp: false, pdfs: false })
  const [whatsResult, setWhatsResult] = useState(null)
  const [pdfsResult, setPdfsResult] = useState(null)
  const [credExcelPreview, setCredExcelPreview] = useState(null)

  // Relaciones familiares (HU-USERS-05)
  const [, setRelValidLoading] = useState(false) // solo se usa el setter para spinner interno de validación
  const [relValidation, setRelValidation] = useState(null)
  const [relCreateLoading, setRelCreateLoading] = useState(false)
  const [relCreateResult, setRelCreateResult] = useState(null)
  const [relVerifyLoading, setRelVerifyLoading] = useState(false)
  const [relVerifyResult, setRelVerifyResult] = useState(null)

  const canValidate = useMemo(() => parsed?.rows?.length > 0, [parsed])

  const handleDownloadTemplate = async () => {
    try {
      setTplLoading(true)
      const tpl = await adminImportService.getTemplate(tipo)

      const headers = (tpl.headers || []).join(',')
      // Incluir una fila sample si existe (primera)
      const sampleRow = tpl.sample && tpl.sample[0] ? tpl.sample[0] : null
      let sampleLine = ''
      if (sampleRow) {
        sampleLine = '\n' + (tpl.headers || []).map(h => String(sampleRow[h] ?? '')).join(',')
      }
      const csv = headers + sampleLine
      // Prefijo BOM para que Excel detecte UTF-8 correctamente
      const bom = '\uFEFF'
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla_${tipo}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toastSuccess('Plantilla descargada')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setTplLoading(false)
    }
  }

  const handleFileChange = async (file) => {
    if (!file) return
    try {
      const arrayBuffer = await file.arrayBuffer()
      const text = decodeTextWithEncodingFallback(arrayBuffer)
      setFileName(file.name)
      const { headers, rows } = parseCsvSimple(text)
      setParsed({ headers, rows })
      setValidation(null)
      setExecuteResult(null)
    } catch (e) {
      toastFromApiError(e)
    }
  }

  const handleValidate = async () => {
    if (!canValidate) return
    try {
      if (tipo === 'relaciones') {
        setRelValidLoading(true)
        const relaciones = buildRelacionesFromParsed(parsed.rows)
        const res = await adminImportService.validateRelationships(relaciones)
        setRelValidation(res)
        toastSuccess('Validación de relaciones completada')
        setStep(3)
      } else {
        setValidLoading(true)
        // Enviar filas parseadas para validación (usuarios)
        const res = await adminImportService.validateImport(tipo, parsed.rows)
        setValidation(res)
        toastSuccess('Validación completada')
        setStep(3)
      }
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setValidLoading(false)
      setRelValidLoading(false)
    }
  }

  // Crear relaciones familiares válidas (HU-USERS-05)
  const handleCreateRelationships = async () => {
    if (!relValidation?.relaciones_validadas) return
    try {
      setRelCreateLoading(true)
      const validas = (relValidation.relaciones_validadas || []).filter(r => r?.valido)
      const relaciones = validas.map(r => ({
        nro_documento_padre: String(r?.nro_documento_padre ?? '').trim(),
        codigo_estudiante: String(r?.codigo_estudiante ?? '').trim(),
        tipo_relacion: String(r?.tipo_relacion ?? '').trim()
      }))
      if (relaciones.length === 0) return
      const res = await adminImportService.createRelationships(relaciones)
      setRelCreateResult(res)
      toastSuccess('Relaciones creadas correctamente')
      // Avanzar a paso 4 para ver resumen global si se desea
      setStep(4)
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setRelCreateLoading(false)
    }
  }

  // Verificar integridad de relaciones (HU-USERS-05)
  const handleVerifyRelationships = async () => {
    try {
      setRelVerifyLoading(true)
      const res = await adminImportService.verifyRelationships()
      setRelVerifyResult(res)
      toastSuccess('Verificación de relaciones completada')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setRelVerifyLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!validation) return
    try {
      setExecLoading(true)
      const registrosValidos = validation.registros_validos || []
      const res = await adminImportService.executeImport(tipo, registrosValidos)
      setExecuteResult(res)
      toastSuccess('Importación ejecutada')
      setStep(4)
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setExecLoading(false)
    }
  }

  const handleGenerateCredentialsPreview = async () => {
    if (!executeResult) return
    try {
      setCredLoading(true)
      // Tomar usuarios exitosos del resultado (si aplica)
      const exitosos = executeResult.exitosos || []
      // Mapear al formato requerido (nro_documento, nombre, apellido, telefono, rol)
      const usuarios = exitosos.map(u => ({
        nro_documento: u.nro_documento || '',
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        telefono: u.telefono || '',
        rol: u.rol || 'docente'
      }))
      const preview = await adminImportService.generateCredentialsPreview(usuarios)
      setCredPreview(preview)
      toastSuccess('Vista previa de credenciales generada')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setCredLoading(false)
    }
  }

  // HU-USERS-06 — Generar credenciales iniciales (endpoints actualizados)
  const handleGenerateCredentials = async () => {
    if (!executeResult?.import_id) {
      toastFromApiError(new Error('Falta import_id. Ejecute la importación primero.'))
      return
    }
    try {
      setCredGenLoading(true)
      const res = await adminImportService.generateCredentials(executeResult.import_id, {
        incluir_excel: credOptions.excel,
        incluir_whatsapp: credOptions.whatsapp,
        incluir_pdfs: credOptions.pdfs
      })
      setCredGenResult(res)
      toastSuccess('Credenciales generadas correctamente')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setCredGenLoading(false)
    }
  }

  const handleViewCredentialsExcelPreview = async () => {
    if (!credGenResult?.credentials_id) return
    try {
      setCredExcelDownloading(true)
      const data = await adminImportService.downloadCredentialsExcel(credGenResult.credentials_id)
      // MVP: GET /admin/import/credentials/{credentials_id}/download devuelve JSON (excel_preview)
      setCredExcelPreview(data?.excel_preview ?? data)
      toastSuccess('Vista Excel (JSON) cargada')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setCredExcelDownloading(false)
    }
  }

  const handleDownloadCsvFromExcelPreview = () => {
    const rows = credExcelPreview || []
    const csv = buildCsvFromObjects(rows)
    downloadCsv(`credenciales_${credGenResult?.credentials_id || 'preview'}.csv`, csv)
  }

  const handleSendCredentialsWhatsapp = async () => {
    if (!credGenResult?.credentials_id) return
    try {
      setCredWhatsSending(true)
      // Enviar a todos los usuarios exitosos de la importación actual (IDs)
      const usuariosSeleccionados = (executeResult?.exitosos || []).map(u => u.id).filter(Boolean)
      const res = await adminImportService.sendCredentialsWhatsapp(credGenResult.credentials_id, usuariosSeleccionados)
      setWhatsResult(res)
      toastSuccess('Envío de WhatsApp procesado')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setCredWhatsSending(false)
    }
  }

  const handleGenerateCredentialPDFs = async () => {
    if (!credGenResult?.credentials_id) return
    try {
      setCredPdfsLoading(true)
      const res = await adminImportService.generateCredentialPDFs(credGenResult.credentials_id)
      setPdfsResult(res)
      toastSuccess('PDFs generados')
    } catch (e) {
      toastFromApiError(e)
    } finally {
      setCredPdfsLoading(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 px-4">
      
      <div className="bg-bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Importar Usuarios
        </h1>
        <p className="text-text-secondary">
          Carga masiva de Padres, Docentes, Estudiantes y Relaciones según plantillas oficiales.
        </p>
      </div>


      {/* Paso 1: Selección y descarga de plantilla */}
      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">1. Seleccione el tipo de carga</h2>
            <p className="text-text-secondary text-sm">
              Elija el tipo de entidad a importar y descargue la plantilla correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VALID_TYPES.map(t => (
              <label key={t.value} className={`border rounded-md p-4 cursor-pointer transition-colors ${tipo === t.value ? 'border-primary-400 bg-primary-50' : 'border-border-primary hover:bg-border-light'}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="tipo"
                    checked={tipo === t.value}
                    onChange={() => setTipo(t.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{t.label}</div>
                    <div className="text-sm text-text-secondary">Tipo: {t.value}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleDownloadTemplate} isLoading={tplLoading} variant="outline">
              Descargar plantilla CSV
            </Button>
            <Button onClick={() => setStep(2)}>
              Siguiente
            </Button>
          </div>
        </Card>
      )}

      {/* Paso 2: Subir archivo y validar */}
      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">2. Subir archivo y validar</h2>
            <p className="text-text-secondary text-sm">
              Cargue el archivo CSV y ejecute la validación antes de insertar en base de datos.
            </p>
          </div>

          <div className="border-2 border-dashed border-border-secondary rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <p className="text-xs text-text-muted mt-2">Formatos soportados: CSV (MVP). XLSX pendiente.</p>
          </div>

          {fileName && (
            <div className="text-sm">
              <span className="font-medium">Archivo:</span> {fileName} {' '}
              <span className="text-text-muted">({parsed?.rows?.length || 0} filas)</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={handleValidate} isLoading={validLoading} disabled={!canValidate}>
              Validar archivo
            </Button>
          </div>

          {/* Vista previa simple de primeras filas */}
          {parsed?.rows?.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    {parsed.headers.map((h) => (
                      <th key={h} className="border px-2 py-1 bg-border-light text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((r, idx) => (
                    <tr key={idx}>
                      {parsed.headers.map((h) => (
                        <td key={h} className="border px-2 py-1">{String(r[h] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-text-muted mt-2">Mostrando 5 primeras filas</div>
            </div>
          )}
        </Card>
      )}

      {/* Paso 3: Reporte de validación y procesar */}
      {step === 3 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">3. Reporte de validación</h2>
            <p className="text-text-secondary text-sm">
              Revise el resultado de la validación. Procese únicamente los registros válidos.
            </p>
          </div>

          {tipo === 'relaciones' ? (
            !relValidation ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-text-secondary">Total relaciones</div>
                    <div className="text-2xl font-semibold">{relValidation?.total_relaciones ?? 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-text-secondary">Válidas</div>
                    <div className="text-2xl font-semibold text-success">{relValidation?.validas ?? 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-text-secondary">Inválidas</div>
                    <div className="text-2xl font-semibold text-error">{relValidation?.invalidas ?? 0}</div>
                  </Card>
                </div>

                {/* Detalle de validación de relaciones */}
                {(relValidation?.relaciones_validadas?.length || 0) > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Detalle de validación de relaciones</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1 bg-border-light text-left">nro_documento_padre</th>
                            <th className="border px-2 py-1 bg-border-light text-left">padre_existe</th>
                            <th className="border px-2 py-1 bg-border-light text-left">padre_nombre</th>
                            <th className="border px-2 py-1 bg-border-light text-left">codigo_estudiante</th>
                            <th className="border px-2 py-1 bg-border-light text-left">estudiante_existe</th>
                            <th className="border px-2 py-1 bg-border-light text-left">estudiante_nombre</th>
                            <th className="border px-2 py-1 bg-border-light text-left">tipo_relacion</th>
                            <th className="border px-2 py-1 bg-border-light text-left">valido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relValidation.relaciones_validadas.slice(0, 20).map((r, idx) => (
                            <tr key={idx}>
                              <td className="border px-2 py-1">{r?.nro_documento_padre}</td>
                              <td className="border px-2 py-1">{String(r?.padre_existe)}</td>
                              <td className="border px-2 py-1">{r?.padre_nombre}</td>
                              <td className="border px-2 py-1">{r?.codigo_estudiante}</td>
                              <td className="border px-2 py-1">{String(r?.estudiante_existe)}</td>
                              <td className="border px-2 py-1">{r?.estudiante_nombre}</td>
                              <td className="border px-2 py-1">{r?.tipo_relacion}</td>
                              <td className="border px-2 py-1">{r?.valido ? '✅' : '❌'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-xs text-text-muted mt-2">Mostrando hasta 20 relaciones validadas</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
                  <Button
                    onClick={handleCreateRelationships}
                    isLoading={relCreateLoading}
                    disabled={(relValidation?.validas ?? 0) === 0}
                  >
                    Crear relaciones válidas
                  </Button>
                </div>
              </>
            )
          ) : (
            !validation ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-text-secondary">Total filas</div>
                    <div className="text-2xl font-semibold">{validation?.resumen?.total_filas ?? 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-text-secondary">Válidos</div>
                    <div className="text-2xl font-semibold text-success">{validation?.resumen?.validos ?? 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-text-secondary">Con errores</div>
                    <div className="text-2xl font-semibold text-error">{validation?.resumen?.con_errores ?? 0}</div>
                  </Card>
                </div>

                {/* Errores (si existen) */}
                {(validation?.registros_con_errores?.length || 0) > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Registros con errores</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1 bg-border-light text-left">fila</th>
                            <th className="border px-2 py-1 bg-border-light text-left">errores</th>
                            <th className="border px-2 py-1 bg-border-light text-left">datos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validation.registros_con_errores.slice(0, 10).map((r, idx) => (
                            <tr key={idx}>
                              <td className="border px-2 py-1">{String(r?.fila ?? r?.row ?? (idx + 1))}</td>
                              <td className="border px-2 py-1">
                                <div className="whitespace-pre-wrap text-xs">
                                  {formatCellValue(r?.errores ?? r?.error ?? r?.errors)}
                                </div>
                              </td>
                              <td className="border px-2 py-1">
                                <div className="whitespace-pre-wrap text-xs">
                                  {formatCellValue(r?.datos ?? r?.row_data ?? r?.input)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-xs text-text-muted mt-2">Mostrando hasta 10 registros con errores</div>
                      <div className="mt-3">
                        <Button variant="outline" onClick={() => downloadErrorReport(validation.registros_con_errores, tipo)}>
                          Descargar reporte de errores
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
                  <Button onClick={handleExecute} isLoading={execLoading} disabled={(validation?.resumen?.validos ?? 0) === 0}>
                    Procesar válidos
                  </Button>
                </div>
              </>
            )
          )}
        </Card>
      )}

      {/* Paso 4: Resumen post-inserción y credenciales (preview) */}
      {step === 4 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">4. Resumen de importación</h2>
            <p className="text-text-secondary text-sm">
              {['padres', 'docentes'].includes(tipo)
                ? 'Resultados de la importación ejecutada. Opcional: generar vista previa de credenciales.'
                : 'Resultados de la importación ejecutada.'}
            </p>
          </div>

          {!executeResult ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Total procesados</div>
                  <div className="text-2xl font-semibold">{executeResult?.resumen?.total_procesados ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Exitosos</div>
                  <div className="text-2xl font-semibold text-success">{executeResult?.resumen?.exitosos ?? 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-text-secondary">Fallidos</div>
                  <div className="text-2xl font-semibold text-error">{executeResult?.resumen?.fallidos ?? 0}</div>
                </Card>
              </div>

              {/* Lista corta de exitosos */}
              {(executeResult?.exitosos?.length || 0) > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Usuarios creados (preview)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 bg-border-light text-left">Nombre</th>
                          <th className="border px-2 py-1 bg-border-light text-left">Apellido</th>
                          <th className="border px-2 py-1 bg-border-light text-left">Rol</th>
                          <th className="border px-2 py-1 bg-border-light text-left">Documento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executeResult.exitosos.slice(0, 10).map((u, idx) => (
                          <tr key={idx}>
                            <td className="border px-2 py-1">{u.nombre}</td>
                            <td className="border px-2 py-1">{u.apellido}</td>
                            <td className="border px-2 py-1">{u.rol}</td>
                            <td className="border px-2 py-1">{u.nro_documento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-xs text-text-muted mt-2">Mostrando hasta 10 usuarios exitosos</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1)
                    setTipo('padres')
                    setParsed({ headers: [], rows: [] })
                    setValidation(null)
                    setExecuteResult(null)
                    setCredPreview(null)
                    setFileName('')
                    setRelValidation(null)
                    setRelCreateResult(null)
                    setRelVerifyResult(null)
                    setCredGenResult(null)
                    setWhatsResult(null)
                    setPdfsResult(null)
                    setCredExcelPreview(null)
                  }}
                >
                  Nueva importación
                </Button>
                {(tipo === 'padres' || tipo === 'docentes') && (
                  <Button onClick={handleGenerateCredentialsPreview} isLoading={credLoading} disabled={(executeResult?.exitosos?.length || 0) === 0}>
                    Generar vista previa de credenciales
                  </Button>
                )}
                {(tipo === 'estudiantes' || tipo === 'relaciones') && (
                  <Button onClick={handleVerifyRelationships} isLoading={relVerifyLoading}>
                    Verificar relaciones
                  </Button>
                )}
              </div>

              {/* HU-USERS-06 — Generación y distribución de credenciales */}
              {(tipo === 'padres' || tipo === 'docentes') && (
                <div className="mt-6 space-y-4">
                  {!credGenResult ? (
                    <>
                      <h3 className="font-semibold">Generar credenciales iniciales</h3>
                      <div className="flex flex-wrap gap-4 items-center">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={credOptions.excel}
                            onChange={(e) => setCredOptions(o => ({ ...o, excel: e.target.checked }))}
                          />
                          Archivo Excel
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={credOptions.whatsapp}
                            onChange={(e) => setCredOptions(o => ({ ...o, whatsapp: e.target.checked }))}
                          />
                          Enviar por WhatsApp
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={credOptions.pdfs}
                            onChange={(e) => setCredOptions(o => ({ ...o, pdfs: e.target.checked }))}
                          />
                          Generar PDFs individuales (ZIP)
                        </label>
                        <Button
                          onClick={handleGenerateCredentials}
                          isLoading={credGenLoading}
                          disabled={!executeResult?.import_id}
                        >
                          Generar credenciales
                        </Button>
                      </div>
                      <p className="text-xs text-text-muted">
                        Se generarán credenciales para los usuarios exitosos de esta importación (import_id: {executeResult?.import_id || '-'}).
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold">Credenciales generadas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <div className="text-sm text-text-secondary">credentials_id</div>
                          <div className="text-sm font-mono">{credGenResult?.credentials_id}</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-sm text-text-secondary">Total credenciales</div>
                          <div className="text-2xl font-semibold">{credGenResult?.total_credenciales ?? 0}</div>
                        </Card>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <Button onClick={handleViewCredentialsExcelPreview} isLoading={credExcelDownloading} disabled={!credGenResult?.credentials_id}>
                          Ver vista Excel (JSON)
                        </Button>

                        {credExcelPreview && (
                          <Button variant="outline" onClick={handleDownloadCsvFromExcelPreview}>
                            Descargar CSV desde preview
                          </Button>
                        )}

                        <Button onClick={handleSendCredentialsWhatsapp} isLoading={credWhatsSending} disabled={!credGenResult?.credentials_id}>
                          Enviar por WhatsApp
                        </Button>

                        <Button onClick={handleGenerateCredentialPDFs} isLoading={credPdfsLoading} disabled={!credGenResult?.credentials_id}>
                          Generar PDFs (ZIP)
                        </Button>

                        {/* Enlaces directos si el backend devolvió URLs absolutas/relativas */}
                        {credGenResult?.archivo_excel_url && (
                          <a
                            className="text-primary-600 underline text-sm"
                            href={`${credGenResult.archivo_excel_url.startsWith('http') ? '' : BASE_URL}${credGenResult.archivo_excel_url}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir vista Excel (JSON)
                          </a>
                        )}
                        {credGenResult?.pdfs_zip_url && (
                          <a
                            className="text-primary-600 underline text-sm"
                            href={`${credGenResult.pdfs_zip_url.startsWith('http') ? '' : BASE_URL}${credGenResult.pdfs_zip_url}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Descargar ZIP de PDFs
                          </a>
                        )}

                        {/* Render de preview Excel en JSON */}
                        {credExcelPreview && (
                          <div className="mt-3 w-full">
                            <h4 className="font-medium mb-1">Vista Excel (JSON)</h4>
                            <pre className="bg-border-light p-3 rounded-md overflow-auto text-xs">
{JSON.stringify(credExcelPreview, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Resultados de envíos por WhatsApp */}
                      {whatsResult && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-1">Resultado de WhatsApp</h4>
                          <div className="text-sm">
                            Envíos: {whatsResult?.total_envios ?? 0} • Éxitos: {whatsResult?.exitosos ?? 0} • Fallidos: {whatsResult?.fallidos ?? 0}
                          </div>
                          {(whatsResult?.detalles_fallidos?.length || 0) > 0 && (
                            <div className="overflow-x-auto mt-2">
                              <table className="min-w-full border text-sm">
                                <thead>
                                  <tr>
                                    <th className="border px-2 py-1 bg-border-light text-left">usuario_id</th>
                                    <th className="border px-2 py-1 bg-border-light text-left">telefono</th>
                                    <th className="border px-2 py-1 bg-border-light text-left">error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {whatsResult.detalles_fallidos.slice(0, 20).map((r, idx) => (
                                    <tr key={idx}>
                                      <td className="border px-2 py-1">{r?.usuario_id}</td>
                                      <td className="border px-2 py-1">{r?.telefono}</td>
                                      <td className="border px-2 py-1">{r?.error}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resultado de PDFs */}
                      {pdfsResult && (
                        <div className="mt-4 w-full">
                          <h4 className="font-medium mb-1">Resultado de PDFs</h4>
                          <div className="text-sm">
                            PDFs generados: {pdfsResult?.total_pdfs ?? 0}
                          </div>
                          {pdfsResult?.zip_url && (
                            <a
                              className="text-primary-600 underline text-sm"
                              href={`${pdfsResult.zip_url.startsWith('http') ? '' : BASE_URL}${pdfsResult.zip_url}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Descargar ZIP
                            </a>
                          )}

                          {Array.isArray(pdfsResult?.pdfs_individuales) && pdfsResult.pdfs_individuales.length > 0 && (
                            <div className="mt-2">
                              <h5 className="font-medium">PDFs individuales</h5>
                              <ul className="list-disc pl-5 text-sm">
                                {pdfsResult.pdfs_individuales.slice(0, 50).map((p) => (
                                  <li key={p?.usuario_id}>
                                    <a
                                      className="text-primary-600 underline"
                                      href={`${p?.pdf_url?.startsWith('http') ? '' : BASE_URL}${p?.pdf_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {p?.usuario_id || 'usuario'} - Ver PDF
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Preview de credenciales (JSON simple) */}
              {(tipo === 'padres' || tipo === 'docentes') && credPreview && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Vista previa de credenciales (JSON)</h3>
                  <pre className="bg-border-light p-3 rounded-md overflow-auto text-xs">
                    {JSON.stringify(credPreview, null, 2)}
                  </pre>
                </div>
              )}

              {/* Resultado de creación de relaciones (HU-USERS-05) */}
              {relCreateResult && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Relaciones familiares creadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-text-secondary">Total creadas</div>
                      <div className="text-2xl font-semibold">{relCreateResult?.relaciones_creadas ?? 0}</div>
                    </Card>
                  </div>
                  {(relCreateResult?.detalles?.length || 0) > 0 && (
                    <div className="overflow-x-auto mt-4">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1 bg-border-light text-left">padre_id</th>
                            <th className="border px-2 py-1 bg-border-light text-left">estudiante_id</th>
                            <th className="border px-2 py-1 bg-border-light text-left">tipo_relacion</th>
                            <th className="border px-2 py-1 bg-border-light text-left">fecha_asignacion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relCreateResult.detalles.slice(0, 20).map((r, idx) => (
                            <tr key={idx}>
                              <td className="border px-2 py-1">{r?.padre_id}</td>
                              <td className="border px-2 py-1">{r?.estudiante_id}</td>
                              <td className="border px-2 py-1">{r?.tipo_relacion}</td>
                              <td className="border px-2 py-1">{r?.fecha_asignacion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-xs text-text-muted mt-2">Mostrando hasta 20 relaciones creadas</div>
                    </div>
                  )}
                </div>
              )}

              {/* Resultado de verificación de relaciones */}
              {relVerifyResult && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Verificación de relaciones</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-text-secondary">Total estudiantes</div>
                      <div className="text-2xl font-semibold">{relVerifyResult?.total_estudiantes ?? 0}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-text-secondary">Con apoderado</div>
                      <div className="text-2xl font-semibold text-success">{relVerifyResult?.con_apoderado ?? 0}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-text-secondary">Sin apoderado</div>
                      <div className="text-2xl font-semibold text-error">{relVerifyResult?.sin_apoderado ?? 0}</div>
                    </Card>
                  </div>
                  {(relVerifyResult?.estudiantes_sin_apoderado?.length || 0) > 0 && (
                    <div className="overflow-x-auto mt-4">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1 bg-border-light text-left">id</th>
                            <th className="border px-2 py-1 bg-border-light text-left">codigo_estudiante</th>
                            <th className="border px-2 py-1 bg-border-light text-left">nombre</th>
                            <th className="border px-2 py-1 bg-border-light text-left">nivel</th>
                            <th className="border px-2 py-1 bg-border-light text-left">grado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relVerifyResult.estudiantes_sin_apoderado.slice(0, 20).map((r, idx) => (
                            <tr key={idx}>
                              <td className="border px-2 py-1">{r?.id}</td>
                              <td className="border px-2 py-1">{r?.codigo_estudiante}</td>
                              <td className="border px-2 py-1">{r?.nombre}</td>
                              <td className="border px-2 py-1">{r?.nivel}</td>
                              <td className="border px-2 py-1">{r?.grado}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-xs text-text-muted mt-2">Mostrando hasta 20 estudiantes sin apoderado</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}