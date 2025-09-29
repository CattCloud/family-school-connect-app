/**
 * Calcula fortaleza de contraseña basada en:
 * - longitud (>=8, >=12)
 * - variedad (mayúsculas, minúsculas, números, símbolos)
 * Retorna score 0-4 y etiqueta.
 */
export function getPasswordStrength(pw = '') {
  let score = 0
  const length = pw.length
  const upper = /[A-Z]/.test(pw)
  const lower = /[a-z]/.test(pw)
  const number = /[0-9]/.test(pw)
  const symbol = /[^A-Za-z0-9]/.test(pw)

  const variety = [upper, lower, number, symbol].filter(Boolean).length

  if (length >= 8) score += 1
  if (length >= 12) score += 1
  if (variety >= 2) score += 1
  if (variety >= 3) score += 1

  let label = 'Muy débil'
  if (score === 1) label = 'Débil'
  if (score === 2) label = 'Aceptable'
  if (score === 3) label = 'Fuerte'
  if (score >= 4) label = 'Muy fuerte'

  return { score, label }
}