import { useMutation, useQueryClient } from '@tanstack/react-query'
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
