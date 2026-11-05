import { vi } from 'vitest'
import type { Session } from '@/features/auth/api/session'
import type { Contract, CreateContractRequest } from '@/features/contracts/api/queries'
import type { Occupant } from '@/features/occupants/api/queries'
import type { PortfolioKpis, PropertyKpis } from '@/features/dashboard/api/portfolio-kpis'
import type { Photo, PropertyDocument } from '@/features/properties/api/files'
import type { FinancingSchedule, Property, PropertyCatalog } from '@/features/properties/api/queries'
import type { PropertyRequest as PropertyRequestBody } from '@/features/properties/lib/property-form'

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

let contractSeq = 0

/** A contract as GET /api/contracts/{id} returns it: a conventional, active one by default. */
export function makeContract(overrides: Partial<Contract> = {}): Contract {
  contractSeq += 1
  return {
    id: `00000000-0000-4000-9000-${String(contractSeq).padStart(12, '0')}`,
    propertyId: '00000000-0000-4000-8000-000000000001',
    propertyName: 'Apartamento Centro',
    contractType: 'conventional',
    status: 'active',
    startDate: '2026-01-08',
    endDate: '2028-01-07',
    notes: null,
    occupant: { id: `occupant-${contractSeq}`, name: 'Ana Carolina Souza', document: '39053344705', email: 'ana@example.com', phone: '11965432109' },
    rentTerms: { monthlyRentCents: 380_000, dueDay: 5, adjustmentIndex: 'igpm' },
    pdfUrl: null,
    createdAt: '2026-01-08T12:00:00.000Z',
    updatedAt: '2026-01-08T12:00:00.000Z',
    ...overrides,
  }
}

