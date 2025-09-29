import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth.js'

const STORAGE_SELECTED_CHILD = 'selected_child_id'

/**
 * useStudentSelector
 * - Gestiona el contexto de hijo seleccionado para padres (HU-AUTH-05)
 * - Persiste en sessionStorage
 * - Carga hijos activos desde API: GET /auth/parent-context/:user_id
 */
export default function useStudentSelector() {
  const { user, getParentContext, isAuthenticated } = useAuth()
  const isParent = user?.rol === 'apoderado'

  const [children, setChildren] = useState([])
  const [selectedId, setSelectedId] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_SELECTED_CHILD) || ''
    } catch {
      return ''
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !isParent) return

    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const ctx = await getParentContext(user.id)
        if (cancelled) return
        const hijos = ctx?.hijos || []
        setChildren(hijos)

        // Selección por defecto
        const stored = sessionStorage.getItem(STORAGE_SELECTED_CHILD)
        const validStored = hijos.find((h) => h.id === stored)
        if (validStored) {
          setSelectedId(validStored.id)
          return
        }
        if (hijos.length > 0) {
          setSelectedId(hijos[0].id)
          sessionStorage.setItem(STORAGE_SELECTED_CHILD, hijos[0].id)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isParent, user?.id, getParentContext])

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedId) || null,
    [children, selectedId]
  )

  const selectChild = (id) => {
    setSelectedId(id)
    try {
      sessionStorage.setItem(STORAGE_SELECTED_CHILD, id)
    } catch {
      // ignore
    }
  }

  return {
    isParent,
    isLoading,
    children,
    selectedId,
    selectedChild,
    selectChild,
  }
}