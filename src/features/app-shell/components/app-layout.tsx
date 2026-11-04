import { Link, Outlet, useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import type { Session } from '@/features/auth/api/session'
import { useSignOut } from '@/features/auth/hooks/use-auth-actions'
import { ImpersonationBanner } from './impersonation-banner'

/** The frame of every signed-in screen. The real navigation comes with the system design. */
export function AppLayout({ session }: { session: Session }) {
  const router = useRouter()
  const signOut = useSignOut()
  const { user } = session

  return (
    <div className="min-h-svh bg-background text-foreground">
      {session.impersonatedById && (
        <ImpersonationBanner userName={user.name} onStopped={() => router.invalidate()} />
      )}
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
        <Link to="/app" className="flex items-center gap-2 rounded-md font-semibold">
          <BrandMark className="size-6 text-primary" />
          MyBricks
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.isAnonymous ? 'Convidado' : user.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSuccess: () => router.navigate({ to: '/' }) })}
          >
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
