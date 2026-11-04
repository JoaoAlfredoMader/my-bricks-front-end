import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/app-shell/components/home-page'

export const Route = createFileRoute('/_authenticated/app/')({
  component: AppHomeRoute,
})

export function AppHomeRoute() {
  const { session } = Route.useRouteContext()
  return <HomePage session={session} />
}
