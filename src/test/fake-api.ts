import { vi } from 'vitest'
import type { Session } from '@/features/auth/api/session'
import type { PortfolioKpis, PropertyKpis } from '@/features/dashboard/api/portfolio-kpis'
import type { Property, PropertyCatalog } from '@/features/properties/api/queries'

export function makeSession(overrides: Partial<Omit<Session, 'user'>> & { user?: Partial<Session['user']> } = {}): Session {
  const { user, ...rest } = overrides
  return {
    sessionId: 'session-1',
    impersonatedById: null,
    organizationId: 'org-1',
    memberRole: 'owner',
    ...rest,
    user: { id: 'user-1', name: 'Ana Souza', email: 'ana@example.com', isAnonymous: false, platformRole: 'user', ...user },
  }
}

export function makeProperty(overrides: Partial<PropertyKpis> = {}): PropertyKpis {
  return {
    propertyId: crypto.randomUUID(),
    name: 'Apartamento Centro',
    clientId: null,
    usageType: 'rental',
    status: 'rented',
    ownershipPercentage: 100,
    estimatedValueCents: 68_000_000,
    revenueSource: 'contract',
    monthlyRentCents: 361_000,
    includedInPortfolio: true,
    annualRevenueCents: 4_332_000,
    annualExpensesCents: 540_000,
    noiCents: 3_792_000,
    grossYield: 0.063706,
    capRate: 0.055765,
    irr: { annualRate: 0.031893, unavailableReason: null, months: 60 },
    ...overrides,
  }
}

export function makeKpis(overrides: Partial<PortfolioKpis> = {}): PortfolioKpis {
  return {
    asOf: '2026-11-04',
    totals: {
      totalValueCents: 657_000_000,
      incomeProducingValueCents: 591_500_000,
      annualRevenueCents: 38_470_000,
      annualExpensesCents: 5_964_000,
      noiCents: 32_506_000,
      grossYield: 0.065038,
      capRate: 0.054955,
    },
    propertyCount: 3,
    propertiesByStatus: { rented: 2, vacant: 0, own_use: 1, loan_for_use: 0 },
    properties: [
      makeProperty(),
      makeProperty({ name: 'Galpão Logístico', estimatedValueCents: 280_000_000, noiCents: 19_200_000 }),
      makeProperty({
        name: 'Casa de Praia',
        usageType: 'own_use',
        status: 'own_use',
        ownershipPercentage: 50,
        includedInPortfolio: false,
        estimatedValueCents: 95_000_000,
        annualRevenueCents: 0,
        noiCents: -800_000,
        grossYield: null,
        capRate: null,
        irr: { annualRate: null, unavailableReason: 'no_acquisition_cost', months: null },
      }),
    ],
    ...overrides,
  }
}

type Handler = (request: Request) => Response | Promise<Response>

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

let propertySeq = 0

/** A full property record, as GET /api/properties/{id} returns it. */
export function makePropertyRecord(overrides: Partial<Property> = {}): Property {
  propertySeq += 1
  return {
    id: `00000000-0000-4000-8000-${String(propertySeq).padStart(12, '0')}`,
    name: 'Apartamento Centro',
    propertyType: 'residential',
    subtypeId: 1,
    usageType: 'rental',
    status: 'rented',
    ownershipPercentage: 100,
    totalArea: 78,
    privateArea: 65,
    bedrooms: 2,
    suites: null,
    bathrooms: 2,
    parkingSpaces: 1,
    parkingSpotLabel: null,
    builtYear: 2012,
    conservationState: 'good',
    estimatedValueCents: 68_000_000,
    annualExpensesCents: 540_000,
    occupancyRate: 95,
    rentalMode: 'contract',
    notes: null,
    clientId: null,
    agencyId: null,
    agencyName: null,
    address: {
      cityId: 3550308,
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1500',
      complement: 'apto 82',
      neighborhood: 'Bela Vista',
      latitude: null,
      longitude: null,
    },
    manualRental: null,
    acquisition: { acquisitionType: 'purchase', acquiredOn: '2021-05-14', costCents: 52_000_000 },
    financing: null,
    legalRecord: null,
    insurance: null,
    createdById: 'user-1',
    createdAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
    ...overrides,
  }
}

