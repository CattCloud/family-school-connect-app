import clsx from 'clsx'
import { getPasswordStrength } from '../../utils/passwordStrength.js'

/**
 * Barra visual de fortaleza de contraseña
 */
export default function PasswordStrength({ value = '' }) {
  const { score, label } = getPasswordStrength(value)

  const bars = [0, 1, 2, 3].map((i) => {
    const active = i < score
    const color =
      score <= 1
        ? 'bg-error'
        : score === 2
        ? 'bg-warning'
        : 'bg-success'

    return (
      <span
        key={i}
        className={clsx(
          'h-1 rounded transition-colors',
          active ? color : 'bg-border-primary'
        )}
      />
    )
  })

  return (
    <div className="mt-2">
      <div className="grid grid-cols-4 gap-1">{bars}</div>
      <div className="mt-1 text-xs text-text-muted">Fortaleza: {label}</div>
      <div className="mt-1 text-[10px] text-text-muted">
        Debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
      </div>
    </div>
  )
}