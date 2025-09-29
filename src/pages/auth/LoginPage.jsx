import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff, IdCard, LockKeyhole } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { toastError, toastSuccess } from '../../components/ui/Toast.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const STORAGE_LAST_DOC = 'last_login_document'

const DOC_OPTIONS = [
  { label: 'DNI', value: 'DNI', minLen: 8, maxLen: 12, helper: 'Ingresa 8 dígitos' },
  { label: 'Carnet de Extranjería', value: 'CARNET_EXTRANJERIA', minLen: 8, maxLen: 12, helper: 'Ingresa de 8 a 12 caracteres numéricos' },
]

// Validación (aplicada manualmente en submit)
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
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, isAuthenticated, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  // Cargar último documento usado
  const remembered = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_LAST_DOC)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      tipo_documento: remembered?.tipo_documento || '',
      nro_documento: remembered?.nro_documento || '',
      password: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated && user?.rol) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const selectedType = watch('tipo_documento')
  const docCfg = DOC_OPTIONS.find((d) => d.value === selectedType)

  const onSubmit = handleSubmit(async (formValues) => {
    const parsed = schema.safeParse(formValues)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path?.[0]
        if (path) {
          setError(path, { type: 'manual', message: issue.message })
        }
      })
      return
    }

    try {
      const data = await login({
        tipo_documento: formValues.tipo_documento,
        nro_documento: formValues.nro_documento,
        password: formValues.password,
      })

      // Recordar último documento
      localStorage.setItem(
        STORAGE_LAST_DOC,
        JSON.stringify({
          tipo_documento: formValues.tipo_documento,
          nro_documento: formValues.nro_documento,
        })
      )

      // Feedback éxito
      const nombre = data?.user?.nombre || 'Usuario'
      toastSuccess(`Bienvenido, ${nombre}`)

      // Redirección por rol, bandera de cambio de password y/o redirect_to
      if (data?.user?.rol === 'docente' && data?.user?.debe_cambiar_password) {
        navigate('/change-password-required', { replace: true })
      } else if (data?.redirect_to) {
        navigate(data.redirect_to, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      if (!err?.message) toastError('Documento o contraseña incorrectos')
    }
  })

  // Normalizar input de nro_documento a solo números
  const handleDocChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setValue('nro_documento', val, { shouldValidate: false })
  }

  // UI basada en wireframe: logo centrado, campos apilados con placeholders y botón oscuro
  return (
    // Aplicamos la clase login-background y ajustamos la grilla y el padding
    <div className="min-h-screen login-background grid place-items-center px-4 py-8">

      {/* Contenedor de contenido */}
      <div className="w-full max-w-sm login-content">

        {/* Tarjeta del formulario */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">

          {/* Logo y título */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={logo}
              alt="I.E.P. Las Orquídeas"
              className="h-28 w-auto select-none mb-2"
              draggable={false}
            />
            <h1 className="text-2xl font-semibold text-text-primary mt-2">Bienvenido</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">

            {/* Tipo de documento */}
            <div className="relative">
              <div className={`relative flex items-center rounded-lg border bg-white ${errors?.tipo_documento?.message
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

            {/* Número de documento */}
            <Input
              name="nro_documento"
              placeholder={docCfg?.helper || 'Numero de Documento'}
              error={errors?.nro_documento?.message}
              required
              maxLength={docCfg?.maxLen || 12}
              onChange={handleDocChange}
              {...register('nro_documento')}
              leftIcon={<IdCard size={18} />}
            />

            {/* Contraseña */}
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              error={errors?.password?.message}
              required
              leftIcon={<LockKeyhole size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-text-muted hover:text-primary-700 transition"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register('password')}
            />

            {/* Enlace de recuperación */}
            <div className="text-end pt-1">
              <Link to="/forgot-password" className="text-sm font-medium text-primary-700 hover:text-primary-600 transition">
                ¿Olvidó la contraseña?
              </Link>
            </div>

            {/* Botón de ingreso */}
            <Button
              type="submit"
              variant="dark"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Ingresar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}