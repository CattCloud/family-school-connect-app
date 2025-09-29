import clsx from 'clsx'

function Spinner({ className }) {
  return (
    <svg
      className={clsx('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  )
}

/**
 * Button reutilizable con variantes y tamaños
 * Variants: primary | secondary | outline | ghost | dark
 * Sizes: sm | md | lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  leftIcon,
  rightIcon,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-60 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  }

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-text-inverse shadow-md',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-text-inverse shadow-md',
    outline: 'border border-primary-300 text-primary-700 hover:bg-primary-50 bg-transparent',
    ghost: 'text-text-secondary hover:bg-border-light bg-transparent',
    dark: 'bg-black hover:bg-neutral-900 text-white shadow-md',
  }

  const contentOpacity = isLoading ? 'opacity-0' : 'opacity-100'

  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className, {
        'pointer-events-none': isLoading,
      })}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loader sobrepuesto */}
      {isLoading && (
        <span className="absolute inline-flex">
          <Spinner className="h-4 w-4 text-text-inverse" />
        </span>
      )}

      <span className={clsx('inline-flex items-center gap-2', contentOpacity)}>
        {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
      </span>
    </button>
  )
}