const CATALOG: PropertyCatalog = [
  { propertyType: 'residential', subtypes: [{ id: 1, name: 'Apartamento' }, { id: 2, name: 'Casa' }], usageTypes: ['rental', 'own_use'] },
  { propertyType: 'logistics', subtypes: [{ id: 9, name: 'Galpão logístico' }], usageTypes: ['rental'] },
]

const UNAUTHENTICATED = { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }
const NOT_FOUND = { error: { code: 'NOT_FOUND', message: 'Not found' } }

interface FakeApiOptions {
  session?: Session | null
  kpis?: PortfolioKpis
  properties?: Property[]
  clients?: { id: string; name: string }[]
  handlers?: Record<string, Handler>
}

/**
 * Stubs fetch with a tiny in-memory API: /api/me answers the current session, the
 * dashboard reads `kpis`, the property screens read `properties` (searched, filtered and
 * paged like the real list), and the endpoints given in `handlers` (keyed by "METHOD /path")
 * win over the defaults.
 */
export function fakeApi({ session = null, kpis = makeKpis(), properties = [], clients = [], handlers = {} }: FakeApiOptions = {}) {
  const state = { session, kpis, properties }
  const calls: { method: string; path: string; query: URLSearchParams; body: unknown }[] = []

  function listProperties(query: URLSearchParams) {
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    const search = query.get('search')?.toLowerCase()
    const matches = state.properties
      .filter((p) => !search || p.name.toLowerCase().includes(search))
      .filter((p) => !query.get('propertyType') || p.propertyType === query.get('propertyType'))
      .filter((p) => !query.get('usageType') || p.usageType === query.get('usageType'))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: matches.length }
  }

  /** Answers for paths with an id in them. */
  function dynamic(method: string, pathname: string, query: URLSearchParams): Response | undefined {
    if (method !== 'GET') return undefined
    if (pathname === '/api/properties') return json(listProperties(query))
    const property = /^\/api\/properties\/([^/]+)$/.exec(pathname)
    if (property) {
      const found = state.properties.find((p) => p.id === property[1])
      return found ? json(found) : json(NOT_FOUND, 404)
    }
    const kpi = /^\/api\/kpis\/properties\/([^/]+)$/.exec(pathname)
    if (kpi) {
      const found = state.properties.find((p) => p.id === kpi[1])
      return found
        ? json(makeProperty({ propertyId: found.id, name: found.name, status: found.status, usageType: found.usageType }))
        : json(NOT_FOUND, 404)
    }
    const client = /^\/api\/clients\/([^/]+)$/.exec(pathname)
    if (client) {
      const found = clients.find((c) => c.id === client[1])
      return found ? json(found) : json(NOT_FOUND, 404)
    }
    return undefined
  }

  const defaults: Record<string, Handler> = {
    'GET /api/me': () => (state.session ? json(state.session) : json(UNAUTHENTICATED, 401)),
    'GET /api/kpis/portfolio': () => (state.session ? json(state.kpis) : json(UNAUTHENTICATED, 401)),
    'GET /api/lookups/property-catalog': () => json(CATALOG),
    'GET /api/auth/organization/get-full-organization': () => {
      if (!state.session) return json(null)
      const isDemo = state.session.user.isAnonymous
      return json({
        id: state.session.organizationId,
        name: isDemo ? 'Demonstração' : 'Portfólio de Ana',
        isDemo,
        demoExpiresAt: isDemo ? new Date(Date.now() + 23.5 * 3_600_000).toISOString() : null,
        members: [],
        invitations: [],
      })
    },
  }

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), location.origin), init)
    const { pathname, searchParams } = new URL(request.url)
    const text = await request.clone().text()
    calls.push({ method: request.method, path: pathname, query: searchParams, body: text ? JSON.parse(text) : undefined })

    const handler = handlers[`${request.method} ${pathname}`] ?? defaults[`${request.method} ${pathname}`]
    if (handler) return handler(request)
    const answer = state.session ? dynamic(request.method, pathname, searchParams) : undefined
    if (answer) return answer
    return json({ error: { code: 'NOT_FOUND', message: `No fake for ${request.method} ${pathname}` } }, 404)
  })

  vi.stubGlobal('fetch', fetch)
  return {
    state,
    calls,
    /** Calls made to `path`, in order. */
    callsTo: (path: string) => calls.filter((call) => call.path === path),
  }
}
