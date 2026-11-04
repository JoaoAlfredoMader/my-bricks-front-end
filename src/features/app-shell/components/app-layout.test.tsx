import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, json, makeSession } from '@/test/fake-api'
import { renderRoute } from '@/test/render-route'

describe('App layout', () => {
  it('signs out and goes back to the landing page', async () => {
    const user = userEvent.setup()
    const api = fakeApi({
      session: makeSession(),
      handlers: {
        'POST /api/auth/sign-out': () => {
          api.state.session = null
          return json({ success: true })
        },
      },
    })
    const { router } = renderRoute('/app')

    await user.click(await screen.findByRole('button', { name: 'Sair' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(api.callsTo('/api/auth/sign-out')).toHaveLength(1)
  })

  it('warns while an admin is seeing the app as someone else', async () => {
    fakeApi({ session: makeSession({ impersonatedById: 'admin-1' }) })
    renderRoute('/app')

    expect(await screen.findByRole('status')).toHaveTextContent('Você está vendo o sistema como Ana Souza')
    expect(screen.getByRole('button', { name: 'Voltar para minha conta' })).toBeInTheDocument()
  })

  it('shows no warning in a normal session', async () => {
    fakeApi({ session: makeSession() })
    renderRoute('/app')

    await screen.findByRole('heading', { name: 'Olá, Ana' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
