// Servicios de Autenticación usando el wrapper fetch nativo

import { apiFetch } from './api.js'

// POST /auth/login
export async function login(credentials) {
  // credentials: { tipo_documento, nro_documento, password }
  return apiFetch('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

// POST /auth/forgot-password
export async function forgotPassword(documentData) {
  // documentData: { tipo_documento, nro_documento }
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: documentData,
  })
}

// POST /auth/reset-password
export async function resetPassword(payload) {
  // payload: { token, nueva_password, confirmar_password }
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: payload,
  })
}

// POST /auth/logout
export async function logout(token) {
  return apiFetch('/auth/logout', {
    method: 'POST',
    token,
  })
}

// GET /auth/validate-token
export async function validateToken(token) {
  return apiFetch('/auth/validate-token', {
    method: 'GET',
    token,
  })
}

// POST /auth/change-required-password
export async function changeRequiredPassword(token, payload) {
  // payload: { password_actual, nueva_password, confirmar_password }
  return apiFetch('/auth/change-required-password', {
    method: 'POST',
    token,
    body: payload,
  })
}

// GET /auth/me
export async function getMe(token) {
  // No existe /auth/me en la API; se usa /auth/validate-token para obtener info básica del usuario
  return apiFetch('/auth/validate-token', {
    method: 'GET',
    token,
  })
}

// GET /auth/parent-context/:user_id
export async function getParentContext(userId, token) {
  return apiFetch(`/auth/parent-context/${userId}`, {
    method: 'GET',
    token,
  })
}