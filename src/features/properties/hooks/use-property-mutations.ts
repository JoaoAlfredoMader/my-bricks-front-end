import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api, unwrap } from '@/lib/api/client'
import { propertyQueryOptions } from '../api/queries'
import type { PropertyRequest } from '../lib/property-form'

/** Lists, the dashboard and the property's own indicators all read what was just written. */
function useRefreshAfterWrite() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['kpis'] }),
    ])
  }
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  const refresh = useRefreshAfterWrite()
  return useMutation({
    mutationFn: (body: PropertyRequest) => unwrap(api.POST('/api/properties', { body })),
    onSuccess: async (property) => {
      queryClient.setQueryData(propertyQueryOptions(property.id).queryKey, property)
      await refresh()
    },
  })
}

/** Deletes the property and leaves its page first, so nothing tries to show it again. */
export function useDeleteProperty(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const refresh = useRefreshAfterWrite()
  return useMutation({
    mutationFn: () => unwrap(api.DELETE('/api/properties/{id}', { params: { path: { id } } })),
    onSuccess: async () => {
      await navigate({ to: '/app/imoveis' })
      queryClient.removeQueries({ queryKey: propertyQueryOptions(id).queryKey })
      for (const part of ['photos', 'documents']) queryClient.removeQueries({ queryKey: ['properties', part, id] })
      await refresh()
    },
  })
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient()
  const refresh = useRefreshAfterWrite()
  return useMutation({
    mutationFn: (body: PropertyRequest) => unwrap(api.PATCH('/api/properties/{id}', { params: { path: { id } }, body })),
    onSuccess: async (property) => {
      queryClient.setQueryData(propertyQueryOptions(id).queryKey, property)
      await refresh()
    },
  })
}
