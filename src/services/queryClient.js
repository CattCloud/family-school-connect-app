import { QueryClient } from '@tanstack/react-query'

/**
 * Query Client centralizado
 * - Maneja reintentos y política de refresco
 * - Evita reintentos en 401/403
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min
      refetchOnWindowFocus: false,
      retry: (failureCount, err) => {
        const status = err?.status || err?.response?.status
        if (status === 401 || status === 403) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: 0,
    },
  },
})

export default queryClient