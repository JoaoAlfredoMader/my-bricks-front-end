import { vi } from 'vitest'
import type { Session } from '@/features/auth/api/session'
import type { PortfolioKpis, PropertyKpis } from '@/features/dashboard/api/portfolio-kpis'

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

const UNAUTHENTICATED = { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }

/**
 * Stubs fetch with a tiny in-memory API: /api/me answers the current session, the
 * dashboard reads `kpis`, and the Better Auth endpoints given in `handlers` (keyed by
 * "METHOD /path") can change the session.
 */
export function fakeApi({
  session = null,
  kpis = makeKpis(),
  handlers = {},
}: { session?: Session | null; kpis?: PortfolioKpis; handlers?: Record<string, Handler> } = {}) {
  const state = { session, kpis }
  const calls: { method: string; path: string; body: unknown }[] = []

  const defaults: Record<string, Handler> = {
    'GET /api/me': () => (state.session ? json(state.session) : json(UNAUTHENTICATED, 401)),
    'GET /api/kpis/portfolio': () => (state.session ? json(state.kpis) : json(UNAUTHENTICATED, 401)),
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
    const { pathname } = new URL(request.url)
    const text = await request.clone().text()
    calls.push({ method: request.method, path: pathname, body: text ? JSON.parse(text) : undefined })

    const handler = handlers[`${request.method} ${pathname}`] ?? defaults[`${request.method} ${pathname}`]
    if (handler) return handler(request)
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
