import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import logo from '../../assets/logo.png'

import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import PasswordStrength from '../../components/ui/PasswordStrength.jsx'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card.jsx'
import { toastFromApiError, toastSuccess, toastError } from '../../components/ui/Toast.jsx'
import { resetPassword } from '../../services/authService.js'

// Regla de contraseña segura
const passwordRules = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos 1 letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos 1 letra minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos 1 número')

const schema = z
  .object({
    nueva_password: passwordRules,
    confirmar_password: z.string(),
  })
  .refine((data) => data.nueva_password === data.confirmar_password, {
    path: ['confirmar_password'],
    message: 'Las contraseñas no coinciden',
  })

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)

  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (!token) {
      toastError('El enlace es inválido o ha expirado')
      navigate('/forgot-password', { replace: true })
    }
  }, [token, navigate])

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    defaultValues: {
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
      await resetPassword({
        token,
        nueva_password: values.nueva_password,
        confirmar_password: values.confirmar_password,
      })
      toastSuccess('Contraseña actualizada. Inicia sesión con tu nueva contraseña')
      navigate('/login', { replace: true })
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
          Restablece tu contraseña
        </p>
      </div>

      <Card className="shadow-xl bg-white rounded-xl">
        <CardHeader
          title="Nueva contraseña"
          description="Crea una contraseña segura para continuar"
        />
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Nueva contraseña"
                name="nueva_password"
                type={show1 ? 'text' : 'password'}
                placeholder="Ingresa tu nueva contraseña"
                error={errors?.nueva_password?.message}
                required
                leftIcon={<LockKeyhole size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShow1((v) => !v)}
                    className="text-text-muted hover:text-primary-700 transition"
                    aria-label={show1 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={show1 ? 'Ocultar' : 'Mostrar'}
                  >
                    {show1 ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('nueva_password')}
              />
              <PasswordStrength value={nueva} />
            </div>

            <div className="relative">
              <Input
                label="Confirmar contraseña"
                name="confirmar_password"
                type={show2 ? 'text' : 'password'}
                placeholder="Repite tu nueva contraseña"
                error={errors?.confirmar_password?.message}
                required
                leftIcon={<LockKeyhole size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShow2((v) => !v)}
                    className="text-text-muted hover:text-primary-700 transition"
                    aria-label={show2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={show2 ? 'Ocultar' : 'Mostrar'}
                  >
                    {show2 ? <EyeOff size={18} /> : <Eye size={18} />}
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
              Cambiar contraseña
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <div className="w-full text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-text-secondary hover:text-primary-700 transition"
            >
              Volver al login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
)
}