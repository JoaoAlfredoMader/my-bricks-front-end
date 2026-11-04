import type { Session } from '@/features/auth/api/session'

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

/** Placeholder until the dashboard exists: proves the session reached the app. */
export function HomePage({ session }: { session: Session }) {
  const { user } = session
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {user.isAnonymous ? 'Bem-vindo à demonstração' : `Olá, ${firstName(user.name)}`}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {user.isAnonymous
          ? 'Esta carteira de exemplo é só sua e será apagada em 24 horas.'
          : 'Sua carteira está pronta.'}{' '}
        O painel com imóveis, contratos e indicadores é a próxima tela a chegar.
      </p>
    </main>
  )
}
