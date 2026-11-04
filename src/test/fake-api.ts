import { vi } from 'vitest'
import type { Session } from '@/features/auth/api/session'

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

type Handler = (request: Request) => Response | Promise<Response>

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/**
 * Stubs fetch with a tiny in-memory API: /api/me answers the current session and the
 * Better Auth endpoints given in `handlers` (keyed by "METHOD /path") can change it.
 */
export function fakeApi({ session = null, handlers = {} }: { session?: Session | null; handlers?: Record<string, Handler> } = {}) {
  const state = { session }
  const calls: { method: string; path: string; body: unknown }[] = []

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), location.origin), init)
    const { pathname } = new URL(request.url)
    const text = await request.clone().text()
    calls.push({ method: request.method, path: pathname, body: text ? JSON.parse(text) : undefined })

    const handler = handlers[`${request.method} ${pathname}`]
    if (handler) return handler(request)
    if (pathname === '/api/me') {
      return state.session
        ? json(state.session)
        : json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, 401)
    }
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