/** `YYYY-MM-DD` plus `months`, keeping the day (tests use days that every month has). */
function addMonths(day: string, months: number) {
  const total = Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1 + months
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}${day.slice(7)}`
}

/**
 * A SAC schedule with round numbers, so tests can read the amounts: R$ 12.000 in 24 months
 * at 1% a month by default, with `paid` installments already due on `asOf`.
 */
export function makeFinancingSchedule({
  financedAmountCents = 1_200_000,
  termMonths = 24,
  firstInstallmentOn = '2026-01-10',
  monthlyRate = 0.01,
  paid = 0,
}: { financedAmountCents?: number; termMonths?: number; firstInstallmentOn?: string; monthlyRate?: number; paid?: number } = {}): FinancingSchedule {
  const amortization = Math.round(financedAmountCents / termMonths)
  let balance = financedAmountCents
  const installments = Array.from({ length: termMonths }, (_, i) => {
    const interest = Math.round(balance * monthlyRate)
    const amortizationCents = i === termMonths - 1 ? balance : amortization
    balance -= amortizationCents
    return {
      number: i + 1,
      dueOn: addMonths(firstInstallmentOn, i),
      installmentCents: amortizationCents + interest,
      interestCents: interest,
      amortizationCents,
      balanceCents: balance,
    }
  })
  const done = installments.slice(0, paid)
  return {
    asOf: paid > 0 ? done.at(-1)!.dueOn : addMonths(firstInstallmentOn, -1),
    amortizationSystem: 'sac',
    financedAmountCents,
    termMonths,
    annualInterestRate: monthlyRate * 1200,
    summary: {
      paidInstallments: paid,
      remainingInstallments: termMonths - paid,
      outstandingBalanceCents: done.at(-1)?.balanceCents ?? financedAmountCents,
      totalPaidCents: done.reduce((sum, row) => sum + row.installmentCents, 0),
      totalInterestCents: installments.reduce((sum, row) => sum + row.interestCents, 0),
      nextInstallment: installments[paid] ?? null,
    },
    installments,
  }
}

const CATALOG: PropertyCatalog = [
  { propertyType: 'residential', subtypes: [{ id: 1, name: 'Apartamento' }, { id: 2, name: 'Casa' }], usageTypes: ['rental', 'own_use'] },
  { propertyType: 'land', subtypes: [], usageTypes: ['own_use', 'agricultural_lease'] },
  { propertyType: 'logistics', subtypes: [{ id: 9, name: 'Galpão logístico' }], usageTypes: ['rental'] },
]

const UNAUTHENTICATED = { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }
const NOT_FOUND = { error: { code: 'NOT_FOUND', message: 'Not found' } }

const CITIES = [
  { ibgeCode: 3550308, name: 'São Paulo', state: 'SP' },
  { ibgeCode: 3548500, name: 'Santos', state: 'SP' },
  { ibgeCode: 3509502, name: 'Campinas', state: 'SP' },
]

interface FakeApiOptions {
  session?: Session | null
  kpis?: PortfolioKpis
  properties?: Property[]
  clients?: { id: string; name: string }[]
  agencies?: { id: string; name: string }[]
  /** By property id. */
  photos?: Record<string, Photo[]>
  documents?: Record<string, PropertyDocument[]>
  contracts?: Contract[]
  /** Tenants and guests on file, for GET /api/occupants. */
  occupants?: Occupant[]
  handlers?: Record<string, Handler>
}

/**
 * Stubs fetch with a tiny in-memory API: /api/me answers the current session, the
 * dashboard reads `kpis`, the property screens read `properties` (searched, filtered and
 * paged like the real list), and the endpoints given in `handlers` (keyed by "METHOD /path")
 * win over the defaults.
 */
export function fakeApi({
  session = null,
  kpis = makeKpis(),
  properties = [],
  clients = [],
  agencies = [],
  photos = {},
  documents = {},
  contracts = [],
  occupants = [],
  handlers = {},
}: FakeApiOptions = {}) {
  const state = { session, kpis, properties, photos, documents, contracts, occupants }
  const calls: { method: string; path: string; query: URLSearchParams; body: unknown }[] = []
  let fileSeq = 0

  /** Photos and documents of a property, kept in `state.photos` / `state.documents` by property id. */
  function files(method: string, pathname: string, body: unknown): Response | undefined {
    const match = /^\/api\/properties\/([^/]+)\/(photos|documents)(?:\/([^/]+))?$/.exec(pathname)
    if (!match) return undefined
    const [, propertyId, kind, rest] = match as unknown as [string, string, 'photos' | 'documents', string | undefined]
    const list = (kind === 'photos' ? state.photos : state.documents) as Record<string, (Photo | PropertyDocument)[]>
    const current = list[propertyId!] ?? []

    if (method === 'GET' && !rest) return json(current)
    if (method === 'POST' && !rest) {
      const { file, category } = body as { file: File; category?: string }
      fileSeq += 1
      const id = `file-${fileSeq}`
      const base = {
        id,
        propertyId: propertyId!,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        contentUrl: `${pathname}/${id}/content`,
        createdAt: '2026-11-04T12:00:00.000Z',
      }
      const created = kind === 'photos' ? { ...base, position: current.length } : { ...base, category: category ?? null }
      list[propertyId!] = [...current, created as Photo & PropertyDocument]
      return json(created, 201)
    }
    if (method === 'PUT' && rest === 'order') {
      const { photoIds } = body as { photoIds: string[] }
      list[propertyId!] = photoIds.map((id, position) => ({ ...current.find((p) => p.id === id)!, position }))
      return json(list[propertyId!])
    }
    if (method === 'PATCH' && rest) {
      list[propertyId!] = current.map((d) => (d.id === rest ? { ...d, ...(body as object) } : d))
      return json(list[propertyId!]!.find((d) => d.id === rest))
    }
    if (method === 'DELETE' && rest) {
      list[propertyId!] = current.filter((item) => item.id !== rest)
      return new Response(null, { status: 204 })
    }
    return undefined
  }

  /** Contracts and the occupants they name, kept in `state.contracts` / `state.occupants`. */
  function contractRoutes(method: string, pathname: string, query: URLSearchParams, body: unknown): Response | undefined {
    if (method === 'GET' && pathname === '/api/occupants') {
      const search = query.get('search')?.toLowerCase()
      const items = state.occupants.filter((o) => !search || o.name.toLowerCase().includes(search))
      return json({ items: items.slice(0, Number(query.get('pageSize') ?? 20)), page: 1, pageSize: 20, total: items.length })
    }
    if (method === 'GET' && pathname === '/api/contracts') {
      const page = Number(query.get('page') ?? 1)
      const pageSize = Number(query.get('pageSize') ?? 20)
      const matches = state.contracts
        .filter((c) => !query.get('propertyId') || c.propertyId === query.get('propertyId'))
        .filter((c) => !query.get('status') || c.status === query.get('status'))
        .filter((c) => !query.get('contractType') || c.contractType === query.get('contractType'))
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
      return json({ items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: matches.length })
    }
    if (method === 'POST' && pathname === '/api/contracts') {
      const request = body as CreateContractRequest
      const property = state.properties.find((p) => p.id === request.propertyId)
      if (!property) return json(NOT_FOUND, 404)
      if (property.rentalMode !== 'contract') {
        return json({ error: { code: 'BUSINESS_RULE', message: 'Switch the property to contract rental mode before creating contracts' } }, 422)
      }
      const occupant: Occupant =
        state.occupants.find((o) => o.id === request.occupantId) ??
        { id: `occupant-new-${state.occupants.length + 1}`, name: request.occupant!.name, document: request.occupant!.document ?? null, email: request.occupant!.email ?? null, phone: request.occupant!.phone ?? null }
      const replaced = state.contracts.find((c) => c.propertyId === property.id && c.status === 'active')
      if (replaced) Object.assign(replaced, { status: 'ended', endDate: request.startDate })
      const created = makeContract({
        propertyId: property.id,
        propertyName: property.name,
        contractType: request.contractType,
        startDate: request.startDate,
        endDate: request.endDate ?? null,
        notes: request.notes ?? null,
        occupant,
        rentTerms: request.rentTerms ? { ...request.rentTerms, adjustmentIndex: request.rentTerms.adjustmentIndex ?? null } : null,
      })
      state.contracts.push(created)
      return json({ ...created, replacedContractId: replaced?.id ?? null }, 201)
    }
    const match = /^\/api\/contracts\/([^/]+)(?:\/(end|cancel|pdf))?$/.exec(pathname)
    if (!match) return undefined
    const contract = state.contracts.find((c) => c.id === match[1])
    if (!contract) return json(NOT_FOUND, 404)
    const action = match[2]
    if (method === 'GET' && !action) return json(contract)
    const inactive = json({ error: { code: 'BUSINESS_RULE', message: 'Only active contracts can be changed' } }, 422)
    if (method === 'PATCH' && !action) {
      if (contract.status !== 'active') return inactive
      const { rentTerms, ...rest } = body as Partial<Contract>
      Object.assign(contract, rest, rentTerms ? { rentTerms: { ...contract.rentTerms, ...rentTerms } } : {})
      return json(contract)
    }
    if (method === 'POST' && action === 'end') {
      if (contract.status !== 'active') return inactive
      Object.assign(contract, { status: 'ended', endDate: (body as { endDate?: string }).endDate ?? contract.endDate })
      return json(contract)
    }
    if (method === 'POST' && action === 'cancel') {
      if (contract.status !== 'active') return inactive
      contract.status = 'cancelled'
      return json(contract)
    }
    if (method === 'POST' && action === 'pdf') {
      contract.pdfUrl = `/api/contracts/${contract.id}/pdf`
      return json({ contractId: contract.id, fileName: 'contrato.pdf', sizeBytes: 4932, generatedAt: '2026-11-05T12:00:00.000Z', url: contract.pdfUrl })
    }
    return undefined
  }

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

  /** A request body as the API would store it: the address gets its city's name back. */
  function stored(body: unknown): Partial<Property> {
    const { address, ...rest } = body as PropertyRequestBody
    if (!address) return { ...rest, address: null } as Partial<Property>
    const city = CITIES.find((c) => c.ibgeCode === address.cityId)
    return {
      ...rest,
      address: {
        cityId: address.cityId,
        city: city?.name ?? '?',
        state: city?.state ?? '?',
        street: address.street,
        number: address.number ?? null,
        complement: address.complement ?? null,
        neighborhood: address.neighborhood ?? null,
        postalCode: address.postalCode ?? null,
        latitude: null,
        longitude: null,
      },
    } as Partial<Property>
  }

  /** Answers for lists and for paths with an id in them. */
  function dynamic(method: string, pathname: string, query: URLSearchParams, body: unknown): Response | undefined {
    if (method === 'POST' && pathname === '/api/properties') {
      const created = makePropertyRecord(stored(body))
      state.properties.push(created)
      return json(created, 201)
    }
    const patched = /^\/api\/properties\/([^/]+)$/.exec(pathname)
    if (method === 'PATCH' && patched) {
      const index = state.properties.findIndex((p) => p.id === patched[1])
      if (index < 0) return json(NOT_FOUND, 404)
      state.properties[index] = { ...state.properties[index]!, ...stored(body) }
      return json(state.properties[index])
    }
    if (method === 'DELETE' && patched) {
      const before = state.properties.length
      state.properties = state.properties.filter((p) => p.id !== patched[1])
      return state.properties.length < before ? new Response(null, { status: 204 }) : json(NOT_FOUND, 404)
    }
    if (method !== 'GET') return undefined
    if (pathname === '/api/properties') return json(listProperties(query))
    if (pathname === '/api/clients') return json({ items: clients, page: 1, pageSize: 100, total: clients.length })
    if (pathname === '/api/agencies') return json({ items: agencies, page: 1, pageSize: 100, total: agencies.length })
    if (pathname === '/api/lookups/cities') {
      const search = (query.get('search') ?? '').toLowerCase()
      return json(CITIES.filter((city) => city.name.toLowerCase().startsWith(search)))
    }
    const property = /^\/api\/properties\/([^/]+)$/.exec(pathname)
    if (property) {
      const found = state.properties.find((p) => p.id === property[1])
      return found ? json(found) : json(NOT_FOUND, 404)
    }
    const schedule = /^\/api\/properties\/([^/]+)\/financing-schedule$/.exec(pathname)
    if (schedule) {
      const financing = state.properties.find((p) => p.id === schedule[1])?.financing
      if (!financing) return json(NOT_FOUND, 404)
      return json(
        makeFinancingSchedule({
          financedAmountCents: financing.financedAmountCents,
          termMonths: financing.termMonths,
          firstInstallmentOn: financing.firstInstallmentOn,
          monthlyRate: financing.annualInterestRate / 1200,
        }),
      )
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

  /** JSON bodies as objects; multipart uploads as their fields, with files as File. */
  async function readBody(request: Request): Promise<unknown> {
    if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      return Object.fromEntries((await request.clone().formData()).entries())
    }
    const text = await request.clone().text()
    return text ? JSON.parse(text) : undefined
  }

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), location.origin), init)
    const { pathname, searchParams } = new URL(request.url)
    const body = await readBody(request)
    calls.push({ method: request.method, path: pathname, query: searchParams, body })

    const handler = handlers[`${request.method} ${pathname}`] ?? defaults[`${request.method} ${pathname}`]
    if (handler) return handler(request)
    const answer = state.session
      ? (files(request.method, pathname, body) ??
        contractRoutes(request.method, pathname, searchParams, body) ??
        dynamic(request.method, pathname, searchParams, body))
      : undefined
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
