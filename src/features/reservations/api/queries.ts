import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api, type Schemas, unwrap } from '@/lib/api/client'

export type Reservation = Schemas['Reservation']
export type ReservationStatus = Reservation['status']
export type CreateReservationRequest = Schemas['CreateReservationRequest']
export type UpdateReservationRequest = Schemas['UpdateReservationRequest']

export const PAGE_SIZE = 20

export interface ReservationFilters {
  page: number
  status?: ReservationStatus | undefined
  propertyId?: string | undefined
}

export function reservationsQueryOptions({ page, status, propertyId }: ReservationFilters, pageSize = PAGE_SIZE) {
  const query = {
    page,
    pageSize,
    ...(status ? { status } : {}),
    ...(propertyId ? { propertyId } : {}),
  }
  return queryOptions({
    queryKey: ['reservations', 'list', query],
    queryFn: () => unwrap(api.GET('/api/reservations', { params: { query } })),
    placeholderData: keepPreviousData,
  })
}

export function reservationQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['reservations', 'detail', id],
    queryFn: () => unwrap(api.GET('/api/reservations/{id}', { params: { path: { id } } })),
  })
}

/** Only short-stay properties take reservations; the first hundred, by name. */
export const shortStayPropertiesQueryOptions = queryOptions({
  queryKey: ['properties', 'short-stay'],
  queryFn: () =>
    unwrap(api.GET('/api/properties', { params: { query: { usageType: 'short_stay', pageSize: 100 } } })),
})
