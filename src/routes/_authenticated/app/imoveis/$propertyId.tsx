import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  clientQueryOptions,
  propertyCatalogQueryOptions,
  propertyKpisQueryOptions,
  propertyQueryOptions,
} from '@/features/properties/api/queries'
import { PropertyDetailPage } from '@/features/properties/components/property-detail-page'
import { ApiError } from '@/lib/api/client'

export const Route = createFileRoute('/_authenticated/app/imoveis/$propertyId')({
  loader: async ({ context: { queryClient }, params: { propertyId } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(propertyQueryOptions(propertyId)),
        queryClient.ensureQueryData(propertyKpisQueryOptions(propertyId)),
        queryClient.ensureQueryData(propertyCatalogQueryOptions),
      ])
    } catch (error) {
      // Another organization's property, or a member's view of someone else's, is a 404 too.
      if (error instanceof ApiError && (error.status === 404 || error.code === 'VALIDATION_ERROR')) throw notFound()
      throw error
    }
  },
  component: PropertyDetailRoute,
  notFoundComponent: PropertyNotFound,
})

export function PropertyDetailRoute() {
  const { propertyId } = Route.useParams()
  const property = useSuspenseQuery(propertyQueryOptions(propertyId)).data
  const kpis = useSuspenseQuery(propertyKpisQueryOptions(propertyId)).data
  const catalog = useQuery(propertyCatalogQueryOptions).data
  const client = useQuery({ ...clientQueryOptions(property.clientId ?? ''), enabled: property.clientId !== null }).data

  return <PropertyDetailPage property={property} kpis={kpis} catalog={catalog} clientName={client?.name} />
}

export function PropertyNotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Imóvel não encontrado</h1>
      <p className="text-sm text-muted-foreground">Ele pode ter sido excluído, ou não faz parte desta carteira.</p>
      <Link to="/app/imoveis" className="text-sm font-medium underline underline-offset-4">
        Ver todos os imóveis
      </Link>
    </main>
  )
}
