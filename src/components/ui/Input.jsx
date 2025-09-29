import clsx from 'clsx'

/**
 * Input reutilizable con label, helpText y estados de validación.
 * Soporta integración con react-hook-form pasando {...register('campo')}.
 */
export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className,
  inputClassName,
  required,
  disabled,
  ...props
}) {
  return (
    <div className={clsx('w-full', className)}>
      {label ? (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          {label}
          {required ? <span className="text-error">*</span> : null}
        </label>
      ) : null}

      <div
        className={clsx(
          'relative flex items-center rounded-md border bg-white',
          'transition-shadow focus-within:shadow-sm',
          error ? 'border-border-error' : 'border-border-primary',
          disabled ? 'opacity-60 cursor-not-allowed' : 'opacity-100'
        )}
      >
        {leftIcon ? (
          <span className="pl-3 text-text-muted">{leftIcon}</span>
        ) : null}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'w-full rounded-md bg-transparent outline-none',
            'placeholder:text-text-placeholder',
            'text-text-primary',
            leftIcon ? 'pl-2 pr-3 py-2.5' : 'px-3 py-2.5',
            rightIcon ? 'pr-8' : '',
            inputClassName
          )}
          {...props}
        />

        {rightIcon ? (
          <span className="absolute right-2 text-text-muted">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-error">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  )
}