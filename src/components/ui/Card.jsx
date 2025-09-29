import clsx from 'clsx'

/**
 * Card contenedor para formularios y secciones
 * Estructura: Header (título/desc), Content (children), Footer (acciones)
 */
function Card({ className, children }) {
  return (
    <div
      className={clsx(
        'w-full rounded-xl border border-border-primary bg-bg-card shadow-md',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, description, className }) {
  return (
    <div className={clsx('px-6 pt-6 pb-2', className)}>
      {title ? (
        <h2 className="text-xl font-semibold text-text-primary">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function CardContent({ className, children }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={clsx(
        'px-6 py-4 border-t border-border-secondary bg-bg-main',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
export { Card }