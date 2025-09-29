import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'

let notyfInstance = null

function getNotyf() {
  if (!notyfInstance) {
    notyfInstance = new Notyf({
      duration: 3000,
      dismissible: true,
      position: { x: 'right', y: 'top' },
      types: [
        {
          type: 'info',
          background: 'var(--color-info)',
          icon: false,
        },
        {
          type: 'warning',
          background: 'var(--color-warning)',
          icon: false,
        },
        {
          type: 'success',
          background: 'var(--color-success)',
          icon: false,
        },
        {
          type: 'error',
          background: 'var(--color-error)',
          icon: false,
        },
      ],
    })
  }
  return notyfInstance
}

export function toastSuccess(message) {
  getNotyf().success({
    message,
    background: 'var(--color-success)',
  })
}

export function toastError(message) {
  getNotyf().error({
    message,
    background: 'var(--color-error)',
  })
}

export function toastInfo(message) {
  getNotyf().open({
    type: 'info',
    message,
  })
}

export function toastWarning(message) {
  getNotyf().open({
    type: 'warning',
    message,
  })
}

/**
 * Mapea errores del API (ApiError) a mensajes de usuario
 * @param {unknown} err
 */
export function toastFromApiError(err) {
  const fallback = 'Ocurrió un error, intenta nuevamente'
  if (!err) return toastError(fallback)

  const code = err?.code || err?.response?.error?.code
  const msg =
    err?.message ||
    err?.response?.error?.message ||
    fallback

  // Mensajes más amigables según códigos conocidos
  const friendly = {
    INVALID_CREDENTIALS: 'Documento o contraseña incorrectos',
    USER_LOCKED: 'Usuario bloqueado temporalmente. Intenta en 15 minutos',
    USER_INACTIVE: 'Usuario desactivado. Contacta al administrador',
    INVALID_INPUT: 'Datos inválidos. Revisa los campos',
    TOKEN_EXPIRED: 'Tu sesión expiró. Inicia sesión nuevamente',
    INVALID_TOKEN: 'Token no válido o expirado',
    WEAK_PASSWORD: 'La contraseña no cumple los requisitos mínimos',
    PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  }

  toastError(friendly[code] || msg)
}