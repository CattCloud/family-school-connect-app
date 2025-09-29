import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, LogOut } from 'lucide-react'
import logo from '../../assets/logo.png'

import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import PasswordStrength from '../../components/ui/PasswordStrength.jsx'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card.jsx'
import { toastFromApiError, toastSuccess, toastError } from '../../components/ui/Toast.jsx'
import { changeRequiredPassword } from '../../services/authService.js'
import { useAuth } from '../../hooks/useAuth.js'

// Regla de contraseña segura
const passwordRules = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos 1 letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos 1 letra minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos 1 número')

const schema = z
  .object({
    password_actual: z.string().min(1, 'Ingresa tu contraseña actual'),
    nueva_password: passwordRules,
    confirmar_password: z.string(),
  })
  .refine((data) => data.nueva_password === data.confirmar_password, {
    path: ['confirmar_password'],
    message: 'Las contraseñas no coinciden',
  })

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated, logout } = useAuth()
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)

  useEffect(() => {
    // Bloqueo de navegación: si no aplica, redirigir
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    // Solo docentes con flag deben cambiar
    if (user?.rol !== 'docente' || user?.debe_cambiar_password !== true) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      password_actual: '',
      nueva_password: '',
      confirmar_password: '',
    },
  })

  const nueva = watch('nueva_password')

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
      const res = await changeRequiredPassword(token, {
        password_actual: values.password_actual,
        nueva_password: values.nueva_password,
        confirmar_password: values.confirmar_password,
      })
      toastSuccess('Contraseña actualizada. Accediendo al sistema...')
      const redirect = res?.data?.redirect_to || '/dashboard'
      navigate(redirect, { replace: true })
    } catch (err) {
      toastFromApiError(err)
    }
  })

 return (
  <div className="min-h-screen login-background grid place-items-center px-4 py-8">
    <div className="w-full max-w-md login-content">
      
      <div className="flex flex-col items-center mb-6">
        <img
          src={logo}
          alt="I.E.P. Las Orquídeas"
          className="h-20 w-auto select-none"
          draggable={false}
        />
        <p className="mt-4 text-sm text-text-secondary text-center font-medium">
          Por seguridad, debe cambiar su contraseña antes de continuar
        </p>
      </div>

      <Card className="shadow-xl bg-white rounded-xl">
        <CardHeader
          title="Cambio de contraseña requerido"
          description="Actualiza tu contraseña para continuar usando el sistema"
        />
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Contraseña actual"
                name="password_actual"
                type={showCurr ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña actual"
                error={errors?.password_actual?.message}
                required
                leftIcon={<LockKeyhole size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurr((v) => !v)}
                    className="text-text-muted hover:text-primary-700 transition"
                    aria-label={showCurr ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showCurr ? 'Ocultar' : 'Mostrar'}
                  >
                    {showCurr ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('password_actual')}
              />
            </div>

            <div className="relative">
              <Input
                label="Nueva contraseña"
                name="nueva_password"
                type={showNew ? 'text' : 'password'}
                placeholder="Ingresa tu nueva contraseña"
                error={errors?.nueva_password?.message}
                required
                leftIcon={<LockKeyhole size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="text-text-muted hover:text-primary-700 transition"
                    aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showNew ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('nueva_password')}
              />
              <PasswordStrength value={nueva} />
            </div>

            <div className="relative">
              <Input
                label="Confirmar nueva contraseña"
                name="confirmar_password"
                type={showConf ? 'text' : 'password'}
                placeholder="Repite tu nueva contraseña"
                error={errors?.confirmar_password?.message}
                required
                leftIcon={<LockKeyhole size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConf((v) => !v)}
                    className="text-text-muted hover:text-primary-700 transition"
                    aria-label={showConf ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showConf ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConf ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('confirmar_password')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Confirmar nueva
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Debe completar este proceso para continuar
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                logout().then(() => {
                  toastError('Sesión cerrada')
                  navigate('/login', { replace: true })
                })
              }}
              rightIcon={<LogOut size={16} />}
            >
              Cerrar sesión
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
) 
}