import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

/**
 * Modal reutilizable
 * Props:
 * - open: boolean (controla visibilidad)
 * - title: string | node
 * - children: contenido
 * - onClose: () => void (no se llama si dismissible=false)
 * - dismissible: boolean (cierre por overlay/esc/btn). Default: true
 * - size: 'sm' | 'md' | 'lg' | 'xl'
 * - footer: node (acciones)
 * - hideCloseButton: boolean (oculta ícono X aunque dismissible true)
 * - className: clases extra del contenedor interno
 */
export default function Modal({
  open,
  title,
  children,
  onClose,
  dismissible = true,
  size = 'md',
  footer,
  hideCloseButton = false,
  className,
}) {
  // Bloquear scroll de fondo cuando está abierto
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Escape key para cerrar si es dismissible
  useEffect(() => {
    if (!open || !dismissible) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, dismissible, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const modal = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-bg-overlay"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={clsx(
          'relative z-[71] w-full mx-4 rounded-xl bg-bg-card shadow-xl border border-border-primary',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || dismissible) && (
          <div className="flex items-center justify-between border-b border-border-secondary px-5 py-3">
            <div className="min-h-6">
              {typeof title === 'string' ? (
                <h2 className="text-lg font-semibold text-text-primary">
                  {title}
                </h2>
              ) : (
                title
              )}
            </div>
            {dismissible && !hideCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-border-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                <X size={18} />
              </button>
            ) : (
              <span className="w-8 h-8" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer */}
        {footer ? (
          <div className="px-5 py-3 border-t border-border-secondary bg-bg-main rounded-b-xl">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}