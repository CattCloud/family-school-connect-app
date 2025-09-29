import clsx from 'clsx'

/**
 * LoadingSpinner
 * - size: 'sm' | 'md' | 'lg' | number (px)
 * - color: CSS color (por defecto usa --color-primary-600)
 * - overlay: si true, muestra pantalla completa centrada
 * - label: texto opcional debajo del spinner
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'var(--color-primary-600)',
  overlay = false,
  label,
  className,
  ...props
}) {
  const px =
    typeof size === 'number'
      ? size
      : { sm: 18, md: 24, lg: 32 }[size] ?? 24

  const spinner = (
    <div className={clsx('inline-flex flex-col items-center', className)} {...props}>
      <svg
        className="animate-spin"
        style={{ width: px, height: px, color }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label={label || 'Cargando'}
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {label ? (
        <span className="mt-2 text-sm text-text-secondary">{label}</span>
      ) : null}
    </div>
  )

  if (!overlay) return spinner

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-bg-overlay"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-lg bg-bg-card p-6 shadow-xl">
        {spinner}
      </div>
    </div>
  )
}