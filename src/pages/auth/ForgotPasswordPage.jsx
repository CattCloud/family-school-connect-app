import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { IdCard } from 'lucide-react'
import logo from '../../assets/logo.png'

import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { toastInfo, toastSuccess } from '../../components/ui/Toast.jsx'
import { forgotPassword } from '../../services/authService.js'

const DOC_OPTIONS = [
  { label: 'DNI', value: 'DNI', minLen: 8, maxLen: 12, helper: 'Ingresa 8 dígitos' },
  { label: 'Carnet de Extranjería', value: 'CARNET_EXTRANJERIA', minLen: 8, maxLen: 12, helper: 'Ingresa de 8 a 12 caracteres numéricos' },
]

// Validación con Zod (aplicación manual al enviar)
const VALID_DOC_TYPES = ['DNI', 'CARNET_EXTRANJERIA']
const schema = z.object({
  tipo_documento: z
    .string()
    .refine((v) => VALID_DOC_TYPES.includes(v), {
      message: 'Seleccione un tipo de documento',
    }),
  nro_documento: z
    .string()
    .min(8, 'El número de documento debe tener al menos 8 dígitos')
    .max(12, 'Máximo 12 dígitos')
    .regex(/^[0-9]+$/, 'Solo números'),
})

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      tipo_documento: '',
      nro_documento: '',
    },
  })

  const selectedType = watch('tipo_documento')
  const docCfg = useMemo(
    () => DOC_OPTIONS.find((d) => d.value === selectedType),
    [selectedType]
  )

  const normalizeDoc = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setValue('nro_documento', val, { shouldValidate: false })
  }

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path?.[0]
        if (path) setError(path, { type: 'manual', message: issue.message })
      })
      return
    }

    try {
      toastInfo('Procesando solicitud...')
      await forgotPassword({
        tipo_documento: values.tipo_documento,
        nro_documento: values.nro_documento,
      })
      toastSuccess('Si el documento existe, recibirás un WhatsApp con instrucciones')
      navigate('/login', { replace: true })
    } catch {
      // Respuesta genérica para no revelar existencia de usuario
      toastSuccess('Si el documento existe, recibirás un WhatsApp con instrucciones')
      navigate('/login', { replace: true })
    }
  })

  // UI acorde a wireframe: Título, texto de instrucciones, campos apilados y dos botones (volver e iniciar)
return (
  <div className="min-h-screen login-background grid place-items-center px-4 py-8">
    <div className="w-full max-w-sm login-content">
      
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">

        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="I.E.P. Las Orquídeas"
            className="h-24 w-auto select-none"
            draggable={false}
          />
        </div>

        <h1 className="text-2xl font-bold text-text-primary text-center">
          Cambio de Contraseña
        </h1>
        <p className="mt-2 text-sm text-text-secondary text-center">
          Selecciona el tipo de documento e ingresa el número de documento con el que accedes al sistema
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <div className={`relative flex items-center rounded-lg border bg-white ${
              errors?.tipo_documento?.message
                ? 'border-border-error'
                : 'border-border-primary focus-within:border-border-focus'
            }`}>
              <span className="pl-3 text-text-muted">
                <IdCard size={18} />
              </span>
              <select
                className="w-full rounded-r-lg bg-transparent outline-none px-2 py-3 text-text-primary appearance-none"
                {...register('tipo_documento')}
              >
                <option value="" disabled hidden>Tipo de Documento</option>
                {DOC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
            </div>
            {errors?.tipo_documento?.message && (
              <p className="mt-1 text-xs text-error">{errors.tipo_documento.message}</p>
            )}
          </div>

          <Input
            name="nro_documento"
            placeholder={docCfg?.helper || 'Numero de Documento'}
            error={errors?.nro_documento?.message}
            required
            maxLength={docCfg?.maxLen || 12}
            onChange={normalizeDoc}
            {...register('nro_documento')}
            leftIcon={<IdCard size={18} />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6"
            isLoading={isSubmitting}
          >
            Continuar
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-primary-700 transition">
              Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  </div>
)
}