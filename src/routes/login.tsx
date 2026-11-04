import { createFileRoute, Link } from '@tanstack/react-router'

// Placeholder until the sign-in screen (e-mail, guest) is built.
export const Route = createFileRoute('/login')({
  component: LoginPlaceholder,
})

export function LoginPlaceholder() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-muted-foreground">A tela de login ainda está em construção.</p>
        <Link to="/" className="underline underline-offset-4">
          Voltar para o início
        </Link>
      </div>
    </main>
  )
}
